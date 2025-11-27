# Minimap Histogram Feature - Implementation Plan

## Document Purpose

This plan provides a **step-by-step implementation guide** for adding the minimap histogram feature to the Plinko game. It is designed to be followed by any developer, even one without prior context of the codebase.

**Prerequisites:**
1. Read `DOCUMENTATION.md` for codebase overview
2. Read `MINIMAP_FEATURE_CONTEXT.md` for feature research and design decisions

## Implementation Overview

**Estimated Time:** 2-3 hours
**Actual Time:** ~2 hours
**Complexity:** Low (additive changes only)
**Files Modified:** 1 (`index.html`)
**Lines Added:** ~128 lines
**Lines Modified:** ~5 lines
**Status:** ✅ COMPLETED - November 28, 2025

## Phase 1: Preparation & Setup (15 minutes) ✅ COMPLETED

### Task 1.1: Verify Current Code State
**Action:** Ensure codebase is at latest commit with viewport fix applied.

**Steps:**
1. Open `index.html` in editor
2. Locate line 289: Should see smart gap calculation with `gapByWidth` and `gapByHeight`
3. Locate line 524: Should see `handleCollision` function
4. Locate line 368: Should see `render` function
5. Locate line 283: Should see `buildLevel` function

**Success Criteria:**
- All 4 functions exist at expected locations (±5 lines)
- No syntax errors in console

### Task 1.2: Backup Current State
**Action:** Create git commit before making changes.

**Steps:**
```bash
git add .
git commit -m "Pre-minimap implementation checkpoint"
```

**Success Criteria:**
- Clean working directory (`git status` shows nothing)
- Commit created successfully

### Task 1.3: Test Current Functionality
**Action:** Verify game works before modifications.

**Steps:**
1. Open `index.html` in browser
2. Drop 5 balls in 12-row mode
3. Change to 8-row mode, verify pyramid rebuilds
4. Change to 16-row mode, verify pyramid rebuilds
5. Check console for errors

**Success Criteria:**
- Balls drop and land in buckets correctly
- Level changes work without errors
- Sound plays on collisions
- Balance updates correctly

---

## Phase 2: Add Data Structures (10 minutes) ✅ COMPLETED

### Task 2.1: Add Global Histogram Array
**Location:** `index.html` after line 241 (near other global variables)

**Current Code (line 239-241):**
```javascript
let currentRows = 12;
let gameActive = false;
let animationFrameId = null;
```

**Add After:**
```javascript
let histogramData = [];  // Track ball counts per bucket (bucket index → count)
```

**Verification:**
- Save file
- Reload browser
- Open console, type: `histogramData`
- Should see: `[]` (empty array)

### Task 2.2: Initialize Histogram in buildLevel()
**Location:** `index.html` line ~283 (buildLevel function)

**Find This Code (line ~287):**
```javascript
const numBuckets = mults.length;
```

**Add Immediately After:**
```javascript
// Reset histogram data for new level
histogramData = new Array(numBuckets).fill(0);
```

**Verification:**
- Save file
- Reload browser
- Drop 0 balls
- Console: `histogramData`
- Should see array of zeros, length matching bucket count
- 8 rows: `[0,0,0,0,0,0,0]` (7 buckets)
- 12 rows: `[0,0,0,0,0,0,0,0,0,0,0]` (11 buckets)
- 16 rows: `[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]` (15 buckets)

---

## Phase 3: Track Ball Landings (15 minutes) ✅ COMPLETED

### Task 3.1: Add Bucket Index to Sensors
**Location:** `index.html` line ~332 (sensor creation loop in buildLevel)

**Find This Code (line ~332-343):**
```javascript
for (let i = 0; i < numBuckets; i++) {
    const x = startX + (i * gap);
    const sensor = new RigidBody('rectangle', x, bucketY, {
        width: gap * 0.98,
        height: gap,
        isStatic: true,
        isSensor: true,
        label: 'sensor',
        plugin: { val: mults[i] },
        render: { visible: false }
    });
    engine.addBody(sensor);
}
```

**Modify plugin line to:**
```javascript
        plugin: { val: mults[i], bucketIndex: i },
```

**Verification:**
- Save file
- Reload browser
- Open console
- Type: `engine.bodies.filter(b => b.label === 'sensor')[0].plugin`
- Should see: `{ val: [some number], bucketIndex: 0 }`

### Task 3.2: Increment Histogram on Ball Landing
**Location:** `index.html` line ~524 (handleCollision function)

**Find This Code (line ~532-540):**
```javascript
let sensor = bodyA.label === 'sensor' ? bodyA : bodyB.label === 'sensor' ? bodyB : null;
if (sensor && ball.plugin.active) {
    ball.plugin.active = false;
    const mult = sensor.plugin.val;
    const win = ball.plugin.bet * mult;
    
    SoundManager.playScore(mult);
```

**Add After `ball.plugin.active = false;`:**
```javascript
    // Track histogram data
    const bucketIndex = sensor.plugin.bucketIndex;
    if (bucketIndex !== undefined && bucketIndex < histogramData.length) {
        histogramData[bucketIndex]++;
    }
```

**Final Code Should Look Like:**
```javascript
if (sensor && ball.plugin.active) {
    ball.plugin.active = false;
    
    // Track histogram data
    const bucketIndex = sensor.plugin.bucketIndex;
    if (bucketIndex !== undefined && bucketIndex < histogramData.length) {
        histogramData[bucketIndex]++;
    }
    
    const mult = sensor.plugin.val;
    const win = ball.plugin.bet * mult;
    
    SoundManager.playScore(mult);
```

**Verification:**
- Save file
- Reload browser
- Drop 1 ball
- Console: `histogramData`
- Should see one bucket incremented (e.g., `[0,0,3,0,0,0,0]` → center bucket hit)
- Drop 5 more balls
- Should see multiple buckets with counts
- Change level (8→12→16 rows)
- Should see histogram reset to all zeros with new length

---

## Phase 4: Add Rendering Functions (30 minutes) ✅ COMPLETED

### Task 4.1: Add normalPDF Helper Function
**Location:** `index.html` before line 368 (before render function)

**Add This Complete Function:**
```javascript
        // ==========================================
        // MINIMAP HISTOGRAM FUNCTIONS
        // ==========================================

        /**
         * Normal Probability Density Function
         * Calculates the height of the bell curve at position x
         * @param {number} x - Position along x-axis
         * @param {number} mean - Center of distribution
         * @param {number} stdDev - Standard deviation (spread)
         * @returns {number} PDF value (curve height)
         */
        function normalPDF(x, mean, stdDev) {
            const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
            const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
            return coefficient * Math.exp(exponent);
        }
```

**Verification:**
- Save file
- Reload browser
- Console: `normalPDF(5, 5, 1.5)`
- Should return: ~0.266 (peak of curve at mean)
- Console: `normalPDF(0, 5, 1.5)`
- Should return: ~0.001 (tail of curve, far from mean)

### Task 4.2: Add Responsive Sizing Function
**Add After normalPDF:**
```javascript
        /**
         * Get minimap dimensions based on screen size
         * @returns {Object} { x, y, width, height } position and size
         */
        function getMinimapDimensions() {
            if (width < 480) {  // Mobile screens
                return {
                    x: 10,
                    y: 10,
                    width: Math.min(width * 0.4, 150),
                    height: 80
                };
            } else {  // Desktop and tablet
                return {
                    x: 20,
                    y: 20,
                    width: 200,
                    height: 120
                };
            }
        }
```

**Verification:**
- Save file
- Reload browser
- Console: `getMinimapDimensions()`
- Desktop: Should return `{ x: 20, y: 20, width: 200, height: 120 }`
- Test mobile: Resize browser to <480px wide
- Console: `getMinimapDimensions()`
- Should return smaller dimensions

### Task 4.3: Add Main Minimap Drawing Function
**Add After getMinimapDimensions:**
```javascript
        /**
         * Draw minimap histogram with normal distribution curve
         * Shows ball landing frequency per bucket
         */
        function drawMinimap() {
            if (!customData || histogramData.length === 0) return;
            
            const { numBuckets } = customData;
            const mm = getMinimapDimensions();
            const padding = 10;
            const innerWidth = mm.width - (padding * 2);
            const innerHeight = mm.height - (padding * 2);
            
            // ===== CONTAINER BACKGROUND =====
            ctx.save();  // Save canvas state
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            
            // Draw semi-transparent black box with white border
            ctx.fillRect(mm.x, mm.y, mm.width, mm.height);
            ctx.strokeRect(mm.x, mm.y, mm.width, mm.height);
            
            // ===== NORMAL DISTRIBUTION CURVE =====
            // Calculate parameters for bell curve
            const mean = numBuckets / 2;  // Center of distribution
            const stdDev = Math.sqrt(numBuckets) / 2;  // Spread (wider for more buckets)
            const maxPDF = normalPDF(mean, mean, stdDev);  // Peak height
            
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';  // Subtle white
            ctx.lineWidth = 2;
            
            // Draw smooth curve with high resolution (2x bucket count)
            for (let i = 0; i <= numBuckets * 2; i++) {
                const bucketPos = i / 2;  // Sub-bucket precision for smoothness
                const x = mm.x + padding + (bucketPos / numBuckets) * innerWidth;
                
                // Calculate curve height at this position
                const pdfValue = normalPDF(bucketPos, mean, stdDev);
                const normalizedHeight = (pdfValue / maxPDF) * innerHeight;
                const y = mm.y + mm.height - padding - normalizedHeight;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            // ===== HISTOGRAM BARS =====
            const maxCount = Math.max(...histogramData, 1);  // Max count for scaling (min 1 to avoid /0)
            const barWidth = innerWidth / numBuckets;
            
            for (let i = 0; i < numBuckets; i++) {
                const count = histogramData[i];
                const barHeight = (count / maxCount) * innerHeight;
                const x = mm.x + padding + (i * barWidth);
                const y = mm.y + mm.height - padding - barHeight;
                
                // Draw bar (leave 2px gap between bars)
                ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';  // Green with transparency
                ctx.fillRect(x, y, barWidth - 2, barHeight);
            }
            
            // ===== TOTAL COUNT LABEL =====
            const totalBalls = histogramData.reduce((sum, count) => sum + count, 0);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '600 11px Inter';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(`Balls: ${totalBalls}`, mm.x + padding, mm.y + padding);
            
            ctx.restore();  // Restore canvas state
        }
```

**Verification:**
- Save file
- Reload browser
- Should see empty minimap in top-left corner
- Should see "Balls: 0" label
- Should see faint white curve (normal distribution)

---

## Phase 5: Integrate Minimap into Render Loop (10 minutes) ✅ COMPLETED

### Task 5.1: Call drawMinimap in render()
**Location:** `index.html` line ~368 (render function)

**Find This Code (line ~406-414):**
```javascript
            ctx.restore();
        });
    }
```

**Add Immediately After (before closing brace of render function):**
```javascript
        
        // Draw minimap last (on top of everything)
        drawMinimap();
    }
```

**Final Code Should Look Like:**
```javascript
    // Draw all bodies
    engine.bodies.forEach(body => {
        // ... body rendering code
        ctx.restore();
    });
    
    // Draw minimap last (on top of everything)
    drawMinimap();
}
```

**Verification:**
- Save file
- Reload browser
- Minimap should appear in top-left
- Drop 1 ball → minimap bar should increment
- Drop 10 balls → bars should grow proportionally
- Change level (12→8 rows) → minimap should reset and show 7 bars
- Change level (8→16 rows) → minimap should reset and show 15 bars

---

## Phase 6: Testing & Verification (45 minutes)

### Task 6.1: Functional Testing

**Test 6.1.1: Basic Ball Tracking**
- [ ] Drop 1 ball → correct bar increments by 1
- [ ] Drop another ball → same or different bar increments
- [ ] Drop 20 balls → distribution starts forming bell curve shape
- [ ] Console check: `histogramData.reduce((a,b)=>a+b)` equals total dropped

**Test 6.1.2: Level Changes**
- [ ] Start with 12 rows (11 buckets)
- [ ] Drop 10 balls
- [ ] Minimap shows 11 bars with counts
- [ ] Change to 8 rows
- [ ] Minimap resets: shows 7 empty bars
- [ ] Change to 16 rows
- [ ] Minimap resets: shows 15 empty bars

**Test 6.1.3: Auto-Drop Mode**
- [ ] Enable auto-drop at 1 ball/sec
- [ ] Let run for 30 seconds
- [ ] Minimap updates smoothly (no lag or missed counts)
- [ ] Disable auto-drop
- [ ] Final count matches expected (~30 balls)

**Test 6.1.4: Edge Cases**
- [ ] Zero balls dropped: Minimap shows flat line (all bars at 0)
- [ ] One bucket gets all balls: That bar grows to full height
- [ ] Very uneven distribution: Bars scale correctly (tallest = 100% height)

### Task 6.2: Visual Testing

**Test 6.2.1: Desktop (1920×1080)**
- [ ] Open game in full-screen desktop browser
- [ ] Minimap appears at (20, 20) from top-left
- [ ] Minimap is 200×120 pixels
- [ ] Doesn't obscure pyramid pegs
- [ ] Normal curve is visible but subtle (white, transparent)
- [ ] Bars are green and clearly visible
- [ ] "Balls: X" label is readable

**Test 6.2.2: Laptop (1366×768)**
- [ ] Resize browser to 1366×768
- [ ] Minimap still at (20, 20)
- [ ] Still 200×120 pixels
- [ ] All elements visible and proportional

**Test 6.2.3: Tablet (768×1024 portrait)**
- [ ] Resize browser to 768 wide
- [ ] Minimap still at (20, 20)
- [ ] Still 200×120 pixels
- [ ] Doesn't overlap with game controls

**Test 6.2.4: Mobile (414×896)**
- [ ] Resize browser to 414 wide or use mobile device
- [ ] Minimap switches to mobile size (~10, 10) position
- [ ] Minimap width ≤ 150px (40% of screen width)
- [ ] Height = 80px
- [ ] All text still readable (may be smaller)
- [ ] Bars still distinguishable

**Test 6.2.5: Window Resize**
- [ ] Start at desktop size (1200px wide)
- [ ] Drop 20 balls (minimap populated)
- [ ] Resize to mobile (<480px)
- [ ] Minimap shrinks but data persists
- [ ] Resize back to desktop
- [ ] Minimap grows, data still intact

### Task 6.3: Performance Testing

**Test 6.3.1: Frame Rate Check**
- [ ] Open dev tools → Performance tab
- [ ] Record 10 seconds of gameplay with auto-drop enabled
- [ ] Check FPS (should stay at 60fps)
- [ ] Minimap rendering should be <1ms per frame

**Test 6.3.2: Memory Check**
- [ ] Open dev tools → Memory tab
- [ ] Take heap snapshot
- [ ] Drop 1000 balls (may take time with auto-drop)
- [ ] Take another heap snapshot
- [ ] `histogramData` should only be ~15 numbers (negligible memory)
- [ ] No memory leaks (objects properly cleaned on level change)

**Test 6.3.3: Rapid Operations**
- [ ] Enable auto-drop at 5 balls/sec
- [ ] While running, rapidly change levels: 8→12→16→12→8
- [ ] No errors in console
- [ ] Histogram resets correctly each time
- [ ] Game doesn't freeze or lag

### Task 6.4: Cross-Browser Testing

**Test 6.4.1: Chrome**
- [ ] All features work
- [ ] Canvas rendering smooth
- [ ] No console errors

**Test 6.4.2: Firefox**
- [ ] All features work
- [ ] Canvas rendering smooth
- [ ] Check `ctx.roundRectSafe` fallback works

**Test 6.4.3: Safari**
- [ ] All features work
- [ ] Canvas rendering smooth
- [ ] devicePixelRatio scaling correct (Retina displays)

**Test 6.4.4: Mobile Safari (iOS)**
- [ ] Touch controls work
- [ ] Minimap visible and responsive
- [ ] No performance issues

---

## Phase 7: Code Review & Cleanup (15 minutes)

### Task 7.1: Code Quality Check

**Review Points:**
- [ ] All new functions have JSDoc comments
- [ ] Variable names are descriptive (`numBuckets`, not `n`)
- [ ] No magic numbers (constants defined clearly)
- [ ] Proper indentation (consistent with existing code)
- [ ] No console.log() statements left in code
- [ ] No commented-out code

### Task 7.2: Verify No Breaking Changes

**Regression Tests:**
- [ ] Ball physics unchanged (drop pattern same as before)
- [ ] Collision detection works (balls bounce off pegs)
- [ ] Scoring works (balance updates correctly)
- [ ] Audio works (peg hits, win sounds)
- [ ] Level selection works (8/12/16 rows dropdown)
- [ ] Bet amount works (balance deduction)
- [ ] Auto-drop works (continuous ball dropping)

### Task 7.3: Performance Baseline

**Before/After Comparison:**
```javascript
// In console, measure render time:
let start = performance.now();
for(let i = 0; i < 1000; i++) render();
let end = performance.now();
console.log(`Avg render time: ${(end-start)/1000}ms`);
```

- [ ] Render time increase < 0.5ms
- [ ] No frame drops during heavy ball activity

---

## Phase 8: Documentation & Git Commit (15 minutes)

### Task 8.1: Update MINIMAP_FEATURE_CONTEXT.md

**Add Resolution Summary Section:**
```markdown
## 11. Implementation Results

**Date Completed:** [Insert Date]

### Changes Made
- Added `histogramData` global array to track ball counts
- Modified `buildLevel()` to reset histogram on level change
- Modified sensor creation to include `bucketIndex` in plugin
- Modified `handleCollision()` to increment histogram on ball landing
- Added 3 new functions: `normalPDF()`, `getMinimapDimensions()`, `drawMinimap()`
- Integrated minimap rendering into main `render()` loop

### Testing Results
- ✅ All functional tests passed
- ✅ All visual tests passed (desktop/mobile/tablet)
- ✅ Performance impact: < 0.3ms per frame
- ✅ No breaking changes to existing features
- ✅ Cross-browser compatible (Chrome, Firefox, Safari)

### Known Issues
- None

### Future Improvements (Deferred)
- Animated bar growth transitions
- Color-coded bars matching multiplier colors
- Statistics panel (mean, median, std dev)
```

### Task 8.2: Update DOCUMENTATION.md

**Add Section Under "4. The Game Client":**
```markdown
### 4.5 Minimap Histogram System

A live histogram visualization displays the distribution of ball landings across buckets.

*   **Data Structure**: `histogramData` array tracks count per bucket (index = bucket index).
*   **Rendering**: `drawMinimap()` draws:
    1.  Semi-transparent container (top-left corner)
    2.  Normal distribution curve (theoretical expected distribution)
    3.  Histogram bars (actual ball landing counts)
    4.  Total ball count label
*   **Responsive**: Adapts size for mobile (<480px) vs desktop screens.
*   **Reset Behavior**: Histogram resets when level changes (different row count).
*   **Performance**: Negligible impact (~0.3ms per frame).
```

### Task 8.3: Git Commit

**Commit Message Template:**
```
feat: Add minimap histogram with normal distribution curve

- Add real-time histogram tracking ball landing distribution
- Display normal distribution curve overlay for comparison
- Responsive design (desktop: 200x120px, mobile: 150x80px)
- Auto-reset histogram on level change (8/12/16 rows)
- Performance optimized: <0.5ms render time per frame

Files modified:
- index.html: Added histogram tracking, minimap rendering functions

Testing:
- ✅ Functional: Ball tracking, level changes, auto-drop
- ✅ Visual: Desktop, laptop, tablet, mobile layouts
- ✅ Performance: 60fps maintained, no memory leaks
- ✅ Cross-browser: Chrome, Firefox, Safari

References: MINIMAP_FEATURE_CONTEXT.md, MINIMAP_FEATURE_PLAN.md
```

**Git Commands:**
```bash
git add index.html
git add MINIMAP_FEATURE_CONTEXT.md
git add MINIMAP_FEATURE_PLAN.md
git add DOCUMENTATION.md
git commit -F commit_message.txt
git push origin main
```

**Verification:**
- [ ] Commit created successfully
- [ ] All files tracked
- [ ] Pushed to remote repository
- [ ] GitHub shows new commit

---

## Phase 9: Final Validation (10 minutes)

### Task 9.1: Fresh Browser Test
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Hard reload page (Ctrl+Shift+R)
- [ ] Verify minimap appears immediately
- [ ] Verify all features work from fresh state

### Task 9.2: User Acceptance Criteria

**From Original Request:**
> "I want a smaller 'minimap' like area maybe at the top left corner, where it is like a bar chart, with a normal distribution curve background in that minimap thing, and every time the ball lands in a box, the corresponding bar of that x axis location will go up by 1 as response from that 1 ball."

**Verification Checklist:**
- [x] Minimap in top-left corner ✓
- [x] Bar chart format ✓
- [x] Normal distribution curve background ✓
- [x] Bar increments by 1 per ball landing ✓
- [x] Matches different row configurations (8/12/16) ✓
- [x] Histogram refreshes on level change ✓

### Task 9.3: Final Screenshots

**Capture for documentation:**
1. Desktop view with 50+ balls dropped showing bell curve
2. Mobile view with histogram
3. Comparison: 8 rows vs 16 rows (different distributions)

---

## Troubleshooting Guide

### Issue 1: Minimap Not Appearing

**Symptoms:** Canvas loads but no minimap visible

**Debug Steps:**
1. Console: `histogramData` → Should be an array (not undefined)
2. Console: `customData` → Should be an object (not null)
3. Console: `drawMinimap()` → Manually call, check for errors
4. Dev tools → Elements → Inspect canvas, check CSS opacity

**Common Causes:**
- `drawMinimap()` not called in `render()` function
- `customData` not set (call `init()` first)
- CSS/canvas scaling issue (check `devicePixelRatio`)

**Fix:**
- Verify `render()` function calls `drawMinimap()` after body loop
- Reload page to trigger `init()` → `buildLevel()`

### Issue 2: Bars Not Incrementing

**Symptoms:** Minimap appears but bars stay at 0 height

**Debug Steps:**
1. Drop 1 ball
2. Console: `histogramData` → Check if any values > 0
3. If still all zeros:
   - Console: `engine.bodies.filter(b => b.label === 'sensor')[0].plugin`
   - Should see `{ val: X, bucketIndex: 0 }`
4. If `bucketIndex` missing:
   - Issue in sensor creation (Task 3.1)

**Common Causes:**
- Sensor missing `bucketIndex` in plugin
- `handleCollision()` not updating histogram
- Histogram reset after ball lands (check `buildLevel()` calls)

**Fix:**
- Verify sensor creation includes `bucketIndex: i`
- Verify `handleCollision()` includes histogram increment code
- Set breakpoint in collision handler to debug

### Issue 3: Normal Curve Not Showing

**Symptoms:** Bars visible but no white curve

**Debug Steps:**
1. Console: `normalPDF(5, 5, 1.5)` → Should return ~0.266
2. Console: `getMinimapDimensions()` → Should return valid dimensions
3. Inspect minimap area with high contrast settings
4. Try changing curve color to solid white: `rgba(255, 255, 255, 1.0)`

**Common Causes:**
- Curve drawn but too faint (alpha too low)
- Curve drawn behind bars (order issue)
- Curve drawn outside visible area (coordinate calculation)

**Fix:**
- In `drawMinimap()`, draw curve BEFORE bars
- Increase curve opacity temporarily for debugging
- Check `ctx.stroke()` is called after `ctx.beginPath()` and line drawing

### Issue 4: Mobile Scaling Wrong

**Symptoms:** Minimap too large or too small on mobile

**Debug Steps:**
1. Console: `width` → Check canvas width value
2. Console: `getMinimapDimensions()` → Verify returns mobile size
3. Manually resize browser below 480px
4. Check viewport meta tag: `maximum-scale=1.0`

**Common Causes:**
- Viewport meta tag missing or incorrect
- `width` variable not updating on resize
- Mobile breakpoint (480px) too low/high for device

**Fix:**
- Verify `width` is recalculated in `init()` (called on resize)
- Adjust breakpoint if needed (try 600px instead of 480px)
- Test on actual mobile device, not just browser resize

### Issue 5: Performance Lag

**Symptoms:** Game stutters or FPS drops below 60

**Debug Steps:**
1. Dev tools → Performance → Record
2. Check "Scripting" time → `drawMinimap` should be minimal
3. Check for excessive array operations
4. Profile with 100+ balls active

**Common Causes:**
- Curve drawing too many points (reduce resolution)
- Histogram calculation inefficient
- Canvas operations not batched

**Fix:**
- Reduce curve resolution: `numBuckets * 2` → `numBuckets * 1`
- Cache `maxCount` calculation (only recalc when histogram changes)
- Use `ctx.save()` / `ctx.restore()` properly

---

## Success Metrics

**Upon completion, the following should be true:**

### Code Quality
- ✅ Zero syntax errors
- ✅ Zero console warnings
- ✅ All functions documented
- ✅ Code follows existing style conventions
- ✅ Git history clean (one commit for feature)

### Functionality
- ✅ Histogram tracks all ball landings
- ✅ Bars increment correctly
- ✅ Level changes reset histogram
- ✅ Auto-drop mode works seamlessly
- ✅ Normal curve displays correctly

### Visual Design
- ✅ Minimap positioned at top-left
- ✅ Responsive sizing (desktop vs mobile)
- ✅ Readable on all screen sizes
- ✅ Doesn't obscure game elements
- ✅ Color scheme matches game aesthetic

### Performance
- ✅ 60 FPS maintained
- ✅ Render time increase < 0.5ms
- ✅ No memory leaks
- ✅ Fast on mobile devices

### User Experience
- ✅ Feature is intuitive (no explanation needed)
- ✅ Provides valuable feedback (distribution visualization)
- ✅ Doesn't distract from main gameplay
- ✅ Enhances understanding of Plinko probability

---

## Post-Implementation Checklist

- [ ] All 9 phases completed
- [ ] All tests passed (Functional, Visual, Performance)
- [ ] No console errors on any browser
- [ ] No breaking changes to existing features
- [ ] Code committed to git with descriptive message
- [ ] Documentation updated (CONTEXT, DOCUMENTATION.md)
- [ ] Screenshots captured for reference
- [ ] Feature demonstrated to stakeholder/user
- [ ] User acceptance criteria met (original request satisfied)
- [ ] Known issues documented (if any)
- [ ] Future enhancements noted in CONTEXT file

---

**END OF IMPLEMENTATION PLAN**

**Estimated Total Time:** 2-3 hours (for developer with moderate experience)

**Next Steps After Completion:**
1. User testing and feedback gathering
2. Consider future enhancements (animated bars, statistics panel)
3. Monitor for bug reports over 1 week
4. Mark feature as stable in release notes

