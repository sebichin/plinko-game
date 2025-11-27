# Viewport Scaling Issue Context

## Problem Statement
**Date:** November 27, 2025  
**Issue:** The Plinko pyramid structure only fits correctly when the window is narrow (phone-sized). On larger screens, the pyramid appears to be cut off or positioned incorrectly, despite having enough screen space to display the entire structure.

## Timeline & Investigation

### [2025-11-27] Initial Research Phase

#### Problem Discovery
- **Symptom**: Pyramid doesn't fit in viewport on desktop/wide screens
- **Workaround**: Works correctly when window is narrow (mobile width)
- **User Experience Impact**: Players cannot see full game board on desktop
- **Expected Behavior**: Pyramid should scale appropriately to fill available space while remaining visible

#### Architecture Understanding

**Layout Structure** (`index.html`):
```
<body> (100vh x 100vw, flexbox column)
  ├─ Header (fixed height)
  ├─ #game-container (flex-grow: 1, relative)
  │   └─ <canvas id="world"> (100% x 100%)
  └─ #controls-area (fixed height at bottom)
```

**Canvas Sizing** (`init()` function, lines 244-268):
```javascript
width = container.clientWidth;   // Full container width
height = container.clientHeight; // Full container height
canvas.width = width * devicePixelRatio;
canvas.height = height * devicePixelRatio;
canvas.style.width = width + 'px';
canvas.style.height = height + 'px';
ctx.scale(devicePixelRatio, devicePixelRatio);
```

**Pyramid Calculation** (`buildLevel()` function, lines 284-296):
```javascript
const paddingX = 24;
const safeWidth = width - paddingX;
let gap = safeWidth / numBuckets;
if (gap > 50) gap = 50;  // ⚠️ GAP CAPPED AT 50px

const pyramidHeight = rows * gap;
const startY = (height - pyramidHeight) / 2 - (gap * 1.0);
```

#### Root Cause Analysis

**Problem 1: Gap Cap Limitation**
- Line 292: `if (gap > 50) gap = 50;`
- **Why it exists**: Prevents pegs from being too far apart
- **Issue**: On wide screens, this cap artificially limits pyramid width
- **Result**: Pyramid width = `numBuckets * 50px` (max ~750px for 15 buckets)
- **Desktop screen**: 1920px wide → pyramid only uses 750px (39%)

**Problem 2: Vertical Positioning**
- `startY = (height - pyramidHeight) / 2 - (gap * 1.0)`
- Additional offset: `-gap * 1.0` pushes pyramid up
- **Issue**: If pyramid is too tall for viewport, it gets cut off at top
- **Calculation**: 
  - 16 rows × 50px gap = 800px pyramid height
  - Container height on desktop ≈ 600-800px (varies)
  - StartY becomes negative or very small → pyramid cut off

**Problem 3: Bucket Width Not Matching Gap**
- Buckets calculated in `drawOverlay()` (lines 424-425):
  ```javascript
  const totalBucketWidth = numBuckets * gap;
  const startX = (width / 2) - (totalBucketWidth / 2) + (gap / 2);
  ```
- This matches peg layout, but both are constrained by gap cap

**Why It Works on Narrow Screens:**
- Phone width: ~375-414px
- `gap = safeWidth / numBuckets = 375 / 15 = 25px`
- Gap is naturally small, never hits 50px cap
- Pyramid fits: 15 buckets × 25px = 375px (100% width usage)
- Height: 16 rows × 25px = 400px (fits in portrait)

#### Key Code Locations

**File: `index.html`**

**Canvas Initialization** (lines 244-268):
```javascript
function init() {
    const container = document.getElementById('game-container');
    width = container.clientWidth;
    height = container.clientHeight;
    // ... canvas setup
}
```

**Pyramid Layout Calculation** (lines 284-296):
```javascript
function buildLevel() {
    const paddingX = 24;
    const safeWidth = width - paddingX;
    let gap = safeWidth / numBuckets;
    if (gap > 50) gap = 50;  // ⚠️ PROBLEM: Hard cap
    
    const pyramidHeight = rows * gap;
    const startY = (height - pyramidHeight) / 2 - (gap * 1.0);  // ⚠️ Extra offset
}
```

**Peg Placement** (lines 299-318):
```javascript
for (let r = 2; r < rows; r++) {
    for (let c = 0; c <= r; c++) {
        const x = width / 2 - (r * gap / 2) + (c * gap);
        const y = startY + r * gap;
        // Create peg at (x, y)
    }
}
```

**Bucket Rendering** (lines 424-450):
```javascript
const totalBucketWidth = numBuckets * gap;
const startX = (width / 2) - (totalBucketWidth / 2) + (gap / 2);
// Draw buckets at bottom
```

#### Related Systems & Dependencies

**1. Physics Engine Dependencies:**
- Peg positions are absolute pixel coordinates
- Ball spawn position: `spawnY = data.startY + (data.gap * 1.2)` (line 479)
- Ball size: `ballRadius = data.gap * sizePercent` (line 478)
- **Impact**: Changing gap affects ball physics behavior

**2. Rendering Dependencies:**
- Peg radius: `gap * 0.12` (line 306)
- Bucket dimensions: `gap * 0.96` width, `gap * 0.7` height (lines 444-445)
- Font size: `gap * 0.35` (line 451)
- **Impact**: All visual elements scale with gap

**3. Collision Detection:**
- Spatial hash cell size: 50px (physics-engine.js)
- Works independently of gap size
- **Impact**: None - physics will work at any scale

**4. Multiplier Arrays:**
```javascript
const MULTIPLIERS = {
    8:  [29, 4, 2, 0.3, 2, 4, 29],              // 7 buckets
    12: [170, 24, 8.1, 2, 1, 0.5, 1, 2, 8.1, 24, 170],  // 11 buckets
    16: [1000, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 1000]  // 15 buckets
};
```
- Number of buckets drives pyramid width
- 16 rows = 15 buckets = maximum width needed

#### Mathematical Analysis

**Current Behavior (Desktop, 16 rows):**
- Screen width: 1920px
- Container width: ~1920px
- Safe width: 1896px (minus 24px padding)
- Ideal gap: 1896 / 15 = 126.4px
- **Actual gap: 50px (capped)**
- Pyramid width: 15 × 50 = 750px
- Pyramid height: 16 × 50 = 800px
- Wasted horizontal space: 1170px (61%)

**Current Behavior (Mobile, 16 rows):**
- Screen width: 414px
- Container width: ~414px
- Safe width: 390px
- Ideal gap: 390 / 15 = 26px
- **Actual gap: 26px (under cap)**
- Pyramid width: 15 × 26 = 390px
- Pyramid height: 16 × 26 = 416px
- Space usage: 94% ✓

**Aspect Ratio Considerations:**
- Desktop typical: 16:9 (1920×1080)
- Available game area: ~1920×800 (after header/controls)
- Aspect ratio: 2.4:1 (very wide)
- 16-row pyramid ideal ratio: 15:16 = ~1:1 (nearly square)
- **Mismatch**: Need to fit 1:1 content into 2.4:1 space

#### Solution Approaches (Brainstormed)

**Approach 1: Dynamic Gap Cap Based on Aspect Ratio**
- Calculate max gap that fits both width AND height
- Remove fixed 50px cap
- Use: `gap = Math.min(safeWidth / numBuckets, safeHeight / rows)`
- **Pros**: Pyramid always fits, responsive
- **Cons**: Very wide screens = huge pegs (bad gameplay)

**Approach 2: Maximum Pyramid Size with Centering**
- Set sensible min/max gap (e.g., 20-60px)
- Center pyramid if screen is larger than max pyramid size
- **Pros**: Consistent gameplay feel, always visible
- **Cons**: Wasted space on very large screens

**Approach 3: Fill Height, Limit Width**
- Remove width cap, add height-based calculation
- `gap = Math.min(safeWidth / numBuckets, safeHeight / (rows + extraSpace))`
- Add extra space for ball drop and bucket display
- **Pros**: Uses screen efficiently, maintains proportions
- **Cons**: Complex calculation

**Approach 4: Viewport-Aware Scaling**
- Calculate optimal gap that uses max available space
- Add safety margins for controls and spacing
- Formula: `gap = Math.min(maxGap, safeWidth/numBuckets, safeHeight/(rows+3))`
- **Pros**: Most flexible, works on all screen sizes
- **Cons**: Requires careful tuning

## Current Understanding Level

### What We Know:
✅ Layout structure (header, canvas, controls)
✅ Canvas sizing using devicePixelRatio
✅ Pyramid calculation uses fixed gap cap (50px)
✅ Gap drives all element sizes (pegs, balls, buckets)
✅ StartY calculation includes extra negative offset
✅ Works on mobile because gap stays under cap
✅ Desktop has 61% wasted horizontal space

### What We Need to Explore:
⏳ Optimal min/max gap values for gameplay
⏳ Extra space needed for ball drop area and buckets
⏳ Impact of different gap sizes on game feel
⏳ Testing different screen sizes/aspect ratios
⏳ Ball physics behavior at different scales

### Gaps in Knowledge:
❓ Why was 50px chosen as the cap? (gameplay balance?)
❓ What is the acceptable range for gap size? (20-80px?)
❓ Should pyramid scale infinitely or have max size?
❓ How much vertical space do buckets + drop zone need?
❓ Does ball speed feel right at different scales?

## Next Steps
Continue research into optimal scaling parameters before proceeding to PLAN document.

---

## Deep Dive: Vertical Space Requirements

### Vertical Layout Breakdown

**Components from Top to Bottom:**
1. **Ball spawn area**: `startY + (gap * 1.2)` (line 479)
   - Needs space above first peg row for ball to drop
   - Current: 1.2 × gap above startY
   
2. **First pegs**: Start at row 2 (loop begins at `r = 2`, line 299)
   - Row 2 is at: `startY + 2 * gap`
   
3. **Peg pyramid**: Rows 2 through (rows-1)
   - Height: `(rows - 2) * gap`
   - For 16 rows: 14 gaps of peg spacing
   
4. **Last peg row**: At `startY + (rows - 1) * gap` (line 323)
   
5. **Bucket area**: `lastRowY + (gap * 0.6)` (line 324)
   - 0.6 × gap spacing between last pegs and buckets
   - Bucket height: `gap * 1.0` (sensor height, line 332)
   - Bucket visual height: `gap * 0.7` (line 445)

**Total Vertical Space Needed:**
```
Total = SpawnArea + PegArea + BucketArea
      = (1.0 * gap) + (rows * gap) + (0.6 * gap + 1.0 * gap)
      = (rows + 2.6) * gap
```

For 16 rows: `18.6 * gap` minimum vertical space

**Current Calculation Analysis:**
```javascript
const pyramidHeight = rows * gap;  // Only counts peg area
const startY = (height - pyramidHeight) / 2 - (gap * 1.0);
```

**Problem Identified:**
- `pyramidHeight` only accounts for `rows * gap`
- Doesn't include spawn area (1.2 * gap) or bucket area (1.6 * gap)
- Additional `-gap * 1.0` offset pushes it up further
- **Total unaccounted space**: ~3.8 × gap

**Recalculated Space Needs:**
```javascript
// What code thinks it needs:
usedSpace = rows * gap

// What it actually needs:
actualSpace = 1.2*gap (spawn) + rows*gap (pegs) + 1.6*gap (buckets)
            = (rows + 2.8) * gap
```

### Horizontal Space Requirements

**Components Left to Right:**
1. **Padding**: 24px on sides (paddingX = 24, line 288)
2. **Pyramid width**: `numBuckets * gap`
3. **Bucket labels**: Rendered inside buckets, no extra space

**Current Calculation:**
```javascript
const paddingX = 24;
const safeWidth = width - paddingX;  // ⚠️ Only subtracts 24px once
let gap = safeWidth / numBuckets;
```

**Problem**: `paddingX = 24` suggests single-side padding, but should be doubled for both sides?

**Analysis of Current Behavior:**
- Pegs: Centered using `width / 2` as anchor (line 302)
- Buckets: Calculated as `(width/2) - (totalBucketWidth/2)` (line 326)
- Both naturally center themselves
- **Conclusion**: The 24px is total safety margin, not per-side

### Gap Size Impact on Gameplay

**Ball Physics Considerations:**
- Ball size: `gap * sizePercent` (5%-45%)
- At gap=50px, 35% ball = 17.5px radius
- At gap=26px, 35% ball = 9.1px radius  
- At gap=80px, 35% ball = 28px radius

**Peg Spacing Impact:**
- Larger gap = easier to avoid obstacles
- Smaller gap = more ricochet, more randomness
- Sweet spot: Ball should pass pegs with some clearance but still hit them

**Optimal Gap Range Estimation:**
- **Minimum (20px)**: 
  - 35% ball = 7px radius
  - Peg radius = 2.4px (gap × 0.12)
  - Clearance = 20 - 7 - 2.4 = 10.6px per side ✓
  
- **Maximum (80px)**:
  - 35% ball = 28px radius  
  - Peg radius = 9.6px
  - Clearance = 80 - 28 - 9.6 = 42.4px per side
  - **May feel too easy** (ball rarely hits pegs)

**Recommended Range: 25-65px**
- Minimum 25px: Good for mobile, tight gameplay
- Maximum 65px: Good for desktop, balanced feel
- Original cap of 50px was reasonable for max size

### Screen Size Matrix

| Screen Type | Width | Height | Rows | Buckets | Ideal Gap | Capped Gap | Fit? |
|-------------|-------|--------|------|---------|-----------|------------|------|
| iPhone SE | 375px | 667px | 16 | 15 | 25px | 25px | ✅ Yes |
| iPhone 14 | 414px | 896px | 16 | 15 | 27px | 27px | ✅ Yes |
| iPad | 768px | 1024px | 16 | 15 | 51px | 50px | ✅ Yes |
| Laptop | 1366px | 768px | 16 | 15 | 91px | **50px** | ❌ No (horiz) |
| Desktop | 1920px | 1080px | 16 | 15 | 128px | **50px** | ❌ No (horiz) |
| Ultrawide | 2560px | 1440px | 16 | 15 | 170px | **50px** | ❌ No (horiz) |

**Game area calculations** (assuming 160px for header+controls):
- Laptop: 1366×608px available → gap needs: width=50px, height=33px
- Desktop: 1920×920px available → gap needs: width=50px, height=49px  
- Ultrawide: 2560×1280px available → gap needs: width=50px, height=69px

**Key Finding**: Width constraint (50px cap) is the limiting factor, NOT height!

### Revised Solution Approach

**Recommended: Approach 2B - Smart Gap Calculation**

```javascript
function calculateOptimalGap(width, height, rows, numBuckets) {
    const paddingX = 24;
    const headerControlsHeight = 160; // estimated
    
    const safeWidth = width - paddingX * 2;  // Both sides
    const safeHeight = height - headerControlsHeight;
    
    // Calculate gap that fits width
    const gapByWidth = safeWidth / numBuckets;
    
    // Calculate gap that fits height
    // Need: (rows + 2.8) * gap for spawn + pegs + buckets
    const gapByHeight = safeHeight / (rows + 2.8);
    
    // Use smaller of the two, with min/max bounds
    const gap = Math.max(25, Math.min(65, gapByWidth, gapByHeight));
    
    return gap;
}
```

**Why This Works:**
1. Considers both dimensions
2. Prevents pyramid from being too large (max 65px)
3. Maintains playability (min 25px)
4. Always fits in viewport
5. Uses available space efficiently

**Expected Results:**
- Mobile (375×667): gap = 25px (width-constrained) ✓
- iPad (768×1024): gap = 51px (width-constrained) ✓
- Laptop (1366×768): gap = 33px (height-constrained) ✓ FIXED
- Desktop (1920×1080): gap = 49px (height-constrained) ✓ FIXED
- Ultrawide (2560×1440): gap = 65px (max cap) ✓ FIXED

## Next Steps
Proceed to PLAN document with implementation strategy.

---

## Testing Methodology & Validation Strategy

### Manual Testing Checklist

**Per Screen Size:**
1. Visual inspection: Entire pyramid visible? Centered?
2. Drop 5 balls: Do they spawn correctly? Hit pegs? Land in buckets?
3. Resize window: Does pyramid adjust smoothly?
4. Change row count: Does 8/12/16 all work?
5. Ball size slider: Does 5% and 45% work?

**Screen Sizes Priority:**
1. **Critical**: 414×896 (mobile), 1920×1080 (desktop)
2. **Important**: 768×1024 (tablet), 1366×768 (laptop)
3. **Nice-to-have**: 2560×1440 (ultrawide), 3840×2160 (4K)

### Automated Validation (Console Commands)

**Check Gap Calculation:**
```javascript
// After level loads, in browser console:
console.log('Gap:', customData.gap);
console.log('Expected min: 25, Expected max: 65');
console.log('Gap in bounds:', customData.gap >= 25 && customData.gap <= 65);
```

**Check Vertical Fit:**
```javascript
const totalHeight = (customData.rows + 2.8) * customData.gap;
console.log('Total height needed:', totalHeight);
console.log('Canvas height:', height);
console.log('Fits:', totalHeight < height);
```

**Check Horizontal Fit:**
```javascript
const totalWidth = customData.numBuckets * customData.gap;
console.log('Total width needed:', totalWidth);
console.log('Canvas width:', width);
console.log('Fits:', totalWidth < width);
```

### Physics Validation

**Ball Spawn Position:**
- Should spawn above first visible peg
- `spawnY = startY + (gap * 1.2)`
- Must be > 0 (not off-screen top)
- Must be < height (not off-screen bottom)

**Peg Positions:**
- All pegs within canvas bounds: `0 < x < width`, `0 < y < height`
- Pegs properly centered: First peg row at `startY + 2*gap`

**Bucket Positions:**
- Buckets at bottom: `bucketY = lastRowY + (gap * 0.6)`
- All buckets visible: `bucketY + gap < height`

### Performance Benchmarks

**Acceptable Performance:**
- Level rebuild: < 50ms
- Frame rate: Consistent 60 FPS with 20 balls
- No jank during window resize

**Measurement:**
```javascript
// In buildLevel()
const t0 = performance.now();
// ... level building code ...
const t1 = performance.now();
console.log('Level build time:', (t1 - t0).toFixed(2), 'ms');
```

### Regression Testing

**Ensure These Still Work:**
- ✅ Collision detection (balls hit pegs)
- ✅ Scoring system (balls land in buckets)
- ✅ Audio system (peg hits play sound)
- ✅ Auto mode (rapid ball drops)
- ✅ Balance tracking
- ✅ Ball size slider
- ✅ Row selection dropdown

### Edge Cases to Test

1. **Very narrow window** (< 400px width)
   - Gap should hit minimum (25px)
   - Pyramid should still fit
   
2. **Very short window** (< 600px height)
   - Gap should be height-constrained
   - May need to use 8 rows instead of 16
   
3. **Extreme aspect ratios**
   - Portrait phone (9:16)
   - Ultrawide monitor (21:9)
   
4. **Rapid resize**
   - Drag window edge quickly
   - No visual glitches or errors
   
5. **Mid-game resize**
   - Balls in flight when window resizes
   - Should they continue or reset?

### Browser Compatibility

**Test in:**
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if available)

**Known differences:**
- Safari devicePixelRatio handling
- Firefox canvas rendering
- Mobile browser viewport units

### Acceptance Criteria Summary

**Must Have:**
1. Pyramid fully visible on 1920×1080 desktop
2. Pyramid fully visible on 414×896 mobile
3. No regression in physics or gameplay
4. Code is clear and maintainable

**Should Have:**
1. Works on 1366×768 laptop
2. Works on 768×1024 tablet
3. Smooth window resize
4. Good gameplay feel at all sizes

**Nice to Have:**
1. Works on ultrawide monitors
2. Works on 4K displays
3. Optimized for portrait mobile
4. Adaptive UI elements

## Implementation Ready
All research complete. Proceed to implementation phase following `VIEWPORT_FIX_PLAN.md`.
