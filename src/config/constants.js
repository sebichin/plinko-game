export const MULTIPLIERS = {
    8:  [29, 4, 2, 0.3, 2, 4, 29],
    12: [170, 24, 8.1, 2, 1, 0.5, 1, 2, 8.1, 24, 170],
    16: [1000, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 1000]
};

export function getMultiplierColor(val) {
    if (val >= 100) return '#ef4444';
    if (val >= 10) return '#f97316';
    if (val >= 2) return '#eab308';
    return '#f59e0b';
}

export const COLORS = {
    background: '#020617',
    peg: 'white',
    ball: '#ff0055',
    ballOutline: '#ff88aa'
};
