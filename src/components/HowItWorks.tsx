import { SectionTitle } from './SiteContent';
import React from 'react';
import { Send, FileSearch, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SITE_CONTACT } from '../data/content';
import { WhatsAppLogo } from './WhatsAppLogo';

export const HowItWorks: React.FC = () => {
  const { t, language } = useLanguage();

  const steps = [
    {
      num: '01',
      icon: <Send className="w-5 h-5 text-[#004AA5]" />,
      title: t('أرسل طلبك عبر واتساب'),
      desc: t('اكتب نوع المعاملة أو تفاصيل الرحلة مع أي وثائق أو معلومات أولية متوفرة لديك.'),
    },
    {
      num: '02',
      icon: <FileSearch className="w-5 h-5 text-[#004AA5]" />,
      title: t('تدقيق التفاصيل وشرح المسار'),
      desc: t('نراجع البيانات بدقة، ونوضح لك الشروط القانونية والمواعيد المتاحة والوثائق التكميلية.'),
    },
    {
      num: '03',
      icon: <CheckCircle2 className="w-5 h-5 text-[#004AA5]" />,
      title: t('متابعة مستمرة حتى إتمام المعاملة'),
      desc: t('نحجز الموعد، نؤكد التذاكر، ننسق الترجمة المحلفة، ونظل على تواصل مباشر حتى استلام طلبك.'),
    },
  ];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="py-24 sm:py-32 bg-[#eaf4ff] relative border-y border-[#D7E7F7]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-[#5E7086]">
            <span>{t('آلية واضحة')}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#CC9048] font-bold">{t('3 خطوات بسيطة')}</span>
          </div>
          <SectionTitle sectionId="how-it-works"
            id="how-heading"
            className="tracking-tight"
          >
            {language === 'tr' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Uzaktan Hizmet Süreci</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">İlk Mesajdan Tamamlanana Kadar</span>
              </>
            ) : language === 'en' ? (
              <>
                <span className="block font-black text-[#0B2E57]">How Remote Service Works</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">From First Message to Completion</span>
              </>
            ) : language === 'fr' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Fonctionnement à Distance</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Du premier message à la finalisation</span>
              </>
            ) : (
              <>
                <span className="block font-black text-[#0B2E57]">طريقة العمل عن بُعد</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">من أول رسالة حتى اكتمال طلبك</span>
              </>
            )}
          </SectionTitle>
          <p className="text-base sm:text-lg lg:text-xl text-[#5E7086] font-normal">
            {t(
              'لا تحتاج إلى إضاعة الوقت في التنقل. أرسل نوع الخدمة والمعلومات الأولية، وسنتولى الترتيب والمتابعة بخطوات واضحة.'
            )}
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step) => (
            <div
              key={step.num}
              className="relative bg-[#FFFFFF] rounded-3xl p-8 border border-[#D7E7F7] shadow-[0_4px_20px_rgba(6,78,168,0.04)] hover:shadow-[0_12px_32px_rgba(6,78,168,0.08)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#eaf4ff] border border-[#D7E7F7] flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="font-mono tabular-nums text-3xl font-black text-[#CC9048]/40">
                    {step.num}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-[1.6rem] font-bold text-[#0B2E57] mb-3.5 tracking-tight">
                  {step.title}
                </h3>

                <p className="text-base sm:text-[1.06rem] text-[#5E7086] font-normal">
                  {step.desc}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#D7E7F7] text-xs sm:text-sm font-semibold text-[#5E7086]">
                {t('متابعة مباشرة عبر واتساب')}
              </div>
            </div>
          ))}
        </div>

        {/* Quick WhatsApp helper bar */}
        <div className="mt-14 text-center">
          <a
            href={`https://wa.me/${SITE_CONTACT.whatsappRaw}?text=${encodeURIComponent(
              'مرحباً، أود معرفة الخطوات اللازمة لمعاملتي.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full bg-[#FFFFFF] border border-[#D7E7F7] hover:border-[#2A83D5] shadow-2xs hover:shadow-xs text-[#0B2E57] font-bold text-sm sm:text-base active:scale-[0.98] transition-all cursor-pointer"
          >
            <WhatsAppLogo className="w-5 h-5" />
            <span>{t('هل لديك سؤال حول الخطوات؟ تواصل معنا مباشرة')}</span>
          </a>
        </div>
      </div>
    </section>
  );
};
