export class Particle {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 1;
        this.color = '#ffffff';
        this.size = 2;
    }

    reset(x, y, color, speed, size = 2, life = 0.5) {
        this.active = true;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;

        const angle = Math.random() * Math.PI * 2;
        const v = Math.random() * speed;
        this.vx = Math.cos(angle) * v;
        this.vy = Math.sin(angle) * v;
    }

    update(dt) {
        if (!this.active) return;

        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return;
        }

        // Physics
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Gravity
        this.vy += 500 * dt;

        // Drag
        this.vx *= 0.95;
        this.vy *= 0.95;
    }
}

export default class ParticleSystem {
    constructor(maxParticles = 500) {
        this.pool = new Array(maxParticles).fill(null).map(() => new Particle());
    }

    emit(x, y, count, color, speed = 150, size = 2, life = 0.5) {
        let spawned = 0;
        for (const p of this.pool) {
            if (!p.active) {
                p.reset(x, y, color, speed, size, life);
                spawned++;
                if (spawned >= count) break;
            }
        }
    }

    update(dt) {
        for (const p of this.pool) {
            if (p.active) p.update(dt);
        }
    }

    draw(ctx) {
        ctx.save();
        for (const p of this.pool) {
            if (!p.active) continue;

            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.restore();
    }
}
