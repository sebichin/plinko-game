# Short Term Project Memory

## Current Context
- **Phase:** Bug Fixes (Physics & UI).
- **Issue:** GitHub Pages shows README only.
- **Cause:** Workflow deploys `.` (root), but `index.html` is now in `src/` and the build output is in `dist/`. The project now requires a build step.

## Solution Plan
1.  **Update Workflow:** Modify `.github/workflows/pages.yml`.
2.  **Add Build Steps:**
    - `actions/setup-node`
    - `npm ci`
    - `npm run build`
3.  **Update Artifact Path:** Change `path: '.'` to `path: './dist'`.

## Investigation Findings (Current Task)
### 1. Physics Engine ID Mismatch
- **Observation:** Balls appear to not fall or sync correctly.
- **Root Cause:** In `src/physics/Engine.js`, the `addBody(body)` method unconditionally executes `body.id = this.nextBodyId++`.
- **Impact:** This overwrites the ID assigned by the main thread (`PhysicsProxy`), breaking the synchronization protocol where the Worker is expected to return updates for the specific IDs requested by the main thread.
- **Context:** `src/workers/physics.worker.js` correctly attempts to restore the ID (`if (data.id !== undefined) body.id = data.id;`) before calling `engine.addBody`, but the Engine ignores this.

### 2. UI Layout Issues
- **Observation:** "Can't see things at the bottom" (Controls/Footer) when at 100% zoom.
- **Root Cause:** `src/style.css` defines `body { @apply ... overflow-hidden ... }` but is missing `h-screen`, `w-screen`, `flex`, and `flex-col`.
- **Impact:** The `index.html` structure relies on the `body` being a Flex container:
    - `<div id="game-container" class="flex-grow ...">`
    - `<div id="controls-area" class="flex-shrink-0 ...">`
    - Without `display: flex` and `height: 100vh` on the parent (`body`), these classes do not function as intended, causing elements to flow normally and potentially overflow the viewport without containment.

## Applied Fixes
### 1. Physics Engine
- **File:** `src/physics/Engine.js`
- **Change:** Modified `addBody(body)` to check `if (body.id === undefined)` before assigning a new ID.
- **Result:** Validated via test script. Worker now respects IDs assigned by the Main thread, restoring correct synchronization.

### 2. UI Layout
- **File:** `src/style.css`
- **Change:** Added `@apply ... h-screen w-screen flex flex-col` to `body`.
- **Result:** Validated via file inspection. The `body` element now acts as a full-screen flex container, allowing children to expand and shrink correctly as defined in `index.html`.
