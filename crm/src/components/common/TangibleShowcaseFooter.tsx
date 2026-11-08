import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ArrowDown,
  Building2,
  Plane,
  IdCard,
  Hotel,
  Car,
  Languages,
  HeartHandshake,
  FileCheck2,
  Baby,
  ArrowUpRight,
  ArrowUpLeft,
  Phone,
  Mail,
  Globe2,
  MessageCircle,
  Copy,
  Share2,
  Check,
  Landmark,
  Database,
  ArrowRightLeft,
  ClipboardList,
  Instagram,
  Facebook,
  Plus,
  AlertTriangle,
  ShieldCheck,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { BRAND_CONFIG } from "../../config/brandConfig";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useCopy } from "../../i18n/useCopy";
import {
  BankDetailsShare,
  copyText,
  bankCopyText,
  bankAccountCopyText,
  ibanOf,
} from "./BankDetailsShare";
import { VisibilitySection } from "./VisibilitySection";
interface Props {
  onOpenBackupModal: () => void;
  onOpenExchangeRatesModal: () => void;
  onStartService: (serviceType: string, isFlight?: boolean) => void;
}
export const TangibleShowcaseFooter: React.FC<Props> = ({
  onOpenBackupModal,
  onOpenExchangeRatesModal,
  onStartService,
}) => {
  const { l, isRTL, language } = useCopy();
  const { documentSettings, setActiveTab } = useApp();
  const { user, canViewAccounting } = useAuth();
  const [copied, setCopied] = useState(""),
    [copyError, setCopyError] = useState(false);
  const admin = user?.role === "super_admin" || user?.role === "admin";
  const operational =
    admin || user?.role === "editor" || user?.role === "agent";
  const consulate = operational || !!user?.canAccessConsulate,
    flights = operational || !!user?.canAccessFlights;
  const arrow = isRTL ? <ArrowUpLeft size={16} /> : <ArrowUpRight size={16} />;
  const phone = documentSettings.phone || BRAND_CONFIG.phone,
    email = documentSettings.email || BRAND_CONFIG.email;
  const bankHolder =
    documentSettings.bankAccountHolder ||
    BRAND_CONFIG.bankAccounts.accountHolder;
  const formatIban = (value: string) =>
    value.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
  const bankAccounts = [
    {
      currency: "TRY",
      iban: documentSettings.ibanTRY || BRAND_CONFIG.bankAccounts.ibanTRY,
      label: l(
        "حساب الليرة التركية",
        "Turkish lira account",
        "Compte en livres turques",
      ),
    },
    {
      currency: "USD",
      iban: documentSettings.ibanUSD || BRAND_CONFIG.bankAccounts.ibanUSD,
      label: l(
        "حساب الدولار الأمريكي",
        "US dollar account",
        "Compte en dollars américains",
      ),
    },
  ];
  const ibansIdentical =
    ibanOf(bankAccounts[0].iban) === ibanOf(bankAccounts[1].iban);
  const copyTimer = useRef<number | null>(null);
  const copy = async (key: string, value: string) => {
    setCopyError(false);
    const ok = await copyText(value);
    if (ok) {
      setCopied(key);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(""), 2200);
    } else {
      setCopied("");
      setCopyError(true);
    }
  };
  const shareText = bankCopyText(l, bankHolder, bankAccounts);
  const clientPaymentMessage = l(
    `السلام عليكم ورحمة الله، تفاصيل الحساب البنكي المعتمد لمؤسسة الفزني للخدمات (ELFAZNI SERVICES):\n\nصاحب الحساب: ${bankHolder}\n\n1. حساب الليرة التركية (TRY):\nIBAN: ${ibanOf(bankAccounts[0].iban)}\n\n2. حساب الدولار الأمريكي (USD):\nIBAN: ${ibanOf(bankAccounts[1].iban)}\n\n* يُرجى تزويدنا بصورة إشعار التحويل بعد الإيداع لتأكيد المعاملة وإصدار الإيصال المالي الرسمي.`,
    `Hello, here are the official bank details for ELFAZNI SERVICES:\n\nAccount Holder: ${bankHolder}\n\n1. Turkish Lira (TRY):\nIBAN: ${ibanOf(bankAccounts[0].iban)}\n\n2. US Dollar (USD):\nIBAN: ${ibanOf(bankAccounts[1].iban)}\n\nPlease send us the transfer receipt to confirm your dossier and issue the official receipt.`,
    `Bonjour, voici les coordonnées bancaires officielles d’ELFAZNI SERVICES :\n\nTitulaire : ${bankHolder}\n\n1. Livres turques (TRY) :\nIBAN : ${ibanOf(bankAccounts[0].iban)}\n\n2. Dollars américains (USD) :\nIBAN : ${ibanOf(bankAccounts[1].iban)}\n\nVeuillez nous transmettre le justificatif de virement pour valider votre dossier.`
  );
  const shareDetails = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "ELFAZNI SERVICES", text: shareText });
      } else {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText)}`,
          "_blank",
          "noopener,noreferrer",
        );
      }
    } catch (e) {
      if ((e as DOMException).name !== "AbortError") setCopyError(true);
    }
  };
  const services = [
    {
      id: "consular",
      type: "تجديد جواز سفر",
      icon: Building2,
      group: "core",
      title: l(
        "المعاملات القنصلية",
        "Consular services",
        "Services consulaires",
      ),
      description: l(
        "تجهيز الملفات، حجز المواعيد، ومتابعة مراحل المعاملة.",
        "Prepare documents, arrange appointments and track each stage.",
        "Préparer les pièces, organiser les rendez-vous et suivre chaque étape.",
      ),
    },
    {
      id: "flights",
      type: "حجوزات الطيران",
      flight: true,
      icon: Plane,
      group: "core",
      title: l("حجوزات الطيران", "Flight bookings", "Réservations de vols"),
      description: l(
        "تسجيل الحجوزات والمسارات والتكاليف ومتابعة إصدار التذاكر.",
        "Manage bookings, routes, costs and ticket issue follow-ups.",
        "Gérer les réservations, trajets, coûts et l’émission des billets.",
      ),
    },
    {
      id: "translation",
      type: "الترجمة المحلفة",
      icon: Languages,
      group: "extra",
      title: l(
        "الترجمة والوثائق",
        "Translation & documents",
        "Traduction et documents",
      ),
      description: l(
        "متابعة طلبات الترجمة والمستندات والتصديقات المطلوبة.",
        "Track translation requests, documents and required certifications.",
        "Suivre les traductions, documents et légalisations nécessaires.",
      ),
    },
    {
      id: "residence",
      type: "تجديد الإقامات",
      icon: IdCard,
      group: "extra",
      title: l("ملفات الإقامة", "Residence files", "Dossiers de séjour"),
      description: l(
        "تنظيم المستندات والمواعيد ومتابعة استكمال ملفات الإقامة.",
        "Organize documents and appointments for residence applications.",
        "Organiser les pièces et rendez-vous des demandes de séjour.",
      ),
    },
    {
      id: "hotels",
      type: "حجوزات فنادق",
      icon: Hotel,
      group: "extra",
      title: l("حجوزات الفنادق", "Hotel bookings", "Réservations d’hôtels"),
      description: l(
        "تسجيل طلبات الإقامة الفندقية ومتابعة تفاصيل الحجز.",
        "Record hotel requests and keep booking details together.",
        "Enregistrer les demandes et centraliser les détails des réservations.",
      ),
    },
    {
      id: "transfer",
      type: "توصيل إلى المطار",
      icon: Car,
      group: "extra",
      title: l(
        "النقل من وإلى المطار",
        "Airport transfers",
        "Transferts aéroport",
      ),
      description: l(
        "تنسيق نقاط الاستلام والمواعيد وتفاصيل خدمة النقل.",
        "Coordinate pickup locations, times and transfer details.",
        "Coordonner les lieux, horaires et détails des transferts.",
      ),
    },
    {
      id: "marriage",
      type: "شهادة أهلية الزواج",
      icon: HeartHandshake,
      group: "core",
      title: l(
        "ملفات الزواج والأسرة",
        "Marriage & family files",
        "Dossiers de mariage et famille",
      ),
      description: l(
        "متابعة وثائق الزواج والملفات الأسرية وخطوات استكمالها.",
        "Follow marriage and family documents through each step.",
        "Suivre les documents de mariage et de famille à chaque étape.",
      ),
    },
    {
      id: "agency",
      type: "مواعيد الوكالة",
      icon: FileCheck2,
      group: "core",
      title: l(
        "الوكالات والتصديقات",
        "Powers of attorney",
        "Procurations et légalisations",
      ),
      description: l(
        "تنظيم طلبات الوكالات والوثائق ومواعيد التوثيق.",
        "Organize powers of attorney, documents and certification appointments.",
        "Organiser les procurations, documents et rendez-vous de légalisation.",
      ),
    },
    {
      id: "birth",
      type: "تسجيل المواليد",
      icon: Baby,
      group: "core",
      title: l(
        "الحالة المدنية والمواليد",
        "Civil records & births",
        "État civil et naissances",
      ),
      description: l(
        "متابعة التسجيلات والوثائق العائلية وطلبات الحالة المدنية.",
        "Track registrations, family records and civil status requests.",
        "Suivre les inscriptions, documents familiaux et demandes d’état civil.",
      ),
    },
  ];
  const [slide, setSlide] = useState(0),
    [autoplay, setAutoplay] = useState(true),
    [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false),
    [inView, setInView] = useState(false),
    [reduced, setReduced] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  const galleryRef = useRef<HTMLDivElement>(null),
    thumbsRef = useRef<HTMLDivElement>(null),
    touchStart = useRef<{ x: number; y: number } | null>(null);
  const current = services[slide],
    allowed = current.flight ? flights : consulate;
  const move = (delta: number) =>
    setSlide((i) => (i + delta + services.length) % services.length);
  const art = (id: string) => `/admin/crm/assets/services-universal/${id}.webp`;
  const whatsapp = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(l("مرحباً فريق الفزني للخدمات، أود الاستفسار عن إحدى الخدمات.", "Hello ELFAZNI SERVICES, I would like to ask about a service.", "Bonjour ELFAZNI SERVICES, je souhaite me renseigner sur un service."))}`;
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(q.matches);
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const node = galleryRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!autoplay || hovered || focused || reduced || !inView) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setSlide((i) => (i + 1) % services.length);
    }, 6500);
    return () => clearInterval(id);
  }, [autoplay, hovered, focused, reduced, inView, services.length]);
  useEffect(() => {
    const rail = thumbsRef.current,
      button = rail?.children[slide] as HTMLElement | undefined;
    if (!rail || !button) return;
    const r = rail.getBoundingClientRect(),
      b = button.getBoundingClientRect();
    if (b.left < r.left || b.right > r.right)
      rail.scrollBy({
        left: b.left - r.left - (r.width - b.width) / 2,
        behavior: reduced ? "auto" : "smooth",
      });
  }, [slide, reduced]);
  const tilt = (e: React.PointerEvent<HTMLElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty(
      "--studio-x",
      `${((e.clientX - r.left) / r.width - 0.5) * 8}px`,
    );
    e.currentTarget.style.setProperty(
      "--studio-y",
      `${((e.clientY - r.top) / r.height - 0.5) * 6}px`,
    );
  };
  const untilt = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--studio-x", "0px");
    e.currentTarget.style.setProperty("--studio-y", "0px");
  };
  return (
    <div className="company-studio">
      <VisibilitySection
        sectionId="company-story"
        title={l(
          "عن الفزني للخدمات",
          "About ELFAZNI SERVICES",
          "À propos d’ELFAZNI SERVICES",
        )}
      >
        <section
          className="studio-intro"
          onPointerMove={tilt}
          onPointerLeave={untilt}
        >
          <div className="studio-intro-image">
            <img
              src="/admin/crm/assets/elfazni-istanbul-editorial.png"
              alt={l(
                "إطلالة إسطنبول بلمسات معمارية مغربية",
                "Istanbul with Moroccan architectural details",
                "Istanbul et détails architecturaux marocains",
              )}
            />
            <span className="studio-image-index">01 / ELFAZNI</span>
            <div className="studio-image-caption">
              <span>ISTANBUL · MOROCCO · WORLDWIDE</span>
              <strong>
                {l(
                  "نقرّب المسافات.",
                  "Bringing you closer.",
                  "Rapprocher les horizons.",
                )}
              </strong>
            </div>
          </div>
          <div className="studio-intro-copy">
            <BrandLogo
              background="white"
              orientation="horizontal"
              size="lg"
              className="studio-white-logo h-12 sm:h-14 w-auto mb-3"
            />
            <span className="studio-kicker">
              {l(
                "خبرة محلية. اهتمام بكل التفاصيل.",
                "Local expertise. Care in every detail.",
                "Une expertise locale. Le soin du détail.",
              )}
            </span>
            <h2>
              {l(
                "كل خدمة،\nبداية لعلاقة ثقة.",
                "Every service.\nA connection built on trust.",
                "Chaque service,\nune relation de confiance.",
              )}
            </h2>
            <p>
              {l(
                "من الملفات القنصلية والوثائق إلى حجوزات السفر: نرتّب الخطوات، نتابع التفاصيل، ونبقى قريبين من العميل حتى اكتمال الخدمة.",
                "From consular documents to travel bookings: we organize each step, follow every detail and stay close to our customers through completion.",
                "Des documents consulaires aux voyages : nous organisons les étapes, suivons les détails et accompagnons chaque client jusqu’au bout.",
              )}
            </p>
            <div className="studio-intro-actions">
              <a
                href="#section-company-services"
                className="studio-btn studio-btn-gold"
              >
                {l(
                  "اكتشف الخدمات",
                  "Explore services",
                  "Découvrir les services",
                )}
                <ArrowDown size={17} />
              </a>
              <a
                href={BRAND_CONFIG.proWebsiteUrl}
                target="_blank"
                rel="noreferrer"
                className="studio-site-link"
              >
                {l("موقع المؤسسة", "Company website", "Site de l’entreprise")}
                {arrow}
              </a>
            </div>
            <div className="studio-values">
              <span>
                <FileCheck2 size={17} />
                {l(
                  "وثائق منظّمة",
                  "Organized documents",
                  "Documents organisés",
                )}
              </span>
              <span>
                <ClipboardList size={17} />
                {l("متابعة واضحة", "Clear follow-up", "Un suivi clair")}
              </span>
              <span>
                <MessageCircle size={17} />
                {l("تواصل مباشر", "Direct contact", "Contact direct")}
              </span>
            </div>
          </div>
        </section>
      </VisibilitySection>
      <VisibilitySection
        sectionId="company-services"
        title={l(
          "الخدمات والأنشطة",
          "Services & activities",
          "Services et activités",
        )}
      >
        <div
          id="company-service-slides"
          className="studio-gallery"
          ref={galleryRef}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node))
              setFocused(false);
          }}
          role="region"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              move((e.key === "ArrowRight" ? 1 : -1) * (isRTL ? -1 : 1));
            }
          }}
          aria-roledescription={l("عارض شرائح", "carousel", "carrousel")}
          aria-label={l(
            "سلايدات خدمات المؤسسة",
            "Company service slides",
            "Diaporama des services",
          )}
        >
          <div className="studio-gallery-heading">
            <div>
              <span className="studio-kicker">
                {l(
                  "خدمات صُممت لتكمل بعضها",
                  "SERVICES THAT WORK TOGETHER",
                  "DES SERVICES COMPLÉMENTAIRES",
                )}
              </span>
              <h2>
                {l(
                  "ما الذي يمكننا إنجازه لك؟",
                  "What can we do for you?",
                  "Que pouvons-nous faire pour vous ?",
                )}
              </h2>
            </div>
            <div className="studio-carousel-controls">
              <span dir="ltr">
                {String(slide + 1).padStart(2, "0")}{" "}
                <i>/ {String(services.length).padStart(2, "0")}</i>
              </span>
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label={l(
                  "الخدمة السابقة",
                  "Previous service",
                  "Service précédent",
                )}
              >
                {isRTL ? <ChevronRight /> : <ChevronLeft />}
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label={l(
                  "الخدمة التالية",
                  "Next service",
                  "Service suivant",
                )}
              >
                {isRTL ? <ChevronLeft /> : <ChevronRight />}
              </button>
              <button
                type="button"
                disabled={reduced}
                onClick={() => setAutoplay((v) => !v)}
                aria-pressed={autoplay && !reduced}
                aria-label={
                  reduced
                    ? l(
                        "الحركة التلقائية متوقفة حسب إعداد الجهاز",
                        "Autoplay disabled by reduced motion preference",
                        "Lecture automatique désactivée selon vos préférences",
                      )
                    : autoplay
                      ? l(
                          "إيقاف العرض التلقائي",
                          "Pause slideshow",
                          "Suspendre le diaporama",
                        )
                      : l(
                          "تشغيل العرض التلقائي",
                          "Play slideshow",
                          "Lancer le diaporama",
                        )
                }
              >
                {autoplay && !reduced ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} />
                )}
              </button>
            </div>
          </div>
          <div
            className="studio-service-stage"
            data-active-service={current.id}
            onTouchStart={(e) => {
              touchStart.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
              };
            }}
            onTouchEnd={(e) => {
              const start = touchStart.current;
              touchStart.current = null;
              if (!start) return;
              const dx = e.changedTouches[0].clientX - start.x,
                dy = e.changedTouches[0].clientY - start.y;
              if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5)
                move((dx < 0 ? 1 : -1) * (isRTL ? -1 : 1));
            }}
          >
            <div
              className="studio-service-art"
              onPointerMove={tilt}
              onPointerLeave={untilt}
            >
              <img
                key={current.id}
                src={art(current.id)}
                alt={current.title}
                decoding="async"
              />
              {
                <img
                  className="studio-service-logo"
                  src="/admin/crm/assets/logo-horizontal.svg"
                  alt="ELFAZNI SERVICES"
                />
              }
              <span className="studio-service-number" aria-hidden="true">
                {String(slide + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="studio-service-copy" key={current.id}>
              <div className="studio-service-topline">
                <span>
                  <current.icon size={23} />
                </span>
                <small>
                  {current.group === "core"
                    ? l("خدمة أساسية", "Core service", "Service principal")
                    : l(
                        "خدمة متخصصة",
                        "Specialist service",
                        "Service spécialisé",
                      )}
                </small>
              </div>
              <h3>{current.title}</h3>
              <p>{current.description}</p>
              <div className="studio-service-promise">
                <Check size={17} />
                {l(
                  "ابدأ المعاملة، وتابع كل خطوة في خطك الزمني.",
                  "Start a request and follow every step in your pipeline.",
                  "Ouvrez un dossier et suivez chaque étape de son avancement.",
                )}
              </div>
              {allowed ? (
                <button
                  type="button"
                  className="studio-btn studio-btn-blue"
                  onClick={() => onStartService(current.type, current.flight)}
                >
                  <Plus size={19} />
                  {l("بدء معاملة", "Start a request", "Ouvrir un dossier")}
                  {arrow}
                </button>
              ) : (
                <span className="studio-view-only">
                  {l("متاح للاطلاع", "View only", "Consultation uniquement")}
                </span>
              )}
              <a
                className="studio-service-contact"
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={17} />
                {l(
                  "استفسر عن الخدمة",
                  "Ask about this service",
                  "Se renseigner sur ce service",
                )}
              </a>
            </div>
          </div>
          <div
            className="studio-service-thumbs"
            ref={thumbsRef}
            aria-label={l(
              "اختر خدمة",
              "Choose a service",
              "Choisir un service",
            )}
          >
            {services.map((service, i) => (
              <button
                type="button"
                key={service.id}
                className="studio-service-thumb"
                aria-current={slide === i ? "true" : undefined}
                onClick={() => setSlide(i)}
                aria-label={`${i + 1}. ${service.title}`}
              >
                <img src={art(service.id)} alt="" loading="lazy" />
                <span>
                  <service.icon size={15} />
                  {service.title}
                </span>
                <i>{String(i + 1).padStart(2, "0")}</i>
              </button>
            ))}
          </div>
          <p className="studio-gallery-help">
            {l(
              "اختر صورة، استخدم الأسهم، أو اسحب على الهاتف. يتوقف العرض أثناء التفاعل.",
              "Choose a thumbnail, use the arrows or swipe on mobile. Slides pause while you interact.",
              "Choisissez une image, utilisez les flèches ou balayez sur mobile. La lecture s’arrête pendant vos interactions.",
            )}
          </p>
        </div>
      </VisibilitySection>
      <VisibilitySection
        sectionId="company-founder"
        title={l(
          "الشخص وراء الخدمة",
          "The person behind the service",
          "La personne derrière le service",
        )}
      >
        <section
          className="studio-founder"
          onPointerMove={tilt}
          onPointerLeave={untilt}
        >
          <div className="studio-founder-image">
            <div className="studio-portrait-ring" />
            <img
              src={BRAND_CONFIG.assets.founderPortrait}
              alt={l(
                "رشيد الفزني، مؤسس الفزني للخدمات",
                "Rachid Elfazni, founder of ELFAZNI SERVICES",
                "Rachid Elfazni, fondateur d’ELFAZNI SERVICES",
              )}
            />
            <span className="studio-founder-badge">
              <span />
              {l("إسطنبول، تركيا", "Istanbul, Türkiye", "Istanbul, Turquie")}
            </span>
          </div>
          <div className="studio-founder-copy">
            <span className="studio-kicker">
              {l(
                "تعامل مع أشخاص، لا مع إجراءات فقط",
                "PEOPLE BEHIND EVERY PROCESS",
                "DES PERSONNES DERRIÈRE CHAQUE DÉMARCHE",
              )}
            </span>
            <h2>{l("رشيد الفزني", "Rachid Elfazni", "Rachid Elfazni")}</h2>
            <small>
              {l(
                "مؤسس الفزني للخدمات · تنسيق ومتابعة الخدمات",
                "Founder of ELFAZNI SERVICES · Service coordination",
                "Fondateur d’ELFAZNI SERVICES · Coordination des services",
              )}
            </small>
            <blockquote>
              {l(
                "«نؤمن أن الخدمة الجيدة تبدأ بالإنصات، وتكتمل بمتابعة التفاصيل.»",
                "“Good service begins with listening and continues through attention to every detail.”",
                "« Un bon service commence par l’écoute et se poursuit par le soin de chaque détail. »",
              )}
            </blockquote>
            <div className="studio-founder-links">
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="studio-btn studio-btn-blue"
              >
                <MessageCircle size={18} />
                {l(
                  "تواصل عبر واتساب",
                  "Contact on WhatsApp",
                  "Contacter sur WhatsApp",
                )}
                {arrow}
              </a>
              <a href={`tel:${phone}`}>
                <Phone size={17} />
                <span dir="ltr">{phone}</span>
              </a>
              <a href={`mailto:${email}`}>
                <Mail size={17} />
                <span dir="ltr">{email}</span>
              </a>
            </div>
          </div>
        </section>
      </VisibilitySection>
      {canViewAccounting && (
        <VisibilitySection
          sectionId="company-payments"
          title={l(
            "معلومات الدفع",
            "Payment details",
            "Coordonnées de paiement",
          )}
        >
          <section className="studio-bank">
            {/* Header with Security Badge and Actions */}
            <div className="studio-bank-header">
              <div className="studio-bank-header-left">
                <div className="studio-bank-icon-box">
                  <Landmark size={28} />
                </div>
                <div className="studio-bank-title-area">
                  <div className="studio-bank-trust-badge">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>
                      {l(
                        "حسابات بنكية رسمية ومعتمدة",
                        "Official Verified Bank Accounts",
                        "Comptes bancaires officiels vérifiés"
                      )}
                    </span>
                  </div>
                  <h3>
                    {l(
                      "الحسابات البنكية المعتمدة للتحويل والسداد",
                      "Company Bank Accounts & Payment Details",
                      "Coordonnées bancaires pour virement et paiement"
                    )}
                  </h3>
                  <p>
                    {l(
                      "الحسابات الرسمية المعتمدة لشركة الفزني للخدمات في البنوك التركية — يُرجى إرفاق رقم المعاملة واسم العميل عند التحويل.",
                      "Official institutional accounts of ELFAZNI SERVICES in Turkish banks — please include transaction reference or customer name with transfer.",
                      "Comptes officiels d'ELFAZNI SERVICES auprès des banques turques — veuillez indiquer la référence du dossier lors du virement."
                    )}
                  </p>
                </div>
              </div>

              <div className="studio-bank-actions">
                <button
                  type="button"
                  className="studio-bank-action-btn primary"
                  onClick={() => copy("both", shareText)}
                  title={l("نسخ الحسابين معاً", "Copy both accounts", "Copier les deux comptes")}
                >
                  {copied === "both" ? <Check size={16} /> : <Copy size={16} />}
                  <span>
                    {copied === "both"
                      ? l("تم نسخ الحسابين", "Copied", "Copié")
                      : l("نسخ الحسابين معاً", "Copy both accounts", "Copier les deux comptes")}
                  </span>
                </button>

                <button
                  type="button"
                  className="studio-bank-action-btn secondary"
                  onClick={() => copy("template", clientPaymentMessage)}
                  title={l("نسخ قالب رسالة السداد للعميل", "Copy payment message for client", "Copier le message de paiement")}
                >
                  {copied === "template" ? <Check size={16} /> : <ClipboardList size={16} />}
                  <span>
                    {copied === "template"
                      ? l("تم نسخ الرسالة", "Message copied", "Message copié")
                      : l("نسخ رسالة السداد", "Copy payment message", "Message de paiement")}
                  </span>
                </button>

                <button
                  type="button"
                  className="studio-bank-action-btn share"
                  onClick={shareDetails}
                  title={l("مشاركة عبر واتساب", "Share via WhatsApp", "Partager sur WhatsApp")}
                >
                  <Share2 size={16} />
                  <span>{l("مشاركة واتساب", "WhatsApp share", "Partager")}</span>
                </button>
              </div>
            </div>

            {/* Beneficiary Meta Bar */}
            <div className="studio-bank-beneficiary-bar">
              <div className="studio-bank-beneficiary-info">
                <div className="studio-bank-beneficiary-tag">
                  {l(
                    "صاحب الحساب المعتمد (المستفيد)",
                    "Authorized Beneficiary",
                    "Titulaire autorisé (Bénéficiaire)"
                  )}
                </div>
                <div className="studio-bank-beneficiary-row">
                  <strong dir="ltr" className="studio-bank-beneficiary-name">{bankHolder}</strong>
                  <button
                    type="button"
                    className="studio-bank-copy-pill"
                    onClick={() => copy("holder", bankHolder)}
                    aria-label={l("نسخ اسم صاحب الحساب", "Copy account holder name", "Copier le nom du titulaire")}
                    title={l("نسخ اسم صاحب الحساب", "Copy account holder name", "Copier le nom du titulaire")}
                  >
                    {copied === "holder" ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copied === "holder" ? l("تم النسخ", "Copied", "Copié") : l("نسخ الاسم", "Copy name", "Copier")}</span>
                  </button>
                </div>
              </div>

              <div className="studio-bank-location-tag">
                <span>📍</span>
                <span>{l("إسطنبول، تركيا — بنك زراعات / البنوك التركية الرسمية", "Istanbul, Turkey — Ziraat Bank / Turkish Banks", "Istanbul, Turquie — Ziraat Bank / Banques turques")}</span>
              </div>

              {ibansIdentical && (
                <div className="studio-bank-warn">
                  <AlertTriangle size={15} />
                  <span>
                    {l(
                      "آيبان TRY وUSD متطابق حاليًا — يلزم التحقق من السجل البنكي قبل الاستخدام.",
                      "TRY and USD IBANs are currently identical — verify against bank records before use.",
                      "Les IBAN TRY et USD sont actuellement identiques — vérification requise."
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Smart Bank Cards Grid */}
            <div className="studio-bank-smart-grid">
              {bankAccounts.map((account) => {
                const isTRY = account.currency === "TRY";
                return (
                  <article
                    key={account.currency}
                    className={`studio-smart-card ${isTRY ? "try-card" : "usd-card"}`}
                  >
                    {/* Metallic card background elements */}
                    <div className="smart-card-shimmer" aria-hidden="true" />
                    <div className="smart-card-circles" aria-hidden="true" />

                    {/* Top Row: Chip, Contactless & Currency Badge */}
                    <div className="smart-card-header">
                      <div className="smart-card-hardware">
                        <div className="smart-card-chip" aria-hidden="true">
                          <div className="smart-card-chip-line" />
                          <div className="smart-card-chip-line" />
                          <div className="smart-card-chip-core" />
                        </div>
                        <svg className="smart-card-contactless" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M8.5 16.5a5 5 0 0 1 0-7" strokeLinecap="round" />
                          <path d="M12 19a8.5 8.5 0 0 0 0-14" strokeLinecap="round" />
                          <path d="M15.5 21.5a12 12 0 0 0 0-19" strokeLinecap="round" />
                        </svg>
                      </div>

                      <div className="smart-card-badge-wrap">
                        <span className={`smart-card-currency-pill ${isTRY ? "try-pill" : "usd-pill"}`}>
                          {isTRY ? "TRY ₺" : "USD $"}
                        </span>
                        <span className="smart-card-bank-brand">Ziraat Bankası</span>
                      </div>
                    </div>

                    {/* Account Type Title */}
                    <div className="smart-card-account-title">
                      {account.label}
                    </div>

                    {/* IBAN Display Box */}
                    <div className="smart-card-iban-box">
                      <div className="smart-card-iban-label">
                        <span>IBAN</span>
                        <span className="smart-card-iban-intl">{l("الآيبان الدولي", "International Bank Account Number", "Numéro de compte international")}</span>
                      </div>
                      <div className="smart-card-iban-code" dir="ltr">
                        {formatIban(account.iban)}
                      </div>
                    </div>

                    {/* Cardholder Name */}
                    <div className="smart-card-holder-box">
                      <small>{l("المستفيد", "CARDHOLDER", "TITULAIRE")}</small>
                      <strong dir="ltr">{bankHolder}</strong>
                    </div>

                    {/* Card Action Buttons */}
                    <div className="smart-card-actions">
                      <button
                        type="button"
                        className="smart-card-btn-primary"
                        onClick={() => copy(account.currency, ibanOf(account.iban))}
                        title={l("نسخ رقم الآيبان فقط", "Copy IBAN only", "Copier l’IBAN uniquement")}
                      >
                        {copied === account.currency ? <Check size={15} /> : <Copy size={15} />}
                        <span>
                          {copied === account.currency
                            ? l("تم نسخ الآيبان", "IBAN Copied", "IBAN copié")
                            : l("نسخ الآيبان فقط", "Copy IBAN only", "Copier l’IBAN")}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="smart-card-btn-secondary"
                        onClick={() =>
                          copy(
                            `${account.currency}_all`,
                            bankAccountCopyText(l, bankHolder, account.currency, account.iban)
                          )
                        }
                        title={l("نسخ تفاصيل الحساب كاملة", "Copy full account details", "Copier toutes les coordonnées")}
                      >
                        {copied === `${account.currency}_all` ? <Check size={15} /> : <FileCheck2 size={15} />}
                        <span>
                          {copied === `${account.currency}_all`
                            ? l("تم النسخ", "Copied", "Copié")
                            : l("نسخ كافة البيانات", "Copy full details", "Toutes les coordonnées")}
                        </span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Reassurance & Feedback Strip */}
            <div className="studio-bank-footer-strip">
              <div className="studio-bank-guarantee">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>
                  {l(
                    "🔒 تحويل آمن وموثق: فور إتمام الحوالة، يرجى إرسال الإشعار لتأكيد المعاملة وتزويدكم برصيد المعاملة والإيصال المالي الرسمي فوراً.",
                    "🔒 Secure & Verified: After sending payment, please share the receipt via WhatsApp to instantly update your balance and issue your official invoice.",
                    "🔒 Sécurisé et vérifié : après votre virement, transmettez le reçu sur WhatsApp pour confirmation immédiate et remise du reçu officiel."
                  )}
                </span>
              </div>

              {copied && (
                <div className="studio-bank-toast-pill" role="status">
                  <Check size={14} className="text-emerald-500" />
                  <span>
                    {copied === "both"
                      ? l("تم نسخ بيانات الحسابين معاً بنجاح", "Both bank accounts copied", "Les deux comptes ont été copiés")
                      : copied === "template"
                      ? l("تم نسخ رسالة السداد الجاهزة للعميل", "Payment message copied", "Message de paiement copié")
                      : copied === "holder"
                      ? l("تم نسخ اسم صاحب الحساب", "Account holder name copied", "Nom du titulaire copié")
                      : copied.endsWith("_all")
                      ? l("تم نسخ كامل بيانات الحساب البنكي", "Full account details copied", "Coordonnées complètes copiées")
                      : l("تم نسخ رقم الآيبان بنجاح", "IBAN copied successfully", "IBAN copié avec succès")}
                  </span>
                </div>
              )}
            </div>
          </section>
        </VisibilitySection>
      )}
      <VisibilitySection
        sectionId="company-utilities"
        title={l(
          "روابط وأدوات المؤسسة",
          "Company links & tools",
          "Liens et outils de l’entreprise",
        )}
      >
        <div className="studio-utilities">
          <button
            onClick={() => {
              setActiveTab("tools");
              window.scrollTo({ top: 0, behavior: "auto" });
            }}
          >
            <ClipboardList size={22} />
            <span>
              {l("مركز المتابعات", "Follow-up center", "Centre de suivi")}
            </span>
            {arrow}
          </button>
          <button onClick={onOpenBackupModal}>
            <Database size={22} />
            <span>
              {l(
                "النسخ الاحتياطي",
                "Backup & restore",
                "Sauvegarde et restauration",
              )}
            </span>
            {arrow}
          </button>
          {canViewAccounting && (
            <button onClick={onOpenExchangeRatesModal}>
              <ArrowRightLeft size={22} />
              <span>
                {l("أسعار الصرف", "Exchange rates", "Taux de change")}
              </span>
              {arrow}
            </button>
          )}
          <a href={BRAND_CONFIG.proWebsiteUrl} target="_blank" rel="noreferrer">
            <Globe2 size={22} />
            <span>
              {l("الموقع الرسمي", "Company website", "Site de l’entreprise")}
            </span>
            {arrow}
          </a>
        </div>
      </VisibilitySection>
      <footer className="studio-footer">
        <BrandLogo
          background="white"
          orientation="horizontal"
          size="lg"
          className="h-11 sm:h-12 w-auto"
        />
        <span>
          {l(
            "خدمات إدارية وقنصلية وسفر، من إسطنبول.",
            "Administrative, consular and travel services, from Istanbul.",
            "Services administratifs, consulaires et de voyage, depuis Istanbul.",
          )}
        </span>
        <div>
          <a
            href="https://www.instagram.com/elfazniservices/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <Instagram size={20} />
          </a>
          <a
            href="https://www.facebook.com/alfazni.services"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
          >
            <Facebook size={20} />
          </a>
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
          >
            <MessageCircle size={20} />
          </a>
        </div>
        <small>© {new Date().getFullYear()} ELFAZNI SERVICES</small>
      </footer>
    </div>
  );
};
