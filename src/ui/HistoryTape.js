import { getMultiplierColor } from '../config/constants.js';

export default class HistoryTape {
    constructor() {
        this.container = document.getElementById('history-tape');
        this.maxItems = 20;
    }

    addEntry(multiplier, payout) {
        if (!this.container) return;

        const entry = document.createElement('div');
        const color = getMultiplierColor(multiplier);
        const isWin = multiplier >= 1;
        const textColor = isWin ? 'text-black' : 'text-slate-400';
        const bg = isWin ? '' : 'bg-slate-800 border border-slate-700';

        entry.className = `flex-shrink-0 h-8 min-w-[3rem] px-2 rounded font-bold text-xs flex items-center justify-center animate-slideIn ${textColor} ${bg}`;

        if (isWin) {
            entry.style.backgroundColor = color;
            entry.style.boxShadow = `0 0 10px ${color}40`;
        }

        entry.textContent = `${multiplier}x`;

        // Prepend new entry
        if (this.container.firstChild) {
            this.container.insertBefore(entry, this.container.firstChild);
        } else {
            this.container.appendChild(entry);
        }

        // Limit items
        if (this.container.children.length > this.maxItems) {
            this.container.lastChild.remove();
        }
    }
}
