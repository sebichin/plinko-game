# Short Term Project Memory

## Current Context
- **Phase:** Fix Deployment.
- **Issue:** GitHub Pages shows README only.
- **Cause:** Workflow deploys `.` (root), but `index.html` is now in `src/` and the build output is in `dist/`. The project now requires a build step.

## Solution Plan
1.  **Update Workflow:** Modify `.github/workflows/pages.yml`.
2.  **Add Build Steps:**
    - `actions/setup-node`
    - `npm ci`
    - `npm run build`
3.  **Update Artifact Path:** Change `path: '.'` to `path: './dist'`.
