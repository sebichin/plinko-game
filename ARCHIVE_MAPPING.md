# Archive Mapping Guide

**Archive Location:** `docs/archive/`  
**Total Documents:** 6  
**Total Size:** 3,896 lines  
**Date Archived:** November 28, 2025  

---

## Overview

This guide provides comprehensive mapping of all archived documentation. Each document pair (CONTEXT + PLAN) represents a complete feature development lifecycle from research through implementation.

---

## Document Pairs

### 1. Audio Bug Fix
- **Context:** `docs/archive/BUG_FIX_CONTEXT.md`
- **Plan:** `docs/archive/BUG_FIX_PLAN.md`
- **Total Size:** 970 lines
- **Relationship:** Context feeds directly into Plan

### 2. Viewport Scaling Fix
- **Context:** `docs/archive/VIEWPORT_FIX_CONTEXT.md`
- **Plan:** `docs/archive/VIEWPORT_FIX_PLAN.md`
- **Total Size:** 1,216 lines
- **Relationship:** Context feeds directly into Plan

### 3. Minimap Histogram Feature
- **Context:** `docs/archive/MINIMAP_FEATURE_CONTEXT.md`
- **Plan:** `docs/archive/MINIMAP_FEATURE_PLAN.md`
- **Total Size:** 1,709 lines
- **Relationship:** Context feeds directly into Plan

---

## Detailed File Mapping

## 1. BUG_FIX_CONTEXT.md

**Full Path:** `j:\Coding stuff\github\plinko_game\docs\archive\BUG_FIX_CONTEXT.md`  
**Size:** 464 lines  
**Date Created:** November 27, 2025  
**Status:** COMPLETED  

### Purpose
Research document analyzing collision audio bug where sound played continuously during ball-peg contact instead of once per collision.

### Key Sections
- **Lines 1-50:** Problem statement and symptoms
- **Lines 51-150:** Root cause analysis (Matter.js collision events)
- **Lines 151-250:** Solution exploration (velocity threshold approach)
- **Lines 251-350:** Implementation considerations
- **Lines 351-464:** Testing strategy and success criteria

### Key Findings
- **Root Cause:** Matter.js fires collisionActive events every frame
- **Solution:** Velocity-based threshold (50 px/s)
- **Formula:** `Math.sqrt(vx² + vy²)`
- **Testing Range:** Tried 100-150 px/s, settled on 50 px/s

### Cross-References
- **Feeds Into:** BUG_FIX_PLAN.md
- **Related Code:** index.html handleCollision() function
- **Commit:** Audio fix commit (pre-minimap)

### Usage Notes
- Read first when understanding audio system
- Contains collision physics primer
- Velocity threshold rationale explained
- Good reference for future audio features

---

## 2. BUG_FIX_PLAN.md

**Full Path:** `j:\Coding stuff\github\plinko_game\docs\archive\BUG_FIX_PLAN.md`  
**Size:** 506 lines  
**Date Created:** November 27, 2025  
**Status:** COMPLETED (30 minutes actual time)  

### Purpose
Step-by-step implementation guide for collision audio bug fix. Designed for developer to follow without additional context.

### Key Sections
- **Lines 1-100:** Overview, time estimates, prerequisites
- **Lines 101-200:** Phase 1-2 (threshold implementation, initial testing)
- **Lines 201-350:** Phase 3-4 (edge cases, code review)
- **Lines 351-450:** Phase 5 (documentation, git commit)
- **Lines 451-506:** Success criteria and troubleshooting

### Implementation Phases
1. **Phase 1:** Add velocity threshold check (10 min)
2. **Phase 2:** Test with auto-drop (5 min)
3. **Phase 3:** Edge case validation (5 min)
4. **Phase 4:** Code review (5 min)
5. **Phase 5:** Documentation (5 min)

### Code Changes
- **File Modified:** index.html
- **Lines Changed:** ~10 lines
- **Function:** handleCollision()
- **Addition:** Velocity calculation and threshold check

### Cross-References
- **Based On:** BUG_FIX_CONTEXT.md
- **Related Code:** index.html lines ~250-265
- **See Also:** PROJECT_TIMELINE.md Phase 1

### Usage Notes
- Read after BUG_FIX_CONTEXT.md
- Follow phases sequentially
- Time estimates proved accurate
- Troubleshooting guide at end

---

## 3. VIEWPORT_FIX_CONTEXT.md

**Full Path:** `j:\Coding stuff\github\plinko_game\docs\archive\VIEWPORT_FIX_CONTEXT.md`  
**Size:** 556 lines  
**Date Created:** November 27, 2025  
**Status:** COMPLETED  

### Purpose
Research document analyzing viewport scaling issue where peg board was cut off on all screen sizes. Most complex bug requiring dual-constraint solution.

### Key Sections
- **Lines 1-100:** Problem statement, symptoms across devices
- **Lines 101-200:** Initial hypothesis (gap cap issue)
- **Lines 201-300:** Root cause analysis (missing height consideration)
- **Lines 301-400:** Dual-constraint approach development
- **Lines 401-500:** Mathematical validation
- **Lines 501-556:** Testing strategy

### Key Findings
- **Root Cause:** Gap capped at 50px + height not considered
- **Solution:** Dual-constraint gap calculation
- **Formula:** `gap = min(widthBasedGap, heightBasedGap)`
- **Vertical Space:** `(rows + 2.8) × gap`
- **Gap Range:** 25-65px bounds

### Mathematical Analysis
```javascript
widthBasedGap = availableWidth / (numBuckets + 3)
heightBasedGap = availableHeight / (rows + 2.8)
finalGap = Math.max(25, Math.min(65, min(widthBasedGap, heightBasedGap)))
```

### Cross-References
- **Feeds Into:** VIEWPORT_FIX_PLAN.md
- **Related Code:** index.html buildLevel() function
- **See Also:** Responsive design section in DOCUMENTATION.md

### Usage Notes
- Most complex research document
- Read when modifying layout/scaling
- Contains viewport constraint theory
- Mathematical proofs included

---

## 4. VIEWPORT_FIX_PLAN.md

**Full Path:** `j:\Coding stuff\github\plinko_game\docs\archive\VIEWPORT_FIX_PLAN.md`  
**Size:** 660 lines  
**Date Created:** November 27, 2025  
**Status:** COMPLETED (2 hours actual time)  

### Purpose
Comprehensive implementation guide for viewport scaling fix. Most detailed plan document with extensive device testing requirements.

### Key Sections
- **Lines 1-100:** Overview, time estimates (2 hours), file inventory
- **Lines 101-200:** Phase 1-2 (viewport tracking, height calculation)
- **Lines 201-350:** Phase 3-4 (dual-constraint logic, responsive testing)
- **Lines 351-500:** Phase 5-6 (cross-device validation, documentation)
- **Lines 501-660:** Troubleshooting, success criteria, testing matrix

### Implementation Phases
1. **Phase 1:** Add viewport height tracking (15 min)
2. **Phase 2:** Implement heightBasedGap (20 min)
3. **Phase 3:** Apply dual-constraint selection (15 min)
4. **Phase 4:** Test responsive behavior (30 min)
5. **Phase 5:** Cross-device validation (30 min)
6. **Phase 6:** Documentation (10 min)

### Testing Requirements
- **Desktop:** 1920×1080, 1366×768, 1280×720
- **Laptop:** 1440×900, 1280×800
- **Tablet:** 768×1024, 1024×768
- **Mobile:** 375×667, 414×896, 360×740

### Code Changes
- **File Modified:** index.html
- **Lines Changed:** ~15 lines
- **Function:** buildLevel()
- **Addition:** heightBasedGap calculation, min() logic

### Cross-References
- **Based On:** VIEWPORT_FIX_CONTEXT.md
- **Related Code:** index.html lines ~350-380
- **See Also:** PROJECT_TIMELINE.md Phase 2

### Usage Notes
- Read after VIEWPORT_FIX_CONTEXT.md
- Extensive testing matrix included
- Device-specific gap values documented
- Most complex implementation of three features

---

## 5. MINIMAP_FEATURE_CONTEXT.md

**Full Path:** `j:\Coding stuff\github\plinko_game\docs\archive\MINIMAP_FEATURE_CONTEXT.md`  
**Size:** 848 lines  
**Date Created:** November 27, 2025  
**Date Completed:** November 28, 2025  
**Status:** COMPLETED  

### Purpose
Most comprehensive research document. Complete analysis of minimap histogram feature including mathematical foundations, responsive design, and implementation architecture.

### Key Sections
- **Lines 1-100:** Feature requirements, user experience goals
- **Lines 101-200:** Histogram architecture and data structures
- **Lines 201-350:** Normal distribution mathematics (PDF formula)
- **Lines 351-500:** Responsive design strategy (4 breakpoints)
- **Lines 501-650:** Rendering pipeline design
- **Lines 651-750:** Performance considerations
- **Lines 751-848:** Implementation results and validation

### Mathematical Content
**Normal Distribution PDF:**
```
f(x) = (1/(σ√(2π))) × e^(-((x-μ)²)/(2σ²))

Where:
- μ = mean (center bucket)
- σ = sqrt(rows × p × (1-p)) for binomial
- p = 0.5 (50% left/right probability)
```

### Responsive Design
- **Desktop:** 200×120px (>1200px width)
- **Laptop:** 180×100px (768-1200px)
- **Tablet:** 160×90px (480-768px)
- **Mobile:** 150×80px (<480px)

### Architecture Decisions
1. **Data Structure:** Simple array `histogramData[]`
2. **Storage Location:** Sensor plugin `bucketIndex` property
3. **Update Trigger:** handleCollision() function
4. **Render Function:** Separate drawMinimap() function
5. **Position:** Top-left, 10px padding

### Cross-References
- **Feeds Into:** MINIMAP_FEATURE_PLAN.md
- **Related Code:** index.html lines ~450-578
- **See Also:** DOCUMENTATION.md minimap section
- **Commit:** 0b065f4 (implementation), 3f1ccbb (docs)

### Usage Notes
- Largest context document (848 lines)
- Read when modifying minimap or adding statistics
- Contains complete math derivations
- Implementation results at end

---

## 6. MINIMAP_FEATURE_PLAN.md

**Full Path:** `j:\Coding stuff\github\plinko_game\docs\archive\MINIMAP_FEATURE_PLAN.md`  
**Size:** 861 lines  
**Date Created:** November 27, 2025  
**Date Completed:** November 28, 2025  
**Status:** COMPLETED (2 hours actual time)  

### Purpose
Most detailed implementation guide. Provides complete step-by-step instructions for minimap implementation with extensive code examples and troubleshooting.

### Key Sections
- **Lines 1-100:** Overview, time estimate (2-3 hours), status (COMPLETED)
- **Lines 101-200:** Phase 1-2 (preparation, data structures)
- **Lines 201-350:** Phase 3-4 (ball tracking, rendering functions)
- **Lines 351-500:** Phase 5-6 (integration, testing)
- **Lines 501-650:** Phase 7-8 (code review, documentation)
- **Lines 651-750:** Phase 9 (final validation)
- **Lines 751-861:** Troubleshooting guide, success metrics

### Implementation Phases
1. **Phase 1:** Preparation & setup (15 min)
2. **Phase 2:** Add data structures (10 min)
3. **Phase 3:** Track ball landings (15 min)
4. **Phase 4:** Add rendering functions (30 min)
5. **Phase 5:** Integrate minimap (10 min)
6. **Phase 6:** Testing & verification (45 min)
7. **Phase 7:** Code review & cleanup (15 min)
8. **Phase 8:** Documentation & git commit (15 min)
9. **Phase 9:** Final validation (10 min)

### Code Changes
- **File Modified:** index.html
- **Lines Added:** ~128 lines
- **Lines Modified:** ~5 lines
- **Functions Added:** 
  - normalPDF() (~15 lines)
  - getMinimapDimensions() (~20 lines)
  - drawMinimap() (~90 lines)
- **Modified Functions:**
  - handleCollision() (+3 lines for histogram increment)
  - render() (+1 line for drawMinimap call)

### Function Descriptions

**normalPDF(x, mean, stdDev)**
- Purpose: Calculate bell curve height
- Parameters: x position, mean, standard deviation
- Returns: Normalized probability (0-1)
- Lines: ~15

**getMinimapDimensions()**
- Purpose: Calculate responsive minimap size
- Returns: {width, height, x, y}
- Breakpoints: 4 (desktop, laptop, tablet, mobile)
- Lines: ~20

**drawMinimap()**
- Purpose: Complete rendering pipeline
- Steps:
  1. Calculate dimensions
  2. Draw container background
  3. Draw normal distribution curve
  4. Draw histogram bars
  5. Draw total count label
- Lines: ~90

### Testing Matrix
**Functional Testing:**
- ✅ Histogram increments on ball landing
- ✅ Level change resets histogram
- ✅ Auto-drop mode updates correctly
- ✅ Total count displays accurately

**Visual Testing:**
- ✅ Desktop (>1200px): 200×120px
- ✅ Laptop (768-1200px): 180×100px
- ✅ Tablet (480-768px): 160×90px
- ✅ Mobile (<480px): 150×80px

**Performance Testing:**
- ✅ Frame rate: 60 FPS maintained
- ✅ Render overhead: <0.3ms
- ✅ Memory: No leaks detected

**Cross-Browser Testing:**
- ✅ Chrome: Perfect rendering
- ✅ Firefox: Perfect rendering
- ✅ Safari: Perfect rendering

### Troubleshooting Guide
**Issue 1:** Minimap not appearing
- Check: drawMinimap() call in render()
- Check: Function definitions present

**Issue 2:** Histogram bars not incrementing
- Check: handleCollision() histogram update
- Check: bucketIndex property on sensor

**Issue 3:** Normal curve not displaying
- Check: normalPDF() calculations
- Check: stdDev not zero or NaN

**Issue 4:** Minimap wrong size on mobile
- Check: getMinimapDimensions() breakpoints
- Check: canvas.width value

**Issue 5:** Performance lag
- Check: Render time (should be <0.5ms)
- Check: Unnecessary redraws

### Cross-References
- **Based On:** MINIMAP_FEATURE_CONTEXT.md
- **Related Code:** index.html lines ~450-578
- **See Also:** PROJECT_TIMELINE.md Phase 3
- **Commits:** 0b065f4, 3f1ccbb

### Usage Notes
- Largest plan document (861 lines)
- Read after MINIMAP_FEATURE_CONTEXT.md
- Most detailed code examples
- Comprehensive troubleshooting guide
- Follow phases sequentially for best results

---

## Cross-Reference Matrix

| From Document | To Document | Relationship |
|--------------|-------------|--------------|
| BUG_FIX_CONTEXT.md | BUG_FIX_PLAN.md | Research → Implementation |
| BUG_FIX_PLAN.md | index.html | Plan → Code |
| VIEWPORT_FIX_CONTEXT.md | VIEWPORT_FIX_PLAN.md | Research → Implementation |
| VIEWPORT_FIX_PLAN.md | index.html | Plan → Code |
| MINIMAP_FEATURE_CONTEXT.md | MINIMAP_FEATURE_PLAN.md | Research → Implementation |
| MINIMAP_FEATURE_PLAN.md | index.html | Plan → Code |
| All CONTEXT docs | DOCUMENTATION.md | Research → Public Docs |
| All PLAN docs | Git Commits | Implementation → Version Control |

---

## Reading Recommendations

### For New Developers
**Start Here:**
1. Read PROJECT_TIMELINE.md (this gives chronological overview)
2. Read this ARCHIVE_MAPPING.md (understand document structure)
3. Pick a feature that interests you
4. Read CONTEXT document for that feature
5. Read PLAN document for implementation details
6. Review related code in index.html

### For Maintenance Work
**Modifying Existing Features:**
1. Identify feature (audio, viewport, minimap)
2. Read CONTEXT doc to understand design rationale
3. Read PLAN doc to see implementation details
4. Make changes with full context

### For New Features
**Adding Similar Features:**
1. Review all CONTEXT docs for architectural patterns
2. Review all PLAN docs for methodology
3. Follow same Research → Plan → Implement → Test → Document workflow
4. Create new CONTEXT and PLAN documents

### For Bug Investigation
**Troubleshooting Issues:**
1. Identify affected system (audio, layout, statistics)
2. Read relevant CONTEXT doc for system understanding
3. Check PLAN doc troubleshooting section
4. Review implementation in index.html

---

## Document Statistics

### By Type
- **Context Documents:** 3 files, 1,868 lines (48%)
- **Plan Documents:** 3 files, 2,028 lines (52%)

### By Feature
- **Audio Bug Fix:** 970 lines (25%)
- **Viewport Fix:** 1,216 lines (31%)
- **Minimap Feature:** 1,709 lines (44%)

### Content Distribution
- **Research/Analysis:** ~40% (1,558 lines)
- **Implementation Plans:** ~35% (1,364 lines)
- **Testing/Validation:** ~15% (584 lines)
- **Documentation/Meta:** ~10% (390 lines)

---

## Maintenance Guidelines

### Updating Archive
When adding new features:
1. Create FEATURE_CONTEXT.md (research phase)
2. Create FEATURE_PLAN.md (planning phase)
3. Move to docs/archive/ after completion
4. Update this ARCHIVE_MAPPING.md
5. Update PROJECT_TIMELINE.md

### Preserving Context
Do NOT delete archived documents:
- They preserve design rationale
- They explain "why" not just "what"
- They prevent repeated mistakes
- They accelerate onboarding

### Document Naming Convention
Follow established pattern:
- **Format:** `FEATURE_TYPE.md`
- **Types:** CONTEXT, PLAN
- **Examples:** 
  - NEW_FEATURE_CONTEXT.md
  - NEW_FEATURE_PLAN.md

---

## Archive Access

### Physical Location
```
j:\Coding stuff\github\plinko_game\docs\archive\
├── BUG_FIX_CONTEXT.md
├── BUG_FIX_PLAN.md
├── VIEWPORT_FIX_CONTEXT.md
├── VIEWPORT_FIX_PLAN.md
├── MINIMAP_FEATURE_CONTEXT.md
└── MINIMAP_FEATURE_PLAN.md
```

### Git History
All documents have full git history:
- View with: `git log --follow docs/archive/FILENAME.md`
- Original commits preserved
- Move operation tracked

### Related Files
- **PROJECT_TIMELINE.md** - Chronological project history
- **DOCUMENTATION.md** - User-facing documentation
- **README.md** - Project overview
- **index.html** - All implementations

---

## Quick Reference

**Fastest way to find information:**

| Question | Document |
|----------|----------|
| Why was this feature built? | CONTEXT doc |
| How was it implemented? | PLAN doc |
| What code was changed? | PLAN doc (code changes section) |
| When was it built? | PROJECT_TIMELINE.md |
| Where is the code? | index.html + line numbers in PLAN |
| Who did it? | Git commit history |

**Common Scenarios:**

| Scenario | Action |
|----------|--------|
| Feature not working | Read PLAN troubleshooting section |
| Need to modify feature | Read CONTEXT for design rationale |
| Adding similar feature | Review CONTEXT + PLAN for patterns |
| Onboarding developer | Start with PROJECT_TIMELINE.md |
| Code review | Check PLAN for intended design |
| Performance issue | Review CONTEXT performance sections |

---

**Archive Mapping Complete**  
**Generated:** November 28, 2025  
**Last Updated:** November 28, 2025  
**Total Documents Mapped:** 6  
**Total Context Preserved:** 3,896 lines
