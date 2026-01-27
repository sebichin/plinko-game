# Short Term Project Memory

## Current Context
- **Phase:** Phase 2 - Visual Polish.
- **Task:** Advanced Rendering (Trails, Glow, Offscreen Canvas).

## Detailed Steps
1.  **Trails:**
    - `RigidBody.js`: Add `this.trail = []` to constructor.
    - `Game.js`: In `update` loop (or after physics update), iterate bodies. If `label === 'ball'`, `push` current position to `trail`. Shift if `length > 15`.
    - `Renderer.js`: In `render`, iterate bodies. Draw polyline from `trail`. Use `ctx.globalAlpha` or gradient for fading.
2.  **Glow (Static Pegs):**
    - `Renderer.js`: Add `this.pegCanvas = document.createElement('canvas')`.
    - `Renderer.js`: Create `preparePegs(pegs)` method. Called once (or on resize).
    - `preparePegs`: Clear offscreen canvas. Iterate pegs. Set `shadowBlur = 15`, `shadowColor = 'white'`. Draw pegs.
    - `Renderer.js`: In `render`, replace peg drawing loop with `ctx.drawImage(this.pegCanvas, 0, 0)`.
3.  **Ball Gradient:**
    - `Renderer.js`: For balls, use `ctx.createRadialGradient`. Center white, edge `fillStyle`.
