import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { WhatsAppLogo } from './WhatsAppLogo';

interface AnimatedSuccessBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AnimatedSuccessBadge: React.FC<AnimatedSuccessBadgeProps> = ({
  size = 'lg',
  className = '',
}) => {
  const dimensions =
    size === 'sm'
      ? 'w-7 h-7'
      : size === 'md'
      ? 'w-11 h-11'
      : 'w-16 h-16';

  const svgSize =
    size === 'sm'
      ? 'w-3.5 h-3.5'
      : size === 'md'
      ? 'w-5 h-5'
      : 'w-8 h-8';

  return (
    <div className={`relative inline-flex items-center justify-center ${dimensions} ${className}`}>
      {/* Subtle expanding halo ring */}
      <span
        className="absolute inset-0 rounded-full bg-emerald-400/30 animate-success-ring pointer-events-none"
        aria-hidden="true"
      />
      {/* Soft outer glow */}
      <span
        className="absolute -inset-1 rounded-full bg-emerald-500/10 pointer-events-none"
        aria-hidden="true"
      />
      {/* Main circle with spring pop */}
      <div
        className={`relative ${dimensions} rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_8px_24px_rgba(16,185,129,0.32)] flex items-center justify-center animate-success-pop`}
      >
        <svg
          className={svgSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 13l4 4L19 7" className="animate-success-check" />
        </svg>
      </div>
    </div>
  );
};

interface InlineSuccessBannerProps {
  title: string;
  subtitle?: string;
  onReopenWhatsApp?: () => void;
  onDismiss?: () => void;
  variant?: 'light' | 'dark';
}

export const InlineSuccessBanner: React.FC<InlineSuccessBannerProps> = ({
  title,
  subtitle,
  onReopenWhatsApp,
  onDismiss,
  variant = 'light',
}) => {
  const { t } = useLanguage();

  const isDark = variant === 'dark';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`animate-success-slide-up rounded-2xl p-3.5 sm:p-4 border transition-all flex flex-wrap items-center justify-between gap-3 ${
        isDark
          ? 'bg-emerald-500/15 border-emerald-400/30 text-white'
          : 'bg-emerald-50/90 border-emerald-200 text-emerald-950 shadow-[0_6px_20px_rgba(16,185,129,0.08)]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <AnimatedSuccessBadge size="sm" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs sm:text-sm font-black leading-snug ${
              isDark ? 'text-white' : 'text-emerald-950'
            }`}
          >
            {title}
          </p>
          {subtitle && (
            <p
              className={`text-[11px] sm:text-xs mt-0.5 truncate ${
                isDark ? 'text-emerald-100/90' : 'text-emerald-800/90'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onReopenWhatsApp && (
          <button
            type="button"
            onClick={onReopenWhatsApp}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark
                ? 'bg-white/15 hover:bg-white/25 text-white'
                : 'bg-white hover:bg-emerald-100/70 text-emerald-900 border border-emerald-200/80 shadow-2xs'
            }`}
          >
            <WhatsAppLogo className="w-3.5 h-3.5" />
            <span>{t('إعادة فتح واتساب')}</span>
          </button>
        )}

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isDark
                ? 'hover:bg-white/15 text-emerald-100'
                : 'hover:bg-emerald-200/60 text-emerald-700'
            }`}
            aria-label={t('إغلاق')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
