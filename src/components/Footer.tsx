import React from 'react';
import { ArrowUp, Instagram, Facebook, Phone, Mail, MapPin, Clock, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { WhatsAppLogo } from './WhatsAppLogo';
import { BrandLogo } from './common/BrandLogo';

interface FooterProps {
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t, isRtl } = useLanguage();
  const { settings, isPublicAnchorVisible, isServiceVisible } = useSiteSettings();
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  const siteLinks = [
    { href: '#top', label: t('الرئيسية') },
    { href: '/blog', label: t('المدونة والمقالات') || 'المدونة والمقالات', isRoute: true },
    { href: '#services', label: t('الخدمات المتكاملة') },
    { href: '#consular-checklist', label: t('مواعيد القنصلية') },
    { href: '#airlines', label: t('حجوزات الطيران') },
    { href: '#airport-transfer', label: t('توصيل المطار VIP') },
    { href: '#guides', label: t('دليل الجالية المغربية') },
    { href: '#about', label: t('من نحن والمؤسس') },
    { href: '#faq', label: t('الأسئلة الشائعة') },
    { href: '/hub', label: t('بوابة الخدمات الموحدة (HUB)') || 'بوابة HUB', isRoute: true },
    { href: '/admin', label: t('لوحة التحكم (Admin)'), isRoute: true },
  ];

  const popularServices = [
    { href: '#consular-checklist', label: t('شهادة أهلية الزواج في تركيا') },
    { href: '#consular-checklist', label: t('مواعيد القنصلية بإسطنبول وأنقرة') },
    { href: '#airlines', label: t('حجز الطيران والفنادق') },
    { href: '#services', key: 'translation', label: t('الترجمة المحلفة وتصديق الأبوستيل') },
    { href: '#services', key: 'residency', label: t('تجديد الإقامات ومتابعة الهجرة') },
    { href: '#airport-transfer', label: t('سيارات التوصيل والاستقبال VIP') },
    { href: '#consular-checklist', label: t('توكيلات رسمية وجوازات السفر') },
  ];

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800/80 relative overflow-hidden">
      {/* Subtle background glow */}
      <div 
        className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" 
        aria-hidden="true" 
      />
      <div 
        className="absolute -top-32 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        
        {/* Top Direct Assistance Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5 text-center md:text-start max-w-xl">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {t('هل لديك استفسار أو تحتاج مساعدة فورية؟')}
            </h3>
            <p className="text-sm text-slate-400 font-normal leading-relaxed">
              {t('فريقنا متاح للرد على استفساراتكم ومتابعة طلباتكم خطوة بخطوة.')}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <a
              href={`https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(
                'مرحباً ELFAZNI SERVICES، أود الاستفسار عن خدماتكم.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/60 active:scale-[0.98] transition-all cursor-pointer"
            >
              <WhatsAppLogo className="w-5 h-5" />
              <span>{t('بدء محادثة واتساب')}</span>
            </a>

            <a
              href={`tel:+${settings.whatsappRaw}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700/80 transition-colors"
            >
              <Phone className="w-4 h-4 text-blue-400" />
              <span dir="ltr">{settings.phone}</span>
            </a>
          </div>
        </div>

        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-slate-800/80">
          
          {/* Column 1: Brand Info (col-span-4) */}
          <div className="lg:col-span-4 space-y-5 text-center sm:text-start">
            <a href="#top" className="inline-block" aria-label="ELFAZNI SERVICES">
              <BrandLogo
                background="blue"
                orientation="horizontal"
                size="lg"
                className="h-[62px] w-auto mx-auto sm:mx-0 hover:opacity-90 transition-opacity"
              />
            </a>
            
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-sm mx-auto sm:mx-0">
              {t(settings.taglineAr || 'خدمات سهلة وواضحة للجالية المغربية والزوار في تركيا.')}
            </p>

            <div className="flex flex-col gap-2 pt-1 text-xs text-slate-400">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-slate-300 font-medium">{t('متاحون يومياً لخدمتكم')}</span>
                <span>·</span>
                <span>{settings.workingHoursAr || '08:00 - 23:00'}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{t(settings.addressAr || 'إسطنبول، تركيا')}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Navigation Menu (col-span-2 or 3) */}
          <div className="lg:col-span-2 space-y-4 text-center sm:text-start">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">
              {t('قائمة الموقع')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {siteLinks.filter((link) => isPublicAnchorVisible(link.href)).map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href.startsWith('#') && location.pathname !== '/' ? '/' + link.href : link.href}
                    onClick={(e) => {
                      if (link.isRoute && onNavigate) {
                        e.preventDefault();
                        onNavigate(link.href);
                      }
                    }}
                    className="group inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowIcon className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Featured Services Menu (col-span-3) */}
          <div className="lg:col-span-3 space-y-4 text-center sm:text-start">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">
              {t('خدماتنا الأكثر طلباً')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {popularServices.filter((link) => isPublicAnchorVisible(link.href) && (!link.key || isServiceVisible(link.key))).map((service, idx) => (
                <li key={idx}>
                  <a
                    href={service.href}
                    className="group inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <ArrowIcon className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
                    <span className="line-clamp-1">{service.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Social (col-span-3) */}
          <div className="lg:col-span-3 space-y-4 text-center sm:text-start">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">
              {t('التواصل والدعم')}
            </h4>
            
            <div className="space-y-3 text-sm">
              <a
                href={`https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(
                  'مرحباً ELFAZNI SERVICES، أود الاستفسار عن خدماتكم.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center sm:justify-start gap-3 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 text-slate-300 hover:text-white transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-start">
                  <div className="text-xs text-slate-400 font-medium">WhatsApp Direct</div>
                  <div className="font-semibold text-slate-200 tabular-nums" dir="ltr">{settings.phone}</div>
                </div>
              </a>

              <a
                href={`mailto:${settings.email}`}
                className="flex items-center justify-center sm:justify-start gap-3 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 text-slate-300 hover:text-white transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="text-start">
                  <div className="text-xs text-slate-400 font-medium">Email</div>
                  <div className="font-medium text-slate-200 text-xs sm:text-sm truncate max-w-[180px]">{settings.email}</div>
                </div>
              </a>
            </div>

            {/* Social Links */}
            <div className="pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
                {t('حسابات التواصل الاجتماعي')}
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-[#004AA5] border border-slate-800 hover:border-blue-500 text-slate-300 hover:text-white transition-all cursor-pointer group"
                  aria-label="Instagram ELFAZNI SERVICES"
                >
                  <Instagram className="w-4 h-4 text-pink-400 group-hover:text-white transition-colors" />
                  <span className="text-xs font-medium">Instagram</span>
                </a>
                <a
                  href={settings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-[#004AA5] border border-slate-800 hover:border-blue-500 text-slate-300 hover:text-white transition-all cursor-pointer group"
                  aria-label="Facebook ELFAZNI SERVICES"
                >
                  <Facebook className="w-4 h-4 text-blue-400 group-hover:text-white transition-colors" />
                  <span className="text-xs font-medium">Facebook</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-xs sm:text-sm text-slate-400">
          <div className="space-y-1 text-center sm:text-start">
            <p>
              © {currentYear} <b className="text-slate-200">ELFAZNI SERVICES</b>. {t('جميع الحقوق محفوظة.')}
            </p>
            <p className="text-xs text-slate-400 font-normal">
              {t('خدمة إدارية وسياحية متخصصة عن بُعد عبر واتساب · الدفع بحوالة بنكية')}
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
              aria-label={t('العودة للأعلى')}
            >
              <ArrowUp className="w-4 h-4 text-blue-400" />
              <span>{t('العودة للأعلى')}</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
