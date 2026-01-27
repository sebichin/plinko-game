import './style.css';
import { polyfillCanvas } from './utils/canvas.js';
import Game from './core/Game.js';

// Polyfill
polyfillCanvas();

// Start Game
window.game = new Game();
