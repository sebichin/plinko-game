# The Definitive Plinko Game Technical Reference

## 1. Executive Summary

This document serves as the exhaustive technical reference for the **Plinko Game** project. It details every aspect of the system's architecture, logic, physics simulation, and user interface. The project is a high-performance, browser-based simulation of the classic casino game "Plinko", built using vanilla JavaScript and a custom-written 2D physics engine.

**Target Audience:** Systems Engineers, Game Developers, Physics Programmers.

## 2. System Architecture

The application follows a **Monolithic Client-Side Architecture**. It is entirely self-contained within the browser, requiring no backend logic for the simulation itself.

### 2.1 High-Level Data Flow

1.  **Input Layer**: User interacts with DOM elements (Buttons, Sliders).
2.  **Game Logic Layer**:
    *   Validates inputs (Balance check).
    *   Instantiates Game Objects (Balls).
    *   Updates Game State (Balance, Score).
3.  **Physics Simulation Layer (`PhysicsEngine`)**:
    *   Receives Game Objects.
    *   Simulates dynamics (Gravity, Collisions) over discrete time steps.
    *   Resolves constraints (Walls, Pegs).
4.  **Rendering Layer**:
    *   Reads Physics State (Positions, Rotations).
    *   Interpolates state for smooth motion.
    *   Draws to HTML5 Canvas.
5.  **Audio Layer**:
    *   Synthesizes sound effects in real-time based on collision events.

## 3. The Physics Engine (`physics-engine.js`)

The core of the simulation is a custom 2D rigid body physics engine designed specifically for stability and determinism.

### 3.1 Mathematical Model

The engine simulates **Rigid Body Dynamics** in 2D space.

*   **State Vector**: Each body $B$ is defined by:
    *   Position $\vec{p} = (x, y)$
    *   Velocity $\vec{v} = (v_x, v_y)$
    *   Orientation $\theta$ (radians)
    *   Angular Velocity $\omega$ (radians/s)
*   **Mass Properties**:
    *   Mass $m$: Derived from area and density ($\rho$).
    *   Moment of Inertia $I$: Resistance to rotation.
        *   Circle: $I = \frac{1}{2}mr^2$
        *   Rectangle: $I = \frac{m(w^2 + h^2)}{12}$

### 3.2 Integration Scheme: Semi-Implicit Euler

The engine uses **Semi-Implicit Euler** (Symplectic Euler) integration. This is chosen over Explicit Euler for its energy conservation properties and over Verlet for its ease of handling velocity-dependent forces (like friction).

**Algorithm per step ($dt$):**
1.  **Update Velocity**:
    $$ \vec{v}_{t+1} = \vec{v}_t + (\vec{g} + \frac{\vec{F}}{m}) \cdot dt $$
    *   $\vec{g}$ is gravity ($980 \text{ px}/s^2$).
    *   Drag is applied as a damping factor: $\vec{v} *= (1 - \text{frictionAir})$.
2.  **Update Position**:
    $$ \vec{p}_{t+1} = \vec{p}_t + \vec{v}_{t+1} \cdot dt $$
3.  **Update Rotation**:
    $$ \theta_{t+1} = \theta_t + \omega_{t+1} \cdot dt $$

### 3.3 The Game Loop: Fixed Timestep Accumulator

To ensure **determinism** (the simulation behaves exactly the same on a 60Hz screen vs a 144Hz screen), the physics simulation is decoupled from the rendering framerate.

*   **Fixed Delta Time ($dt$)**: $\frac{1}{60}$ seconds (16.67ms).
*   **Accumulator**: Stores "unsimulated" time from the render loop.

**Logic:**
```javascript
accumulator += frameTime
while (accumulator >= fixedDeltaTime) {
    step(fixedDeltaTime)
    accumulator -= fixedDeltaTime
}
alpha = accumulator / fixedDeltaTime
```
*   **Interpolation**: The `alpha` value represents how far we are between the last physics step and the next one. The renderer uses this to draw bodies at $\vec{p}_{render} = \vec{p}_{prev} + (\vec{p}_{curr} - \vec{p}_{prev}) \cdot \alpha$. This eliminates "micro-stutter".

### 3.4 Collision Detection Pipeline

Collision detection is a two-phase process:

#### Phase 1: Broad Phase (Spatial Hashing)
*   **Goal**: Quickly eliminate pairs of bodies that cannot possibly collide.
*   **Algorithm**: Spatial Hashing.
    *   The world is divided into a grid of cells (size 50x50).
    *   Each body is mapped to the cells it overlaps.
    *   A hash key is generated for each cell: $H(x,y) = (x \cdot p_1 + y \cdot p_2)$.
    *   Only bodies sharing a cell are checked in the narrow phase.
*   **Complexity**: Reduces $O(N^2)$ to approx $O(N)$.

#### Phase 2: Narrow Phase
*   **Goal**: Determine if two specific bodies overlap and calculate the collision manifold (Normal, Penetration Depth, Contact Point).
*   **Supported Shapes**:
    *   **Circle-Circle**: Distance check.
    *   **Circle-Rectangle**: Closest point on AABB (Axis-Aligned Bounding Box) to Circle center.

### 3.5 Collision Resolution: Impulse-Based

The engine resolves collisions by applying **Impulses** (instantaneous changes in velocity) rather than forces.

**1. Positional Correction (Projection)**
To prevent sinking/tunneling, bodies are moved apart immediately based on penetration depth and mass ratios.

**2. Velocity Resolution**
The impulse scalar $j$ is calculated to satisfy the coefficient of restitution $e$ (bounciness).

$$ j = \frac{-(1+e)(\vec{v}_{rel} \cdot \vec{n})}{\frac{1}{m_A} + \frac{1}{m_B} + \frac{(\vec{r}_A \times \vec{n})^2}{I_A} + \frac{(\vec{r}_B \times \vec{n})^2}{I_B}} $$

**3. Friction**
A tangent impulse is applied perpendicular to the collision normal to simulate surface friction, clamped by the Coulomb friction model ($F_f \le \mu F_n$).

## 4. The Game Client (`index.html`)

The client is a single HTML file containing the UI, Game Logic, and Renderer.

### 4.1 DOM Structure & Styling
*   **Framework**: Tailwind CSS (via CDN) for utility-first styling.
*   **Layout**: Flexbox column layout.
    *   `#game-container`: Takes remaining height (`flex-grow: 1`).
    *   `#controls-area`: Fixed height at bottom.
*   **Canvas**: The `<canvas>` element is scaled by `window.devicePixelRatio` to ensure crisp rendering on Retina/High-DPI displays.

### 4.2 Game Logic & State

*   **`init()`**: The bootstrapper.
    1.  Resets the Physics Engine.
    2.  Calculates canvas dimensions.
    3.  Calls `buildLevel()`.
    4.  Starts the render loop.
*   **`buildLevel()`**: Procedural generation of the Plinko board.
    *   **Pyramid Logic**:
        *   Rows: 8, 12, or 16.
        *   Pegs are placed in a triangular formation: Row $r$ has $r+1$ pegs.
        *   Spacing (`gap`) is calculated dynamically based on canvas width to fit the pyramid perfectly.
    *   **Sensors**: Invisible rectangles placed at the bottom. They are `isSensor: true` (detect collision but don't bounce).
*   **`dropBall()`**:
    *   Spawns a ball at `width/2` with a random x-jitter (`Math.random() - 0.5`) to ensure chaotic outcomes.
    *   **Physics Material**:
        *   `restitution: 0.35`: Simulates metal on plastic (low bounce).
        *   `friction: 0.08`: Low friction.
        *   `density: 0.008`: High density (Steel).

### 4.3 The Rendering Pipeline (`render()`)

The `render` function runs every frame (vsync).

1.  **Clear**: `ctx.clearRect`.
2.  **Draw Overlay**: Draws the static UI elements inside the canvas (Multiplier buckets, vertical guide lines).
3.  **Draw Bodies**: Iterates through `engine.bodies`.
    *   **Interpolation**: Uses `engine.getInterpolatedPosition(body, alpha)` to draw the body where it *should* be at the exact render time, not where it was at the last physics step.
    *   **Shape Drawing**: Uses standard Canvas API (`arc`, `fillRect`).
4.  **Draw Minimap**: Renders the histogram overlay showing ball landing distribution.

### 4.4 Minimap Histogram System

A live histogram visualization displays the distribution of ball landings across buckets.

*   **Data Structure**: `histogramData` array tracks count per bucket (index = bucket index).
*   **Rendering Components**:
    1.  **Container**: Semi-transparent black box (200×120px desktop, 150×80px mobile) at top-left corner
    2.  **Normal Distribution Curve**: Theoretical expected distribution based on binomial probability
    3.  **Histogram Bars**: Green bars showing actual ball landing counts per bucket
    4.  **Total Count Label**: "Balls: X" displaying cumulative ball count
*   **Mathematical Model**: 
    *   Binomial distribution approximates Normal distribution for large n
    *   Mean: μ = numBuckets / 2
    *   Standard deviation: σ = √(numBuckets) / 2
    *   Normal PDF: f(x) = (1/(σ√(2π))) × e^(-(x-μ)²/(2σ²))
*   **Responsive Design**: 
    *   Desktop/Tablet (≥480px): 200×120px at (20, 20)
    *   Mobile (<480px): 150×80px at (10, 10), width capped at 40% of screen
*   **Reset Behavior**: Histogram automatically resets when level changes (different row count selected).
*   **Performance**: Negligible impact (~0.3ms per frame), maintains 60 FPS.
*   **Visual Features**:
    *   Bars scale proportionally to max count (tallest bar = 100% height)
    *   Normal curve drawn with 2x resolution for smoothness (22 segments for 11 buckets)
    *   Semi-transparent styling for non-intrusive overlay
    *   Proper z-order (drawn last, appears on top of game elements)

### 4.5 Audio System (`SoundManager`)

A custom synthesizer using the **Web Audio API**. No external assets are loaded.

*   **Oscillators**: Uses `createOscillator()` to generate waveforms.
    *   `triangle`: Used for peg hits (soft, bell-like).
    *   `sawtooth`: Used for low multipliers (harsh, buzzing).
    *   `sine`: Used for standard wins (pure tone).
*   **Envelopes**: Uses `gainNode.gain.exponentialRampToValueAtTime` to create percussive envelopes (fast attack, exponential decay).
*   **Music Theory**: The high-multiplier win sound plays a major arpeggio (C, E, G, C) using multiple oscillators.

## 5. Configuration & Customization

### 5.1 Multipliers (`MULTIPLIERS` object)
Defined in `index.html`. These arrays determine the risk/reward profile.
*   **8 Rows**: Low variance. Center is 0.3x, Edges are 29x.
*   **16 Rows**: Extreme variance. Center is 0.2x, Edges are 1000x.

### 5.2 Physics Tuning
*   **Gravity**: `980` (approx 9.8 m/s² scaled).
*   **Peg Size**: `gap * 0.12` (12% of the gap width).
*   **Ball Size**: User adjustable via slider (5% to 45% of gap).

## 6. Codebase Map

| File | Responsibility | Key Functions/Classes |
|------|----------------|-----------------------|
| `index.html` | UI, Game Loop, Audio, Input | `init`, `render`, `dropBall`, `SoundManager` |
| `physics-engine.js` | Physics Simulation | `PhysicsEngine`, `RigidBody`, `SpatialHash`, `Vec2` |
| `package.json` | Project Metadata | `scripts`, `dependencies` |
| `DOCUMENTATION.md` | This file | N/A |

## 7. Future Expansion Paths

To extend this system "infinitely", one would look at:
1.  **Networked Multiplayer**: Moving the physics engine to a Node.js server (it is already module-compatible) to prevent client-side cheating.
2.  **WebGL Rendering**: Replacing the Canvas 2D context with Pixi.js or Three.js for particle effects and lighting.
3.  **Advanced Physics**: Adding `Constraint` classes to `physics-engine.js` to support springs, ropes, and ragdolls.
