import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { LayoutDirection, PanelConfig, WorkspaceContextValue, WorkspaceLayoutPreferences } from './types';
import { loadLayoutPreferences, saveLayoutPreferences, resetLayoutPreferences, clampPanelSize } from './layoutPreferences';
import './resizable.css';

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceShell');
  }
  return ctx;
}

interface WorkspaceShellProps {
  workspaceId: string;
  userId?: string;
  direction?: LayoutDirection;
  isRtl?: boolean;
  panels?: PanelConfig[];
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  workspaceId,
  userId = 'current',
  direction = 'horizontal',
  isRtl = false,
  panels = [],
  className = '',
  style = {},
  children,
}) => {
  // Build default panel sizes
  const defaultSizes = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of panels) {
      map[p.id] = p.defaultSize;
    }
    return map;
  }, [panels]);

  // Load persisted preferences
  const [preferences, setPreferences] = useState<WorkspaceLayoutPreferences>(() =>
    loadLayoutPreferences(workspaceId, userId, defaultSizes)
  );

  const [panelSizes, setPanelSizes] = useState<Record<string, number>>(() => ({
    ...defaultSizes,
    ...(preferences.panelSizes || {}),
  }));

  const [collapsedPanels, setCollapsedPanels] = useState<Record<string, boolean>>(
    () => preferences.collapsedPanels || {}
  );

  const [maximizedPanelId, setMaximizedPanelId] = useState<string | null>(
    () => preferences.maximizedPanelId || null
  );

  const [isDragging, setIsDragging] = useState(false);
  const [activeHandleId, setActiveHandleId] = useState<string | null>(null);

  // Sync to localStorage when layout changes (debounced)
  useEffect(() => {
    const updated: WorkspaceLayoutPreferences = {
      workspaceId,
      userId,
      panelSizes,
      collapsedPanels,
      maximizedPanelId,
      updatedAt: new Date().toISOString(),
    };
    saveLayoutPreferences(updated);
  }, [workspaceId, userId, panelSizes, collapsedPanels, maximizedPanelId]);

  // Get current size of a panel
  const getPanelSize = useCallback(
    (panelId: string, defaultFallback: number = 280): number => {
      if (panelSizes[panelId] !== undefined) {
        return panelSizes[panelId];
      }
      const cfg = panels.find((p) => p.id === panelId);
      return cfg ? cfg.defaultSize : defaultFallback;
    },
    [panelSizes, panels]
  );

  // Set size for a panel with clamping
  const setPanelSize = useCallback(
    (panelId: string, newSize: number) => {
      const cfg = panels.find((p) => p.id === panelId);
      const min = cfg ? cfg.minSize : 100;
      const max = cfg ? cfg.maxSize : 800;
      const clamped = clampPanelSize(newSize, min, max, typeof window !== 'undefined' ? window.innerWidth : 1200);

      setPanelSizes((prev) => ({
        ...prev,
        [panelId]: clamped,
      }));
    },
    [panels]
  );

  // Toggle collapse state of a panel
  const toggleCollapse = useCallback((panelId: string) => {
    setCollapsedPanels((prev) => ({
      ...prev,
      [panelId]: !prev[panelId],
    }));
  }, []);

  // Toggle maximize state of a panel
  const toggleMaximize = useCallback((panelId: string) => {
    setMaximizedPanelId((prev) => (prev === panelId ? null : panelId));
  }, []);

  const isCollapsed = useCallback(
    (panelId: string): boolean => Boolean(collapsedPanels[panelId]),
    [collapsedPanels]
  );

  const isMaximized = useCallback(
    (panelId: string): boolean => maximizedPanelId === panelId,
    [maximizedPanelId]
  );

  // Reset layout to defaults
  const resetLayout = useCallback(() => {
    resetLayoutPreferences(workspaceId, userId);
    setPanelSizes({ ...defaultSizes });
    setCollapsedPanels({});
    setMaximizedPanelId(null);
  }, [workspaceId, userId, defaultSizes]);

  // Apply a layout preset
  const applyPreset = useCallback(
    (presetId: string) => {
      if (presetId === 'default' || presetId === 'standard') {
        resetLayout();
      } else if (presetId === 'focus' || presetId === 'maximize_editor') {
        setMaximizedPanelId('editor');
      } else if (presetId === 'compact') {
        const compact: Record<string, boolean> = {};
        for (const p of panels) {
          if (p.id !== 'editor' && p.id !== 'main') {
            compact[p.id] = true;
          }
        }
        setCollapsedPanels(compact);
        setMaximizedPanelId(null);
      }
    },
    [resetLayout, panels]
  );

  // Dragging lifecycle handlers
  const startDragging = useCallback((handleId: string) => {
    setIsDragging(true);
    setActiveHandleId(handleId);
  }, []);

  const onDragMove = useCallback((_currentPos: number) => {
    // Handled in ResizeHandle via callback
  }, []);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
    setActiveHandleId(null);
  }, []);

  const contextValue: WorkspaceContextValue = useMemo(
    () => ({
      workspaceId,
      direction,
      isRtl,
      panelSizes,
      collapsedPanels,
      maximizedPanelId,
      isDragging,
      activeHandleId,
      getPanelSize,
      setPanelSize,
      toggleCollapse,
      toggleMaximize,
      isCollapsed,
      isMaximized,
      resetLayout,
      applyPreset,
      startDragging,
      onDragMove,
      stopDragging,
    }),
    [
      workspaceId,
      direction,
      isRtl,
      panelSizes,
      collapsedPanels,
      maximizedPanelId,
      isDragging,
      activeHandleId,
      getPanelSize,
      setPanelSize,
      toggleCollapse,
      toggleMaximize,
      isCollapsed,
      isMaximized,
      resetLayout,
      applyPreset,
      startDragging,
      onDragMove,
      stopDragging,
    ]
  );

  return (
    <WorkspaceContext.Provider value={contextValue}>
      <div
        id={`workspace-shell-${workspaceId}`}
        data-workspace-id={workspaceId}
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`ws-shell ws-shell-${direction} ${className}`}
        style={style}
      >
        {children}
      </div>
    </WorkspaceContext.Provider>
  );
};
