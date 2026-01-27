import { normalPDF } from '../utils/math.js';
import GameState from '../core/GameState.js';

export default class Minimap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.gameState = GameState.getInstance();
    }

    getDimensions(screenWidth) {
        if (screenWidth < 480) {  // Mobile screens
            return {
                x: 10,
                y: 10,
                width: Math.min(screenWidth * 0.4, 150),
                height: 80
            };
        } else {  // Desktop and tablet
            return {
                x: 20,
                y: 20,
                width: 200,
                height: 120
            };
        }
    }

    draw(ctx, customData) {
        const histogramData = this.gameState.histogramData;
        if (!customData || histogramData.length === 0) return;

        const { numBuckets } = customData;
        const screenWidth = ctx.canvas.width / (window.devicePixelRatio || 1);
        const mm = this.getDimensions(screenWidth);

        const padding = 10;
        const innerWidth = mm.width - (padding * 2);
        const innerHeight = mm.height - (padding * 2);

        // ===== CONTAINER BACKGROUND =====
        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;

        ctx.fillRect(mm.x, mm.y, mm.width, mm.height);
        ctx.strokeRect(mm.x, mm.y, mm.width, mm.height);

        // ===== NORMAL DISTRIBUTION CURVE =====
        const mean = numBuckets / 2;
        const stdDev = Math.sqrt(numBuckets) / 2;
        const maxPDF = normalPDF(mean, mean, stdDev);

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;

        for (let i = 0; i <= numBuckets * 2; i++) {
            const bucketPos = i / 2;
            const x = mm.x + padding + (bucketPos / numBuckets) * innerWidth;

            const pdfValue = normalPDF(bucketPos, mean, stdDev);
            const normalizedHeight = (pdfValue / maxPDF) * innerHeight;
            const y = mm.y + mm.height - padding - normalizedHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // ===== HISTOGRAM BARS =====
        const maxCount = Math.max(...histogramData, 1);
        const barWidth = innerWidth / numBuckets;

        for (let i = 0; i < numBuckets; i++) {
            const count = histogramData[i];
            const barHeight = (count / maxCount) * innerHeight;
            const x = mm.x + padding + (i * barWidth);
            const y = mm.y + mm.height - padding - barHeight;

            ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
            ctx.fillRect(x, y, barWidth - 2, barHeight);
        }

        // ===== TOTAL COUNT LABEL =====
        const totalBalls = histogramData.reduce((sum, count) => sum + count, 0);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '600 11px Inter';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Balls: ${totalBalls}`, mm.x + padding, mm.y + padding);

        ctx.restore();
    }
}
