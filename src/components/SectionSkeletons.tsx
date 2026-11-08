import React from 'react';

/**
 * Reusable shimmer bar block for skeleton placeholders
 */
export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-[#D7E7F7] via-[#eaf4ff] to-[#D7E7F7] rounded-xl ${className}`}
    aria-hidden="true"
  />
);

/**
 * Dark-surface shimmer block for full-bleed cards & dark bars
 */
export const DarkSkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-white/15 rounded-xl ${className}`}
    aria-hidden="true"
  />
);

/**
 * Individual Service Card Skeleton (used inside ServicesSection and ServicesSectionSkeleton)
 */
export const ServiceCardSkeleton: React.FC = () => (
  <div
    className="relative rounded-3xl overflow-hidden min-h-[430px] sm:min-h-[450px] p-6 sm:p-7 flex flex-col justify-between bg-gradient-to-br from-[#0E4B87] to-[#0B2E57] border border-[#D7E7F7]/30 shadow-[0_14px_34px_rgba(1,26,59,0.12)]"
    aria-hidden="true"
  >
    {/* Simulated background shimmer */}
    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#0B2E57] via-[#0E4B87] to-[#0B2E57]" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

    {/* Top Floating Row: Glassmorphic Tag & Circular Action Button */}
    <div className="relative z-10 flex items-center justify-between gap-2">
      <DarkSkeletonBlock className="h-7 w-32 rounded-full" />
      <DarkSkeletonBlock className="h-10 w-10 rounded-full shrink-0" />
    </div>

    {/* Bottom Overlaid Content & Full-Width CTA */}
    <div className="relative z-10 mt-auto pt-12 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <DarkSkeletonBlock className="h-7 w-2/3 rounded-lg" />
        <DarkSkeletonBlock className="h-6 w-20 rounded-full shrink-0" />
      </div>
      <div className="space-y-2">
        <DarkSkeletonBlock className="h-4 w-full rounded-md" />
        <DarkSkeletonBlock className="h-4 w-4/5 rounded-md" />
      </div>
      <div className="pt-2">
        <div className="w-full h-12 rounded-2xl bg-white/25 animate-pulse" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton Screen for ServicesSection
 */
export const ServicesSectionSkeleton: React.FC = () => (
  <section
    id="services"
    aria-busy="true"
    aria-label="Loading services"
    className="py-24 sm:py-32 bg-[#FFFFFF] relative"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header Skeleton */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-4 flex flex-col items-center">
        <SkeletonBlock className="h-5 w-56 rounded-full" />
        <SkeletonBlock className="h-10 sm:h-12 w-72 sm:w-96 rounded-2xl" />
        <SkeletonBlock className="h-8 sm:h-10 w-64 sm:w-80 rounded-2xl" />
        <SkeletonBlock className="h-5 w-full max-w-xl rounded-lg" />
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex justify-center mb-14">
        <div className="p-1.5 bg-[#eaf4ff] rounded-2xl sm:rounded-full grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 max-w-lg w-full sm:w-auto border border-[#D7E7F7]">
          {[1, 2, 3, 4].map((tab) => (
            <SkeletonBlock
              key={tab}
              className="h-10 w-full sm:w-32 rounded-xl sm:rounded-full"
            />
          ))}
        </div>
      </div>

      {/* Services Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <ServiceCardSkeleton key={idx} />
        ))}
      </div>
    </div>
  </section>
);

/**
 * Skeleton Screen for CampaignSlider
 */
export const CampaignSliderSkeleton: React.FC = () => (
  <section
    id="service-slides"
    aria-busy="true"
    aria-label="Loading campaign showcase"
    className="py-16 sm:py-24 bg-[#FFFFFF] relative overflow-hidden"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Heading Skeleton */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-4 flex flex-col items-center">
        <SkeletonBlock className="h-5 w-44 rounded-full" />
        <SkeletonBlock className="h-10 sm:h-12 w-72 sm:w-96 rounded-2xl" />
        <SkeletonBlock className="h-8 sm:h-10 w-64 sm:w-80 rounded-2xl" />
        <SkeletonBlock className="h-5 w-60 rounded-lg" />
      </div>

      {/* Carousel Frame Skeleton */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#D7E7F7] bg-[#FFFFFF]">
        {/* Progress bar placeholder */}
        <div className="h-1.5 w-full bg-[#eaf4ff] overflow-hidden">
          <div className="h-full w-1/3 bg-[#CC9048]/50 animate-pulse" />
        </div>

        {/* Slide Image Area Skeleton */}
        <div className="w-full aspect-[16/10] sm:aspect-[16/9] bg-gradient-to-br from-[#eaf4ff] via-[#D7E7F7] to-[#eaf4ff] animate-pulse flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-[#004AA5]/10 border border-[#004AA5]/20 flex items-center justify-center mb-4">
            <div className="w-8 h-8 rounded-full border-2 border-[#004AA5] border-t-transparent animate-spin" />
          </div>
          <div className="h-4 w-48 bg-[#0B2E57]/10 rounded-full" />
        </div>

        {/* Bottom Info & Controls Bar Skeleton */}
        <div className="bg-[#012450] text-white px-5 py-5 sm:px-8 sm:py-6 border-t border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2.5 flex-1 w-full">
            <div className="flex items-center gap-2.5">
              <DarkSkeletonBlock className="h-5 w-10 rounded-md" />
              <DarkSkeletonBlock className="h-5 w-40 rounded-md" />
            </div>
            <DarkSkeletonBlock className="h-7 w-64 sm:w-80 rounded-lg" />
          </div>

          <div className="w-full lg:w-auto flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4 shrink-0">
            <DarkSkeletonBlock className="h-10 w-44 rounded-xl" />
            <div className="flex items-center gap-3">
              <DarkSkeletonBlock className="hidden sm:block h-8 w-36 rounded-xl" />
              <DarkSkeletonBlock className="h-10 w-28 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/**
 * Skeleton Screen for UnifiedBookingsSection (#airlines)
 */
export const UnifiedBookingsSkeleton: React.FC = () => (
  <section
    id="airlines"
    aria-busy="true"
    aria-label="Loading bookings hub"
    className="py-20 sm:py-28 bg-[#eaf4ff] relative overflow-hidden border-b border-[#D7E7F7]"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-4 flex flex-col items-center">
        <SkeletonBlock className="h-6 w-48 rounded-full bg-white" />
        <SkeletonBlock className="h-10 w-80 sm:w-96 rounded-2xl bg-white" />
        <SkeletonBlock className="h-8 w-64 sm:w-80 rounded-2xl bg-white" />
      </div>

      {/* Tabs Pill Bar */}
      <div className="flex justify-center">
        <div className="flex gap-2 p-2 bg-white rounded-2xl border border-[#D7E7F7]">
          <SkeletonBlock className="h-11 w-32 sm:w-40 rounded-xl" />
          <SkeletonBlock className="h-11 w-32 sm:w-40 rounded-xl" />
          <SkeletonBlock className="h-11 w-32 sm:w-40 rounded-xl" />
        </div>
      </div>

      {/* Main Booking Engine Card Skeleton */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-[#D7E7F7] space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
        <SkeletonBlock className="h-14 w-full sm:w-64 rounded-2xl" />
      </div>
    </div>
  </section>
);

/**
 * Skeleton Screen for GuidesSection & WorkGallery Card Grids
 */
export const CardsRowSectionSkeleton: React.FC<{ id: string; bgClass?: string }> = ({
  id,
  bgClass = 'bg-[#FFFFFF]',
}) => (
  <section
    id={id}
    aria-busy="true"
    className={`py-20 ${bgClass} relative`}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-4 flex flex-col items-center">
        <SkeletonBlock className="h-5 w-44 rounded-full" />
        <SkeletonBlock className="h-10 w-72 sm:w-96 rounded-2xl" />
        <SkeletonBlock className="h-5 w-full max-w-lg rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((idx) => (
          <ServiceCardSkeleton key={idx} />
        ))}
      </div>
    </div>
  </section>
);

/**
 * Generic Section Skeleton for Checklist, Founder, FAQ, Contact, etc.
 */
export const GenericSectionSkeleton: React.FC<{ id?: string; dark?: boolean }> = ({
  id,
  dark = false,
}) => (
  <section
    id={id}
    aria-busy="true"
    className={`py-20 ${dark ? 'bg-gradient-to-br from-[#0E4B87] to-[#0B2E57]' : 'bg-[#eaf4ff]/60'} relative`}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3 flex flex-col items-center">
        {dark ? (
          <>
            <DarkSkeletonBlock className="h-5 w-40 rounded-full" />
            <DarkSkeletonBlock className="h-10 w-72 sm:w-96 rounded-2xl" />
          </>
        ) : (
          <>
            <SkeletonBlock className="h-5 w-40 rounded-full" />
            <SkeletonBlock className="h-10 w-72 sm:w-96 rounded-2xl" />
          </>
        )}
      </div>
      <div className="rounded-3xl p-6 sm:p-10 bg-white/90 border border-[#D7E7F7] shadow-sm space-y-4">
        <SkeletonBlock className="h-8 w-1/3 rounded-xl" />
        <SkeletonBlock className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonBlock className="h-14 w-full rounded-xl" />
          <SkeletonBlock className="h-14 w-full rounded-xl" />
        </div>
      </div>
    </div>
  </section>
);
