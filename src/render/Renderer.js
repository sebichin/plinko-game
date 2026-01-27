import Minimap from './Minimap.js';
import { getMultiplierColor } from '../config/constants.js';

export default class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.minimap = new Minimap();

        // Offscreen canvas for static pegs (Optimization)
        this.pegCanvas = document.createElement('canvas');
        this.pegCtx = this.pegCanvas.getContext('2d');
        this.pegCanvasValid = false;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        // Resize peg canvas matches main canvas
        this.pegCanvas.width = this.canvas.width;
        this.pegCanvas.height = this.canvas.height;
        this.pegCtx.scale(dpr, dpr);
        this.pegCanvasValid = false; // Force redraw

        this.ctx.scale(dpr, dpr);
    }

    preparePegs(engine) {
        if (this.pegCanvasValid) return;

        const { pegCtx: ctx, width, height } = this;
        ctx.clearRect(0, 0, width, height);

        engine.bodies.forEach(body => {
            if (body.label !== 'peg') return;

            ctx.save();
            ctx.translate(body.position.x, body.position.y);

            // Glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';

            ctx.beginPath();
            ctx.arc(0, 0, body.radius, 0, Math.PI * 2);
            ctx.fillStyle = body.render.fillStyle || '#ffffff';
            ctx.fill();

            ctx.restore();
        });

        this.pegCanvasValid = true;
    }

    render(engine, particles, customData, interpolationAlpha) {
        const { ctx, width, height } = this;
        if (!ctx || !customData) return;

        // Ensure pegs are pre-rendered
        if (!this.pegCanvasValid) this.preparePegs(engine);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw overlay
        this.drawOverlay(customData);

        // Draw Pre-rendered Pegs
        ctx.drawImage(this.pegCanvas, 0, 0, width, height);

        // Draw trails and Dynamic bodies
        engine.bodies.forEach(body => {
            if (body.label === 'peg' || (body.render && body.render.visible === false)) return;

            // Draw Trail (for balls)
            if (body.label === 'ball' && body.trail && body.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(body.trail[0].x, body.trail[0].y);
                for (let i = 1; i < body.trail.length; i++) {
                    ctx.lineTo(body.trail[i].x, body.trail[i].y);
                }

                const gradient = ctx.createLinearGradient(
                    body.trail[0].x, body.trail[0].y,
                    body.position.x, body.position.y
                );
                gradient.addColorStop(0, 'rgba(255, 0, 85, 0)');
                gradient.addColorStop(1, 'rgba(255, 0, 85, 0.6)');

                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = body.radius * 0.8;
                ctx.strokeStyle = gradient;
                ctx.stroke();
            }

            const pos = engine.getInterpolatedPosition(body, interpolationAlpha);

            ctx.save();
            ctx.translate(pos.x, pos.y);

            if (body.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, body.radius, 0, Math.PI * 2);

                // Ball Gradient
                if (body.label === 'ball') {
                    const grad = ctx.createRadialGradient(-body.radius*0.3, -body.radius*0.3, body.radius*0.1, 0, 0, body.radius);
                    grad.addColorStop(0, '#ffffff');
                    grad.addColorStop(1, body.render.fillStyle);
                    ctx.fillStyle = grad;

                    // Ball Glow
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = body.render.fillStyle;
                } else {
                    ctx.fillStyle = body.render.fillStyle || '#ffffff';
                }

                ctx.fill();

                if (body.render.strokeStyle && body.label !== 'ball') {
                    ctx.strokeStyle = body.render.strokeStyle;
                    ctx.lineWidth = body.render.lineWidth || 1;
                    ctx.stroke();
                }
            } else if (body.shape === 'rectangle') {
                const halfW = body.width / 2;
                const halfH = body.height / 2;

                ctx.fillStyle = body.render.fillStyle || '#ffffff';
                ctx.fillRect(-halfW, -halfH, body.width, body.height);

                if (body.render.strokeStyle) {
                    ctx.strokeStyle = body.render.strokeStyle;
                    ctx.lineWidth = body.render.lineWidth || 1;
                    ctx.strokeRect(-halfW, -halfH, body.width, body.height);
                }
            }

            ctx.restore();
        });

        // Draw Particles
        if (particles) {
            particles.draw(ctx);
        }

        // Draw minimap
        this.minimap.draw(ctx, customData);
    }

    drawOverlay(data) {
        const { ctx } = this;
        const { gap, rows, mults, startY, numBuckets } = data;
        const lastRowY = startY + (rows - 1) * gap;
        const bucketY = lastRowY + (gap * 0.6);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const totalBucketWidth = numBuckets * gap;
        const startX = (this.width / 2) - (totalBucketWidth / 2) + (gap / 2);

        // Guides
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';

        for (let i = 0; i < mults.length; i++) {
            const x = startX + (i * gap);
            const val = mults[i];
            const color = getMultiplierColor(val);

            // Grid Line
            ctx.beginPath();
            ctx.moveTo(x - gap/2, lastRowY);
            ctx.lineTo(x - gap/2, bucketY + gap);
            ctx.stroke();

            // Box
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = color;
            const bw = gap * 0.96;
            const bh = gap * 0.7;

            // roundRectSafe should be polyfilled in main.js
            if (ctx.roundRectSafe) {
                ctx.roundRectSafe(x - bw/2, bucketY - bh/2, bw, bh, 4);
            } else {
                ctx.fillRect(x - bw/2, bucketY - bh/2, bw, bh);
            }
            ctx.fill();

            // Text
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000';
            let fontSize = Math.max(10, gap * 0.35);
            if (val >= 1000) fontSize *= 0.6;
            ctx.font = `800 ${fontSize}px Inter`;
            ctx.fillText(`${val}x`, x, bucketY + 1);
        }
    }
}
