# Short Term Project Memory

## Current Context
- **Phase:** Phase 3 - Gameplay Features.
- **Task:** Implement Ball Types.

## Detailed Steps
1.  **Config:**
    - Update `src/config/constants.js`: Add `BALL_TYPES` (Standard, Bouncy, Heavy) with physics properties.
2.  **UI:**
    - Update `src/index.html`: Add `<select id="ballType">` in the controls area.
    - Update `src/ui/UIManager.js`: Handle `ballType` change, update `GameState`.
3.  **State:**
    - Update `src/core/GameState.js`: Add `ballType` property (default 'STANDARD').
4.  **Game Logic:**
    - Update `src/core/Game.js`: In `dropBall`, use `BALL_TYPES[this.state.ballType]` to override `RigidBody` options.
