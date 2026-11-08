import React from 'react';
import { PhoneCall } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { WhatsAppLogo } from './WhatsAppLogo';

export const ContactCTA: React.FC = () => {
  const { t, language } = useLanguage();
  const { settings } = useSiteSettings();

  const whatsappUrl = `https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(
    'مرحباً ELFAZNI SERVICES، أود بدء معاملتي والاستفسار عن الخطوات المطلوبة.'
  )}`;

  return (
    <section className="py-16 md:py-20 bg-[#0B2E57] relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="bg-gradient-to-b from-[#0E4B87] to-[#001233] p-8 sm:p-12 md:p-14 rounded-[2rem] border border-[#CC9048]/35 shadow-2xl">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#CC9048]/20 text-[#E3C88F] font-bold text-xs sm:text-sm mb-5 border border-[#CC9048]/35">
            {t('جاهز لبدء طلبك؟')} · {t('تواصل مباشر وسريع')}
          </span>

          <h2 className="tracking-tight mb-4">
            {language === 'tr' ? (
              <>
                <span className="block font-black text-white">WhatsApp’tan Bize Ulaşın</span>
                <span className="block font-extralight font-bahij-bold text-[#E3C88F] mt-1">
                  İşleminizi Hemen Başlatalım
                </span>
              </>
            ) : language === 'en' ? (
              <>
                <span className="block font-black text-white">Contact Us on WhatsApp</span>
                <span className="block font-extralight font-bahij-bold text-[#E3C88F] mt-1">
                  Let’s Start Your Request Right Away
                </span>
              </>
            ) : language === 'fr' ? (
              <>
                <span className="block font-black text-white">Contactez-nous sur WhatsApp</span>
                <span className="block font-extralight font-bahij-bold text-[#E3C88F] mt-1">
                  Commençons Votre Démarche Immédiatement
                </span>
              </>
            ) : (
              <>
                <span className="block font-black text-white">تواصل الآن عبر واتساب</span>
                <span className="block font-extralight font-bahij-bold text-[#E3C88F] mt-1">
                  لبدء معاملتك أو حجز رحلتك في تركيا
                </span>
              </>
            )}
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-blue-100/85 mb-8 max-w-xl mx-auto leading-relaxed">
            {t('أرسل لنا نوع الخدمة، وسنجيبك بالخطوات المطلوبة فوراً ونبدأ التنسيق معك خطوة بخطوة.')}
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-base font-black px-8 py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <WhatsAppLogo className="w-5 h-5" />
              <span>{t('تواصل الآن عبر واتساب')}</span>
            </a>

            <a
              href={`tel:+${settings.whatsappRaw}`}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/15 text-white text-base font-bold px-6 py-4 rounded-xl border border-white/15 transition-all cursor-pointer tabular-nums"
              dir="ltr"
            >
              <PhoneCall className="w-4 h-4 text-[#E3C88F]" />
              <span>{settings.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
