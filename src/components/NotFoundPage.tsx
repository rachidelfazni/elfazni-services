import React from 'react';
import { Home, MessageCircle, ArrowLeft, ArrowRight, Compass, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { BrandLogo } from './common/BrandLogo';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
  onOpenContact?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate, onOpenContact }) => {
  const { language, isRtl, setLanguage } = useLanguage();

  const copy = {
    ar: {
      badge: 'رمز الخطأ 404',
      title: 'الصفحة غير موجودة',
      subtitle: 'عذرًا، الصفحة أو المسار الذي تحاول الوصول إليه غير موجود أو تم نقله.',
      homeBtn: 'العودة للرئيسية',
      contactBtn: 'تواصل معنا',
      whatsappBtn: 'مراسلة الدعم عبر واتساب',
      hint: 'إذا كنت تبحث عن خدمة معينة أو متابعة معاملة قنصلية، يسعدنا مساعدتك مباشرة.',
    },
    en: {
      badge: 'Error Code 404',
      title: 'Page Not Found',
      subtitle: 'Sorry, the page or path you are trying to reach does not exist or has been moved.',
      homeBtn: 'Back to Home',
      contactBtn: 'Contact Us',
      whatsappBtn: 'WhatsApp Support',
      hint: 'Looking for a specific service or consular assistance? We are here to help.',
    },
    fr: {
      badge: "Code d'erreur 404",
      title: 'Page introuvable',
      subtitle: 'Désolé, la page que vous cherchez n’existe pas ou a été déplacée.',
      homeBtn: "Retour à l'accueil",
      contactBtn: 'Contactez-nous',
      whatsappBtn: 'Assistance WhatsApp',
      hint: 'Besoin d’aide pour un service ou une démarche consulaire ? Contactez-nous.',
    },
    tr: {
      badge: 'Hata Kodu 404',
      title: 'Sayfa Bulunamadı',
      subtitle: 'Üzgünüz, aradığınız sayfa veya bağlantı bulunamadı veya taşındı.',
      homeBtn: 'Ana Sayfaya Dön',
      contactBtn: 'Bize Ulaşın',
      whatsappBtn: 'WhatsApp Destek',
      hint: 'Belirli bir işlem veya konsolosluk hizmeti için doğrudan destek alabilirsiniz.',
    },
  }[language] || {
    badge: '404',
    title: 'Page Not Found',
    subtitle: 'Page not found',
    homeBtn: 'Home',
    contactBtn: 'Contact',
    whatsappBtn: 'WhatsApp',
    hint: '',
  };

  const handleContactClick = () => {
    if (onOpenContact) {
      onOpenContact();
    } else {
      onNavigate('/');
      setTimeout(() => {
        const el = document.getElementById('contact-form');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  return (
    <div
      className="min-h-screen bg-radial from-[#0B2E57] via-[#012247] to-[#000E20] text-white flex flex-col justify-between selection:bg-[#CC9048] selection:text-white"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="focus:outline-none cursor-pointer transition-transform hover:scale-105"
          aria-label="ELFAZNI SERVICES Home"
        >
          <BrandLogo background="blue" orientation="horizontal" size="md" />
        </button>

        {/* 4-Language Switcher */}
        <div
          className="flex items-center bg-white/10 backdrop-blur-md p-0.5 rounded-full border border-white/15 text-xs font-bold"
          role="group"
          aria-label="Language selector"
        >
          {(['ar', 'tr', 'en', 'fr'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              aria-label={`Switch language to ${lang === 'ar' ? 'العربية' : lang.toUpperCase()}`}
              aria-pressed={language === lang}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                language === lang
                  ? 'bg-[#CC9048] text-white shadow-xs font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {lang === 'ar' ? 'ع' : lang.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 z-10">
        <div className="w-full max-w-xl text-center bg-white/5 backdrop-blur-xl border border-white/15 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#CC9048]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#004AA5]/40 rounded-full blur-3xl pointer-events-none" />

          {/* 404 Big Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#CC9048]/15 border border-[#CC9048]/30 text-[#E7B87A] text-xs font-black mb-6">
            <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '10s' }} />
            <span>{copy.badge}</span>
          </div>

          <h1 className="text-7xl sm:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-[#CC9048]/80 mb-3 font-mono">
            404
          </h1>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            {copy.title}
          </h2>

          <p className="text-sm sm:text-base text-slate-300 mb-8 max-w-md mx-auto leading-relaxed">
            {copy.subtitle}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#CC9048] to-[#B37933] hover:from-[#dca058] hover:to-[#CC9048] text-white font-black text-sm shadow-lg shadow-[#CC9048]/20 transition-all active:scale-95 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>{copy.homeBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleContactClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[#E7B87A]" />
              <span>{copy.contactBtn}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            {copy.hint}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-slate-400 border-t border-white/10 z-10">
        © {new Date().getFullYear()} ELFAZNI SERVICES — جميع الحقوق محفوظة
      </footer>
    </div>
  );
};

