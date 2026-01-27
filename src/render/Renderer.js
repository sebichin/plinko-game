import Minimap from './Minimap.js';
import { getMultiplierColor } from '../config/constants.js';

export default class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.minimap = new Minimap();
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        this.ctx.scale(dpr, dpr);
    }

    render(engine, customData, interpolationAlpha) {
        const { ctx, width, height } = this;
        if (!ctx || !customData) return;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw overlay
        this.drawOverlay(customData);

        // Draw bodies
        engine.bodies.forEach(body => {
            if (body.render && body.render.visible === false) return;

            const pos = engine.getInterpolatedPosition(body, interpolationAlpha);

            ctx.save();
            ctx.translate(pos.x, pos.y);

            if (body.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, body.radius, 0, Math.PI * 2);
                ctx.fillStyle = body.render.fillStyle || '#ffffff';
                ctx.fill();

                if (body.render.strokeStyle) {
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
