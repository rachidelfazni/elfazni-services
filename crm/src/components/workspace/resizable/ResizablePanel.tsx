import React from 'react';
import { LayoutDirection } from './types';
import './resizable.css';

interface ResizablePanelProps {
  id: string;
  size?: number; // Size in pixels
  minSize?: number;
  maxSize?: number;
  isCollapsed?: boolean;
  collapsedSize?: number; // default 0 or 48px
  isMaximized?: boolean;
  direction?: LayoutDirection;
  flex?: string | number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  id,
  size,
  minSize,
  maxSize,
  isCollapsed = false,
  collapsedSize = 0,
  isMaximized = false,
  direction = 'horizontal',
  flex,
  className = '',
  style = {},
  children,
}) => {
  const isHorizontal = direction === 'horizontal';

  // Compute inline dimensions
  const computedStyle: React.CSSProperties = {
    ...style,
  };

  if (isMaximized) {
    // Handled by CSS class .ws-panel-maximized
  } else if (isCollapsed) {
    if (isHorizontal) {
      computedStyle.width = `${collapsedSize}px`;
      computedStyle.minWidth = `${collapsedSize}px`;
      computedStyle.maxWidth = `${collapsedSize}px`;
      computedStyle.flex = '0 0 auto';
    } else {
      computedStyle.height = `${collapsedSize}px`;
      computedStyle.minHeight = `${collapsedSize}px`;
      computedStyle.maxHeight = `${collapsedSize}px`;
      computedStyle.flex = '0 0 auto';
    }
  } else if (typeof size === 'number') {
    if (isHorizontal) {
      computedStyle.width = `${size}px`;
      if (minSize) computedStyle.minWidth = `${minSize}px`;
      if (maxSize) computedStyle.maxWidth = `${maxSize}px`;
      computedStyle.flex = `0 0 ${size}px`;
    } else {
      computedStyle.height = `${size}px`;
      if (minSize) computedStyle.minHeight = `${minSize}px`;
      if (maxSize) computedStyle.maxHeight = `${maxSize}px`;
      computedStyle.flex = `0 0 ${size}px`;
    }
  } else if (flex) {
    computedStyle.flex = flex;
    computedStyle.minWidth = 0;
    computedStyle.minHeight = 0;
  } else {
    computedStyle.flex = '1 1 0%';
    computedStyle.minWidth = 0;
    computedStyle.minHeight = 0;
  }

  return (
    <div
      id={`panel-${id}`}
      data-panel-id={id}
      className={`ws-panel ${isMaximized ? 'ws-panel-maximized' : ''} ${
        isCollapsed ? 'ws-panel-collapsed' : ''
      } ${className}`}
      style={computedStyle}
    >
      {children}
    </div>
  );
};
