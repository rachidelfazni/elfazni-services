import React from 'react';
import { X, BookOpen, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { GuideArticle } from '../data/guides';
import { useLanguage } from '../context/LanguageContext';
import { SITE_CONTACT } from '../data/content';

interface GuideReaderModalProps {
  guide: GuideArticle | null;
  onClose: () => void;
  onOpenFlightModal?: () => void;
  onOpenConsularModal?: () => void;
}

export const GuideReaderModal: React.FC<GuideReaderModalProps> = ({
  guide,
  onClose,
  onOpenFlightModal,
  onOpenConsularModal,
}) => {
  const { t, language, isRtl } = useLanguage();

  if (!guide) return null;

  const currentTitle =
    language === 'tr'
      ? guide.titleTr
      : language === 'en'
        ? guide.titleEn
        : t(guide.title);
  const currentTag =
    language === 'tr'
      ? guide.tagTr
      : language === 'en'
        ? guide.tagEn
        : t(guide.tag);

  const handleAction = () => {
    if (guide.id === 'travel-guide' && onOpenFlightModal) {
      onClose();
      onOpenFlightModal();
    } else if (
      (guide.id === 'consular-services' || guide.id === 'documents-guide') &&
      onOpenConsularModal
    ) {
      onClose();
      onOpenConsularModal();
    } else {
      const waText = `مرحباً، قرأت "${guide.title}" وأريد استفساراً أو مساعدة في هذه الخدمة.`;
      const url = `https://wa.me/${SITE_CONTACT.whatsappRaw}?text=${encodeURIComponent(waText)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#011a3b]/70 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Full Uncropped Thumbnail & Title */}
        <div className="relative bg-gradient-to-br from-[#0B2E57] to-[#012450] p-6 sm:p-8 text-white">
          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center backdrop-blur-md transition-all cursor-pointer`}
            aria-label={t('إغلاق')}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
            <div className="w-32 sm:w-36 aspect-[4/5] rounded-2xl overflow-hidden bg-white p-1 shadow-xl shrink-0">
              <img
                src={guide.image}
                alt={currentTitle}
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            <div className="text-center sm:text-start flex-1">
              <span className="inline-block px-3 py-1 rounded-full bg-[#CC9048] text-white text-xs font-bold mb-2.5">
                {currentTag}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight">
                {t(guide.headline)}
              </h2>
            </div>
          </div>
        </div>

        {/* Article Body */}
        <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto space-y-6">
          <p className="text-base sm:text-lg text-[#0B2E57] font-medium leading-relaxed bg-blue-50/70 p-4 rounded-2xl border border-blue-100">
            {t(guide.lead)}
          </p>

          {guide.sections.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="text-lg font-bold text-[#0B2E57] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2A83D5]" />
                <span>{t(section.title)}</span>
              </h3>

              {section.items && (
                <ul className="space-y-2 mr-2">
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-2.5 text-sm sm:text-base text-gray-700">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                      <span>{t(item)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.content && (
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  {t(section.content)}
                </p>
              )}

              {section.note && (
                <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{t(section.note)}</span>
                </div>
              )}
            </div>
          ))}

          {/* Action Prompt Banner */}
          <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                {t('هل تحتاج مساعدة في تجهيز هذا الملف أو الحجز؟')}
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                {t('نساعدك خطوة بخطوة مع خدمة كاملة عن بُعد عبر واتساب.')}
              </p>
            </div>
            <button
              onClick={handleAction}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#004AA5] hover:bg-[#2A83D5] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer shrink-0"
            >
              <span>{t('ابدأ الآن')}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
