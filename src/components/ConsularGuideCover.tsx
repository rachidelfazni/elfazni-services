import React from 'react';
import { CalendarCheck, FileCheck2, Plane, Car, Phone, ArrowLeft, ArrowRight, Printer } from 'lucide-react';
import { BrandLogo } from './common/BrandLogo';
import { WhatsAppLogo } from './WhatsAppLogo';
import { useLanguage } from '../context/LanguageContext';

interface ConsularGuideCoverProps {
  onNavigate?: (path: string) => void;
}

export const ConsularGuideCover: React.FC<ConsularGuideCoverProps> = ({ onNavigate }) => {
  const { isRtl } = useLanguage();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4 sm:px-6 flex flex-col items-center justify-center font-sans">
      {/* Top action toolbar (hidden when printing) */}
      <div className="w-full max-w-xl mb-4 flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={() => (onNavigate ? onNavigate('/') : window.location.replace('/'))}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>العودة إلى الموقع</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#004AA5] hover:bg-[#0B70DD] text-white text-xs font-bold shadow-md transition cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة / تصدير الغلاف</span>
        </button>
      </div>

      {/* Main Cover Card (A4 Aspect Ratio: ~1 : 1.414) */}
      <div
        className="w-full max-w-[540px] aspect-[1/1.414] bg-gradient-to-b from-[#01336F] via-[#0B2E57] to-[#01224A] text-white rounded-3xl shadow-2xl border border-white/15 overflow-hidden flex flex-col justify-between p-7 sm:p-9 relative select-none print:shadow-none print:m-0 print:p-8 print:w-full print:max-w-none print:aspect-auto print:h-screen"
        dir="rtl"
      >
        {/* Decorative background glow & luxury curves */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Block */}
        <header className="relative z-10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/15 pb-4">
            <BrandLogo background="blue" orientation="horizontal" size="md" className="h-9 sm:h-11 w-auto" />
            <div className="text-left">
              <span className="block text-[11px] font-black tracking-wider text-[#E6BD67] uppercase">
                دليل الفزني للخدمات
              </span>
              <span className="block text-[9px] text-white/70 font-semibold" dir="ltr">
                ELFAZNI GUIDE · 2026
              </span>
            </div>
          </div>

          <div className="pt-2 text-center space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-[#CC9048]/20 border border-[#CC9048]/40 text-[#E6BD67] text-xs font-bold tracking-wide">
              دليل شامل بالعربية والتركية · Fas konsolosluk belge rehberi
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight pt-1">
              دليل الوثائق القنصلية المغربية
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 font-medium max-w-md mx-auto leading-relaxed">
              سبع خدمات للمغاربة المقيمين في تركيا، إسطنبول وأنقرة
            </p>
          </div>
        </header>

        {/* Center 3D Visual Asset */}
        <div className="relative z-10 flex-1 my-3 flex items-center justify-center">
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square flex items-center justify-center">
            <img
              src="/assets/brand/3d/02-consular-documents-transparent.png"
              alt="وثائق المعاملات القنصلية"
              className="w-full h-full object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.4)]"
            />
          </div>
        </div>

        {/* 4 Primary Service Blocks Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-2.5 sm:gap-3 my-2">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#CC9048]/25 text-[#E6BD67] flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">المواعيد القنصلية</h4>
              <p className="text-[10px] text-blue-200 truncate">إسطنبول وأنقرة</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#CC9048]/25 text-[#E6BD67] flex items-center justify-center shrink-0">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">الترجمة المحلفة</h4>
              <p className="text-[10px] text-blue-200 truncate">وتصديق الأبوستيل</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#CC9048]/25 text-[#E6BD67] flex items-center justify-center shrink-0">
              <Plane className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">حجوزات الطيران</h4>
              <p className="text-[10px] text-blue-200 truncate">والفنادق بأسعار خاصة</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#CC9048]/25 text-[#E6BD67] flex items-center justify-center shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">توصيل المطار</h4>
              <p className="text-[10px] text-blue-200 truncate">استقبال VIP خاص</p>
            </div>
          </div>
        </div>

        {/* Footer Block */}
        <footer className="relative z-10 pt-3 border-t border-white/15 space-y-2.5 text-center">
          {/* Contact Badge */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold">
            <a
              href="https://wa.me/905522677851"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 transition"
            >
              <WhatsAppLogo className="w-4 h-4" />
              <span>راسلنا عبر واتساب:</span>
              <span dir="ltr" className="font-mono text-white">
                +90 552 267 78 51
              </span>
            </a>
          </div>

          <div className="flex items-center justify-between text-[10px] text-white/60 border-t border-white/10 pt-2">
            <span>رشيد الفزني · مؤسس الفزني للخدمات</span>
            <span>مساعدة استشارية وإدارية مستقلة</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ConsularGuideCover;
