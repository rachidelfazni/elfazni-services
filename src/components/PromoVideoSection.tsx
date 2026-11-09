import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Sparkles,
  MessageCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Award,
  Plane,
  FileCheck,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SITE_CONTACT } from '../data/content';

interface PromoVideoSectionProps {
  onOpenStartModal?: () => void;
}

export const PromoVideoSection: React.FC<PromoVideoSectionProps> = ({ onOpenStartModal }) => {
  const { t, language, isRtl } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Auto-play immediately on mount and continuous loop
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        // Fallback if browser policy blocks initial autoplay
        setIsPlaying(false);
      });
    }
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!duration && videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const whatsappUrl = `https://wa.me/${SITE_CONTACT.whatsappRaw || '905377885333'}?text=${encodeURIComponent(
    'السلام عليكم، أرغب في الاستفسار عن خدمات الفزني في تركيا.'
  )}`;

  return (
    <section
      id="promo-video"
      className="py-14 sm:py-18 bg-gradient-to-b from-[#FFFFFF] via-[#F4F8FC] to-[#FFFFFF] relative overflow-hidden"
    >
      {/* Decorative Brand Ambient Glows */}
      <div className="absolute top-1/4 -right-24 w-80 h-80 bg-[#004AA5]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-24 w-80 h-80 bg-[#CC9048]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#004AA5]/10 border border-[#004AA5]/20 text-[#004AA5] text-xs font-black shadow-2xs">
            <Sparkles size={14} className="text-[#CC9048]" />
            <span>
              {language === 'tr'
                ? 'Resmi Tanıtım Videosu · 2026'
                : language === 'en'
                ? 'Official Promotional Video · 2026'
                : language === 'fr'
                ? 'Vidéo Promotionnelle Officielle · 2026'
                : 'الفيديو الإشهاري الرسمي · 2026'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0B2E57] tracking-tight leading-snug">
            {language === 'tr' ? (
              <>Türkiye’deki Tüm İşlemlerinizde <span className="text-[#004AA5]">Güvenilir Çözüm Ortağınız</span></>
            ) : language === 'en' ? (
              <>Your Trusted Partner for <span className="text-[#004AA5]">All Services in Türkiye</span></>
            ) : language === 'fr' ? (
              <>Votre Partenaire de Confiance pour <span className="text-[#004AA5]">Vos Démarches en Turquie</span></>
            ) : (
              <>شاهد كيف نرافقك في <span className="text-[#004AA5]">كافة معاملاتك وسفرياتك في تركيا</span></>
            )}
          </h2>

          <p className="text-xs sm:text-sm text-[#5E7086] font-medium max-w-2xl mx-auto leading-relaxed">
            {language === 'tr'
              ? 'Rachid Elfazni doğrudan gözetiminde konsolosluk randevuları, yeminli tercüme ve seyahat organizasyonu.'
              : language === 'en'
              ? 'Directly supervised by Rachid Elfazni for consular bookings, certified translations, flights, and VIP airport services.'
              : language === 'fr'
              ? 'Sous la supervision directe de Rachid Elfazni pour vos démarches consulaires, traductions et voyages.'
              : 'مواكبة مباشرة ودقيقة بإشراف رشيد الفزني لجميع معاملات القنصلية، الترجمة المحلفة، وحجوزات الطيران والاستقبال.'}
          </p>
        </div>

        {/* 2-Column Professional Compact Trust Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center max-w-6xl mx-auto">
          {/* Column 1 (7 cols on Desktop): Auto-looping Branded Video */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_16px_50px_rgba(11,46,87,0.16)] border border-[#004AA5]/20 bg-slate-950 relative group">
              <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  src="/assets/videos/ELFAZNI_SERVICES_BRANDED.mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted={isMuted}
                  loop
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                />

                {/* Floating Audio Toggle Pill (Top End) */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`absolute top-3 end-3 px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer ${
                    isMuted
                      ? 'bg-amber-500/90 hover:bg-amber-500 text-white animate-pulse'
                      : 'bg-black/60 hover:bg-black/80 text-white border border-white/20'
                  }`}
                  title={isMuted ? 'انقر لتشغيل الصوت' : 'كتم الصوت'}
                >
                  {isMuted ? (
                    <>
                      <VolumeX size={14} className="text-white" />
                      <span>انقر لسماع الصوت 🔊</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={14} className="text-emerald-400" />
                      <span>الصوت يعمل</span>
                    </>
                  )}
                </button>

                {/* Center Play/Pause button on manual pause */}
                {!isPlaying && (
                  <div
                    onClick={togglePlay}
                    className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition-opacity"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#004AA5] to-[#2A83D5] text-white flex items-center justify-center shadow-2xl ring-4 ring-white/30 transform hover:scale-110 active:scale-95 transition-all">
                      <Play size={28} className="ms-1 fill-white" />
                    </div>
                  </div>
                )}

                {/* Video In-Player Bottom Control Bar */}
                <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/85 via-black/50 to-transparent flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  {/* Progress Line */}
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#004AA5] to-[#CC9048] transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-white">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition backdrop-blur-xs cursor-pointer"
                        title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                      >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-white" />}
                      </button>

                      <button
                        type="button"
                        onClick={toggleMute}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition backdrop-blur-xs cursor-pointer"
                        title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                      >
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>

                      <span className="text-[11px] font-bold text-white/90">
                        {formatTime(currentTime)} / {formatTime(duration || 40)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline text-[11px] font-semibold text-amber-300">
                        الفزني للخدمات · ELFAZNI
                      </span>

                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition backdrop-blur-xs cursor-pointer"
                        title="شاشة كاملة"
                      >
                        <Maximize size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 (5 cols on Desktop): Trust Card ("استخدام رشيد وموثوق") */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-white/80 backdrop-blur-sm p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#004AA5]/15 shadow-sm">
            {/* Founder Endorsement Header */}
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
              <div className="relative">
                <img
                  src="/assets/founder-rachid-elfazni-v2.webp"
                  alt="رشid الفزني - Rachid Elfazni"
                  className="w-13 h-13 rounded-2xl object-cover border-2 border-[#004AA5] shadow-xs"
                />
                <div className="absolute -bottom-1 -end-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white">
                  <ShieldCheck size={11} />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-[#0B2E57]">رشيد الفزني (Rachid Elfazni)</h3>
                  <Award size={14} className="text-[#CC9048]" />
                </div>
                <p className="text-[11px] font-bold text-[#004AA5]">
                  المؤسس والإشراف المباشر على كافة المعاملات
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  خبرة واحترافية في خدمة الجالية المغربية والعربية بتركيا
                </p>
              </div>
            </div>

            {/* 3 Core Trust Pillars */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-black text-[#0B2E57]">حجوزات قنصلية وإدارية دقيقة</div>
                  <div className="text-[11px] text-slate-500">
                    متابعة ملفات جواز السفر، البطاقة الوطنية، وعقود الحالة المدنية خطوة بخطوة.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <Plane size={16} className="text-[#004AA5] mt-0.5 shrink-0" />
                <div>
                  <div className="font-black text-[#0B2E57]">طيران، فنادق واستقبال مطار VIP</div>
                  <div className="text-[11px] text-slate-500">
                    أفضل أسعار التذاكر مع خدمات استقبال وتوصيل بسيارات خاصة حديثة.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <FileCheck size={16} className="text-[#CC9048] mt-0.5 shrink-0" />
                <div>
                  <div className="font-black text-[#0B2E57]">ترجمة محلفة وتصديق رسمي</div>
                  <div className="text-[11px] text-slate-500">
                    ترجمة قانونية معتمدة لدى النوتر التركي والقنصليات بكامل الاعتمادية.
                  </div>
                </div>
              </div>
            </div>

            {/* Direct CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              {onOpenStartModal && (
                <button
                  type="button"
                  onClick={onOpenStartModal}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#004AA5] hover:bg-[#003882] text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>طلب خدمة الآن</span>
                  {isRtl ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                </button>
              )}

              <a
                href="#contact-form"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <MessageCircle size={15} />
                <span>
                  {language === 'tr'
                    ? 'Hemen İletişime Geçin'
                    : language === 'en'
                    ? 'Contact Us Directly'
                    : language === 'fr'
                    ? 'Contactez-nous'
                    : 'تواصل واستفسار فوري'}
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
