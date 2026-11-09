import React, { useState } from 'react';
import { Plane, ArrowLeft, ArrowRight, Play, Pause, Compass } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AIRLINES_LIST } from '../data/content';
import { AirlineLogoMarquee } from './AirlineLogoMarquee';

interface AirlinesSectionProps {
  onOpenFlightModal: () => void;
}

export const AirlinesSection: React.FC<AirlinesSectionProps> = ({ onOpenFlightModal }) => {
  const { t, isRtl, language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(true);

  // Divide active airlines into 2 balanced rows for the dual-row marquee
  const visibleAirlines = AIRLINES_LIST.filter((a) => !a.hidden && a.slug !== 'air-france');
  const midPoint = Math.ceil(visibleAirlines.length / 2);
  const row1 = visibleAirlines.slice(0, midPoint);
  const row2 = visibleAirlines.slice(midPoint);

  return (
    <section
      id="airlines"
      aria-labelledby="airlines-heading"
      className="py-20 sm:py-28 bg-[#eaf4ff] relative overflow-hidden border-y border-[#D7E7F7]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 text-[#004AA5] text-xs sm:text-sm font-bold">
            <Compass className="w-4 h-4 text-[#CC9048]" />
            <span>{t('طيران وسفر')}</span>
          </div>

          <h2
            id="airlines-heading"
            className="tracking-tight"
          >
            {language === 'tr' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Uçak Bileti Rezervasyonları</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Seyahatiniz Buradan Başlıyor</span>
              </>
            ) : language === 'en' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Flight Ticket Bookings</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Your Journey Starts Here</span>
              </>
            ) : language === 'fr' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Réservation de Billets d’Avion</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Votre voyage commence ici</span>
              </>
            ) : (
              <>
                <span className="block font-black text-[#0B2E57]">حجوزات تذاكر الطيران</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">رحلتك تبدأ من هنا</span>
              </>
            )}
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-[#5E7086] font-normal max-w-2xl mx-auto">
            {language === 'ar' &&
              'أخبرنا بوجهتك وموعد سفرك، لنساعدك في البحث ومقارنة الخيارات المتاحة.'}
            {language === 'tr' &&
              'Rotanızı ve seyahat tarihinizi belirtin, mevcut tüm uçuş seçeneklerini araştırıp karşılaştıralım.'}
            {language === 'en' &&
              'Share your destination and travel dates with us, and we’ll search and compare all available options for you.'}
            {language === 'fr' &&
              'Indiquez-nous votre destination et vos dates de voyage afin de comparer les meilleures options disponibles.'}
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenFlightModal}
              className="px-8 py-4 rounded-full bg-[#004AA5] hover:bg-[#2A83D5] text-white font-bold text-sm sm:text-base shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Plane className="w-4 h-4 text-[#E3C88F]" />
              <span>{t('جهّز طلب رحلتك')}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>

            {/* Play / Pause Toggle Button */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-11 h-11 rounded-full bg-[#FFFFFF] hover:bg-[#eaf4ff] border border-[#D7E7F7] text-[#5E7086] hover:text-[#0B2E57] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              aria-label={isPlaying ? t('إيقاف الشريط المتحرك مؤقتاً') : t('تشغيل الشريط المتحرك')}
              title={isPlaying ? t('إيقاف مؤقت') : t('تشغيل')}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
          </div>
        </div>

        {/* Dual-Row Infinite Marquee Ticker — measured seamless loops (row 1 right-to-left, row 2 left-to-right) */}
        <div className="space-y-4 relative py-2">
          {/* Row 1: Forward Marquee */}
          <AirlineLogoMarquee
            items={row1}
            direction="forward"
            playing={isPlaying}
            label={t('شعارات شركات الطيران — الصف الأول')}
          />

          {/* Row 2: Reverse Marquee */}
          <AirlineLogoMarquee
            items={row2}
            direction="reverse"
            playing={isPlaying}
            label={t('شعارات شركات الطيران — الصف الثاني')}
          />
        </div>

        {/* Transparent, Honest Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
            {language === 'ar' &&
              'تُعرض الشعارات للتعريف بإمكانيات البحث والمقارنة فقط، ولا تعني وجود شراكة حصرية أو وكالة رسمية.'}
            {language === 'tr' &&
              'Logolar yalnızca arama ve karşılaştırma imkânlarını göstermek amaçlıdır; resmi münhasır ortaklık ifade etmez.'}
            {language === 'en' &&
              'Logos are shown strictly to demonstrate search and comparison coverage; they do not imply an exclusive official agency.'}
            {language === 'fr' &&
              'Les logos sont affichés à titre indicatif pour la comparaison des vols et n’impliquent aucun partenariat exclusif.'}
          </p>
        </div>
      </div>
    </section>
  );
};
