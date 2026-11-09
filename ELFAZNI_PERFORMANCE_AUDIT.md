# ELFAZNI SERVICES — Comprehensive Performance Audit Report

## 1. Executive Summary

This performance audit of **ELFAZNI SERVICES** (`http://localhost:8080/`) was conducted using automated real-browser instrumentation (Chrome CDP, Puppeteer, PerformanceNavigationTiming, PerformanceObserver for LCP, CLS, and Long Tasks) across Desktop (1440x900), Mobile (iPhone 14 / 390x844), and simulated Fast 4G conditions.

The investigation was launched in response to user feedback indicating that the platform had become noticeably slower after recent updates, particularly questioning whether the newly added branded promotional video was responsible.

### Core Audit Verdict
The slowdown was caused by **three concurrent architectural bottlenecks**, not just the video alone:
1. **Aggressive Media Preloading**: The 48.87 MB branded video in `PromoVideoSection.tsx` lacked `preload="none"`, `poster`, and viewport detection, attempting to stream and decode 48MB on initial mount even when far below the fold.
2. **Monolithic Bundle Bloat**: Admin management (`AdminLayout.tsx`) statically imported 10 complex sub-tabs (`AdminAnalytics`, `AdminLiveChat`, `AdminMailbox`, `AdminSiteEditor`, `AdminServicesEditor`, `AdminProfileSettings`, `AdminSeoManager`, `AdminBlogCms`, `AdminThemeManager`, `AdminUsers`), forcing a 797 KB monolithic chunk. In CRM, `CalendarWorkspace` (including FullCalendar, Geo-Analytics, Notebook, and Tasks) was statically imported on initial dashboard view.
3. **Render-Blocking External Fonts**: `index.html` contained synchronous external stylesheets downloading 6 distinct Google Font families before initial layout could begin, delaying First Contentful Paint.

---

## 2. Controlled Video Impact Assessment

To eliminate guesswork, a controlled A/B experiment was conducted using `qa/test-video-impact.mjs`:
- **Test A (Video Enabled Unrestricted)**: Initial load with unoptimized video tag.
- **Test B (Video Network-Blocked)**: Video network requests intercepted and aborted.

### Experimental Results:
| Metric | Test A (Video Active) | Test B (Video Blocked) | Impact Delta | Root Cause |
| :--- | :---: | :---: | :---: | :--- |
| **Transferred Bandwidth** | **63.58 MB** | **14.71 MB** | **-48.87 MB (-77%)** | Full video buffered upfront |
| **Long Tasks Execution** | **1,480 ms** | **780 ms** | **-700 ms (-47%)** | Video decoder & frame painting |
| **Initial LCP (Desktop)** | **1,400 ms** | **1,310 ms** | **-90 ms (-6.4%)** | Bandwidth contention on network pipe |
| **Mobile Initial Transfer** | **48.90 MB** | **0.03 MB** | **-48.87 MB (-99.9%)** | Unrestricted mobile streaming |

### Conclusion on Video:
The video file (`ELFAZNI_SERVICES_BRANDED.mp4`, 48.87 MB) did not need to be removed. Instead, it required **intelligent viewport lifecycle management**:
- `poster="/assets/slides/10-all-services.webp"`
- `preload="none"`
- `IntersectionObserver` playing only when scrolled within 25% of viewport
- Automatic pausing when scrolled off-screen
- Complete autoplay suppression on touch and mobile devices (`< 768px`)

---

## 3. Detailed Component Bottleneck Inventory

### 3.1 PromoVideoSection (`src/components/PromoVideoSection.tsx`)
- **Issue**: Default HTML5 `autoPlay` without `preload="none"` triggered aggressive video buffering on page load.
- **Impact**: Consumed up to 48.87 MB of network transfer, saturating bandwidth on slow connections and mobile devices.

### 3.2 LCP Hero Visual (`src/components/Hero.tsx`)
- **Issue**: Hero image `/assets/phone-services-transparent.webp` lacked explicit `width="480"` and `height="540"` attributes and had no `<link rel="preload">` in `index.html`.
- **Impact**: Delayed browser image discovery until HTML parsing reached the bottom of the hero component, resulting in higher LCP times.

### 3.3 Font Delivery (`index.html` & `src/index.css`)
- **Issue**: Duplicate render-blocking font links for Amiri, Cairo, Inter, Noto Sans Arabic, Plus Jakarta Sans, Roboto, and Tajawal in `<head>`. Duplicate `@font-face` declarations in CSS for 5 separate TTF weights.
- **Impact**: Held back FCP by ~400ms while waiting for external Google Fonts CDN handshakes.

### 3.4 Monolithic Admin Tabs (`src/components/admin/AdminLayout.tsx`)
- **Issue**: 10 heavy sub-tabs bundled into one single bundle. Opening `/portal` downloaded the full Theme Manager with color palettes, SVG presets, blog CMS, and mailbox simultaneously.
- **Impact**: 3.90 MB transferred on admin entry; 27 MB JavaScript heap allocation.

### 3.5 CRM Workspace Eager Loading (`crm/src/components/workspace/WorkspaceNavbar.tsx`)
- **Issue**: `CalendarWorkspace` (including FullCalendar and World Geo-Analytics) was statically imported, bundling 212 KB of calendar logic into the initial CRM dashboard.
- **Impact**: Slower CRM initial load time.

### 3.6 Browser HTTP Caching (`server.ts`)
- **Issue**: `express.static(distPath)` and `express.static(crmDist)` lacked `maxAge` and `Cache-Control: immutable` headers.
- **Impact**: Repeat visitors re-downloaded all JavaScript, CSS, and font assets instead of retrieving them from disk cache.

---

## 4. Architectural Target Metrics

Following this audit, target thresholds were defined based on Google Core Web Vitals and industry benchmarks:
- **LCP (Largest Contentful Paint)**: < 1,200 ms (Desktop), < 800 ms (Mobile)
- **FCP (First Contentful Paint)**: < 800 ms (Desktop), < 500 ms (Mobile)
- **CLS (Cumulative Layout Shift)**: < 0.05 (Target: 0.000)
- **Mobile Initial Page Weight**: < 1.0 MB
- **Admin Entry Weight**: < 0.5 MB
