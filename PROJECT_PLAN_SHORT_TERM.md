# Short Term Project Memory

## Current Context
- **Phase:** Deployment Fixes (Completed).
- **Issue:** GitHub Pages deployment fails to render the application (shows README).
- **Resolution:**
    - Updated `vite.config.js` to set `base: '/plinko-game/'`.
    - User instruction: Change GitHub Repository Settings -> Pages -> Source to "GitHub Actions".

## Investigation Findings (Deployment Task)
### 1. GitHub Pages Configuration
- **Observation:** The URL `https://sebichin.github.io/plinko-game/` displays the README.
- **Root Cause:**
    - Default GitHub Pages source is "Deploy from branch" (root), serving `README.md` as `index.html` is in `src/`.
    - `vite.config.js` used relative base `./`, which works but absolute `/plinko-game/` is more robust for subpath deployments.
- **Fix:**
    - Modified `vite.config.js`: `base: '/plinko-game/'`.
    - User Agreement: User will switch deployment source to "GitHub Actions" to trigger the workflow in `.github/workflows/pages.yml`.

## Previous Findings (Resolved)
### 1. Physics Engine ID Mismatch
- **Observation:** Balls appear to not fall or sync correctly.
- **Root Cause:** `src/physics/Engine.js` overwrote main thread IDs.
- **Fix:** Modified `addBody` to preserve existing IDs.

### 2. UI Layout Issues
- **Observation:** Controls cut off at bottom of screen.
- **Root Cause:** `body` lacked full-screen flex layout.
- **Fix:** Added `h-screen w-screen flex flex-col` to `body` in `src/style.css`.
