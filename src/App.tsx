/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { SiteSettingsProvider, VisibleSection, VisibleService } from './context/SiteSettingsContext';
import { OrderedSections } from './components/SiteContent';
import { WorkspacePortal } from './components/WorkspacePortal';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { StatsMarquee } from './components/StatsMarquee';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { MobileQuickDock } from './components/MobileQuickDock';
import { FlightBookingModal } from './components/FlightBookingModal';
import { ConsularBookingModal } from './components/ConsularBookingModal';
import { StartRequestModal } from './components/StartRequestModal';
import { GuideReaderModal } from './components/GuideReaderModal';
import { ScrollRevealSection } from './components/ScrollRevealSection';
import {
  ServicesSectionSkeleton,
  CampaignSliderSkeleton,
  UnifiedBookingsSkeleton,
  CardsRowSectionSkeleton,
  GenericSectionSkeleton,
} from './components/SectionSkeletons';
import { GuideArticle } from './data/guides';
import { api } from './services/api';
import { tracker } from './services/tracker';
import { VisitorLiveChat } from './components/chat/VisitorLiveChat';
import { themeService } from './services/themeService';

// Lazy load heavy homepage sections
const ServicesSection = lazy(() =>
  import('./components/ServicesSection').then((m) => ({ default: m.ServicesSection }))
);
const InteractiveConsularChecklist = lazy(() =>
  import('./components/InteractiveConsularChecklist').then((m) => ({
    default: m.InteractiveConsularChecklist,
  }))
);
const UnifiedBookingsSection = lazy(() =>
  import('./components/UnifiedBookingsSection').then((m) => ({
    default: m.UnifiedBookingsSection,
  }))
);
const CampaignSlider = lazy(() =>
  import('./components/CampaignSlider').then((m) => ({ default: m.CampaignSlider }))
);
const GuidesSection = lazy(() =>
  import('./components/GuidesSection').then((m) => ({ default: m.GuidesSection }))
);
const HowItWorks = lazy(() =>
  import('./components/HowItWorks').then((m) => ({ default: m.HowItWorks }))
);
const WorkGallery = lazy(() =>
  import('./components/WorkGallery').then((m) => ({ default: m.WorkGallery }))
);
const FounderSection = lazy(() =>
  import('./components/FounderSection').then((m) => ({ default: m.FounderSection }))
);
const FAQSection = lazy(() =>
  import('./components/FAQSection').then((m) => ({ default: m.FAQSection }))
);
const DisclaimerSection = lazy(() =>
  import('./components/DisclaimerSection').then((m) => ({ default: m.DisclaimerSection }))
);
const ContactFormSection = lazy(() =>
  import('./components/ContactFormSection').then((m) => ({ default: m.ContactFormSection }))
);
const ContactCTA = lazy(() =>
  import('./components/ContactCTA').then((m) => ({ default: m.ContactCTA }))
);

// Lazy load Blog and Admin components
const BlogIndex = lazy(() =>
  import('./components/blog/BlogIndex').then((m) => ({ default: m.BlogIndex }))
);
const BlogPostView = lazy(() =>
  import('./components/blog/BlogPostView').then((m) => ({ default: m.BlogPostView }))
);
const AdminLogin = lazy(() =>
  import('./components/admin/AdminLogin').then((m) => ({ default: m.AdminLogin }))
);
const AdminLayout = lazy(() =>
  import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const HubPage = lazy(() =>
  import('./components/hub/HubPage').then((m) => ({ default: m.HubPage }))
);
const ConsularGuideCover = lazy(() =>
  import('./components/ConsularGuideCover').then((m) => ({ default: m.ConsularGuideCover }))
);

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(api.getToken()));

  const [startRequestModalOpen, setStartRequestModalOpen] = useState(false);
  const [initialRequestService, setInitialRequestService] = useState<string | undefined>('consular');
  const [flightModalOpen, setFlightModalOpen] = useState(false);
  const [consularModalOpen, setConsularModalOpen] = useState(false);
  const [defaultConsularService, setDefaultConsularService] = useState<string | undefined>(undefined);
  const [activeGuide, setActiveGuide] = useState<GuideArticle | null>(null);

  useEffect(() => {
    let lastTouchPing = 0;

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setIsAuthenticated(Boolean(api.getToken()));
      tracker.trackPage(window.location.pathname, 'تصفح صفحة بالموقع');
    };
    window.addEventListener('popstate', handlePopState);

    // Initial genuine visitor hit tracking
    if (!window.location.pathname.startsWith('/admin')) {
      tracker.trackPage(window.location.pathname, 'زيارة الصفحة الرئيسية');
    }

    // Live Heartbeat every 12 seconds while user is on site (also auto-registers if analytics was reset)
    const heartbeatTimer = setInterval(() => {
      tracker.trackHeartbeat();
    }, 12000);

    const handleVisibilityOrWake = () => {
      if (document.visibilityState === 'visible') {
        tracker.trackHeartbeat();
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        tracker.trackPage(window.location.pathname, 'عودة للموقع من الهاتف');
      } else {
        tracker.trackHeartbeat();
      }
    };

    const handleTouchInteraction = () => {
      const now = Date.now();
      if (now - lastTouchPing > 20000) {
        lastTouchPing = now;
        tracker.trackHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrWake);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleVisibilityOrWake);
    window.addEventListener('touchstart', handleTouchInteraction, { passive: true });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityOrWake);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleVisibilityOrWake);
      window.removeEventListener('touchstart', handleTouchInteraction);
      clearInterval(heartbeatTimer);
    };
  }, []);

  useEffect(() => {
    if (!currentPath.startsWith('/admin') || !isAuthenticated) return;
    const token = api.getToken();
    let active = true;
    api.getMe().catch(() => {
      if (active && api.getToken() === token) {
        api.removeToken();
        setIsAuthenticated(false);
      }
    });
    return () => { active = false; };
  }, [currentPath, isAuthenticated]);

  useEffect(() => {
    if (currentPath === '/hub' || currentPath.startsWith('/admin')) {
      return;
    }
    let active = true;
    themeService.getPublishedTheme('website').then((theme) => {
      if (theme) {
        themeService.applyCssVariables(theme.colors, theme.typography);
      }
    }).catch((err) => {
      console.error('Failed to load published website theme', err);
    });
    return () => { active = false; };
  }, [currentPath]);

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setIsAuthenticated(Boolean(api.getToken()));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.dispatchEvent(new Event('popstate'));
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    handleNavigate('/admin/login');
  };

  const handleOpenStartRequest = (serviceId?: string) => {
    setInitialRequestService(serviceId || 'consular');
    setStartRequestModalOpen(true);
  };

  const handleOpenConsular = (serviceName?: string) => {
    setDefaultConsularService(serviceName);
    setConsularModalOpen(true);
  };

  if (currentPath === '/workspace') return <WorkspacePortal />;

  // Route 0: ELFAZNI SERVICES HUB — unified access portal
  if (currentPath === '/hub' || currentPath === '/hub/') {
    return (
      <LanguageProvider>
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#0B2E57] flex items-center justify-center text-white font-bold">
              جاري تحميل البوابة...
            </div>
          }
        >
          <HubPage />
        </Suspense>
      </LanguageProvider>
    );
  }

  // Route 0B: Consular Guide Cover Template
  if (currentPath === '/guide-cover' || currentPath === '/guide-cover/') {
    return (
      <LanguageProvider>
        <Suspense fallback={<div className="min-h-screen bg-[#0B2E57] flex items-center justify-center text-white font-bold">جاري التحميل...</div>}>
          <ConsularGuideCover onNavigate={handleNavigate} />
        </Suspense>
      </LanguageProvider>
    );
  }

  // Route 1: Admin Login
  if (currentPath === '/admin/login') {
    return (
      <LanguageProvider>
        <Suspense fallback={<div className="min-h-screen bg-[#0B2E57] flex items-center justify-center text-white font-bold">جاري التحميل...</div>}>
          <AdminLogin
            onLoginSuccess={() => {
              setIsAuthenticated(true);
              handleNavigate('/admin');
            }}
            onNavigate={handleNavigate}
          />
        </Suspense>
      </LanguageProvider>
    );
  }

  // Route 2: Admin Dashboard (Protected)
  if (currentPath.startsWith('/admin')) {
    if (!isAuthenticated) {
      return (
        <LanguageProvider>
          <SiteSettingsProvider>
            <Suspense fallback={<div className="min-h-screen bg-[#0B2E57] flex items-center justify-center text-white font-bold">جاري التحميل...</div>}>
              <AdminLogin
                onLoginSuccess={() => {
                  setIsAuthenticated(true);
                  handleNavigate('/admin');
                }}
                onNavigate={handleNavigate}
              />
            </Suspense>
          </SiteSettingsProvider>
        </LanguageProvider>
      );
    }

    return (
      <LanguageProvider>
        <SiteSettingsProvider>
          <Suspense fallback={<div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center text-[#004AA5] font-bold">جاري فتح لوحة التحكم...</div>}>
            <AdminLayout onLogout={handleLogout} onNavigate={handleNavigate} />
          </Suspense>
        </SiteSettingsProvider>
      </LanguageProvider>
    );
  }

  // Route 3: Public Blog Index
  if (currentPath === '/blog' || currentPath === '/blog/') {
    return (
      <LanguageProvider>
        <SiteSettingsProvider>
          <div className="min-h-screen flex flex-col bg-[#F8FAFD] text-[#0B2E57]">
            <Header onNavigate={handleNavigate} />
            <main className="flex-1">
              <Suspense fallback={<div className="pt-32 text-center text-slate-500 font-bold">جاري تحميل المدونة...</div>}>
                <BlogIndex onNavigate={handleNavigate} />
              </Suspense>
            </main>
            <Footer onNavigate={handleNavigate} />
            <FloatingWhatsApp />
            <VisitorLiveChat />
            <MobileQuickDock />
          </div>
        </SiteSettingsProvider>
      </LanguageProvider>
    );
  }

  // Route 4: Single Blog Post
  if (currentPath.startsWith('/blog/')) {
    const slug = currentPath.replace('/blog/', '').split('?')[0].split('#')[0];
    return (
      <LanguageProvider>
        <SiteSettingsProvider>
          <div className="min-h-screen flex flex-col bg-[#F8FAFD] text-[#0B2E57]">
            <Header onNavigate={handleNavigate} />
            <main className="flex-1">
              <Suspense fallback={<div className="pt-32 text-center text-slate-500 font-bold">جاري تحميل المقال...</div>}>
                <BlogPostView slug={slug} onNavigate={handleNavigate} />
              </Suspense>
            </main>
            <Footer onNavigate={handleNavigate} />
            <FloatingWhatsApp />
            <VisitorLiveChat />
            <MobileQuickDock />
          </div>
        </SiteSettingsProvider>
      </LanguageProvider>
    );
  }

  // Default Route: Full Landing Page
  return (
    <LanguageProvider>
      <SiteSettingsProvider>
        <div className="min-h-screen flex flex-col bg-[#fbfbfd] text-[#0B2E57]">
        {/* Navigation */}
        <Header onNavigate={handleNavigate} />

        <main className="flex-1">
          {/* Hero Section */}
          <ScrollRevealSection>
            <Hero
              onOpenStartModal={handleOpenStartRequest}
              onOpenFlightModal={() => setFlightModalOpen(true)}
              onOpenConsularModal={() => handleOpenConsular()}
            />
          </ScrollRevealSection>

          {/* Stats & Infinite Marquee */}
          <ScrollRevealSection>
            <StatsMarquee />
          </ScrollRevealSection>

          <OrderedSections>
          {/* Core Services Section with Filter Tabs */}
          <VisibleSection id="services">
            <ScrollRevealSection>
              <Suspense fallback={<ServicesSectionSkeleton />}>
                <ServicesSection
                  onOpenFlightModal={() => setFlightModalOpen(true)}
                  onOpenConsularModal={handleOpenConsular}
                />
              </Suspense>
            </ScrollRevealSection>
          </VisibleSection>

          {/* 1. Interactive Consular Document Checklist & Progress (مواعيد القنصلية) */}
          <VisibleSection id="consular-checklist">
            <ScrollRevealSection>
              <Suspense fallback={<GenericSectionSkeleton id="consular-checklist" />}>
                <InteractiveConsularChecklist />
              </Suspense>
            </ScrollRevealSection>
          </VisibleSection>

          {/* 2. Unified Bookings Hub: Flights + Hotels + VIP Airport Transfer */}
          <VisibleSection id="airlines">
            <ScrollRevealSection>
              <Suspense fallback={<UnifiedBookingsSkeleton />}>
                <UnifiedBookingsSection onOpenFlightModal={() => setFlightModalOpen(true)} />
              </Suspense>
            </ScrollRevealSection>
          </VisibleSection>

          {/* 10-Service Auto-Rotating Campaign Showcase */}
          <VisibleSection id="service-slides">
            <ScrollRevealSection>
              <Suspense fallback={<CampaignSliderSkeleton />}>
                <CampaignSlider />
              </Suspense>
            </ScrollRevealSection>
          </VisibleSection>

          {/* Guides & Knowledge Hub */}
          <VisibleSection id="guides">
            <ScrollRevealSection>
              <Suspense fallback={<CardsRowSectionSkeleton id="guides" />}>
                <GuidesSection onSelectGuide={(guide) => setActiveGuide(guide)} />
              </Suspense>
            </ScrollRevealSection>
          </VisibleSection>

          {/* How It Works Steps */}
          <VisibleSection id="how-it-works">
            <ScrollRevealSection>
              <Suspense fallback={<GenericSectionSkeleton id="how-it-works" />}>
                <HowItWorks />
              </Suspense>
            </ScrollRevealSection>
          </VisibleSection>

          {/* Visual Identity & Portfolio Gallery */}
          <VisibleSection id="work">
            <ScrollRevealSection>
              <Suspense fallback={<CardsRowSectionSkeleton id="work" bgClass="bg-[#eaf4ff]" />}>
                <WorkGallery />
              </Suspense>
            </ScrollRevealSection>
          </VisibleSection>

          {/* Founder Section: Rachid Elfazni */}
          <VisibleSection id="about">
            <ScrollRevealSection>
              <Suspense fallback={<GenericSectionSkeleton id="about" />}>
                <FounderSection />
              </Suspense>
            </ScrollRevealSection>
          </VisibleSection>

          {/* FAQ Accordion */}
          <VisibleSection id="faq">
            <ScrollRevealSection>
              <Suspense fallback={<GenericSectionSkeleton id="faq" />}>
                <FAQSection />
              </Suspense>
            </ScrollRevealSection>
          </VisibleSection>

          {/* Legal Disclaimer Section (إخلاء المسؤولية) */}
          <ScrollRevealSection>
            <Suspense fallback={<GenericSectionSkeleton id="disclaimer" />}>
              <DisclaimerSection />
            </Suspense>
          </ScrollRevealSection>

          {/* Direct Email / WhatsApp Contact Form */}
          <VisibleSection id="contact-form">
            <ScrollRevealSection>
              <Suspense fallback={<GenericSectionSkeleton id="contact-form" />}>
                <ContactFormSection />
              </Suspense>
            </ScrollRevealSection>
          </VisibleSection>

          </OrderedSections>
          {/* Bottom High Impact CTA */}
          <ScrollRevealSection>
            <Suspense fallback={<GenericSectionSkeleton dark />}>
              <ContactCTA />
            </Suspense>
          </ScrollRevealSection>
        </main>

        {/* Footer */}
        <ScrollRevealSection>
          <Footer onNavigate={handleNavigate} />
        </ScrollRevealSection>

        {/* Persistent Floating WhatsApp (desktop & general) */}
        <FloatingWhatsApp />

        {/* Real-time Visitor Live Chat Widget */}
        <VisitorLiveChat />

        {/* Mobile Quick Action Dock (iOS-style bottom dock for smartphones) */}
        <MobileQuickDock
          onOpenFlightModal={() => setFlightModalOpen(true)}
          onOpenConsularModal={() => handleOpenConsular()}
        />

        {/* Start Request Modal (Guided 4-Step Intake) */}
        <StartRequestModal
          isOpen={startRequestModalOpen}
          onClose={() => setStartRequestModalOpen(false)}
          initialServiceId={initialRequestService}
        />

        {/* Flight Booking Modal */}
        <VisibleService serviceKey="flights">
          <FlightBookingModal
            isOpen={flightModalOpen}
            onClose={() => setFlightModalOpen(false)}
          />
        </VisibleService>

        {/* Consular Appointment Modal */}
        <VisibleService serviceKey="consular">
          <ConsularBookingModal
            isOpen={consularModalOpen}
            onClose={() => setConsularModalOpen(false)}
            defaultService={defaultConsularService}
          />
        </VisibleService>

        {/* In-Depth Guide Article Reader Modal */}
        <GuideReaderModal
          guide={activeGuide}
          onClose={() => setActiveGuide(null)}
          onOpenFlightModal={() => setFlightModalOpen(true)}
          onOpenConsularModal={() => handleOpenConsular()}
        />
        </div>
      </SiteSettingsProvider>
    </LanguageProvider>
  );
}
