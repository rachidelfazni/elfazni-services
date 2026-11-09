# ELFAZNI SERVICES — Performance Optimization Changelog

This document tracks all source code, build configuration, and infrastructure modifications implemented during the comprehensive performance optimization pass.

---

## 1. Video & Media Optimization

### `src/components/PromoVideoSection.tsx`
- **IntersectionObserver Viewport Lifecycle**: Implemented viewport tracking using `IntersectionObserver` with a threshold of `0.25` and root margin of `100px`.
  - Automatically starts playback only when the user scrolls near the section.
  - Automatically pauses video decoding and playback when the section leaves the viewport, freeing GPU memory and CPU cycles.
- **Smart Mobile Guard**: Added detection for mobile viewports (`window.innerWidth < 768` or touch devices). Autoplay is suppressed on mobile devices, displaying a crisp poster image and play button so that zero video bytes are streamed without user consent.
- **Poster & Preload**:
  - Added `poster="/assets/slides/10-all-services.webp"` (213 KB crisp slide).
  - Configured `preload="none"`, preventing the browser from pre-buffering 48.87 MB of video data during initial HTML rendering.

---

## 2. Hero Visual & LCP Acceleration

### `src/components/Hero.tsx`
- **Aspect Ratio Locking**: Added explicit `width={480}` and `height={540}` attributes to the hero graphic (`/assets/phone-services-transparent.webp`).
- **Asynchronous Decoding**: Added `decoding="async"` to prevent image decoding from blocking the main thread.
- **Fetch Priority**: Retained `fetchPriority="high"` for prioritized download scheduling.

### `index.html`
- **Hero Image Preload**: Added high-priority image preloading in `<head>`:
  ```html
  <link rel="preload" href="/assets/phone-services-transparent.webp" as="image" type="image/webp" fetchpriority="high" />
  ```
- **Non-Render-Blocking Google Fonts**:
  - Replaced synchronous `<link rel="stylesheet">` tags with the asynchronous print media pattern:
    ```html
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=..." media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=..." /></noscript>
    ```
  - Removed duplicate external font requests for Plus Jakarta Sans.

---

## 3. Code-Splitting & Route Splitting

### `src/components/admin/AdminLayout.tsx`
- Converted all 10 heavy administrative sub-modules to dynamic `React.lazy()` imports:
  - `AdminUsers`
  - `AdminAnalytics`
  - `AdminLiveChat`
  - `AdminMailbox`
  - `AdminSiteEditor`
  - `AdminServicesEditor`
  - `AdminProfileSettings`
  - `AdminSeoManager`
  - `AdminBlogCms`
  - `AdminThemeManager`
- Wrapped the tab stage in `<React.Suspense>` with a branded fallback spinner.
- **Result**: Admin entry bundle shrank from 797 KB down to **38.87 KB** (9.95 KB gzipped), saving over 92% of upfront transfer.

### `crm/src/components/workspace/WorkspaceNavbar.tsx`
- Converted `CalendarWorkspace` (which bundles FullCalendar, World Geo-Analytics, Notebook, and Tasks) to `React.lazy()`.
- Deferred instantiation until `workspace.open` evaluates to `true`.
- **Result**: Removed 212.28 KB of JavaScript from the initial CRM dashboard load.

---

## 4. Vite Build & Vendor Chunking

### `vite.config.ts` (Main Portal)
- Configured Rollup `manualChunks` to isolate long-term cached vendor libraries:
  - `vendor-react`: React, React-DOM, Scheduler
  - `vendor-motion`: Framer-motion, Motion
  - `vendor-lucide`: Lucide-React
- Enabled `cssCodeSplit: true` and set `chunkSizeWarningLimit: 650`.

### `crm/vite.config.ts` (CRM Portal)
- Mirroring vendor chunking strategy for `vendor-react`, `vendor-motion`, and `vendor-lucide`.
- Enabled `cssCodeSplit: true`.

---

## 5. Server Static File Caching

### `server.ts`
- **1-Year Immutable Caching for Production Bundles**:
  - Hashed assets (`.js`, `.css`, `.webp`, `.png`, `.ttf`) are served with `Cache-Control: public, max-age=31536000, immutable`.
  - HTML entrypoints (`index.html`) are served with `Cache-Control: public, max-age=0, must-revalidate` to ensure immediate deployment propagation.
- **CRM Static Caching**:
  - CRM hashed assets served with `maxAge: '1y', immutable: true`.
- **User Uploads**:
  - Configured 30-day client caching for `/uploads`.

---

## 6. Dependency & DevOps Readiness

### `package.json`
- Relocated `tsx` and `typescript` from `devDependencies` into `dependencies` to allow Node servers to run `npm start` in production without requiring full devDependencies.
