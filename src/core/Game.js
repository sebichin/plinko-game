import PhysicsEngine from '../physics/Engine.js';
import RigidBody from '../physics/RigidBody.js';
import Vec2 from '../physics/Vec2.js';
import Renderer from '../render/Renderer.js';
import GameState from './GameState.js';
import SoundManager from './SoundManager.js';
import UIManager from '../ui/UIManager.js';
import { MULTIPLIERS } from '../config/constants.js';

export default class Game {
    constructor() {
        this.state = GameState.getInstance();
        this.soundManager = SoundManager.getInstance();
        this.engine = new PhysicsEngine({ gravity: 980 });

        const canvas = document.getElementById('world');
        this.renderer = new Renderer(canvas);

        // Initialize UI (depends on Game instance for callbacks)
        this.ui = new UIManager(this);

        this.lastFrameTime = performance.now();
        this.animationFrameId = null;
        this.customData = null;
        this.gameActive = false;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => this.resize(), 200);
        });

        // Register Collision
        this.engine.onCollision((e) => this.handleCollision(e));

        this.buildLevel();
        this.startLoop();
        this.gameActive = true;
    }

    resize() {
        const container = document.getElementById('game-container');
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        if (this.height === 0) return; // Hidden or not ready

        this.renderer.resize(this.width, this.height);

        // Rebuild level on resize to fit new dimensions
        // Note: This clears existing balls, which is a trade-off for responsive layout
        this.engine.clear();
        this.buildLevel();
    }

    buildLevel() {
        const rows = this.state.rowCount;
        const mults = MULTIPLIERS[rows];
        const numBuckets = mults.length;

        // Reset Histogram
        this.state.resetHistogram(numBuckets);

        // Smart gap calculation
        const paddingX = 48;
        const paddingY = 40;
        const safeWidth = this.width - paddingX;
        const safeHeight = this.height - paddingY;
        const gapByWidth = safeWidth / numBuckets;
        const gapByHeight = safeHeight / (rows + 2.8);
        const minGap = 25, maxGap = 65;
        let gap = Math.max(minGap, Math.min(maxGap, gapByWidth, gapByHeight));

        const totalGameHeight = (rows + 2.8) * gap;
        const startY = (this.height - totalGameHeight) / 2;
        const pegRadius = gap * 0.12;

        this.customData = { gap, rows, mults, startY, pegRadius, numBuckets };

        // Pegs
        for (let r = 2; r < rows; r++) {
            for (let c = 0; c <= r; c++) {
                const x = this.width / 2 - (r * gap / 2) + (c * gap);
                const y = startY + r * gap;

                const peg = new RigidBody('circle', x, y, {
                    radius: pegRadius,
                    isStatic: true,
                    label: 'peg',
                    render: { fillStyle: 'white' },
                    friction: 0.1,
                    restitution: 0.7,
                    frictionStatic: 0.05
                });
                this.engine.addBody(peg);
            }
        }

        // Sensors
        const lastRowY = startY + (rows - 1) * gap;
        const bucketY = lastRowY + (gap * 0.6);
        const totalBucketWidth = numBuckets * gap;
        const startX = (this.width / 2) - (totalBucketWidth / 2) + (gap / 2);

        for (let i = 0; i < numBuckets; i++) {
            const x = startX + (i * gap);
            const sensor = new RigidBody('rectangle', x, bucketY, {
                width: gap * 0.98,
                height: gap,
                isStatic: true,
                isSensor: true,
                label: 'sensor',
                plugin: { val: mults[i], bucketIndex: i },
                render: { visible: false }
            });
            this.engine.addBody(sensor);
        }
    }

    startLoop() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

        const loop = (currentTime) => {
            const deltaTime = (currentTime - this.lastFrameTime) / 1000;
            this.lastFrameTime = currentTime;

            const alpha = this.engine.update(deltaTime);
            this.renderer.render(this.engine, this.customData, alpha);

            this.animationFrameId = requestAnimationFrame(loop);
        };

        this.lastFrameTime = performance.now();
        this.animationFrameId = requestAnimationFrame(loop);
    }

    dropBall() {
        this.soundManager.init();

        const bet = this.state.betAmount;
        if (this.state.balance < bet) {
            this.ui.flashBalance();
            return;
        }

        this.state.balance -= bet;

        const data = this.customData;
        const sizePercent = this.state.ballSizePercent;
        const ballRadius = data.gap * sizePercent;

        const jitter = (Math.random() * 1 - 0.5);
        const spawnY = data.startY + (data.gap * 1.2);

        const ball = new RigidBody('circle', this.width / 2 + jitter, spawnY, {
            radius: ballRadius,
            restitution: 0.35,
            friction: 0.08,
            frictionAir: 0.005,
            density: 0.008,
            label: 'ball',
            plugin: { bet: bet, active: true },
            render: {
                fillStyle: '#ff0055',
                strokeStyle: '#ff88aa',
                lineWidth: 2
            },
            collisionFilter: { group: -1 }
        });

        const initialVelocityX = (Math.random() - 0.5) * 0.1;
        ball.velocity = new Vec2(initialVelocityX, 0);

        this.engine.addBody(ball);
    }

    handleCollision(event) {
        const { bodyA, bodyB } = event;

        let ball = bodyA.label === 'ball' ? bodyA : bodyB.label === 'ball' ? bodyB : null;
        if (!ball) return;

        // Sensor Check
        let sensor = bodyA.label === 'sensor' ? bodyA : bodyB.label === 'sensor' ? bodyB : null;
        if (sensor && ball.plugin.active) {
            ball.plugin.active = false;

            const bucketIndex = sensor.plugin.bucketIndex;
            this.state.updateHistogram(bucketIndex);

            const mult = sensor.plugin.val;
            const win = ball.plugin.bet * mult;

            this.soundManager.playScore(mult);
            this.state.balance += win;

            this.ui.spawnFloater(mult, win, ball.position.x, ball.position.y);
            this.engine.removeBody(ball);
            return;
        }

        // Peg Check
        let peg = bodyA.label === 'peg' ? bodyA : bodyB.label === 'peg' ? bodyB : null;
        if (peg) {
            const { collision } = event;
            const velA = bodyA.getPointVelocity(collision.contactPoint);
            const velB = bodyB.getPointVelocity(collision.contactPoint);
            const relativeVel = {
                x: velB.x - velA.x,
                y: velB.y - velA.y
            };

            const velAlongNormal = Math.abs(
                relativeVel.x * collision.normal.x +
                relativeVel.y * collision.normal.y
            );

            const IMPACT_THRESHOLD = 50;
            if (velAlongNormal > IMPACT_THRESHOLD) {
                this.soundManager.playPegHit();
            }
        }
    }

    restart() {
        this.engine.clear();
        this.buildLevel();
    }
}
