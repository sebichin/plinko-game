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
- Initialize `package.json` with `vite`, `tailwindcss`, `autoprefixer`, `postcss`.
- Configure `tailwind.config.js` to scan `./src/**/*.{js,html}`.
- Create `postcss.config.js`.

**1.2 Directory Structure Refactoring**
Refactor the codebase into the following module structure:
```text
src/
├── main.js                 # Entry point, initializes Game
├── config/
│   └── constants.js        # MULTIPLIERS, COLORS, DEFAULT_SETTINGS
├── core/
│   ├── Game.js             # Main game loop, coordinates Engine and Renderer
│   ├── GameState.js        # Singleton for Balance, Settings, Statistics
│   └── SoundManager.js     # AudioContext wrapper
├── physics/
│   ├── Engine.js           # PhysicsEngine class
│   ├── RigidBody.js        # RigidBody class
│   ├── Vec2.js             # Vector math
│   └── SpatialHash.js      # Collision optimization
├── render/
│   ├── Renderer.js         # Canvas rendering logic
│   └── Minimap.js          # Histogram rendering logic
├── ui/
│   └── UIManager.js        # DOM event listeners, HTML updates
└── utils/
    └── math.js             # Helper functions (normalPDF, etc.)
```

**1.3 Implementation Details**
- **State Management:** Create a `GameState` class that extends `EventTarget` (or similar simple observer) to notify UI when `balance` changes.
- **Physics:** Extract classes from `physics-engine.js` into individual files.
- **Game Loop:** Move `requestAnimationFrame` loop into `Game.js`.

### Phase 2: Visual Polish ("Juice")
*Enhance the visual experience and feedback.*

**2.1 Particle System**
- Create `src/render/ParticleSystem.js`.
- **Logic:** Simple pool-based particle manager.
- **Triggers:**
  - **Peg Hit:** Small spark burst (Color: White/Yellow).
  - **Bucket Win:** Confetti explosion (Color: Bucket color).
- **Integration:** Hook into `PhysicsEngine` collision events.

**2.2 Advanced Rendering**
- **Ball Trails:** Add a `trail: Vec2[]` buffer to `RigidBody` (or a `Ball` subclass). Render as a fading polyline.
- **Glow Effects:**
  - Apply `ctx.shadowBlur` to Pegs and Balls.
  - Optimize by pre-rendering static glowing pegs to an offscreen canvas if performance drops.
- **Canvas-based UI:** Move "Score Popups" from DOM elements (`<div>`) to Canvas text for smoother 60fps animation.

**2.3 Rendering Pipeline Update (`Renderer.js`)**
1. `ctx.clearRect`
2. Draw Background (Gradient)
3. Draw Buckets & Grid
4. Draw Pegs (with Glow)
5. Draw Ball Trails
6. Draw Balls (Gradient Fill)
7. Draw Particles
8. Draw UI Overlays (Score Popups, Minimap)

### Phase 3: Gameplay Features
*Add depth and trust mechanisms.*

**3.1 Provably Fair System**
- **Concept:** Ensure physics initial conditions are deterministic based on seeds.
- **Implementation:**
  - Create `src/core/FairnessSystem.js`.
  - Use `HMAC-SHA256` (via Web Crypto API) to generate RNG values from `ServerSeed + ClientSeed + Nonce`.
  - Replace `Math.random()` in `dropBall()` with this deterministic RNG for position jitter and initial velocity.
  - Add "Fairness" modal to UI to view seeds and verify previous drops.

**3.2 History Tape**
- **Logic:** `GameState` maintains a `history` array (Max 20 items).
- **UI:** Add a horizontal scrollable bar above the game area.
- **Data:** Show Multiplier Badge (color-coded) + Profit Amount.

**3.3 Ball Types**
- **Config:** Define presets in `constants.js` (Standard, Bouncy, Heavy).
  - *Standard:* Balanced (Current physics).
  - *Bouncy:* High restitution (0.8), Lower density.
  - *Heavy:* High density, Low restitution (0.1), Higher friction.
- **UI:** Add Selector dropdown near "Ball Size".

### Phase 4: Performance
*Ensure scalability.*

**4.1 Web Worker Architecture**
- **File:** `src/workers/physics.worker.js`.
- **Strategy:** The Worker holds the authoritative `PhysicsEngine` instance. The Main thread holds "RenderProxies".
- **Communication Protocol:**
  - **Main -> Worker:**
    - `INIT`: Setup gravity and engine.
    - `SPAWN`: Add new ball (pass ID from main).
    - `RESET`: Clear world.
  - **Worker -> Main:**
    - `SYNC`: Float32Array containing `[id, x, y, angle]` for all dynamic bodies.
    - `EVENT`: Array of collision events (for playing sounds/particles).

**4.2 Data Optimization**
- Use `Float32Array` for the SYNC payload to minimize GC overhead.
- (Optional) Use `SharedArrayBuffer` if deployment environment allows `Cross-Origin-Opener-Policy` headers.
