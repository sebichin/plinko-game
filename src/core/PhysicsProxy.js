import { WORKER_MSG } from '../config/worker-msg.js';
import PhysicsWorker from '../workers/physics.worker.js?worker';

export default class PhysicsProxy {
    constructor(options = {}) {
        this.worker = new PhysicsWorker();
        this.bodies = []; // Shadow bodies for rendering
        this.bodiesMap = new Map(); // ID -> Body
        this.nextBodyId = 0;

        // Callbacks
        this.collisionCallbacks = [];

        // Init Worker
        this.worker.postMessage({
            type: WORKER_MSG.INIT,
            payload: { gravity: options.gravity || 980 }
        });

        // Handle Messages
        this.worker.onmessage = (e) => {
            const { type, buffer, payload } = e.data;

            if (type === WORKER_MSG.SYNC) {
                this.handleSync(buffer);
            } else if (type === WORKER_MSG.COLLISION) {
                this.handleCollision(payload);
            }
        };
    }

    addBody(body) {
        // Assign ID on main thread
        body.id = this.nextBodyId++;
        this.bodies.push(body);
        this.bodiesMap.set(body.id, body);

        // Serialize for worker
        // We only send what's needed for physics construction
        const payload = {
            id: body.id,
            shape: body.shape,
            x: body.position.x,
            y: body.position.y,
            velocity: { x: body.velocity.x, y: body.velocity.y },
            options: {
                radius: body.radius,
                width: body.width,
                height: body.height,
                isStatic: body.isStatic,
                isSensor: body.isSensor,
                restitution: body.restitution,
                friction: body.friction,
                frictionAir: body.frictionAir,
                density: body.density,
                label: body.label,
                collisionFilter: body.collisionFilter
            }
        };

        this.worker.postMessage({
            type: WORKER_MSG.SPAWN,
            payload
        });

        return body;
    }

    removeBody(body) {
        // We don't implement full removal sync yet for simplicity
        // But we hide it locally
        const index = this.bodies.indexOf(body);
        if (index !== -1) {
            this.bodies.splice(index, 1);
            this.bodiesMap.delete(body.id);
        }
        // Worker cleanup TODO
    }

    clear() {
        this.bodies = [];
        this.bodiesMap.clear();
        this.nextBodyId = 0;
        this.worker.postMessage({ type: WORKER_MSG.CLEAR, payload: {} });
    }

    onCollision(callback) {
        this.collisionCallbacks.push(callback);
    }

    handleSync(buffer) {
        const floatView = new Float32Array(buffer);
        const count = floatView[0];
        let offset = 1;

        for (let i = 0; i < count; i++) {
            const id = floatView[offset++];
            const x = floatView[offset++];
            const y = floatView[offset++];
            const angle = floatView[offset++];

            const body = this.bodiesMap.get(id);
            if (body) {
                body.position.x = x;
                body.position.y = y;
                body.angle = angle;

                // Update trail if ball
                if (body.label === 'ball' && body.trail) {
                    body.trail.push({ x, y });
                    if (body.trail.length > 20) body.trail.shift();
                }
            }
        }
    }

    handleCollision(data) {
        // Reconstruct event object for Game.js
        const bodyA = this.bodiesMap.get(data.idA);
        const bodyB = this.bodiesMap.get(data.idB);

        if (!bodyA || !bodyB) return;

        const event = {
            bodyA,
            bodyB,
            collision: {
                contactPoint: data.contact,
                normal: { x: 0, y: 0 } // Not needed for current game logic if we have impact
            }
        };

        this.collisionCallbacks.forEach(cb => cb(event));
    }

    update(dt) {
        // Worker runs its own loop.
        // We just return alpha = 1 because we sync position directly.
        // Or we could implement interpolation between sync frames for smoother 144hz
        // For now, simple direct sync.
        return 1;
    }

    // Stub methods needed by renderer
    getInterpolatedPosition(body, alpha) {
        return body.position; // Already interpolated by worker sync freq? No, but close enough for V1
    }
}
