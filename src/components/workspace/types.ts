export type LayoutDirection = 'horizontal' | 'vertical';

export type PanelCollapseState = 'expanded' | 'collapsed' | 'hidden';

export interface PanelConfig {
  id: string;
  defaultSize: number; // in pixels
  minSize: number; // in pixels
  maxSize: number; // in pixels
  collapsible?: boolean;
  collapsedSize?: number; // default 48px or 0px
  priority?: number; // resize priority
  labelAr?: string;
  labelEn?: string;
}

export interface WorkspaceLayoutPreferences {
  workspaceId: string;
  userId: string;
  panelSizes: Record<string, number>; // panelId -> width/height in px
  collapsedPanels: Record<string, boolean>; // panelId -> true if collapsed
  maximizedPanelId: string | null;
  dockPositions?: Record<string, 'left' | 'right' | 'bottom'>;
  presetId?: string;
  updatedAt: string;
}

export type SaveStatusState = 'saved' | 'saving' | 'failed' | 'unsaved';

export interface WorkspaceContextValue {
  workspaceId: string;
  direction: LayoutDirection;
  isRtl: boolean;
  panelSizes: Record<string, number>;
  collapsedPanels: Record<string, boolean>;
  maximizedPanelId: string | null;
  isDragging: boolean;
  activeHandleId: string | null;
  getPanelSize: (panelId: string, defaultFallback?: number) => number;
  setPanelSize: (panelId: string, newSize: number) => void;
  toggleCollapse: (panelId: string) => void;
  toggleMaximize: (panelId: string) => void;
  isCollapsed: (panelId: string) => boolean;
  isMaximized: (panelId: string) => boolean;
  resetLayout: () => void;
  applyPreset: (presetId: string) => void;
  startDragging: (handleId: string, initialPos: number, panelId: string, initialSize: number) => void;
  onDragMove: (currentPos: number) => void;
  stopDragging: () => void;
}
