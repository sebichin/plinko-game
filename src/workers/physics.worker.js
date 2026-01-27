import PhysicsEngine from '../physics/Engine.js';
import RigidBody from '../physics/RigidBody.js';
import Vec2 from '../physics/Vec2.js';
import { WORKER_MSG } from '../config/worker-msg.js';

const engine = new PhysicsEngine({ gravity: 980 });
let lastTime = performance.now();

// Buffer for sync
// Layout: [Count, ID_1, X_1, Y_1, Angle_1, ID_2, ...]
// Max 1000 bodies -> 1 + 1000 * 4 = 4001 floats -> ~16KB
const MAX_BODIES = 1500;
const FLOATS_PER_BODY = 4;
let syncBuffer = new Float32Array(1 + MAX_BODIES * FLOATS_PER_BODY);

// Config
const CONFIG = {
    fixedStep: 1/60
};

self.onmessage = function(e) {
    const { type, payload } = e.data;

    switch(type) {
        case WORKER_MSG.INIT:
            if (payload.gravity) engine.gravity.y = payload.gravity;
            break;

        case WORKER_MSG.SPAWN:
            spawnBody(payload);
            break;

        case WORKER_MSG.CLEAR:
            engine.clear();
            break;
    }
};

function spawnBody(data) {
    const body = new RigidBody(data.shape, data.x, data.y, data.options);
    body.velocity = new Vec2(data.velocity.x, data.velocity.y);
    // Restore ID from main thread to keep sync
    if (data.id !== undefined) body.id = data.id;
    engine.addBody(body);
}

// Collision forwarding
engine.onCollision((event) => {
    // We only care about events involving sensors or high impact peg hits
    // to reduce message overhead
    const { bodyA, bodyB, collision } = event;

    // Simplification: Just send ID pairs and let main thread decide logic
    // Or send typed event

    const isSensor = bodyA.isSensor || bodyB.isSensor;
    if (isSensor) {
        self.postMessage({
            type: WORKER_MSG.COLLISION,
            payload: {
                idA: bodyA.id,
                idB: bodyB.id,
                isSensor: true
            }
        });
        return;
    }

    // Check Impact for sound
    const velA = bodyA.getPointVelocity(collision.contactPoint);
    const velB = bodyB.getPointVelocity(collision.contactPoint);
    const relativeVel = { x: velB.x - velA.x, y: velB.y - velA.y };
    const velAlongNormal = Math.abs(relativeVel.x * collision.normal.x + relativeVel.y * collision.normal.y);

    if (velAlongNormal > 50) {
        self.postMessage({
            type: WORKER_MSG.COLLISION,
            payload: {
                idA: bodyA.id,
                idB: bodyB.id,
                isSensor: false,
                contact: { x: collision.contactPoint.x, y: collision.contactPoint.y },
                impact: velAlongNormal
            }
        });
    }
});

// Loop
function loop() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    // Safety cap on dt
    const safeDt = Math.min(dt, 0.1);

    engine.update(safeDt);

    // Sync
    serializeState();

    // Transfer buffer to main thread (Zero Copy)
    self.postMessage({
        type: WORKER_MSG.SYNC,
        buffer: syncBuffer
    }, [syncBuffer.buffer]);

    // Reallocate for next frame since ownership was transferred
    syncBuffer = new Float32Array(1 + MAX_BODIES * FLOATS_PER_BODY);

    // Use setTimeout for loop since requestAnimationFrame is not in Workers
    // Aiming for 60hz
    setTimeout(loop, 1000/60);
}

function serializeState() {
    let count = 0;
    let offset = 1; // Index 0 is count

    // Only sync dynamic bodies (circles/balls) to save bandwidth
    // Static bodies (pegs, sensors) don't move
    for (const body of engine.bodies) {
        if (body.isStatic) continue;

        if (offset + 4 > syncBuffer.length) break;

        syncBuffer[offset++] = body.id;
        syncBuffer[offset++] = body.position.x;
        syncBuffer[offset++] = body.position.y;
        syncBuffer[offset++] = body.angle;
        count++;
    }

    syncBuffer[0] = count;
}

// Start loop
loop();
