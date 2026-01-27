# Short Term Project Memory

## Current Context
- **Phase:** Phase 4 - Performance (Web Workers).
- **Task:** Implement Web Worker Architecture & Binary Protocol.

## Detailed Steps
1.  **Worker Script (`src/workers/physics.worker.js`):**
    - Imports `PhysicsEngine`, `RigidBody`.
    - Holds `engine` instance.
    - Message Handler: `INIT` (setup), `SPAWN` (add body), `CONFIG` (gravity/rows).
    - Loop: `engine.update(dt)`.
    - Output: Serialize `id, x, y, angle` to `Float32Array`. Post back as `SYNC`.
2.  **Physics Proxy (`src/core/PhysicsProxy.js`):**
    - Spawns `new Worker()`.
    - Manages `bodies` array (render-only).
    - `addBody(body)` -> `postMessage('SPAWN', body_props)`.
    - `update(dt)` -> No-op? Or just processes latest sync buffer.
    - `onmessage`: Updates local body positions from buffer.
3.  **Refactoring:**
    - `Game.js` switches `this.engine` to `new PhysicsProxy()`.
    - Must ensure `Renderer` can still read from `proxy.bodies`.
