# ELFAZNI SERVICES — Resizable Layout Architecture & Implementation Specification

**Platform:** ELFAZNI SERVICES Multi-Workspace Ecosystem  
**Target:** Desktop-Grade Web Workspace Architecture  
**Document Version:** 1.0  
**Specification Owner:** Senior Full-Stack Engineer, Desktop Application UX Architect, React/TypeScript Developer  

---

## 1. Architectural Architecture Overview

The ELFAZNI SERVICES Resizable Layout System is a modular, high-performance, accessible panel-management architecture built specifically to deliver a native desktop application experience in modern web browsers.

### Component Taxonomy:
```
src/components/workspace/ (and crm/src/components/workspace/resizable/)
├── types.ts                   -> Core TypeScript interfaces & types
├── layoutPreferences.ts       -> Persistence, clamping & scoping engine
├── resizable.css              -> Desktop workspace styling & tokens
├── ResizeHandle.tsx           -> Pointer-capture draggable boundary separator
├── ResizablePanel.tsx         -> Isolated flex container with min-w-0
├── WorkspaceShell.tsx         -> Multi-panel layout orchestrator & context provider
├── WindowControls.tsx         -> Desktop controls (Maximize, Save, Reset, Collapse)
├── UnsavedChangesGuard.tsx    -> Dirty-state data protection modal
├── WorkspaceTabs.tsx          -> Multi-document tab bar with dirty indicators
└── index.ts                   -> Clean public export interface
```

---

## 2. Interaction & Event Model

### 2.1. Pointer Events & Pointer Capture
Traditional HTML mouse drag handlers suffer from cursor escape when the user drags quickly across iframe boundaries or off-screen. The ELFAZNI `ResizeHandle` solves this using the W3C Pointer Events API:

```typescript
const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
  if (disabled || e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();

  const target = e.currentTarget;
  target.setPointerCapture(e.pointerId);

  dragStartPosRef.current = isHorizontal ? e.clientX : e.clientY;
  setIsDragging(true);

  if (typeof document !== 'undefined') {
    document.body.classList.add('ws-resizing-active');
  }
};
```

When pointer capture is active, the handle element continues receiving all `pointermove` and `pointerup` events regardless of where the cursor travels, ensuring zero event loss.

### 2.2. Comfortable Hit Area with Subtle Visual Indicator
To ensure effortless grabbing without visual clutter:
- **Interaction Hit Area:** `8px` to `12px` transparent clickable boundary.
- **Visual Indicator:** `2px` crisp border line (`bg-slate-200`).
- **Active / Hover Glowing State:** Transitions to Royal Blue (`#004AA5`) with subtle box-shadow glow.
- **Cursor Indicators:** `col-resize` for horizontal separators; `row-resize` for vertical separators.

```css
.ws-resize-handle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  user-select: none;
  z-index: 25;
}

.ws-resize-handle-horizontal {
  width: 10px;
  cursor: col-resize;
  margin: 0 -4px;
}

.ws-resize-handle-line {
  position: absolute;
  background-color: #cbd5e1;
  transition: all 150ms ease;
}

.ws-resize-handle:hover .ws-resize-handle-line,
.ws-resize-handle.ws-handle-dragging .ws-resize-handle-line {
  background-color: #004aa5;
  box-shadow: 0 0 8px rgba(0, 74, 165, 0.45);
}
```

### 2.3. Arabic RTL Reversal Mathematics
In an Arabic RTL interface (`dir="rtl"`), panels on the right side of the screen grow as the separator is dragged to the left (decreasing `clientX`). Without adjustment, standard LTR calculations cause the panel to shrink when dragged left.

The `ResizeHandle` automatically inverts deltas when `isRtl` is true:
$$\Delta_{\text{effective}} = \begin{cases} -\Delta_{\text{raw}}, & \text{if } \text{horizontal and RTL} \\ \Delta_{\text{raw}}, & \text{otherwise} \end{cases}$$

```typescript
const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!isDragging) return;
  e.preventDefault();

  const currentPos = isHorizontal ? e.clientX : e.clientY;
  let delta = currentPos - dragStartPosRef.current;

  // In horizontal RTL mode, dragging leftwards increases a right panel's width
  if (isHorizontal && isRtl) {
    delta = -delta;
  }

  if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
  rafIdRef.current = requestAnimationFrame(() => {
    onResize(delta);
    dragStartPosRef.current = currentPos;
  });
};
```

### 2.4. Double-Click Reset & Keyboard Accessibility
- **Double-Click Action:** Double-clicking any separator invokes `onReset`, instantly restoring the default panel size without requiring manual adjustments.
- **Keyboard Navigation:** The separator implements `role="separator"`, `tabIndex={0}`, and handles:
  - `ArrowLeft` / `ArrowRight`: Step adjustment by ±10px.
  - `Shift + Arrow`: Large step adjustment by ±50px.
  - `Enter` / `Space`: Toggles collapse or resets to default.
  - Standard ARIA attributes: `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-orientation`.

---

## 3. Clamping & Safe Persistence

### 3.1. Dynamic Viewport Clamping
To prevent panels from crushing adjacent containers or extending past the visible screen, the `clampPanelSize` utility enforces both minimum/maximum bounds and viewport bounds:

```typescript
export function clampPanelSize(
  size: number,
  minSize: number,
  maxSize: number,
  viewportBound?: number
): number {
  let effectiveMax = maxSize;
  if (viewportBound && viewportBound > 0) {
    // Guarantees at least 200px remain for neighboring content
    effectiveMax = Math.min(maxSize, Math.max(minSize, viewportBound - 200));
  }
  return Math.max(minSize, Math.min(effectiveMax, size));
}
```

### 3.2. Scoped Preferences Engine
Preferences are stored in `localStorage` scoped by:
1. Workspace ID (e.g., `notes-editor`, `crm-shell`, `admin-layout`).
2. User ID / Role (e.g., `admin`, `general_manager`).
3. Viewport Category (`desktop`, `tablet`, `mobile`).

Key schema:
`elfazni_ws_layout_v1::<userId>::<workspaceId>::<deviceCategory>`

---

## 4. Workspaces Integrated

| Workspace | Component | Separators | Range | Default | Persist Key |
|---|---|:---:|---|---|---|
| **My Notes** | `ModernNotesEditor.tsx` | 2 handles | List: 200–480px<br>Props: 220–420px | List: 290px<br>Props: 280px | `elfazni_ws_layout_v1::...::notes-editor` |
| **CRM Shell** | `WorkspaceNavbar.tsx` | 1 handle | 180–420px | 256px | `elfazni_crm_sidebar_width` |
| **Admin Shell** | `AdminLayout.tsx` | 1 handle | 200–460px | 288px | `elfazni_admin_sidebar_width` |
| **Blog Editor** | `WordLikeBlogEditor.tsx` | 1 handle | 260–520px | 380px | `elfazni_blog_drawer_width` |
| **Theme Manager** | `AdminThemeManager.tsx` | 1 handle | 260–520px | 340px | `elfazni_theme_sidebar_width` |

---

## 5. Usage Example

```tsx
import { WorkspaceShell, ResizablePanel, ResizeHandle, WindowControls } from '@/components/workspace';

export const MyDesktopWorkspace = () => {
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <WorkspaceShell workspaceId="custom-tool">
      <ResizablePanel id="nav" size={sidebarWidth} minSize={200} maxSize={450}>
        <SidebarContent />
      </ResizablePanel>

      <ResizeHandle
        id="nav-handle"
        direction="horizontal"
        isRtl={true}
        onResize={(delta) => setSidebarWidth((prev) => clampPanelSize(prev + delta, 200, 450))}
        onReset={() => setSidebarWidth(280)}
      />

      <ResizablePanel id="main" isMaximized={isMaximized} className="flex-1 min-w-0">
        <WindowControls
          onMaximize={() => setIsMaximized(!isMaximized)}
          isMaximized={isMaximized}
          onResetLayout={() => setSidebarWidth(280)}
          saveStatus="saved"
        />
        <MainStageContent />
      </ResizablePanel>
    </WorkspaceShell>
  );
};
```

---
*Specification approved for ELFAZNI SERVICES Production Architecture.*
