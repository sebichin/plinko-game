# Short Term Project Memory

## Current Context
- **Phase:** Bug Fixes (Row Switching).
- **Issue:** Switching to different rows caused the mechanism to appear broken.
- **Resolution:**
    - Invalidated `Renderer` static peg cache on game restart.

## Investigation Findings (Row Switching Task)
### 1. Row Switching Visual Glitch
- **Observation:** Switching rows caused the game mechanism to appear broken (visual mismatch).
- **Root Cause:** `Renderer.js` cached static pegs in an offscreen canvas (`pegCanvas`) but did not invalidate this cache when the level changed (rows updated).
- **Fix:** Added `reset()` method to `Renderer` and called it in `Game.restart()`.

## Previous Findings (Resolved)
### 1. GitHub Pages Configuration
- **Observation:** The URL `https://sebichin.github.io/plinko-game/` displays the README.
- **Root Cause:**
    - Default GitHub Pages source is "Deploy from branch" (root), serving `README.md` as `index.html` is in `src/`.
    - `vite.config.js` used relative base `./`, which works but absolute `/plinko-game/` is more robust for subpath deployments.
- **Fix:**
    - Modified `vite.config.js`: `base: '/plinko-game/'`.
    - User Agreement: User will switch deployment source to "GitHub Actions" to trigger the workflow in `.github/workflows/pages.yml`.

### 2. Physics Engine ID Mismatch
- **Observation:** Balls appear to not fall or sync correctly.
- **Root Cause:** `src/physics/Engine.js` overwrote main thread IDs.
- **Fix:** Modified `addBody` to preserve existing IDs.

### 3. UI Layout Issues
- **Observation:** Controls cut off at bottom of screen.
- **Root Cause:** `body` lacked full-screen flex layout.
- **Fix:** Added `h-screen w-screen flex flex-col` to `body` in `src/style.css`.
