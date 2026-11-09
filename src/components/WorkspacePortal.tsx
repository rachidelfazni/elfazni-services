import React, { useState, useEffect } from 'react';
import { Globe, LayoutDashboard, Users, ArrowUpLeft, Settings } from 'lucide-react';
import { themeService, type InterfaceThemeConfig } from '../services/themeService';
import { BrandLogo } from './common/BrandLogo';

const DEFAULT_APPS = [
  { href: '/crm', title: 'إدارة العملاء', text: 'الحجوزات والمعاملات والمتابعات والديون', Icon: Users, featured: true },
  { href: '/portal', title: 'إدارة الموقع', text: 'المحتوى والخدمات والمحادثات وفريق العمل', Icon: LayoutDashboard, featured: false },
  { href: '/', title: 'زيارة الموقع', text: 'الخدمات والمعلومات المتاحة للزوار', Icon: Globe, featured: false },
];

/**
 * ELFAZNI SERVICES — workspace portal (/workspace).
 *
 * Connected directly to the Theme & Appearance Management System (Portal / HUB theme).
 * Animated edition on the classic navy backdrop with full dynamic theme support.
 */
export function WorkspacePortal() {
  const [theme, setTheme] = useState<InterfaceThemeConfig | null>(null);

  useEffect(() => {
    let active = true;
    themeService.getPublishedTheme('portal').then((t) => {
      if (!active || !t) return;
      setTheme(t);
      themeService.applyCssVariables(t.colors, t.typography);
    }).catch((err) => {
      console.error('Failed to load published portal theme in /workspace', err);
    });
    return () => { active = false; };
  }, []);

  const resolveDestination = (dest: string | undefined, cardId: string) => {
    if (!dest) {
      return cardId === 'crm' ? '/crm' : cardId === 'admin' ? '/portal' : '/';
    }
    if (dest.includes('/admin/login?next=crm') || dest === '/admin/crm' || dest === '/crm') {
      return '/crm';
    }
    if (dest.includes('/admin/login') || dest === '/admin' || dest === '/portal') {
      return '/portal';
    }
    return dest;
  };

  const portalCards = theme?.portalCards || [];
  const apps = portalCards.length > 0
    ? portalCards.filter(c => c.visible !== false).map(c => {
        const Icon = c.id === 'crm' ? Users : c.id === 'admin' ? LayoutDashboard : Globe;
        return {
          href: resolveDestination(c.destination, c.id),
          title: c.title?.ar || c.title?.en || '',
          text: c.description?.ar || c.description?.en || '',
          Icon,
          featured: Boolean(c.featured),
          cardBg: c.cardBg,
          borderColor: c.borderColor,
        };
      })
    : DEFAULT_APPS;

  const eyebrow = theme?.texts?.heroKicker?.ar || 'ELFAZNI SERVICES';
  const headingTitle = theme?.texts?.heroTitle?.ar || 'كل أعمالك، في مكان واحد.';
  const headingDesc = theme?.texts?.heroDescription?.ar || 'اختر مساحة العمل التي تريد الدخول إليها.';

  return (
    <main
      className="workspace-portal"
      dir="rtl"
      style={{
        backgroundColor: theme?.backgroundColor || '#012247',
        backgroundImage: theme?.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
      }}
    >
      <div className="wp-orbs" aria-hidden="true"><i /><i /><i /></div>

      <header>
        <a href="/" className="wp-brandmark" aria-label="ELFAZNI SERVICES">
          <BrandLogo
            background="blue"
            orientation="horizontal"
            size="md"
            className="h-10 w-auto"
          />
        </a>
        <span className="wp-chip">
          <i className="wp-chip-dot" aria-hidden="true" />
          مساحة العمل
        </span>
      </header>

      <section
        className="wp-card"
        style={{
          backgroundColor: theme?.formBg || '#FFFFFF',
          borderRadius: theme?.cardRadius || '30px',
        }}
      >
        <span
          className="portal-eyebrow"
          style={{ color: theme?.kickerColor || '#CC9048' }}
        >
          {eyebrow}
        </span>
        <h1 style={{ color: theme?.formTextColor || '#0B2E57' }}>
          {headingTitle.includes('،') ? (
            <>
              {headingTitle.split('،')[0]}، <span className="wp-accent">{headingTitle.split('،').slice(1).join('،')}</span>
            </>
          ) : (
            headingTitle
          )}
        </h1>
        <p style={{ color: theme?.formMutedColor || '#5E7086' }}>{headingDesc}</p>
        <div className="portal-apps">
          {apps.map(({ href, title, text, Icon, featured, cardBg, borderColor }: any) => (
            <a
              key={href}
              href={href}
              style={{
                backgroundColor: cardBg || (featured ? undefined : '#f7faff'),
                borderColor: borderColor || undefined,
              }}
            >
              <span className="portal-app-icon" aria-hidden="true">
                <Icon size={28} strokeWidth={2.1} />
              </span>
              <h2 style={{ color: theme?.formTextColor || '#0B2E57' }}>{title}</h2>
              <p style={{ color: theme?.formMutedColor || '#5E7086' }}>{text}</p>
              <ArrowUpLeft className="portal-app-arrow" size={20} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <footer>
        {theme?.texts?.secureNote?.ar || 'الفزني للخدمات · دخول الأنظمة بحسب صلاحيات الحساب'}
      </footer>
    </main>
  );
}
