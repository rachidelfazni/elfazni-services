import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AirlineItem } from '../data/content';

interface AirlineLogoMarqueeProps {
  /** Logo cards for one full row */
  items: AirlineItem[];
  /** 'forward': track moves right-to-left (content flows left); 'reverse': moves left-to-right */
  direction: 'forward' | 'reverse';
  /** Seconds for one full loop of a single sequence */
  duration?: number;
  /** Whether the animation is running */
  playing: boolean;
  /** Accessible label for the row */
  label: string;
  /** Compact card styling (used inside the dark UnifiedBookingsSection) */
  compact?: boolean;
}

/** Copies rendered before the first measurement lands. Generous by default. */
const INITIAL_COPIES = 3;
/** Hard upper bound so absurdly small logo sets cannot explode the DOM. */
const MAX_COPIES = 8;

/**
 * AirlineLogoMarquee — a seamless, gap-free infinite logo track (master brief §3).
 *
 * Instead of guessing a `translateX(-50%)` CSS keyframe (which breaks whenever track
 * padding/gaps/widths differ from a perfect 50% split, and leaves blank areas on any
 * viewport wider than one track half), this component:
 *
 *  1. Measures the exact width of one complete logo sequence *including the gap*.
 *  2. Renders enough copies of the sequence so the track always covers the viewport:
 *     N = ceil((viewportWidth + loopWidth) / loopWidth), so even at the moment the
 *     track has slid one full loop, its right edge is still past the viewport edge.
 *  3. Animates the track by exactly one loop width with the Web Animations API —
 *     so the loop point is invisible: no jumps, no flicker, no accumulated drift.
 *  4. Rebuilds measurements via ResizeObserver on content/viewport changes.
 *
 * `prefers-reduced-motion` renders a static, fully populated arrangement.
 */
export const AirlineLogoMarquee: React.FC<AirlineLogoMarqueeProps> = ({
  items,
  direction,
  duration = 32,
  playing,
  label,
  compact = false,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const [copies, setCopies] = useState(INITIAL_COPIES);

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const buildAnimation = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    // Kill any previous animation and rebuild measurements from scratch.
    animationRef.current?.cancel();
    animationRef.current = null;
    track.style.transform = '';

    if (prefersReducedMotion || items.length === 0) {
      track.style.transform = 'translateX(0)';
      return;
    }

    // Exact one-repeat width: first sequence width + the track gap between copies.
    const firstSequence = track.firstElementChild as HTMLElement | null;
    if (!firstSequence) return;
    const trackStyle = window.getComputedStyle(track);
    const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || '0') || 0;
    const loopWidth = firstSequence.getBoundingClientRect().width + gap;
    if (loopWidth <= 0) return;

    // Ensure the track is always wider than viewport + one loop, so no blank gap
    // can ever appear on either side while the track slides one loop.
    const viewport = Math.max(window.innerWidth, 320);
    const required = Math.min(
      MAX_COPIES,
      Math.max(2, Math.ceil((viewport + loopWidth) / loopWidth))
    );
    setCopies((prev) => (prev === required ? prev : required));

    const keyframes =
      direction === 'forward'
        ? [
            { transform: 'translateX(0)' },
            { transform: `translateX(${-loopWidth}px)` },
          ]
        : [
            { transform: `translateX(${-loopWidth}px)` },
            { transform: 'translateX(0)' },
          ];

    const animation = track.animate(keyframes, {
      duration: duration * 1000,
      iterations: Infinity,
      easing: 'linear',
    });
    animationRef.current = animation;
    if (playing) animation.play();
    else animation.pause();
  }, [direction, duration, playing, prefersReducedMotion, items.length]);

  // (Re)measure whenever items, direction, size, or reduced-motion preference change.
  useEffect(() => {
    buildAnimation();

    const observer = new ResizeObserver(() => buildAnimation());
    if (trackRef.current) observer.observe(trackRef.current);
    window.addEventListener('resize', buildAnimation);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', buildAnimation);
    };
  }, [buildAnimation]);

  // Rebuild once copies changes so the measurement reflects the final DOM.
  useEffect(() => {
    buildAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copies]);

  // Play/pause without destroying the measured animation.
  useEffect(() => {
    const animation = animationRef.current;
    if (!animation) return;
    if (playing) animation.play();
    else animation.pause();
  }, [playing]);

  const renderSequence = (copyIndex: number) => {
    const isFirst = copyIndex === 0;
    return (
      <div
        key={`copy-${copyIndex}`}
        className="flex shrink-0 gap-3.5 py-1"
        aria-hidden={isFirst ? undefined : true}
      >
        {items.map((airline) => {
          const isAirFrance = airline.logo.includes('air-france') || airline.name.includes('Air France') || airline.name.includes('الفرنسية');
          const imgClass = isAirFrance
            ? compact
              ? 'max-h-10 max-w-[130px] scale-[1.32] w-auto h-auto object-contain transition-transform duration-200 group-hover:scale-[1.38]'
              : 'max-h-11 max-w-[140px] scale-[1.38] w-auto h-auto object-contain transition-transform duration-200 group-hover:scale-[1.45]'
            : compact
            ? 'max-h-8 max-w-[105px] w-auto h-auto object-contain transition-transform duration-200 group-hover:scale-105'
            : 'max-h-9 max-w-[110px] w-auto h-auto object-contain transition-transform duration-200 group-hover:scale-105';

          return (
          <div
            key={`copy-${copyIndex}-${airline.name}`}
            className={
              compact
                ? 'group relative bg-white rounded-2xl px-5 py-3.5 border border-[#D7E7F7] hover:border-[#004AA5]/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(18,85,154,0.06)] transition-all duration-200 flex flex-col items-center justify-center min-w-[135px] sm:min-w-[155px] h-22 select-none'
                : 'group relative bg-white rounded-2xl px-5 py-4 border border-black/[0.06] hover:border-black/[0.18] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(18,85,154,0.06)] transition-all duration-200 flex flex-col items-center justify-center min-w-[140px] sm:min-w-[160px] h-24 select-none'
            }
            tabIndex={isFirst ? 0 : -1}
            title={airline.name}
          >
            <div
              className={
                compact
                  ? 'h-9 w-full flex items-center justify-center overflow-hidden'
                  : 'h-10 w-full flex items-center justify-center overflow-hidden'
              }
            >
              <img
                src={airline.logo}
                alt={isFirst ? airline.name : ''}
                className={imgClass}
                loading="lazy"
                onError={(e) => {
                  // Graceful fallback: hide broken image and show the airline name as text.
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.airline-fallback')) {
                    const fallback = document.createElement('span');
                    fallback.className =
                      'airline-fallback text-xs font-bold text-[#0B2E57]';
                    fallback.innerText = airline.name;
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
            <span
              className={
                compact
                  ? 'text-[11px] font-semibold text-slate-500 group-hover:text-[#0B2E57] transition-colors mt-1 truncate max-w-[125px]'
                  : 'text-[11px] font-semibold text-slate-500 group-hover:text-[#0B2E57] transition-colors mt-1.5 truncate max-w-[130px]'
              }
            >
              {airline.name}
            </span>
          </div>
        );
        })}
      </div>
    );
  };

  return (
    <div
      className="relative overflow-hidden mask-marquee-edges"
      role="group"
      aria-label={label}
      // Force LTR geometry for the track so the measured loop math holds in RTL pages:
      // the track anchors at the left edge and overflows rightward, which keeps the
      // viewport covered in both animation directions. Card contents (Arabic airline
      // names) still render correctly via Unicode bidi inside each fixed-size card.
      dir="ltr"
    >
      <div
        ref={trackRef}
        className="flex w-max gap-3.5 will-change-transform"
      >
        {Array.from({ length: copies }, (_, i) => renderSequence(i))}
      </div>
    </div>
  );
};
