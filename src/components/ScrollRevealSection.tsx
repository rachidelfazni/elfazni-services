import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollRevealSection: React.FC<ScrollRevealSectionProps> = ({
  children,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Respect reduced motion preference or environments without IntersectionObserver
    if (
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsVisible(true);
      return;
    }

    // Safety fallback: ensure section always becomes visible even on mobile or delayed scroll
    const safetyTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, 450);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px 80px 0px',
      }
    );

    observer.observe(node);

    return () => {
      window.clearTimeout(safetyTimer);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-section ${isVisible ? 'is-visible' : ''} ${className}`.trim()}
    >
      {children}
    </div>
  );
};
