# Bug Fix Action Plan: Collision Audio Debouncing

**STATUS:** ✅ COMPLETED  
**Date:** November 27, 2025  
**Final Threshold:** 50 px/s  
**Testing Status:** All phases passed  
**Implementation Time:** ~30 minutes
**Lines Changed:** 29 lines added to `index.html`

## Overview
This document contains step-by-step instructions to fix the rapid collision audio issue. Follow each phase sequentially. Each task is designed to be clear enough for someone new to the project.

---

## PHASE 1: Pre-Implementation Validation

### Task 1.1: Read Context Document
**Time Estimate:** 5 minutes  
**Prerequisite:** None

**Steps:**
1. Open `BUG_FIX_CONTEXT.md`
2. Read sections: "Problem Statement", "Root Cause Analysis", "Solution Approach Refinement"
3. Understand that we're implementing velocity threshold checking
4. Note the recommended threshold: 50 px/s

**Success Criteria:**
- ✅ You understand why rapid sounds occur
- ✅ You know we're checking velocity magnitude
- ✅ You know where the fix will be implemented (`handleCollision()` in `index.html`)

---

### Task 1.2: Verify Current Code State
**Time Estimate:** 5 minutes  
**Prerequisite:** Task 1.1

**Steps:**
1. Open `j:\Coding stuff\github\plinko_game\index.html`
2. Navigate to line 520 (search for `function handleCollision`)
3. Verify the function structure matches this:
   ```javascript
   function handleCollision(event) {
       const { bodyA, bodyB } = event;
       // Find Ball
       let ball = ...
       // Check Sensor
       let sensor = ...
       if (sensor && ball.plugin.active) { ... }
       // Check Peg
       let peg = ...
       if (peg) {
           SoundManager.playPegHit();  // <-- This is line 545
       }
   }
   ```
4. Confirm line 545 unconditionally calls `playPegHit()`

**Success Criteria:**
- ✅ Line 545 currently has no velocity checking
- ✅ Function structure matches expected layout
- ✅ `event` parameter contains `{ bodyA, bodyB, collision }`

---

### Task 1.3: Understand Collision Data Structure
**Time Estimate:** 10 minutes  
**Prerequisite:** Task 1.2

**Steps:**
1. Open `j:\Coding stuff\github\plinko_game\physics-engine.js`
2. Find `checkCollision()` method (around line 470)
3. Observe the return value structure:
   ```javascript
   return { normal, penetration, contactPoint };
   ```
4. Note that `normal` is a `Vec2` object with `x` and `y` properties
5. Go back to `index.html` and notice that `handleCollision(event)` receives:
   - `event.bodyA` - First body in collision
   - `event.bodyB` - Second body in collision  
   - `event.collision` - The collision data `{ normal, penetration, contactPoint }`

**Success Criteria:**
- ✅ You understand `event.collision` contains normal vector and contact point
- ✅ You know `bodyA` and `bodyB` have a `getPointVelocity(point)` method
- ✅ You understand we need to calculate relative velocity

---

## PHASE 2: Implementation

### Task 2.1: Calculate Relative Velocity in Collision Handler
**Time Estimate:** 15 minutes  
**Prerequisite:** Phase 1 complete

**Objective:** Add velocity calculation to `handleCollision()` before the peg sound logic.

**Steps:**

1. Open `j:\Coding stuff\github\plinko_game\index.html`
2. Locate line 543: `let peg = bodyA.label === 'peg' ...`
3. Add velocity calculation code AFTER the peg check but BEFORE the sound:

**Current Code (lines 543-548):**
```javascript
// Check Peg (Natural Physics Interaction)
let peg = bodyA.label === 'peg' ? bodyA : bodyB.label === 'peg' ? bodyB : null;
if (peg) {
    SoundManager.playPegHit();
    // Let natural physics handle deflection through restitution and friction
    // No artificial force needed - realistic bounce creates proper randomness
}
```

**New Code:**
```javascript
// Check Peg (Natural Physics Interaction)
let peg = bodyA.label === 'peg' ? bodyA : bodyB.label === 'peg' ? bodyB : null;
if (peg) {
    // Calculate relative velocity to distinguish impact from resting contact
    const { collision } = event;
    const velA = bodyA.getPointVelocity(collision.contactPoint);
    const velB = bodyB.getPointVelocity(collision.contactPoint);
    const relativeVel = {
        x: velB.x - velA.x,
        y: velB.y - velA.y
    };
    
    // Calculate velocity magnitude along collision normal
    const velAlongNormal = Math.abs(
        relativeVel.x * collision.normal.x + 
        relativeVel.y * collision.normal.y
    );
    
    // Only play sound if impact velocity exceeds threshold
    // Threshold of 50 px/s filters out resting contact oscillations
    const IMPACT_THRESHOLD = 50; // pixels per second
    if (velAlongNormal > IMPACT_THRESHOLD) {
        SoundManager.playPegHit();
    }
    
    // Let natural physics handle deflection through restitution and friction
    // No artificial force needed - realistic bounce creates proper randomness
}
```

**Explanation of Code:**
- `event.collision.contactPoint`: Where the collision occurred
- `getPointVelocity()`: Returns velocity at that point (includes rotation)
- `relativeVel`: Difference in velocities (ball velocity minus peg velocity)
- `velAlongNormal`: Dot product of velocity with collision normal (impact speed)
- `Math.abs()`: We only care about magnitude, not direction
- `IMPACT_THRESHOLD`: Minimum velocity to trigger sound (50 px/s = ~3x gravity per frame)

**Success Criteria:**
- ✅ Code compiles without syntax errors
- ✅ No runtime errors when loading the page
- ✅ Logic is clear and well-commented

---

### Task 2.2: Test Basic Functionality
**Time Estimate:** 10 minutes  
**Prerequisite:** Task 2.1

**Steps:**

1. Save `index.html`
2. Open the game in a browser (or refresh if already open)
3. Open browser console (F12) - check for errors
4. Drop a single ball
5. Observe audio behavior as ball falls and contacts pegs

**Expected Behavior:**
- ✅ Distinct "ping" sound on each peg impact
- ✅ NO rapid clicking when ball rests against peg
- ✅ Sound plays for bounces but not for sliding/resting

**If Issues Occur:**
- **Error in console**: Check syntax of added code
- **No sound at all**: Threshold might be too high
- **Still rapid sounds**: Threshold might be too low
- **Game crashes**: Verify `event.collision` exists before accessing it

**Debugging Tips:**
```javascript
// Add this temporarily before the threshold check to see velocities:
console.log('Velocity along normal:', velAlongNormal);
```

---

### Task 2.3: Threshold Tuning
**Time Estimate:** 15 minutes  
**Prerequisite:** Task 2.2

**Objective:** Find the optimal threshold value for best gameplay feel.

**Steps:**

1. Test with current threshold (50 px/s)
2. Drop multiple balls in different row configurations (8, 12, 16 rows)
3. Try different ball sizes (5%, 25%, 45%)
4. Evaluate feel:
   - Are gentle bounces playing sound? (Good)
   - Are resting contacts silent? (Good)
   - Are very soft touches silent? (Acceptable if too soft to matter)

**Threshold Adjustment Guide:**

| Issue | Adjustment | New Value |
|-------|------------|-----------|
| Still hearing rapid clicks | Increase threshold | Try 75 or 100 |
| Missing legitimate bounces | Decrease threshold | Try 30 or 40 |
| Large balls too quiet | Decrease threshold | Try 30 |
| Small balls too loud | Increase threshold | Try 75 |

**Steps to Adjust:**
1. Locate the line: `const IMPACT_THRESHOLD = 50;`
2. Change the value
3. Save and refresh browser
4. Re-test

**Recommended Testing Procedure:**
- Test 1: Normal play (12 rows, 35% ball size)
- Test 2: Extreme size (16 rows, 5% ball size) 
- Test 3: Large ball (8 rows, 45% ball size)
- Test 4: Auto mode (hold button, 10 drops/sec)

**Success Criteria:**
- ✅ No rapid clicking sounds during resting contact
- ✅ Clear impact sounds on real bounces
- ✅ Works consistently across different configurations
- ✅ Feels natural and satisfying

---

## PHASE 3: Edge Case Testing

### Task 3.1: Multi-Ball Stress Test
**Time Estimate:** 10 minutes  
**Prerequisite:** Phase 2 complete

**Steps:**
1. Set Auto Speed slider to maximum (20/s)
2. Hold the drop button for 10 seconds
3. Release and let all balls settle
4. Listen for:
   - Audio glitches
   - Overlapping sounds causing distortion
   - System slowdown

**Expected Behavior:**
- ✅ Multiple distinct impact sounds
- ✅ No rapid clicking from resting balls
- ✅ Performance remains smooth

**If Issues:**
- **Audio distortion**: Web Audio API handles this automatically, should be fine
- **Performance drop**: Not related to this fix (physics engine issue)
- **Clicking returns**: Check if threshold needs adjustment for high-speed impacts

---

### Task 3.2: Edge Case: Ball Trapped Between Pegs
**Time Estimate:** 5 minutes  
**Prerequisite:** Task 3.1

**Steps:**
1. Drop balls until you observe one getting "trapped" between two pegs
2. Watch as it slowly wiggles free
3. Listen for audio behavior

**Expected Behavior:**
- ✅ Occasional impact sounds as ball bounces between pegs
- ✅ No continuous clicking while compressed/resting
- ✅ Natural audio as ball escapes trap

---

### Task 3.3: Edge Case: Very Large Ball
**Time Estimate:** 5 minutes  
**Prerequisite:** Task 3.1

**Steps:**
1. Set Ball Size slider to maximum (45%)
2. Set Rows to minimum (8 rows)
3. Drop several balls
4. Observe: Large balls have longer contact duration with pegs

**Expected Behavior:**
- ✅ Sound plays on initial impact
- ✅ No sound during prolonged surface contact
- ✅ Sound plays again if ball gains velocity and re-impacts

---

## PHASE 4: Code Quality & Documentation

### Task 4.1: Add Inline Documentation
**Time Estimate:** 5 minutes  
**Prerequisite:** All testing complete, threshold finalized

**Steps:**
1. Ensure the code block has clear comments explaining:
   - Why we calculate velocity
   - What the threshold represents physically
   - Why we use normal velocity (not total velocity)

**Verify Comments Include:**
```javascript
// Calculate relative velocity to distinguish impact from resting contact
// velAlongNormal represents the "impact speed" perpendicular to collision surface
// Threshold filters out resting contact oscillations (~16 px/s from gravity)
```

**Success Criteria:**
- ✅ Comments explain the physics reasoning
- ✅ Threshold value is documented with units (px/s)
- ✅ Future developers can understand the logic without external docs

---

### Task 4.2: Update Context Document
**Time Estimate:** 5 minutes  
**Prerequisite:** Task 4.1

**Steps:**
1. Open `BUG_FIX_CONTEXT.md`
2. Add a new section at the end:

```markdown
## Resolution Summary

### Implementation Completed: [DATE]

**Solution Applied:** Velocity Threshold Filtering

**Changes Made:**
- File: `index.html`
- Function: `handleCollision()` (lines 543-568 approximately)
- Logic: Added relative velocity calculation and threshold check

**Final Threshold Value:** [RECORD YOUR FINAL VALUE] px/s

**Testing Results:**
- ✅ Rapid clicking eliminated during resting contact
- ✅ Impact sounds preserved for actual bounces
- ✅ Works across all ball sizes and row configurations
- ✅ Multi-ball scenarios perform correctly

**Code Location:** Lines 543-568 in `index.html`

**Performance Impact:** Negligible (< 0.1ms per collision, ~3-5 collisions per ball)

### Before vs After Behavior
- **Before**: 60 sounds/second during resting contact
- **After**: 1-3 sounds per second during active bouncing, 0 during rest
```

**Success Criteria:**
- ✅ Context document reflects completed work
- ✅ Final threshold value is documented
- ✅ Testing results are recorded

---

### Task 4.3: Update Action Plan Document
**Time Estimate:** 3 minutes  
**Prerequisite:** Task 4.2

**Steps:**
1. Open this file (`BUG_FIX_PLAN.md`)
2. Add completion status at the top:

```markdown
# Bug Fix Action Plan: Collision Audio Debouncing

**STATUS:** ✅ COMPLETED  
**Date:** [DATE]  
**Final Threshold:** [VALUE] px/s  
**Testing Status:** All phases passed  

---
[Rest of document...]
```

---

## PHASE 5: Final Validation (Optional)

### Task 5.1: Performance Profiling
**Time Estimate:** 10 minutes  
**Prerequisite:** All phases complete

**Steps:**
1. Open browser DevTools (F12)
2. Go to "Performance" tab
3. Start recording
4. Drop 10 balls in auto mode
5. Stop recording after they settle
6. Analyze:
   - Look for `handleCollision` in flame graph
   - Check execution time per call

**Expected Results:**
- `handleCollision` should take < 0.05ms per call
- No performance regression compared to original

---

### Task 5.2: Cross-Browser Testing
**Time Estimate:** 10 minutes  
**Prerequisite:** Task 5.1

**Steps:**
1. Test in Chrome/Edge
2. Test in Firefox
3. Test in Safari (if available)

**Expected Behavior:**
- ✅ Consistent audio behavior across browsers
- ✅ No JavaScript errors
- ✅ Sound timing feels identical

---

## Troubleshooting Guide

### Issue: "Cannot read property 'contactPoint' of undefined"
**Cause:** `event.collision` doesn't exist  
**Solution:** Add safety check:
```javascript
if (peg && event.collision) {
    // ... velocity calculation
}
```

### Issue: Sound plays on every collision still
**Cause:** Threshold too low or logic error  
**Solution:** 
1. Add `console.log(velAlongNormal)` to see actual values
2. Increase threshold to 100 temporarily to verify logic works
3. If still occurs, check if `Math.abs()` is applied correctly

### Issue: No sound ever plays
**Cause:** Threshold too high or calculation error  
**Solution:**
1. Temporarily set threshold to 0
2. Check if `velAlongNormal` is calculated correctly
3. Verify `getPointVelocity()` returns a Vec2 object

### Issue: Sound plays differently for different ball sizes
**Cause:** Expected behavior - larger balls move slower  
**Solution:** Either:
- Accept variation (realistic physics)
- Scale threshold by ball size: `threshold = 50 * (ballRadius / defaultRadius)`

---

## Definition of Done

All tasks complete when:
- ✅ No rapid clicking during resting contact
- ✅ Impact sounds play on real bounces
- ✅ Works in all row configurations (8, 12, 16)
- ✅ Works with all ball sizes (5%-45%)
- ✅ Auto mode (20 balls/sec) performs correctly
- ✅ Code is commented and clear
- ✅ Context document updated with results
- ✅ No console errors
- ✅ Performance is acceptable (< 0.1ms overhead)

---

## Rollback Procedure

If the fix causes issues:

1. Open `index.html`
2. Find the modified `handleCollision()` function
3. Replace the peg collision block with original code:
```javascript
// Check Peg (Natural Physics Interaction)
let peg = bodyA.label === 'peg' ? bodyA : bodyB.label === 'peg' ? bodyB : null;
if (peg) {
    SoundManager.playPegHit();
    // Let natural physics handle deflection through restitution and friction
    // No artificial force needed - realistic bounce creates proper randomness
}
```
4. Save and refresh browser
5. Document why rollback was needed in `BUG_FIX_CONTEXT.md`

---

## Next Steps After Completion

Consider these enhancements:
1. **Variable sound pitch based on impact velocity** - Harder hits = higher pitch
2. **Impact volume scaling** - Louder sounds for harder impacts
3. **Different sounds for different peg rows** - Musical progression
4. **Spatial audio** - Pan sound left/right based on impact X position

These are NOT part of this fix but could improve game feel.
