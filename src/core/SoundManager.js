export default class SoundManager {
    constructor() {
        this.ctx = null;
    }

    static getInstance() {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playPegHit() {
        this.playTone(800 + (Math.random() * 400), 'triangle', 0.05, 0.05);
    }

    playScore(multiplier) {
        if (!this.ctx) return;
        if (multiplier < 1) {
            this.playTone(150, 'sawtooth', 0.2, 0.08);
        } else if (multiplier >= 10) {
            const now = this.ctx.currentTime;
            [523, 659, 783, 1046].forEach((f, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.frequency.value = f;
                gain.gain.setValueAtTime(0.08, now + i*0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i*0.05 + 0.3);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + i*0.05);
                osc.stop(now + i*0.05 + 0.3);
            });
        } else {
            this.playTone(880, 'sine', 0.3, 0.1);
        }
    }
}
