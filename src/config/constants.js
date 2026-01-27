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

export const BALL_TYPES = {
    STANDARD: { density: 0.008, restitution: 0.35, friction: 0.08, color: '#ff0055', label: 'Standard' },
    BOUNCY:   { density: 0.005, restitution: 0.8,  friction: 0.05, color: '#3b82f6', label: 'High Bounce' },
    HEAVY:    { density: 0.015, restitution: 0.1,  friction: 0.2,  color: '#a855f7', label: 'Heavy' }
};
