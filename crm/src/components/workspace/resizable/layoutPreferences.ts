import { WorkspaceLayoutPreferences } from './types';

const STORAGE_PREFIX = 'elfazni_ws_layout_v1';

/**
 * Generates a storage key scoped by workspace, user, and viewport category
 */
export function getStorageKey(workspaceId: string, userId: string = 'current'): string {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
  const device = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
  return `${STORAGE_PREFIX}::${userId}::${workspaceId}::${device}`;
}

/**
 * Clamps a panel size between min and max bounds, preventing viewport overflow
 */
export function clampPanelSize(
  size: number,
  minSize: number,
  maxSize: number,
  viewportBound?: number
): number {
  let effectiveMax = maxSize;
  if (viewportBound && viewportBound > 0) {
    // Leave at least 200px or 30% for adjacent panels
    effectiveMax = Math.min(maxSize, Math.max(minSize, viewportBound - 200));
  }
  return Math.max(minSize, Math.min(effectiveMax, size));
}

/**
 * Loads saved layout preferences for a workspace
 */
export function loadLayoutPreferences(
  workspaceId: string,
  userId: string = 'current',
  defaultSizes: Record<string, number> = {}
): WorkspaceLayoutPreferences {
  const fallback: WorkspaceLayoutPreferences = {
    workspaceId,
    userId,
    panelSizes: { ...defaultSizes },
    collapsedPanels: {},
    maximizedPanelId: null,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(getStorageKey(workspaceId, userId));
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as Partial<WorkspaceLayoutPreferences>;
    return {
      workspaceId,
      userId,
      panelSizes: { ...defaultSizes, ...(parsed.panelSizes || {}) },
      collapsedPanels: parsed.collapsedPanels || {},
      maximizedPanelId: parsed.maximizedPanelId || null,
      dockPositions: parsed.dockPositions || {},
      presetId: parsed.presetId,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[LayoutPreferences] Failed to load preferences:', err);
    return fallback;
  }
}

/**
 * Persists layout preferences to client storage
 */
export function saveLayoutPreferences(prefs: WorkspaceLayoutPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    const key = getStorageKey(prefs.workspaceId, prefs.userId);
    const toStore: WorkspaceLayoutPreferences = {
      ...prefs,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(toStore));
  } catch (err) {
    console.warn('[LayoutPreferences] Failed to save preferences:', err);
  }
}

/**
 * Resets layout preferences for a workspace
 */
export function resetLayoutPreferences(workspaceId: string, userId: string = 'current'): void {
  if (typeof window === 'undefined') return;

  try {
    const key = getStorageKey(workspaceId, userId);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('[LayoutPreferences] Failed to reset preferences:', err);
  }
}
