# Short Term Project Memory

## Current Context
- **Phase:** Phase 1 - Initialization.
- **Task:** Initialize Build System (Vite + Tailwind).

## Detailed Steps
1.  **Dependencies:** Add `vite`, `tailwindcss`, `postcss`, `autoprefixer` to `package.json`.
2.  **Configs:**
    - `vite.config.js`: Set root to `src`, outDir to `../dist`.
    - `tailwind.config.js`: Scan `src/**/*.js`.
    - `postcss.config.js`: Load tailwind and autoprefixer.
3.  **Styles:** Create `src/style.css` with `@tailwind base; @tailwind components; @tailwind utilities;`.
