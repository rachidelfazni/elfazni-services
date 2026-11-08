import React from 'react';

export type LogoBackground = 'white' | 'blue' | 'gold';
export type LogoOrientation = 'horizontal' | 'vertical';

export interface BrandLogoProps {
  /**
   * Actual surface/background color behind the logo:
   * - 'white': light backgrounds, white headers, invoices, documents
   * - 'blue': dark blue/navy backgrounds, hero sections, blue topbars, footers
   * - 'gold': warm gold accent backgrounds, covers, gold badges
   */
  background?: LogoBackground;
  /** Alias for background to match specification */
  surface?: LogoBackground;
  /** Logo layout: 'horizontal' (headers, navbars, invoices) or 'vertical' (posters, cards, sidebars) */
  orientation?: LogoOrientation;
  /** Size preset or height in pixels */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Optional custom CSS classes */
  className?: string;
  /** Alt text for accessibility. Empty if decorative */
  alt?: string;
  /** Whether the image is purely decorative */
  decorative?: boolean;
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
  style?: React.CSSProperties;
}

/** Official vector SVG logo mapping as defined by ELFAZNI SERVICES Identity Matrix */
const LOGO_ASSETS: Record<LogoBackground, Record<LogoOrientation, string>> = {
  white: {
    horizontal: '/admin/crm/assets/logos/elfazni-horizontal-on-white.svg',
    vertical: '/admin/crm/assets/logos/elfazni-vertical-on-white.svg',
  },
  blue: {
    horizontal: '/admin/crm/assets/logos/elfazni-horizontal-on-blue.svg',
    vertical: '/admin/crm/assets/logos/elfazni-vertical-on-blue.svg',
  },
  gold: {
    horizontal: '/admin/crm/assets/logos/elfazni-horizontal-on-gold.svg',
    vertical: '/admin/crm/assets/logos/elfazni-vertical-on-gold.svg',
  },
};

const SIZE_CLASSES: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string> = {
  xs: 'h-6',
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
  xl: 'h-16 sm:h-20',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  background,
  surface = 'white',
  orientation = 'horizontal',
  size = 'md',
  className = '',
  alt = 'ELFAZNI SERVICES — الفزني سيرفيسز',
  decorative = false,
  onClick,
  style,
}) => {
  const activeBg: LogoBackground = background || surface;
  const logoSrc = LOGO_ASSETS[activeBg]?.[orientation] || LOGO_ASSETS.white.horizontal;

  const sizeClass = typeof size === 'string' ? SIZE_CLASSES[size] || 'h-10' : '';
  const heightStyle = typeof size === 'number' ? { height: `${size}px` } : undefined;

  return (
    <img
      src={logoSrc}
      alt={decorative ? '' : alt}
      aria-hidden={decorative ? 'true' : undefined}
      onClick={onClick}
      className={`inline-block w-auto max-w-full select-none object-contain transition-opacity duration-200 ${sizeClass} ${className}`.trim()}
      style={{
        ...heightStyle,
        ...style,
      }}
      loading="eager"
      decoding="async"
    />
  );
};

export default BrandLogo;
