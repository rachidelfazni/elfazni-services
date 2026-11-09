import React from 'react';
import { Scale, FileText, CheckCircle2, ShieldCheck, MessageCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SITE_CONTACT } from '../data/content';

export const DisclaimerSection: React.FC = () => {
  const { language, isRtl } = useLanguage();

  const eyebrowText =
    language === 'tr'
      ? 'Yasal Bilgilendirme ve Şeffaflık'
      : language === 'en'
        ? 'Legal Transparency & Notice'
        : language === 'fr'
          ? 'Transparence juridique et avis'
          : 'توضيح قانوني وشفافية الخدمة';

  const heading =
    language === 'tr'
      ? 'Sorumluluk Reddi: Danışmanlık Hizmetlerimiz'
      : language === 'en'
        ? 'Legal Disclaimer: Advisory Nature of Our Services'
        : language === 'fr'
          ? 'Avis de non-responsabilité : Nature de nos services'
          : 'إخلاء المسؤولية: طبيعة خدماتنا الاستشارية';

  const subtitle =
    language === 'tr'
      ? 'Hizmetlerimizin kapsamı ve resmi kurumlardan tam bağımsızlığımız hakkında açık ve şeffaf bilgilendirme.'
      : language === 'en'
        ? 'Clear transparency regarding the advisory nature of our services and our complete independence from official authorities.'
        : language === 'fr'
          ? 'Transparence claire sur la nature consultative de nos services et notre totale indépendance vis-à-vis des autorités officielles.'
          : 'توضيح شفاف حول طبيعة خدماتنا الاستشارية واستقلاليتنا التامة عن الجهات الرسمية لضمان تجربة آمنة وموثوقة.';

  const points =
    language === 'tr'
      ? [
          {
            icon: Scale,
            badge: 'Özel Girişim',
            title: 'Tam Bağımsızlık',
            text: 'Fas Konsolosluğu veya kamu idaresi ile hiçbir resmi bağımız veya ilişkimiz bulunmamaktadır.',
            highlight: 'Bağımsız özel danışmanlık',
          },
          {
            icon: FileText,
            badge: 'Başvuru Desteği',
            title: 'Danışmanlık ve Dosya Desteği',
            text: 'Belgelerin çıkarılması ve randevu hazırlanması konusunda danışmanlık ve başvuru destek hizmetleri sunmaktayız.',
            highlight: 'Eksiksiz evrak hazırlığı',
          },
          {
            icon: CheckCircle2,
            badge: 'Rehberlik',
            title: 'İşlem Kolaylaştırma',
            text: 'Kişi adına resmi vekil olarak hareket etmiyoruz; ancak işlemleri kolaylaştırmak ve daha basit hale getirmek için rehberlik ederek yardımcı oluyoruz.',
            highlight: 'Kişiye özel adım adım refakat',
          },
        ]
      : language === 'en'
        ? [
            {
              icon: Scale,
              badge: 'Private Consultancy',
              title: 'Complete Independence',
              text: 'We have no official relationship or affiliation with the Moroccan Consulate or any public administration.',
              highlight: 'Fully independent entity',
            },
            {
              icon: FileText,
              badge: 'Document Preparation',
              title: 'Advisory & Preparation',
              text: 'We provide advisory services and assistance in issuing, reviewing, and preparing documents efficiently.',
              highlight: 'Accurate file verification',
            },
            {
              icon: CheckCircle2,
              badge: 'Guided Support',
              title: 'Process Facilitation',
              text: 'We do not act on behalf of the person as an official proxy, but guide them so procedures are smoother, faster, and simpler.',
              highlight: 'Empowering you with guidance',
            },
          ]
        : language === 'fr'
          ? [
              {
                icon: Scale,
                badge: 'Cabinet Privé',
                title: 'Indépendance Totale',
                text: 'Nous n’avons aucun lien officiel avec le Consulat du Maroc ou l’administration publique.',
                highlight: 'Structure indépendante',
              },
              {
                icon: FileText,
                badge: 'Aide aux Démarches',
                title: 'Conseil et Préparation',
                text: 'Nous fournissons des services de conseil et d’assistance pour la préparation et la délivrance de documents.',
                highlight: 'Dossiers vérifiés et conformes',
              },
              {
                icon: CheckCircle2,
                badge: 'Accompagnement',
                title: 'Facilitation des Démarches',
                text: 'Nous n’agissons pas au nom de la personne, mais nous l’accompagnons par nos conseils afin de simplifier ses démarches.',
                highlight: 'Orientation étape par étape',
              },
            ]
          : [
              {
                icon: Scale,
                badge: 'مكتب استشاري خاص',
                title: 'استقلالية تامة',
                text: 'لا تربطنا أي علاقة رسمية مع القنصلية المغربية أو مع الإدارة العمومية.',
                highlight: 'استقلالية مهنية وقانونية كاملة',
              },
              {
                icon: FileText,
                badge: 'تجهيز المستندات',
                title: 'خدمات استشارية ومساعدة',
                text: 'نقوم بتقديم خدمات استشارية وخدمات المساعدة في إصدار الأوراق وتجهيزها بدقة.',
                highlight: 'مراجعة وتدقيق المستندات',
              },
              {
                icon: CheckCircle2,
                badge: 'تسهيل وإرشاد',
                title: 'تبسيط الإجراءات والمتابعة',
                text: 'لا ننوب عن الشخص، لكن نساعده بالإرشاد حتى نسهل عليه المعاملات، وتكون المعاملات أسهل وأبسط.',
                highlight: 'إرشاد مباشر خطوة بخطوة',
              },
            ];

  const bottomBannerText =
    language === 'tr'
      ? 'Şeffaflık ve dürüstlük, Türkiye’deki Fas toplumuna yönelik sunduğumuz tüm hizmetlerin temelidir.'
      : language === 'en'
        ? 'Transparency and integrity are the core foundations of every consultation we provide for Moroccans in Türkiye.'
        : language === 'fr'
          ? 'La transparence et l’honnêteté sont les piliers de notre engagement auprès des Marocains résidant en Turquie.'
          : 'الشفافية والمصداقية التامة هي الأساس في عملنا لخدمة وإرشاد أبناء الجالية المغربية في تركيا.';

  const bottomButtonText =
    language === 'tr'
      ? 'Sorularınız için danışın'
      : language === 'en'
        ? 'Ask a Question'
        : language === 'fr'
          ? 'Poser une question'
          : 'استفسر مباشرة عبر واتساب';

  const whatsappDisclaimerUrl = `https://wa.me/${SITE_CONTACT.whatsappRaw}?text=${encodeURIComponent(
    'مرحباً ELFAZNI SERVICES، أود الاستفسار حول طبيعة الخدمات والمساعدة المقدمة.'
  )}`;

  return (
    <section
      id="disclaimer"
      aria-labelledby="disclaimer-heading"
      className="py-16 sm:py-20 bg-gradient-to-b from-white via-[#F8FAFD] to-white relative overflow-hidden"
    >
      {/* Soft atmospheric gradient accents */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-[#004AA5]/6 via-[#CC9048]/5 to-transparent rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Modern streamlined header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#CC9048]/10 border border-[#CC9048]/20 text-[#8C601E] text-xs sm:text-sm font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#CC9048]" />
            <span>{eyebrowText}</span>
          </div>

          <h2
            id="disclaimer-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0B2E57] tracking-tight leading-snug"
          >
            {heading}
          </h2>

          <p className="text-sm sm:text-base text-[#556987] font-medium leading-relaxed max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* 3 Seamless Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7">
          {points.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group relative rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:shadow-[#004AA5]/6 hover:border-[#2A83D5]/40 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Top: Icon + Badge */}
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#004AA5] to-[#0B2E57] text-white flex items-center justify-center shadow-md shadow-[#004AA5]/20 group-hover:scale-105 transition-transform duration-300">
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-100/90 text-slate-600 border border-slate-200/60">
                      {item.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-[19px] font-bold text-[#0B2E57] mb-2.5 group-hover:text-[#004AA5] transition-colors">
                    {item.title}
                  </h3>

                  {/* Body Text */}
                  <p className="text-sm sm:text-[15px] text-[#4A5568] font-medium leading-relaxed">
                    {item.text}
                  </p>
                </div>

                {/* Subtle highlight footer */}
                <div className="pt-4 mt-5 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-[#004AA5]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CC9048]" />
                  <span>{item.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Smooth Reassurance Ribbon */}
        <div className="mt-8 rounded-2xl bg-[#0B2E57] text-white p-5 sm:p-6 shadow-md shadow-[#0B2E57]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-start">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-[#E3C88F]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed max-w-2xl">
              {bottomBannerText}
            </p>
          </div>

          <a
            href="#contact-form"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#CC9048] to-[#E3C88F] hover:from-[#B37B37] hover:to-[#CC9048] text-slate-950 text-xs sm:text-sm font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>{bottomButtonText}</span>
            {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </a>
        </div>
      </div>
    </section>
  );
};
