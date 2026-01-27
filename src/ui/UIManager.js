import GameState from '../core/GameState.js';

export default class UIManager {
    constructor(game) {
        this.game = game;
        this.state = GameState.getInstance();

        // Elements
        this.balanceDisplay = document.getElementById('balanceDisplay');
        this.rowCountSelect = document.getElementById('rowCount');
        this.betInput = document.getElementById('betInput');
        this.maxBtn = document.getElementById('maxBtn');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedDisplay = document.getElementById('speedDisplay');
        this.sizeSlider = document.getElementById('sizeSlider');
        this.sizeDisplay = document.getElementById('sizeDisplay');
        this.dropBtn = document.getElementById('dropBtn');
        this.scoreOverlays = document.getElementById('score-overlays');

        this.autoInterval = null;

        this.initListeners();
    }

    initListeners() {
        // Balance updates
        this.state.addEventListener('balanceChange', () => this.updateBalanceDisplay());

        // Row Count
        this.rowCountSelect.addEventListener('change', (e) => {
            this.state.rowCount = parseInt(e.target.value);
            this.game.restart();
        });

        // Bet Amount
        this.betInput.addEventListener('change', (e) => {
            this.state.betAmount = parseFloat(e.target.value);
        });

        // Max Button
        this.maxBtn.addEventListener('click', () => {
            this.betInput.value = Math.floor(this.state.balance);
            this.state.betAmount = parseFloat(this.betInput.value);
        });

        // Speed Slider
        this.speedSlider.addEventListener('input', (e) => {
            const rate = parseInt(e.target.value);
            this.state.autoSpeed = rate;
            this.speedDisplay.textContent = `${rate}/s`;

            if (this.autoInterval) {
                this.restartAuto();
            }
        });

        // Size Slider
        this.sizeSlider.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            this.state.ballSizePercent = size / 100;
            this.sizeDisplay.textContent = `${size}%`;
        });

        // Drop Button (Auto Play Logic)
        this.dropBtn.addEventListener('mousedown', () => this.startAuto());
        window.addEventListener('mouseup', () => this.stopAuto());
        this.dropBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startAuto();
        }, {passive: false});
        window.addEventListener('touchend', () => this.stopAuto());
    }

    updateBalanceDisplay() {
        this.balanceDisplay.textContent = '$' + this.state.balance.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    flashBalance() {
        this.balanceDisplay.style.color = 'red';
        setTimeout(() => this.balanceDisplay.style.color = 'white', 200);
    }

    spawnFloater(mult, winAmt, x, y) {
        const el = document.createElement('div');
        el.className = 'absolute font-black pointer-events-none animate-floatUp z-50 whitespace-nowrap text-shadow';
        // Note: Tailwind classes replaced custom CSS animation, but we need custom keyframes for floatUp
        // For now, re-using inline styles or we add 'animate-floatUp' to tailwind config
        // Let's stick to the inline style approach from original for safety, but wrapping in tailwind

        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.animation = 'floatUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards';

        const isWin = mult >= 1;
        const color = isWin ? '#4ade80' : '#94a3b8';
        const valColor = mult >= 10 ? '#f472b6' : 'white';

        el.innerHTML = `
            <div style="background: #1e293b; padding: 4px 8px; border-radius: 4px; border: 1px solid ${color}; display: flex; flex-direction: column; align-items: center;">
                <span style="color: ${valColor}; font-size: 12px;">${mult}x</span>
                <span style="color: ${color}; font-size: 10px;">$${winAmt.toFixed(0)}</span>
            </div>
        `;

        this.scoreOverlays.appendChild(el);
        setTimeout(() => el.remove(), 1200);
    }

    startAuto() {
        if (this.autoInterval) return;
        this.game.dropBall();
        this.dropBtn.classList.add('scale-95', 'brightness-110');

        const rate = this.state.autoSpeed;
        this.autoInterval = setInterval(() => {
            if (this.state.balance < this.state.betAmount) {
                this.stopAuto();
                return;
            }
            this.game.dropBall();
        }, 1000 / rate);
    }

    restartAuto() {
        clearInterval(this.autoInterval);
        const rate = this.state.autoSpeed;
        this.autoInterval = setInterval(() => {
            if (this.state.balance < this.state.betAmount) {
                this.stopAuto();
                return;
            }
            this.game.dropBall();
        }, 1000 / rate);
    }

    stopAuto() {
        if (this.autoInterval) {
            clearInterval(this.autoInterval);
            this.autoInterval = null;
        }
        this.dropBtn.classList.remove('scale-95', 'brightness-110');
    }
}
