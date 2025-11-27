# Minimap Histogram Feature - Context Documentation

## Timeline

**Date Started:** November 27, 2025
**Feature Request:** Add minimap histogram with normal distribution curve showing ball landing distribution

## 1. Feature Requirements

### 1.1 User Request Summary
- **Visual Element:** A small "minimap" area positioned at top-left corner of canvas
- **Content:** Bar chart/histogram showing ball landing counts per bucket
- **Background:** Normal distribution curve overlay
- **Behavior:** 
  - Each time a ball lands in a bucket, increment that bucket's bar by 1
  - Bars grow upward to visualize frequency
  - Adapt to different row configurations (8/12/16 rows have different bucket counts)
  - Reset histogram when level changes (different row count selected)

### 1.2 Visual Design Concept
```
┌─────────────────────────────────────────┐
│ ┌─────────────┐                         │
│ │  [Minimap]  │                         │
│ │  ┌─┬─┬─┬─┐  │                         │
│ │  │ │█│ │ │  │  ← Bars grow up        │
│ │  │█│█│█│ │  │                         │
│ │  │█│█│█│█│  │  ← Normal curve bg     │
│ │  └─┴─┴─┴─┘  │                         │
│ │   Buckets   │                         │
│ └─────────────┘                         │
│           [Main Game Area]              │
│              Pegs & Balls               │
└─────────────────────────────────────────┘
```

## 2. Current System Analysis

### 2.1 Bucket Detection System

**Location:** `index.html` lines 524-543

**Mechanism:**
1. **Sensor Creation** (lines 326-344):
   - Each bucket has an invisible rectangular sensor
   - Sensors are `RigidBody` objects with `isSensor: true`
   - Positioned at `bucketY = lastRowY + (gap * 0.6)`
   - Each sensor stores multiplier value: `plugin: { val: mults[i] }`
   - Number of sensors = `numBuckets = mults.length`

2. **Collision Detection** (lines 524-543):
   ```javascript
   function handleCollision(event) {
       const { bodyA, bodyB } = event;
       let ball = bodyA.label === 'ball' ? bodyA : bodyB.label === 'ball' ? bodyB : null;
       if (!ball) return;
       
       let sensor = bodyA.label === 'sensor' ? bodyA : bodyB.label === 'sensor' ? bodyB : null;
       if (sensor && ball.plugin.active) {
           ball.plugin.active = false;
           const mult = sensor.plugin.val;
           const win = ball.plugin.bet * mult;
           // ... handle scoring
           engine.removeBody(ball);
           return;
       }
   }
   ```

**Key Insight:** 
- Sensors are created in a loop: `for (let i = 0; i < numBuckets; i++)`
- Each sensor corresponds to bucket index `i`
- We need to track which sensor index (0 to numBuckets-1) was hit
- **Problem:** Current code doesn't store bucket index in sensor!

**Required Modification:**
- Add bucket index to sensor: `plugin: { val: mults[i], bucketIndex: i }`
- In collision handler, extract `sensor.plugin.bucketIndex`
- Increment histogram array: `histogramData[bucketIndex]++`

### 2.2 Canvas Rendering System

**Location:** `index.html` lines 368-516

**Rendering Pipeline:**
1. **Main Render Loop** (lines 368-414):
   ```javascript
   function render() {
       if (!ctx || !customData) return;
       ctx.clearRect(0, 0, width, height);  // Clear entire canvas
       drawOverlay();                        // Draw UI elements first
       engine.bodies.forEach(body => {       // Draw physics objects
           // ... interpolated rendering
       });
   }
   ```

2. **Overlay Drawing** (lines 416-460):
   - Called BEFORE physics bodies are drawn
   - Draws static UI: bucket boxes, multiplier text, grid lines
   - Uses `customData` for layout: `{ gap, rows, mults, startY, numBuckets }`
   - Bucket positioning:
     ```javascript
     const totalBucketWidth = numBuckets * gap;
     const startX = (width / 2) - (totalBucketWidth / 2) + (gap / 2);
     for (let i = 0; i < mults.length; i++) {
         const x = startX + (i * gap);  // Bucket i is at x position
         // Draw box, text, grid line
     }
     ```

**Key Insights:**
- Canvas dimensions: `width` and `height` (global variables)
- Context: `ctx` (CanvasRenderingContext2D)
- High-DPI scaling: Canvas uses `devicePixelRatio` (lines 260-267)
- Coordinate system: Origin (0,0) is top-left
- Drawing order: Overlay → Physics Bodies → (New: Minimap should be last)

**Minimap Integration Points:**
1. Create new function: `drawMinimap()` 
2. Call it AFTER `engine.bodies.forEach()` in `render()`
3. This ensures minimap draws on top of everything
4. Access `ctx`, `width`, `height` globals
5. Use `customData.numBuckets` to determine bar count

### 2.3 Canvas Coordinate System

**Global Variables:**
- `width`: Canvas logical width (container.clientWidth)
- `height`: Canvas logical height (container.clientHeight)
- `canvas.width`: Physical width (width × devicePixelRatio)
- `canvas.height`: Physical height (height × devicePixelRatio)
- `ctx.scale(devicePixelRatio, devicePixelRatio)` applied (line 267)

**Drawing Context:**
- All drawing uses logical coordinates (width, height)
- Top-left is (0, 0)
- Bottom-right is (width, height)

**Minimap Position Planning:**
- Top-left corner: Start at (padding, padding)
- Suggested: (20, 20) with size ~200px wide
- Must avoid: Header area (but header is outside canvas)
- Must consider: Mobile screens may be narrow

### 2.4 Data Flow for Minimap

**Required Data Structure:**
```javascript
let histogramData = [];  // Array of counts, index = bucket index
```

**Initialization (in buildLevel):**
```javascript
histogramData = new Array(numBuckets).fill(0);
```

**Update (in handleCollision):**
```javascript
if (sensor && ball.plugin.active) {
    const bucketIndex = sensor.plugin.bucketIndex;
    histogramData[bucketIndex]++;
    // ... existing code
}
```

**Rendering (in drawMinimap):**
```javascript
function drawMinimap() {
    const numBuckets = customData.numBuckets;
    const maxCount = Math.max(...histogramData, 1);
    
    // Position & Size
    const mmX = 20, mmY = 20;
    const mmWidth = 200, mmHeight = 120;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(mmX, mmY, mmWidth, mmHeight);
    
    // Bars
    const barWidth = mmWidth / numBuckets;
    for (let i = 0; i < numBuckets; i++) {
        const barHeight = (histogramData[i] / maxCount) * (mmHeight - 20);
        const x = mmX + (i * barWidth);
        const y = mmY + mmHeight - barHeight;
        ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
        ctx.fillRect(x, y, barWidth - 2, barHeight);
    }
}
```

## 3. Normal Distribution Mathematics

### 3.1 Binomial Distribution (Plinko Physics)

Plinko follows a **Binomial Distribution** which approximates a **Normal Distribution** for large n.

**Physics:**
- Each peg hit: ball goes left or right (~50/50 chance)
- After `n` rows, position follows Binomial(n, p=0.5)
- Center buckets are most likely (peak of bell curve)
- Edge buckets are least likely (tails of distribution)

**Parameters:**
- `n` = number of rows (8, 12, or 16)
- `k` = bucket position (0 to numBuckets-1)
- Center bucket: `k = numBuckets / 2`

### 3.2 Normal Distribution Formula

For large n, Binomial(n, 0.5) ≈ Normal(μ, σ²) where:
- Mean: μ = n/2
- Variance: σ² = n/4
- Standard deviation: σ = √(n/4) = √n/2

**Probability Density Function (PDF):**
$$f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}$$

**For rendering:**
```javascript
function normalPDF(x, mean, stdDev) {
    const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
    return coefficient * Math.exp(exponent);
}
```

### 3.3 Curve Rendering Strategy

**Approach:** Draw smooth curve behind histogram bars

```javascript
function drawNormalCurve(ctx, mmX, mmY, mmWidth, mmHeight, numBuckets) {
    const mean = numBuckets / 2;
    const stdDev = Math.sqrt(numBuckets) / 2;
    
    // Calculate max PDF value for normalization
    const maxPDF = normalPDF(mean, mean, stdDev);
    
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    
    // Draw curve across minimap width
    for (let i = 0; i <= numBuckets; i++) {
        const x = mmX + (i / numBuckets) * mmWidth;
        const pdfValue = normalPDF(i, mean, stdDev);
        const normalizedHeight = (pdfValue / maxPDF) * (mmHeight - 20);
        const y = mmY + mmHeight - normalizedHeight;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}
```

**Visual Design:**
- Curve color: Semi-transparent white `rgba(255, 255, 255, 0.3)`
- Draw curve BEFORE bars (background)
- Normalize curve height to fit minimap
- Curve should peak at center, taper to edges

### 3.4 Expected Distribution by Row Count

**8 Rows (7 buckets):**
- Mean: 3.5 (center)
- StdDev: √8/2 ≈ 1.41
- Distribution: Relatively flat, moderate spread

**12 Rows (11 buckets):**
- Mean: 5.5 (center)
- StdDev: √12/2 ≈ 1.73
- Distribution: More defined bell curve

**16 Rows (15 buckets):**
- Mean: 7.5 (center)
- StdDev: √16/2 = 2.0
- Distribution: Sharper peak, clearer normal shape

**Key Insight:** More rows = sharper peak = more predictable distribution

## 4. Responsive Design & Positioning

### 4.1 Screen Size Considerations

**Current Game Responsiveness:**
- Canvas fills container: `width = container.clientWidth`
- Container: `flex-grow: 1` takes available vertical space
- Viewport: `100dvh` (dynamic viewport height)
- Mobile-friendly: `maximum-scale=1.0, user-scalable=no`

**Testing Required For:**
1. **Desktop:** 1920×1080, 1366×768
2. **Tablet:** 768×1024 (portrait), 1024×768 (landscape)
3. **Mobile:** 414×896 (iPhone), 360×740 (Android)

### 4.2 Minimap Positioning Strategy

**Fixed Position Approach:**
```javascript
const MINIMAP_CONFIG = {
    paddingX: 20,        // Distance from left edge
    paddingY: 20,        // Distance from top edge
    baseWidth: 200,      // Base width on desktop
    baseHeight: 120,     // Base height on desktop
    minWidth: 150,       // Minimum width on mobile
    minHeight: 90        // Minimum height on mobile
};

function getMinimapDimensions() {
    // Responsive sizing based on canvas width
    if (width < 480) {  // Mobile
        return {
            x: 10,
            y: 10,
            width: Math.min(width * 0.4, 150),
            height: 80
        };
    } else {  // Desktop/Tablet
        return {
            x: 20,
            y: 20,
            width: 200,
            height: 120
        };
    }
}
```

**Collision Avoidance:**
- Top-left is safest (no game elements there)
- Header is outside canvas (separate DOM element)
- Pyramid starts at `startY` (calculated in buildLevel)
- Typical `startY` > 150px, so minimap won't overlap

### 4.3 Visual Design Details

**Container Styling:**
- Background: `rgba(0, 0, 0, 0.7)` - Semi-transparent black
- Border: `1px solid rgba(255, 255, 255, 0.2)` - Subtle white border
- Border radius: `6px` - Rounded corners
- Inner padding: `10px` - Space for content

**Bar Styling:**
- Color scheme matches multipliers:
  - High count: `#22c55e` (green) - center buckets
  - Low count: Same color but more transparent
- Bar spacing: `2px` gap between bars
- Width: `(mmWidth - innerPadding) / numBuckets`
- Max height: `mmHeight - 30px` (reserve space for labels)

**Text Labels (Optional Enhancement):**
- Total balls dropped: Top-left of minimap
- Font: `'Inter', sans-serif` (matches game)
- Size: `10px` to `12px`
- Color: `rgba(255, 255, 255, 0.8)`

## 5. Level Change & Reset Logic

### 5.1 Level Initialization Flow

**Function Call Chain:**
```
User clicks "Restart" button
  → restartGame() (line 605)
    → currentRows = parseInt(rowCount.value)
    → init() (line 244)
      → engine.clear() (clears physics)
      → buildLevel() (line 283)
        → Creates pegs, sensors
        → Sets customData = { gap, rows, mults, startY, pegRadius, numBuckets }
```

**Key Functions:**

1. **init()** (lines 244-281):
   - Called on first load and level change
   - Clears previous engine
   - Recalculates canvas dimensions
   - Creates new physics engine
   - Calls `buildLevel()`
   - Starts render loop

2. **buildLevel()** (lines 283-344):
   - Reads `currentRows` global variable
   - Gets multipliers: `mults = MULTIPLIERS[currentRows]`
   - Calculates layout: gap, startY, numBuckets
   - Creates pegs and sensors
   - Stores data: `customData = { ... }`

3. **restartGame()** (lines 605-608):
   - Updates `currentRows` from dropdown
   - Calls `init()` to rebuild everything

### 5.2 Histogram Reset Strategy

**When to Reset:**
- On every `buildLevel()` call
- When `numBuckets` changes
- When user clicks "Restart" button

**Implementation:**
```javascript
let histogramData = [];  // Global variable

function buildLevel() {
    // ... existing code to get mults
    const numBuckets = mults.length;
    
    // Reset histogram when level changes
    histogramData = new Array(numBuckets).fill(0);
    
    // ... rest of buildLevel code
}
```

**Edge Cases:**
- First load: `histogramData` starts empty, initialized in first `buildLevel()`
- Mid-game level change: All balls removed by `engine.clear()`, histogram resets
- Auto-drop mode: Must handle rapid ball additions

### 5.3 Data Persistence Considerations

**Current Behavior:**
- No persistence: Level change resets everything
- Balance persists (global variable)

**Minimap Behavior:**
- Should reset on level change (user expects fresh histogram)
- Should NOT reset during auto-drop (accumulate counts)
- Should animate bar growth smoothly

**Implementation Note:**
```javascript
// In handleCollision when ball lands:
if (sensor && ball.plugin.active) {
    const bucketIndex = sensor.plugin.bucketIndex;
    histogramData[bucketIndex]++;
    
    // Histogram will be drawn on next render frame
    // No manual trigger needed - render loop handles it
}
```

## 6. Code Modification Summary

### 6.1 Files to Modify

**Only 1 file needs changes:** `index.html`

### 6.2 Modification Points

**1. Global Variables (after line 241):**
```javascript
let histogramData = [];  // Track ball counts per bucket
```

**2. buildLevel() function (line 283):**
- Add after calculating `numBuckets`:
```javascript
histogramData = new Array(numBuckets).fill(0);
```

**3. Sensor Creation Loop (line 332-343):**
- Modify sensor plugin to include bucket index:
```javascript
sensor = new RigidBody('rectangle', x, bucketY, {
    // ... existing properties
    plugin: { 
        val: mults[i],
        bucketIndex: i  // ADD THIS
    },
    // ... rest
});
```

**4. handleCollision() function (line 524-543):**
- Add histogram update when ball lands:
```javascript
if (sensor && ball.plugin.active) {
    ball.plugin.active = false;
    const bucketIndex = sensor.plugin.bucketIndex;  // ADD THIS
    histogramData[bucketIndex]++;                   // ADD THIS
    
    // ... existing scoring code
}
```

**5. render() function (line 368):**
- Add minimap drawing AFTER physics bodies loop:
```javascript
function render() {
    // ... existing code
    
    engine.bodies.forEach(body => {
        // ... draw bodies
    });
    
    drawMinimap();  // ADD THIS LINE
}
```

**6. New Functions (add before render function, ~line 365):**
```javascript
function normalPDF(x, mean, stdDev) {
    const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
    return coefficient * Math.exp(exponent);
}

function getMinimapDimensions() {
    if (width < 480) {
        return { x: 10, y: 10, width: Math.min(width * 0.4, 150), height: 80 };
    }
    return { x: 20, y: 20, width: 200, height: 120 };
}

function drawMinimap() {
    if (!customData || histogramData.length === 0) return;
    
    const { numBuckets } = customData;
    const mm = getMinimapDimensions();
    const padding = 10;
    const innerWidth = mm.width - (padding * 2);
    const innerHeight = mm.height - (padding * 2);
    
    // Container
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.fillRect(mm.x, mm.y, mm.width, mm.height);
    ctx.strokeRect(mm.x, mm.y, mm.width, mm.height);
    
    // Normal distribution curve
    const mean = numBuckets / 2;
    const stdDev = Math.sqrt(numBuckets) / 2;
    const maxPDF = normalPDF(mean, mean, stdDev);
    
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i <= numBuckets * 2; i++) {
        const bucketPos = i / 2;
        const x = mm.x + padding + (bucketPos / numBuckets) * innerWidth;
        const pdfValue = normalPDF(bucketPos, mean, stdDev);
        const normalizedHeight = (pdfValue / maxPDF) * innerHeight;
        const y = mm.y + mm.height - padding - normalizedHeight;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Histogram bars
    const maxCount = Math.max(...histogramData, 1);
    const barWidth = innerWidth / numBuckets;
    
    for (let i = 0; i < numBuckets; i++) {
        const barHeight = (histogramData[i] / maxCount) * innerHeight;
        const x = mm.x + padding + (i * barWidth);
        const y = mm.y + mm.height - padding - barHeight;
        
        ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
        ctx.fillRect(x, y, barWidth - 2, barHeight);
    }
    
    // Total count label
    const totalBalls = histogramData.reduce((a, b) => a + b, 0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '600 11px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Balls: ${totalBalls}`, mm.x + padding, mm.y + padding);
}
```

### 6.3 Estimated Line Changes

- **New code:** ~90 lines (3 new functions)
- **Modified code:** ~5 lines (4 modification points)
- **Total impact:** ~95 lines
- **Files touched:** 1 (index.html)

### 6.4 Integration Complexity

**Low Complexity:**
- No external dependencies needed
- No physics engine changes
- No HTML/CSS structure changes
- Pure canvas rendering additions
- Minimal state management (one array)

**Risk Assessment:**
- **Breaking changes:** None (purely additive)
- **Performance impact:** Negligible (simple histogram drawing)
- **Testing scope:** Visual verification only

## 7. Visual Design Mockup

### 7.1 Desktop View (1920×1080)
```
┌─────────────────────────────────────────────────────────────┐
│ PLINKOSIM                                    Balance: $10,000│
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────┐                                             │
│ │ Balls: 47    │                                             │
│ │              │                                             │
│ │    ╱‾‾‾╲     │  ← Normal curve (white, transparent)      │
│ │  ╱      ╲    │                                             │
│ │ ││█││█││█││█││  ← Histogram bars (green)                  │
│ └──────────────┘                                             │
│                                                               │
│                     ●  ← Ball                                │
│                  ●  ●  ●  ← Pegs                            │
│                ●  ●  ●  ●  ●                                 │
│              ●  ●  ●  ●  ●  ●  ●                             │
│             [5x][2x][1x][2x][5x]  ← Buckets                 │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Mobile View (414×896)
```
┌──────────────────────────┐
│ PLINKOSIM    Balance: $10K│
├──────────────────────────┤
│ ┌───────┐                │
│ │ B: 12 │  ← Smaller     │
│ │  ╱╲   │                │
│ │ │││││ │                │
│ └───────┘                │
│                          │
│         ●                │
│       ●  ●  ●            │
│     [2x][1x][2x]         │
└──────────────────────────┘
```

## 8. Success Criteria

### 8.1 Functional Requirements
✅ Minimap appears in top-left corner
✅ Shows bar chart with correct number of bars (matches buckets)
✅ Bars increment when balls land in buckets
✅ Normal distribution curve rendered as background
✅ Histogram resets when level changes (8→12→16 rows)
✅ Responsive sizing on mobile/tablet/desktop
✅ Doesn't obscure game elements

### 8.2 Visual Requirements
✅ Semi-transparent background for visibility
✅ Bars color-coded (green for frequency)
✅ Curve is subtle, doesn't overpower bars
✅ Total ball count displayed
✅ Smooth rendering (no flicker)

### 8.3 Performance Requirements
✅ No frame rate impact (<1ms per frame for minimap)
✅ Handles rapid ball drops (auto-drop mode)
✅ Memory efficient (single array, ~16 elements max)

## 9. Testing Checklist

### 9.1 Functional Tests
- [ ] Load game → minimap appears with empty histogram
- [ ] Drop 1 ball → correct bar increments
- [ ] Drop 10 balls → all bars update correctly
- [ ] Change from 12 rows to 8 rows → histogram resets, shows 7 bars
- [ ] Change from 8 rows to 16 rows → histogram resets, shows 15 bars
- [ ] Enable auto-drop → bars accumulate smoothly
- [ ] Normal curve matches bucket count (shifts shape for 7 vs 15 buckets)

### 9.2 Visual Tests
- [ ] Desktop (1920×1080): Minimap clearly visible, doesn't block pyramid
- [ ] Laptop (1366×768): Minimap scales appropriately
- [ ] Tablet portrait (768×1024): Minimap smaller but readable
- [ ] Mobile (414×896): Minimap condensed, still functional

### 9.3 Edge Cases
- [ ] Zero balls dropped: Empty histogram shows scale
- [ ] One bucket gets 100 balls, others get 0: Bar maxes out, others at floor
- [ ] Rapid auto-drop (5 balls/sec): No visual lag or missing increments
- [ ] Resize window mid-game: Minimap repositions correctly

## 10. Future Enhancements (Out of Scope)

These are NOT part of the current implementation but documented for future reference:

1. **Animated Bar Growth:** Smooth transition when count increases (CSS-like animation)
2. **Color-Coded Bars:** Match multiplier colors (red for high mult buckets)
3. **Statistics Panel:** Show mean, median, standard deviation
4. **Comparison Line:** Expected vs actual distribution overlay
5. **Minimap Toggle:** Button to show/hide minimap
6. **Minimap Dragging:** Let user reposition minimap
7. **Export Data:** CSV download of histogram data
8. **Historical View:** Track distribution across multiple level resets

---

**End of Context Documentation**
**Next Step:** Create MINIMAP_FEATURE_PLAN.md with implementation phases

