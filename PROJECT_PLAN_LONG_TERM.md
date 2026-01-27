# Plinko Project - Long Term Implementation Plan

This document serves as the master roadmap for upgrading the Plinko Game project. It is divided into 4 distinct phases to ensure a structured and high-quality evolution of the codebase.

## Overview
- **Goal:** Transform the single-file prototype into a professional, modular, feature-rich, and performant web application.
- **Current State:** Single `index.html` + `physics-engine.js` (vanilla JS).
- **Target State:** Modular Vite project, rich visual effects, provably fair gameplay, and multi-threaded physics.

## Roadmap

### Phase 1: Foundation (Architecture)
*Establish a professional development environment and code structure.*

**1.1 Build System Setup**
- **Dependencies:**
  - `vite` (latest)
  - `tailwindcss` (latest)
  - `autoprefixer` (latest)
  - `postcss` (latest)
- **Config Files:**
  - **`vite.config.js`**:
    ```js
    export default {
      root: 'src',
      build: { outDir: '../dist' }
    }
    ```
  - **`tailwind.config.js`**:
    ```js
    module.exports = {
      content: ['./src/**/*.{html,js}'],
      theme: { extend: {} },
      plugins: [],
    }
    ```
  - **`postcss.config.js`**: Standard config requiring tailwindcss and autoprefixer.

**1.2 Directory Structure & Code Mapping**
Refactor the codebase into the following module structure.
**Mapping Strategy:**

| Original Source | Function/Class | New Destination | Notes |
|----------------|----------------|-----------------|-------|
| `physics-engine.js` | `PhysicsEngine` | `src/physics/Engine.js` | |
| `physics-engine.js` | `RigidBody` | `src/physics/RigidBody.js` | |
| `physics-engine.js` | `Vec2` | `src/physics/Vec2.js` | |
| `physics-engine.js` | `SpatialHash` | `src/physics/SpatialHash.js` | |
| `index.html` | `SoundManager` | `src/core/SoundManager.js` | Convert to Singleton Class |
| `index.html` | `MULTIPLIERS`, `getMultiplierColor` | `src/config/constants.js` | Export constants |
| `index.html` | `normalPDF` | `src/utils/math.js` | |
| `index.html` | `roundRectSafe` | `src/utils/canvas.js` | Polyfill helper |
| `index.html` | `drawMinimap`, `getMinimapDimensions` | `src/render/Minimap.js` | Encapsulate in `Minimap` class |
| `index.html` | `render`, `drawOverlay` | `src/render/Renderer.js` | Encapsulate in `Renderer` class |
| `index.html` | `init`, `startRenderLoop`, `dropBall`, `restartGame` | `src/core/Game.js` | Core Game Logic |
| `index.html` | `updateUI`, `spawnFloater`, Sliders | `src/ui/UIManager.js` | Manage DOM elements |
| `index.html` | `balance`, `currentRows` | `src/core/GameState.js` | State Store |

**1.3 Implementation Details**
- **Entry Point (`src/main.js`):**
  - Import `style.css` (Tailwind directives).
  - Instantiate `GameState`, `SoundManager`, `UIManager`.
  - Initialize `Game` instance.
- **Game Class (`src/core/Game.js`):**
  - **Properties:** `engine` (Physics), `renderer` (Canvas), `state` (GameState).
  - **Methods:** `start()`, `stop()`, `loop()`, `handleCollision()`.
  - **Event Loop:** Moves `requestAnimationFrame` logic here.

### Phase 2: Visual Polish ("Juice")
*Enhance the visual experience and feedback.*

**2.1 Particle System (`src/render/ParticleSystem.js`)**
- **Class Structure:**
  ```js
  class Particle {
      constructor() { this.active = false; /* x, y, vx, vy, life, color */ }
      reset(x, y, color) { /* ... */ }
      update(dt) { /* Euler integration, drag, gravity */ }
  }
  class ParticleSystem {
      constructor(maxParticles = 500) { this.pool = new Array(maxParticles).fill(new Particle()); }
      emit(x, y, count, color) { /* Activate particles from pool */ }
      update(dt) { /* Update active particles */ }
      draw(ctx) { /* Render active particles */ }
  }
  ```
- **Configuration:**
  - **Peg Hit:** 5 particles, Speed 100-200, Life 0.3s, Color: White.
  - **Bucket Win:** 50 particles, Speed 300-500, Life 2.0s, Color: Bucket Color (Confetti).

**2.2 Advanced Rendering Components**
- **Ball Trails:**
  - **Logic:** In `Game.update()`, push current Ball position to `ball.trail` array (Max 15 points).
  - **Draw:** `ctx.beginPath()`, connect points. Use `ctx.strokeStyle` with gradients or diminishing opacity.
- **Static Glow Optimization:**
  - Create `this.pegCanvas = document.createElement('canvas')` in `Renderer`.
  - Draw all Pegs with `shadowBlur = 15`, `shadowColor = 'white'` **once** during initialization.
  - In main loop: `ctx.drawImage(this.pegCanvas, 0, 0)`.

**2.3 Main Render Pipeline (`Renderer.render()`)**
1. `ctx.clearRect(0, 0, width, height)`
2. **Background:** Draw Radial Gradient (matches CSS).
3. **Static Elements:** `ctx.drawImage(this.pegCanvas)` (Buckets & Pegs).
4. **Trails:** Loop bodies -> Draw trails.
5. **Bodies:** Loop bodies -> Draw Balls (Gradient fills: Radial `white` -> `color`).
6. **Particles:** `particleSystem.draw(ctx)`.
7. **UI Layer:**
   - Draw Score Popups (managed by `UIManager` but rendered here for performance).
   - Draw `Minimap`.

### Phase 3: Gameplay Features
*Add depth and trust mechanisms.*

**3.1 Provably Fair System (`src/core/FairnessSystem.js`)**
- **Algorithm:**
  ```js
  // Pseudocode for deterministic float generation
  const msg = `${clientSeed}:${nonce}`;
  const hash = hmac_sha256(serverSeed, msg);
  const chunk = hash.substring(0, 8);
  const float = parseInt(chunk, 16) / 4294967296; // 0.0 to 1.0
  ```
- **Application:**
  - In `dropBall()`, replace `Math.random()` with `fairnessSystem.getNextFloat()`.
  - Use this float to calculate:
    1. Initial X Jitter (offset from center).
    2. Initial X Velocity (slight push).
- **Data Storage:**
  - `serverSeed`: Generated on client init (simulated server).
  - `clientSeed`: User editable.
  - `nonce`: Incremented per drop.

**3.2 History Tape (`src/ui/HistoryTape.js`)**
- **Data Structure:**
  ```js
  type HistoryEntry = {
    id: string;        // Unique ID (nonce)
    multiplier: number;// e.g., 0.5, 1000
    payout: number;    // e.g., 50
    timestamp: number;
  }
  ```
- **UI:** Horizontal Flexbox container. New items prepend with animation. Max 10 visible.

**3.3 Ball Types Configuration (`src/config/constants.js`)**
- **Config Object:**
  ```js
  export const BALL_TYPES = {
    STANDARD: { density: 0.008, restitution: 0.35, friction: 0.08, color: '#ff0055' },
    BOUNCY:   { density: 0.005, restitution: 0.8,  friction: 0.05, color: '#3b82f6' },
    HEAVY:    { density: 0.015, restitution: 0.1,  friction: 0.2,  color: '#a855f7' }
  };
  ```
- **Logic:** Pass these overrides to `RigidBody` constructor in `dropBall`.

### Phase 4: Performance
*Ensure scalability.*

**4.1 Web Worker Architecture (`src/workers/physics.worker.js`)**
- **Main Thread (`PhysicsProxy.js`):**
  - Manages `Worker` instance.
  - Sends inputs: `worker.postMessage({ type: 'SPAWN', id, x, y, options })`.
  - Receives updates: `worker.onmessage` -> Updates local `RenderBody` positions.
- **Worker Thread:**
  - Runs the `PhysicsEngine` loop.
  - Serializes state every frame.

**4.2 Binary Protocol (Transferable Objects)**
- **Sync Payload (`Float32Array`):**
  - **Layout:** `[Count, ID_1, X_1, Y_1, Angle_1, ID_2, ...]`
  - **Transfer:** `postMessage({ type: 'SYNC', buffer }, [buffer.buffer])`.
  - **Optimization:** This "Zero-Copy" transfer moves ownership of the memory block to the main thread (very fast), preventing Garbage Collection overhead. The Worker allocates a new buffer for the next frame.

**4.3 Message Types Enum**
```js
const WORKER_MSG = {
  INIT: 0,
  SPAWN: 1,
  UPDATE_CONFIG: 2,
  SYNC: 3,
  COLLISION: 4
};
```
