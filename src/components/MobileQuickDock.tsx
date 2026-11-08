import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plane, Building2, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { WhatsAppLogo } from './WhatsAppLogo';

interface MobileQuickDockProps {
  onOpenFlightModal?: () => void;
  onOpenConsularModal?: () => void;
}

export const MobileQuickDock: React.FC<MobileQuickDockProps> = ({
  onOpenFlightModal,
  onOpenConsularModal,
}) => {
  const { t } = useLanguage();
  const {
    settings,
    isServiceVisible,
    isChatOpen,
    toggleChat,
    unreadChatCount,
    adminOnline,
  } = useSiteSettings();
  const handleGeneralWA = () => {
    const msg = `مرحباً ${settings.siteNameEn || 'ELFAZNI SERVICES'}، أود الاستفسار عن خدماتكم في تركيا.`;
    const waUrl = `https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConsularAction = () => {
    if (onOpenConsularModal) {
      onOpenConsularModal();
    } else {
      window.location.href = '/#consular-checklist';
    }
  };

  const handleFlightAction = () => {
    if (onOpenFlightModal) {
      onOpenFlightModal();
    } else {
      window.location.href = '/#airlines';
    }
  };

  return (
    <AnimatePresence>
      {!isChatOpen && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="lg:hidden fixed bottom-[max(.75rem,env(safe-area-inset-bottom))] inset-x-3 z-40 flex justify-center pointer-events-none"
        >
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl rounded-2xl p-1.5 flex items-center justify-between gap-1.5 pointer-events-auto ring-1 ring-slate-900/5">
            {/* 1. Consular button */}
            {isServiceVisible('consular') && <button
              type="button"
              onClick={handleConsularAction}
              className="flex-1 py-2 px-1.5 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 hover:text-[#004AA5] hover:bg-blue-50/80 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Building2 className="w-4 h-4 text-[#004AA5]" />
              <span className="text-[11px] font-black">{t('قنصلية')}</span>
            </button>}

            {/* 2. Flights button */}
            {isServiceVisible('flights') && <button
              type="button"
              onClick={handleFlightAction}
              className="flex-1 py-2 px-1.5 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 hover:text-[#004AA5] hover:bg-blue-50/80 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plane className="w-4 h-4 text-[#004AA5]" />
              <span className="text-[11px] font-black">{t('طيران')}</span>
            </button>}

            {/* 3. Integrated Live Chat Button (Next to WhatsApp) */}
            <button
              type="button"
              onClick={toggleChat}
              aria-label={t('محادثة')}
              className={`relative flex-[1.25] py-2.5 px-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                isChatOpen
                  ? 'bg-[#0B2E57] text-white ring-2 ring-blue-400'
                  : 'bg-gradient-to-r from-[#004AA5] to-[#0B2E57] text-white'
              }`}
            >
              <div className="relative flex items-center">
                <MessageSquare className="w-4 h-4" />
                {adminOnline && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-[#0B2E57]" />
                )}
              </div>
              <span className="text-xs font-black">{t('محادثة')}</span>
              {unreadChatCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full tabular-nums">
                  {unreadChatCount}
                </span>
              )}
            </button>

            {/* 4. Primary WhatsApp Button */}
            <button
              type="button"
              onClick={handleGeneralWA}
              className="flex-[1.25] py-2.5 px-2.5 rounded-xl bg-gradient-to-r from-[#25d366] to-[#128c7e] text-white flex items-center justify-center gap-1.5 active:scale-95 shadow-sm shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <WhatsAppLogo className="w-4 h-4 shrink-0" />
              <span className="text-xs font-black">{t('واتساب')}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
