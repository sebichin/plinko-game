# Viewport Scaling Fix Action Plan

## Overview
This document contains step-by-step instructions to fix the viewport scaling issue where the Plinko pyramid doesn't fit properly on desktop screens. The fix implements smart gap calculation that considers both width and height constraints.

---

## PHASE 1: Pre-Implementation Analysis

### Task 1.1: Read Context Document
**Time Estimate:** 10 minutes  
**Prerequisite:** None

**Steps:**
1. Open `VIEWPORT_FIX_CONTEXT.md`
2. Read sections: "Problem Statement", "Root Cause Analysis", "Deep Dive: Vertical Space Requirements"
3. Understand current gap calculation: `gap = safeWidth / numBuckets; if (gap > 50) gap = 50;`
4. Understand the issue: Fixed 50px cap doesn't consider height or aspect ratio
5. Review recommended solution: Smart gap calculation with min/max bounds (25-65px)

**Success Criteria:**
- ✅ Understand why pyramid gets cut off on desktop
- ✅ Know the formula: `gap = min(65, max(25, width/buckets, height/(rows+2.8)))`
- ✅ Understand vertical space needs: (rows + 2.8) × gap

---

### Task 1.2: Verify Current Code Location
**Time Estimate:** 5 minutes  
**Prerequisite:** Task 1.1

**Steps:**
1. Open `j:\Coding stuff\github\plinko_game\index.html`
2. Navigate to `buildLevel()` function (around line 284)
3. Locate the gap calculation (lines 288-292):
   ```javascript
   const paddingX = 24;
   const safeWidth = width - paddingX;
   let gap = safeWidth / numBuckets;
   if (gap > 50) gap = 50;  // <-- This is the problem
   ```
4. Verify `startY` calculation (line 295):
   ```javascript
   const pyramidHeight = rows * gap;
   const startY = (height - pyramidHeight) / 2 - (gap * 1.0);
   ```

**Success Criteria:**
- ✅ Located gap calculation code
- ✅ Located startY calculation code
- ✅ Confirmed structure matches documentation

---

### Task 1.3: Understand Space Requirements
**Time Estimate:** 5 minutes  
**Prerequisite:** Task 1.2

**Steps:**
1. Review vertical space breakdown from context document
2. Note the components:
   - Spawn area: 1.2 × gap (above first pegs)
   - Peg area: rows × gap
   - Bucket area: 1.6 × gap (0.6 spacing + 1.0 bucket height)
   - **Total**: (rows + 2.8) × gap
3. Note current code only accounts for `rows * gap`
4. Understand this causes vertical clipping

**Success Criteria:**
- ✅ Understand (rows + 2.8) multiplier
- ✅ Know current code underestimates space needed
- ✅ Ready to implement corrected calculation

---

## PHASE 2: Implementation

### Task 2.1: Implement Smart Gap Calculation
**Time Estimate:** 15 minutes  
**Prerequisite:** Phase 1 complete

**Objective:** Replace fixed gap calculation with dynamic calculation that considers both dimensions.

**Steps:**

1. Open `j:\Coding stuff\github\plinko_game\index.html`
2. Locate `buildLevel()` function (line 284)
3. Find the gap calculation section (lines 288-292)

**Current Code:**
```javascript
const paddingX = 24;
const safeWidth = width - paddingX;
let gap = safeWidth / numBuckets;
if (gap > 50) gap = 50;
```

**Replace With:**
```javascript
// Calculate optimal gap that fits both width and height
const paddingX = 48; // 24px padding on each side
const paddingY = 40; // Extra vertical margin for spacing

const safeWidth = width - paddingX;
const safeHeight = height - paddingY;

// Calculate gap based on width constraint
const gapByWidth = safeWidth / numBuckets;

// Calculate gap based on height constraint
// Vertical space needed: spawn area (1.2*gap) + pegs (rows*gap) + buckets (1.6*gap)
// Total: (rows + 2.8) * gap
const gapByHeight = safeHeight / (rows + 2.8);

// Use the smaller of the two constraints, with sensible min/max bounds
// Min 25px: Maintains playability on small screens
// Max 65px: Prevents overly large pegs on huge screens
const minGap = 25;
const maxGap = 65;
let gap = Math.max(minGap, Math.min(maxGap, gapByWidth, gapByHeight));
```

**Explanation:**
- `paddingX = 48`: 24px margin on each side (left + right)
- `paddingY = 40`: Extra vertical breathing room
- `gapByWidth`: Maximum gap that fits horizontally
- `gapByHeight`: Maximum gap that fits vertically  
- `Math.min(gapByWidth, gapByHeight)`: Chooses limiting dimension
- `Math.max(minGap, ...)`: Ensures minimum playability
- `Math.min(maxGap, ...)`: Ensures maximum size constraint

**Success Criteria:**
- ✅ Code compiles without syntax errors
- ✅ Gap is calculated using both width and height
- ✅ Min/max bounds are applied (25-65px)

---

### Task 2.2: Fix Vertical Positioning
**Time Estimate:** 10 minutes  
**Prerequisite:** Task 2.1

**Objective:** Correct startY calculation to properly center the pyramid.

**Steps:**

1. Locate the startY calculation (line 295)

**Current Code:**
```javascript
const pyramidHeight = rows * gap;
const startY = (height - pyramidHeight) / 2 - (gap * 1.0);
```

**Replace With:**
```javascript
// Calculate total height needed for entire game area
// Includes: spawn area + pegs + bucket spacing
const totalGameHeight = (rows + 2.8) * gap;

// Center the game area vertically
const startY = (height - totalGameHeight) / 2;
```

**Explanation:**
- `totalGameHeight`: Accurate measurement including all components
- Removed the `- (gap * 1.0)` arbitrary offset
- Simple centering: places middle of game area at middle of canvas

**Success Criteria:**
- ✅ startY calculation updated
- ✅ Uses totalGameHeight instead of just pyramidHeight
- ✅ No arbitrary offset applied

---

### Task 2.3: Test Basic Functionality
**Time Estimate:** 10 minutes  
**Prerequisite:** Task 2.2

**Steps:**

1. Save `index.html`
2. Refresh browser (or open http://localhost:8000)
3. Open browser console (F12) - check for errors
4. Test different configurations:
   - 8 rows
   - 12 rows  
   - 16 rows
5. Observe pyramid positioning

**Expected Behavior:**
- ✅ Pyramid centered both horizontally and vertically
- ✅ All pegs visible
- ✅ All buckets visible at bottom
- ✅ No clipping on any edge
- ✅ Appropriate spacing around pyramid

**If Issues Occur:**
- **Pyramid too small**: Increase maxGap or decrease padding
- **Pyramid too large**: Decrease maxGap or increase padding
- **Cut off at top**: Check totalGameHeight calculation
- **Cut off at bottom**: Increase paddingY
- **Console errors**: Check syntax in modified code

---

## PHASE 3: Responsive Testing

### Task 3.1: Desktop Testing
**Time Estimate:** 10 minutes  
**Prerequisite:** Task 2.3 passed

**Steps:**

1. Set browser window to full desktop size (1920×1080 or similar)
2. Test all row configurations (8, 12, 16)
3. Drop multiple balls to verify physics
4. Check that entire pyramid is visible without scrolling

**Expected Results:**
- ✅ Pyramid fits comfortably in viewport
- ✅ Gap size approximately 45-55px (height-constrained)
- ✅ Good balance between visibility and playability
- ✅ No wasted space (pyramid uses available area)

**Measurements to Verify:**
Open browser console and type:
```javascript
console.log('Gap:', customData.gap);
console.log('Start Y:', customData.startY);
console.log('Canvas size:', width, 'x', height);
```

Expected gap: ~45-55px on 1080p display

---

### Task 3.2: Laptop Testing
**Time Estimate:** 10 minutes  
**Prerequisite:** Task 3.1

**Steps:**

1. Resize browser to 1366×768 (common laptop size)
2. Test all row configurations
3. Verify pyramid fits completely
4. Check 16-row configuration specifically (most constrained)

**Expected Results:**
- ✅ Gap approximately 30-35px (height-constrained)
- ✅ Pyramid slightly smaller but fully visible
- ✅ Still playable and responsive
- ✅ Buckets readable

---

### Task 3.3: Tablet Testing
**Time Estimate:** 5 minutes  
**Prerequisite:** Task 3.2

**Steps:**

1. Resize browser to 768×1024 (iPad size) OR use browser dev tools device emulation
2. Test 16-row configuration
3. Verify landscape and portrait orientations (if possible)

**Expected Results:**
- ✅ Gap approximately 40-50px
- ✅ Pyramid centered and visible
- ✅ Touch controls work (if testing on device)

---

### Task 3.4: Mobile Testing
**Time Estimate:** 5 minutes  
**Prerequisite:** Task 3.3

**Steps:**

1. Resize browser to 414×896 (iPhone size) OR use device emulation
2. Test all row configurations
3. Verify this still works as well as before

**Expected Results:**
- ✅ Gap approximately 25-27px (at minimum bound)
- ✅ Behavior unchanged from previous version
- ✅ Still works perfectly on narrow screens
- ✅ Pyramid fills screen appropriately

---

### Task 3.5: Ultra-Wide Testing
**Time Estimate:** 5 minutes  
**Prerequisite:** Task 3.4

**Steps:**

1. Resize browser to 2560×1440 or wider (if available)
2. Test 16-row configuration
3. Check if gap hits maximum bound (65px)

**Expected Results:**
- ✅ Gap at or near 65px maximum
- ✅ Pyramid doesn't become absurdly large
- ✅ Still centered and playable
- ✅ Pegs not too spread out

---

## PHASE 4: Edge Case Testing

### Task 4.1: Window Resize Behavior
**Time Estimate:** 5 minutes  
**Prerequisite:** Phase 3 complete

**Steps:**

1. Start with desktop-sized window
2. Slowly resize window smaller (drag edge)
3. Observe pyramid scaling in real-time
4. Resize back to larger
5. Switch between landscape and portrait (rotate device if testing mobile)

**Expected Behavior:**
- ✅ Pyramid smoothly adjusts size
- ✅ Always remains visible and centered
- ✅ No sudden jumps or glitches
- ✅ Physics continues working correctly

---

### Task 4.2: Ball Size Slider Testing
**Time Estimate:** 5 minutes  
**Prerequisite:** Task 4.1

**Steps:**

1. Set ball size to minimum (5%)
2. Drop balls, verify they interact with pegs correctly
3. Set ball size to maximum (45%)
4. Drop balls, verify no collision issues
5. Test at different window sizes

**Expected Behavior:**
- ✅ Small balls pass between pegs appropriately
- ✅ Large balls collide with pegs correctly
- ✅ Ball size scales properly with gap at all screen sizes
- ✅ No balls getting stuck or clipping through pegs

---

### Task 4.3: Auto Mode Stress Test
**Time Estimate:** 5 minutes  
**Prerequisite:** Task 4.2

**Steps:**

1. Set Auto Speed to maximum (20/s)
2. Hold button for 10 seconds (200 balls)
3. Let all balls settle
4. Check for visual or performance issues
5. Test at different screen sizes

**Expected Behavior:**
- ✅ All balls spawn in correct position
- ✅ No visual clipping or overflow
- ✅ Performance remains smooth
- ✅ Balls properly interact with scaled pegs

---

## PHASE 5: Code Quality & Documentation

### Task 5.1: Add Inline Comments
**Time Estimate:** 5 minutes  
**Prerequisite:** All testing complete

**Steps:**

1. Review the modified gap calculation code
2. Ensure comments clearly explain:
   - Why we calculate gap using both dimensions
   - What the (rows + 2.8) multiplier represents
   - Purpose of min/max bounds (25-65px)
   - Why paddingX = 48 (both sides)

**Verify Comments Include:**
```javascript
// Calculate optimal gap that fits both width and height
// This ensures pyramid is always fully visible regardless of screen size

// Vertical space breakdown:
// - Spawn area: 1.2 * gap (above first pegs)
// - Peg area: rows * gap
// - Bucket area: 1.6 * gap (0.6 spacing + 1.0 bucket height)
// Total: (rows + 2.8) * gap

// Min 25px: Maintains playability on small screens
// Max 65px: Prevents overly large pegs on huge screens
```

**Success Criteria:**
- ✅ Comments explain the math clearly
- ✅ Future developers can understand the logic
- ✅ Constants are documented with reasoning

---

### Task 5.2: Update Context Document
**Time Estimate:** 10 minutes  
**Prerequisite:** Task 5.1

**Steps:**

1. Open `VIEWPORT_FIX_CONTEXT.md`
2. Add a new section at the end:

```markdown
## Resolution Summary

### Implementation Completed: [DATE]

**Solution Applied:** Smart Gap Calculation with Dual-Constraint

**Changes Made:**
- File: `index.html`
- Function: `buildLevel()` (lines ~288-300)
- Modified gap calculation to consider both width and height
- Fixed startY calculation to use accurate total height

**Final Parameters:**
- Minimum gap: 25px (mobile playability)
- Maximum gap: 65px (desktop limit)
- Padding X: 48px (24px each side)
- Padding Y: 40px (vertical margin)
- Height multiplier: (rows + 2.8)

**Gap Calculation Formula:**
```javascript
gapByWidth = (width - 48) / numBuckets
gapByHeight = (height - 40) / (rows + 2.8)
gap = max(25, min(65, gapByWidth, gapByHeight))
```

**Testing Results:**
- ✅ Desktop (1920×1080): gap ~49px, fully visible
- ✅ Laptop (1366×768): gap ~33px, fully visible
- ✅ Tablet (768×1024): gap ~47px, fully visible
- ✅ Mobile (414×896): gap ~25px, works as before
- ✅ Ultra-wide (2560×1440): gap ~65px, properly capped
- ✅ All row configurations (8, 12, 16) tested
- ✅ All ball sizes (5%-45%) tested
- ✅ Window resize works smoothly
- ✅ Auto mode stress test passed

**Performance Impact:** None - calculation happens once per level build

**Code Location:** Lines ~288-310 in `index.html`

### Before vs After Behavior

**Before (Desktop 1920×1080, 16 rows):**
- Gap: 50px (artificially capped)
- Pyramid width: 750px (39% of screen)
- Pyramid often cut off vertically
- Wasted horizontal space: 1170px

**After (Desktop 1920×1080, 16 rows):**
- Gap: ~49px (height-constrained)
- Pyramid width: ~735px
- Pyramid fully visible and centered
- Uses available space efficiently
- Adapts to screen dimensions

### Technical Validation

**Mathematical Correctness:**
- Height calculation: (16 + 2.8) * 49px = 920px
- Available height: ~1040px (1080 - header - controls)
- Fits with margin: ✓

**Gameplay Feel:**
- Gap range 25-65px maintains good peg spacing
- Ball physics work correctly at all scales
- Difficulty curve preserved across devices

### Lessons Learned

1. **Aspect ratio matters**: Can't just constrain one dimension
2. **Accurate space calculation**: Must account for ALL components (spawn, pegs, buckets)
3. **Sensible bounds**: Min/max prevents extreme cases
4. **Test across devices**: Desktop and mobile have different constraints

### Future Enhancement Opportunities

These are NOT part of this fix but could improve UX:
1. **Dynamic font sizing**: Scale multiplier text with gap
2. **Adaptive padding**: Adjust margins based on screen size
3. **Save preferred zoom level**: Remember user's row selection per device
4. **Portrait mode optimization**: Different layout for tall screens
```

---

### Task 5.3: Update Plan Document
**Time Estimate:** 3 minutes  
**Prerequisite:** Task 5.2

**Steps:**

1. Open this file (`VIEWPORT_FIX_PLAN.md`)
2. Add completion status at the top:

```markdown
# Viewport Scaling Fix Action Plan

**STATUS:** ✅ COMPLETED  
**Date:** [DATE]  
**Final Gap Range:** 25-65px  
**Testing Status:** All phases passed  
**Implementation Time:** ~1 hour
**Lines Changed:** ~25 lines in `index.html`

---
```

---

## PHASE 6: Finalization

### Task 6.1: Create Git Commit
**Time Estimate:** 5 minutes  
**Prerequisite:** All phases complete

**Steps:**

1. Stage changes:
   ```powershell
   git add index.html VIEWPORT_FIX_CONTEXT.md VIEWPORT_FIX_PLAN.md
   ```

2. Create descriptive commit:
   ```powershell
   git commit -m "Fix: Pyramid viewport scaling for all screen sizes

- Implemented smart gap calculation considering both width and height
- Gap now calculated as min(65, max(25, width/buckets, height/(rows+2.8)))
- Fixed vertical positioning to account for spawn and bucket areas
- Pyramid now properly fits and centers on desktop, laptop, tablet, mobile
- Maintains playability with sensible 25-65px gap bounds

Testing: All screen sizes from 414×896 to 2560×1440
Performance: No impact, calculation happens once per level build

Fixes issue where pyramid was cut off on wide screens"
   ```

3. Push to GitHub:
   ```powershell
   git push origin main
   ```

**Success Criteria:**
- ✅ Commit created with clear message
- ✅ All modified files staged
- ✅ Pushed to remote repository

---

## Troubleshooting Guide

### Issue: "Pyramid still cut off at top"
**Cause:** Height multiplier too small or paddingY too large  
**Solution:**
1. Check `totalGameHeight` calculation
2. Reduce `paddingY` from 40 to 20
3. Verify multiplier is `(rows + 2.8)` not `rows`

### Issue: "Pyramid too small on desktop"
**Cause:** maxGap too low  
**Solution:**
1. Increase `maxGap` from 65 to 75 or 80
2. Test to ensure it doesn't feel too spacious
3. May need to adjust based on gameplay preference

### Issue: "Pyramid too large on mobile"
**Cause:** minGap too high  
**Solution:**
1. Decrease `minGap` from 25 to 20
2. Test on actual device (not just emulator)
3. Verify small balls still interact correctly

### Issue: "Balls spawning outside view"
**Cause:** startY calculation incorrect  
**Solution:**
1. Verify spawn position: `startY + (gap * 1.2)`
2. Check that startY is positive
3. Add console.log to debug: `console.log('startY:', startY, 'gap:', gap)`

### Issue: "Gap calculation results in NaN or Infinity"
**Cause:** Division by zero or invalid dimensions  
**Solution:**
1. Add safety check: `if (height === 0) return;`
2. Verify container has dimensions before calling buildLevel()
3. Check that `numBuckets > 0`

---

## Definition of Done

All tasks complete when:
- ✅ Pyramid fully visible on all screen sizes (414px to 2560px+ width)
- ✅ Pyramid properly centered both horizontally and vertically
- ✅ Works in all row configurations (8, 12, 16)
- ✅ Gap stays within sensible bounds (25-65px)
- ✅ Window resize works smoothly
- ✅ Ball physics unchanged and working correctly
- ✅ Code is commented and clear
- ✅ Context document updated with results
- ✅ No console errors
- ✅ Performance is acceptable
- ✅ Pushed to GitHub

---

## Rollback Procedure

If the fix causes issues:

1. Revert gap calculation to original:
```javascript
const paddingX = 24;
const safeWidth = width - paddingX;
let gap = safeWidth / numBuckets;
if (gap > 50) gap = 50;
```

2. Revert startY calculation:
```javascript
const pyramidHeight = rows * gap;
const startY = (height - pyramidHeight) / 2 - (gap * 1.0);
```

3. Save, refresh browser
4. Document rollback reason in `VIEWPORT_FIX_CONTEXT.md`
5. Create new analysis of what went wrong

---

## Success Metrics

After implementation, verify:
- [ ] User can see entire pyramid on desktop without scrolling
- [ ] Mobile experience unchanged (still works great)
- [ ] All pegs and buckets visible simultaneously
- [ ] Pyramid centered in available space
- [ ] No performance degradation
- [ ] Code is maintainable and well-documented
