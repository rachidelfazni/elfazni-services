import { SectionTitle } from './SiteContent';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  CheckCircle2,
  Circle,
  Building2,
  FileText,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Shield,
  Clock,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SITE_CONTACT } from '../data/content';
import { WhatsAppLogo } from './WhatsAppLogo';
import { ServiceContactModal } from './common/ServiceContactModal';
import { InlineSuccessBanner } from './SuccessFeedback';

interface ProcedureDocument {
  id: string;
  groupAr?: string;
  groupTr?: string;
  groupEn?: string;
  groupFr?: string;
  textAr: string;
  textTr: string;
  textEn: string;
  textFr: string;
  note?: string;
}

interface ProcedureItem {
  id: string;
  titleAr: string;
  titleTr: string;
  titleEn: string;
  titleFr: string;
  tag: string;
  overviewAr: string;
  overviewTr: string;
  overviewEn: string;
  overviewFr: string;
  importantNoticeAr?: string;
  importantNoticeTr?: string;
  importantNoticeEn?: string;
  importantNoticeFr?: string;
  documents: ProcedureDocument[];
  tipsAr: string[];
}

const PROCEDURES: ProcedureItem[] = [
  {
    id: 'marriage',
    titleAr: 'شهادة أهلية الزواج (لإتمام الزواج في تركيا)',
    titleTr: 'Evlenme Ehliyet Belgesi (Türkiye’de Nikah İçin)',
    titleEn: 'Marriage Eligibility (Civil Marriage in Türkiye)',
    titleFr: 'Capacité matrimoniale (Mariage en Turquie)',
    tag: 'الأكثر طلباً',
    overviewAr:
      'لجمع الملف وتقديمه إلى القنصلية لاستخراج شهادة أهلية الزواج، يجب توفير وثائق الطرف المغربي بالإضافة إلى أوراق الزوج، مع الالتزام بشرط تصديق الأبوستيل.',
    overviewTr:
      'Konsolosluğa evlenme ehliyet belgesi başvurusu için Faslı başvuru sahibinin belgeleri ile eş adayının belgeleri apostil onaylı olarak hazırlanmalıdır.',
    overviewEn:
      'To compile and submit the marriage eligibility file to the Consulate, both the Moroccan applicant’s documents and the spouse’s documents must be provided with valid Apostille stamps.',
    overviewFr:
      'Pour constituer et déposer le dossier de capacité matrimoniale au consulat, les documents du ressortissant marocain ainsi que ceux du conjoint doivent être fournis avec l’Apostille.',
    importantNoticeAr:
      'شرط التصديق الأساسي: راجع القنصلية لتأكيد الوثائق التي تحتاج إلى أبوستيل والجهة المختصة بتصديقها قبل تقديم الملف.',
    importantNoticeTr:
      'Başvuru öncesi apostil gerektiren belgeleri ve yetkili kurumu konsoloslukla teyit edin.',
    importantNoticeEn:
      'Confirm with the consulate which documents require an apostille and who can issue it before submitting your application.',
    importantNoticeFr:
      'Avant le dépôt, confirmez auprès du consulat les documents nécessitant une apostille et l’autorité compétente.',
    documents: [
      {
        id: 'm1',
        groupAr: 'أولاً: وثائق الطرف المغربي',
        groupTr: '1. Fas Vatandaşı İçin Belgeler',
        groupEn: '1. Moroccan Applicant Documents',
        groupFr: '1. Documents du ressortissant marocain',
        textAr: '1. شهادة الخطوبة صادرة من المغرب مع الأبوستيل المغربي',
        textTr: '1. Fas’tan alınmış Fas Apostilli Nişanlılık / Bekarlık Belgesi',
        textEn: '1. Engagement / Celibacy certificate issued from Morocco with Moroccan Apostille',
        textFr: '1. Certificat de fiançailles / célibat délivré au Maroc avec Apostille',
      },
      {
        id: 'm2',
        groupAr: 'أولاً: وثائق الطرف المغربي',
        groupTr: '1. Fas Vatandaşı İçin Belgeler',
        groupEn: '1. Moroccan Applicant Documents',
        groupFr: '1. Documents du ressortissant marocain',
        textAr: '2. نسخة كاملة من رسم الولادة مع الأبوستيل المغربي',
        textTr: '2. Fas Apostilli Tam Vukuatlı Doğum Kayıt Örneği (Copie Intégrale)',
        textEn: '2. Full copy of birth record (Copie Intégrale) with Moroccan Apostille',
        textFr: '2. Copie intégrale de l’acte de naissance avec Apostille',
      },
      {
        id: 'm3',
        groupAr: 'أولاً: وثائق الطرف المغربي',
        groupTr: '1. Fas Vatandaşı İçin Belgeler',
        groupEn: '1. Moroccan Applicant Documents',
        groupFr: '1. Documents du ressortissant marocain',
        textAr: '3. السجل العدلي مع الأبوستيل المغربي',
        textTr: '3. Fas Apostilli Adli Sicil Kaydı',
        textEn: '3. Criminal record certificate from Morocco with Moroccan Apostille',
        textFr: '3. Extrait du casier judiciaire avec Apostille',
      },
      {
        id: 'm4',
        groupAr: 'أولاً: وثائق الطرف المغربي',
        groupTr: '1. Fas Vatandaşı İçin Belgeler',
        groupEn: '1. Moroccan Applicant Documents',
        groupFr: '1. Documents du ressortissant marocain',
        textAr: '4. جواز السفر، وفي حالة وجود إقامة، نسخة عن الإقامة',
        textTr: '4. Pasaport ve (varsa) İkamet İzni fotokopisi',
        textEn: '4. Passport, and if holding a residence permit, a copy of the residence permit',
        textFr: '4. Passeport et, le cas échéant, copie du titre de séjour',
      },
      {
        id: 'm5',
        groupAr: 'أولاً: وثائق الطرف المغربي',
        groupTr: '1. Fas Vatandaşı İçin Belgeler',
        groupEn: '1. Moroccan Applicant Documents',
        groupFr: '1. Documents du ressortissant marocain',
        textAr: '5. وثيقة إثبات العنوان (Yerleşim Belgesi)',
        textTr: '5. Yerleşim Yeri Belgesi (Adres kanıt belgesi)',
        textEn: '5. Address Proof Document (Yerleşim Belgesi)',
        textFr: '5. Justificatif de domicile (Yerleşim Belgesi)',
      },
      {
        id: 'm6',
        groupAr: 'ثانياً: أوراق الزوج (مصدقة بأبوستيل تركي)',
        groupTr: '2. Eş Adayının Belgeleri (Türk Apostilli)',
        groupEn: '2. Spouse Documents (with Turkish Apostille)',
        groupFr: '2. Documents du conjoint (avec Apostille turque)',
        textAr: '1. بطاقة التعريف الوطنية الخاصة بالزوج',
        textTr: '1. Eş adayının Ulusal Kimlik Kartı',
        textEn: '1. Spouse’s National ID Card',
        textFr: '1. Carte nationale d’identité du conjoint',
      },
      {
        id: 'm7',
        groupAr: 'ثانياً: أوراق الزوج (مصدقة بأبوستيل تركي)',
        groupTr: '2. Eş Adayının Belgeleri (Türk Apostilli)',
        groupEn: '2. Spouse Documents (with Turkish Apostille)',
        groupFr: '2. Documents du conjoint (avec Apostille turque)',
        textAr: '2. سجل القيد العائلي الخاص بالزوج (Nüfus Kayıt Örneği)',
        textTr: '2. Eş adayının Nüfus Kayıt Örneği (Apostilli)',
        textEn: '2. Spouse’s Family Registration Record (with Apostille)',
        textFr: '2. Registre d’état civil familial du conjoint (avec Apostille)',
      },
      {
        id: 'm8',
        groupAr: 'ثانياً: أوراق الزوج (مصدقة بأبوستيل تركي)',
        groupTr: '2. Eş Adayının Belgeleri (Türk Apostilli)',
        groupEn: '2. Spouse Documents (with Turkish Apostille)',
        groupFr: '2. Documents du conjoint (avec Apostille turque)',
        textAr: '3. أوراق العمل الخاصة بالزوج',
        textTr: '3. Eş adayının Çalışma / İş Evrakları',
        textEn: '3. Spouse’s Employment / Work Documents',
        textFr: '3. Justificatifs professionnels / documents de travail du conjoint',
      },
      {
        id: 'm9',
        groupAr: 'ثانياً: أوراق الزوج (مصدقة بأبوستيل تركي)',
        groupTr: '2. Eş Adayının Belgeleri (Türk Apostilli)',
        groupEn: '2. Spouse Documents (with Turkish Apostille)',
        groupFr: '2. Documents du conjoint (avec Apostille turque)',
        textAr: '4. السجل العدلي الخاص بالزوج (Adli Sicil Kaydı)',
        textTr: '4. Eş adayının Adli Sicil Kaydı (Apostilli)',
        textEn: '4. Spouse’s Criminal Record Certificate (with Apostille)',
        textFr: '4. Casier judiciaire du conjoint (avec Apostille)',
      },
    ],
    tipsAr: [
      'راجع القنصلية لتأكيد الوثائق التي تحتاج إلى أبوستيل والجهة المختصة بتصديقها قبل تقديم الملف.',
      'تأكد من وضوح النسخ وتطابق الأسماء في جميع الوثائق قبل الموعد.',
      'نساعدك في مراجعة الملف بالكامل وحجز الموعد في القنصلية أو السفارة.',
    ],
  },
  {
    id: 'agency',
    titleAr: 'الوكالات الخاصة العادية (وتنبيه الوكالة العقارية)',
    titleTr: 'Özel Vekâletname (Gayrimenkul Vekâleti Notu)',
    titleEn: 'Special Power of Attorney (Real Estate POA Note)',
    titleFr: 'Procuration spéciale (Note sur la procuration immobilière)',
    tag: 'خدمات الوكالات',
    overviewAr:
      'تتوفر في القنصلية خدمة الوكالات الخاصة العادية، بينما الوكالة الخاصة بالعقارات هي وكالة عدلية في المغرب تقام عند العدول والقنصلية ليس لديها هذه الخدمة.',
    overviewTr:
      'Konsoloslukta yalnızca normal özel vekâletname hizmeti bulunmaktadır. Gayrimenkul vekâleti Fas’ta Adoul (noter) nezdinde yapılır ve konsoloslukta bu hizmet yoktur.',
    overviewEn:
      'The Consulate provides ordinary special power of attorney services only. Real estate POA is a notarized Adoul act performed in Morocco and is not offered by the Consulate.',
    overviewFr:
      'Le consulat assure uniquement le service des procurations spéciales ordinaires. La procuration immobilière est un acte adoulaire établi au Maroc chez les Adouls et n’est pas disponible au consulat.',
    importantNoticeAr:
      'تنبيه هام جداً: بالنسبة للوكالة الخاصة بالعقارات، الوكالة العقارية هي وكالة عدلية في المغرب تقام عند العدول والقنصلية ليس لديها هذه الخدمة. يوجد في القنصلية خدمة الوكالات الخاصة العادية فقط.',
    importantNoticeTr:
      'Önemli Uyarı: Gayrimenkul (emlak) vekâleti Fas’ta Adoul nezdinde yapılan adli bir vekâlettir ve konsoloslukta bu hizmet verilmemektedir. Konsoloslukta normal özel vekâletname hizmeti mevcuttur.',
    importantNoticeEn:
      'Important Notice: Real Estate Power of Attorney is a notarized Adoul deed executed in Morocco before Adouls, and the Consulate does NOT provide this service. Only ordinary special powers of attorney are available.',
    importantNoticeFr:
      'Avis important : La procuration immobilière est un acte adoulaire établi au Maroc auprès des Adouls ; le consulat ne propose pas ce service. Seules les procurations spéciales ordinaires sont disponibles.',
    documents: [
      {
        id: 'a1',
        textAr: 'إرسال نص الوكالة (موضوع الوكالة الخاصة العادية بالتفصيل)',
        textTr: 'Vekâletname metninin gönderilmesi',
        textEn: 'Sending the text/draft of the power of attorney',
        textFr: 'Envoi du texte de la procuration spéciale',
      },
      {
        id: 'a2',
        textAr: 'بطاقة التعريف الوطنية المغربية (CNIE)',
        textTr: 'Fas Ulusal Kimlik Kartı (CNIE)',
        textEn: 'Moroccan National ID Card (CNIE)',
        textFr: 'Carte Nationale d’Identité Électronique (CNIE)',
      },
      {
        id: 'a3',
        textAr: 'الإقامة في تركيا (بطاقة الإقامة السارية)',
        textTr: 'Türkiye İkamet İzni Kartı',
        textEn: 'Residence Permit in Türkiye (İkamet)',
        textFr: 'Titre de séjour en Turquie (İkamet)',
      },
      {
        id: 'a4',
        textAr: 'جواز السفر المغربي',
        textTr: 'Fas Pasaportu',
        textEn: 'Moroccan Passport',
        textFr: 'Passeport marocain',
      },
      {
        id: 'a5',
        textAr: 'وثيقة إثبات العنوان / النفوس (Yerleşim Belgesi)',
        textTr: 'Yerleşim Yeri Belgesi (Nüfus adres belgesi)',
        textEn: 'Address Registration Document / Nüfus (Yerleşim Belgesi)',
        textFr: 'Certificat de résidence / Nüfus (Yerleşim Belgesi)',
      },
    ],
    tipsAr: [
      'الوكالة العقارية هي وكالة عدلية في المغرب تقام عند العدول والقنصلية ليس لديها هذه الخدمة.',
      'من أجل الوكالة الخاصة العادية يجب إرسال نص الوكالة مسبقاً مع بطاقة التعريف الوطنية، الإقامة، جواز السفر، والنفوس (Yerleşim Belgesi).',
    ],
  },
  {
    id: 'passport',
    titleAr: 'تجديد أو إصدار جواز السفر',
    titleTr: 'Pasaport Yenileme ve Çıkarma',
    titleEn: 'Passport Issuance & Renewal',
    titleFr: 'Délivrance et renouvellement de passeport',
    tag: 'وثائق رسمية',
    overviewAr:
      'الأوراق الأساسية المطلوبة لتجهيز ملف استخراج أو تجديد جواز السفر المغربي في تركيا.',
    overviewTr:
      'Türkiye’de Fas pasaportu başvurusu veya yenilemesi için gerekli temel belgeler.',
    overviewEn:
      'Required documents for issuing or renewing a Moroccan passport in Türkiye.',
    overviewFr:
      'Documents requis pour la demande ou le renouvellement du passeport marocain en Turquie.',
    documents: [
      {
        id: 'p1',
        textAr: 'صورة لبطاقة التعريف الوطنية (CNIE)',
        textTr: 'Ulusal Kimlik Kartı (CNIE) fotokopisi / görüntüsü',
        textEn: 'Copy of the Moroccan National ID Card (CNIE)',
        textFr: 'Copie de la Carte Nationale d’Identité (CNIE)',
      },
      {
        id: 'p2',
        textAr: 'الإقامة في تركيا (الإقامة التركية)',
        textTr: 'Türkiye İkamet İzni (Türk İkameti)',
        textEn: 'Turkish Residence Permit (İkamet in Türkiye)',
        textFr: 'Titre de séjour turc (Résidence en Turquie)',
      },
      {
        id: 'p3',
        textAr: 'صورة لـ Yerleşim Belgesi أو النفوس (وثيقة إثبات العنوان)',
        textTr: 'Yerleşim Belgesi (Nüfus kayıt/adres belgesi) kopyası',
        textEn: 'Copy of Yerleşim Belgesi or Nüfus (Address proof)',
        textFr: 'Copie du Yerleşim Belgesi ou Nüfus (Justificatif d’adresse)',
      },
    ],
    tipsAr: [
      'تأكد من وضوح صورة بطاقة التعريف الوطنية وصلاحية الإقامة التركية.',
      'يمكن استخراج وثيقة النفوس (Yerleşim Belgesi) بسهولة عبر بوابة e-Devlet.',
    ],
  },
  {
    id: 'birth',
    titleAr: 'تسجيل المواليد في الحالة المدنية المغربية',
    titleTr: 'Doğum Kaydı (Fas Nüfusuna Tescil)',
    titleEn: 'Moroccan Birth Registration',
    titleFr: 'Déclaration de naissance',
    tag: 'حالة مدنية',
    overviewAr: 'تسجيل المولود الجديد بالدفتر العائلي المغربي واستخراج رسم الولادة والنسخ الكاملة الرسمية.',
    overviewTr: 'Türkiye’de doğan bebeğin Fas nüfus kütüğüne tescili ve doğum belgesi alımı.',
    overviewEn: 'Registering newborns born in Türkiye into the Moroccan civil registry.',
    overviewFr: 'Enregistrement des nouveau-nés nés en Turquie sur les registres d’état civil marocains.',
    documents: [
      {
        id: 'b1',
        textAr: 'شهادة الميلاد التركية الأصلية من المستشفى ومن دائرة النفوس (Formül A)',
        textTr: 'Nüfus müdürlüğünden alınan uluslararası doğum belgesi (Formül A)',
        textEn: 'Original Turkish international birth certificate (Formul A)',
        textFr: 'Acte de naissance international délivré par l’état civil turc (Formule A)',
      },
      {
        id: 'b2',
        textAr: 'الدفتر العائلي المغربي (دفتر الحالة المدنية) أو عقد الزواج',
        textTr: 'Fas aile cüzdanı veya resmi evlilik cüzdanı',
        textEn: 'Moroccan family record book (Livret de famille) or marriage deed',
        textFr: 'Livret de famille marocain ou acte de mariage légal',
      },
      {
        id: 'b3',
        textAr: 'البطاقات الوطنية وجوازات سفر الأبوين والإقامة',
        textTr: 'Anne ve babanın Fas kimlik, pasaport ve ikametleri',
        textEn: 'Moroccan national IDs, passports and residence permits of both parents',
        textFr: 'CNIE, passeports et titres de séjour des deux parents',
      },
    ],
    tipsAr: [
      'يستحسن تسجيل المولود خلال الأيام الأولى لتفادي المساطر القضائية الإضافية.',
    ],
  },
];

export const InteractiveConsularChecklist: React.FC = () => {
  const { t, language, isRtl } = useLanguage();
  const [activeProcedureId, setActiveProcedureId] = useState<string>('marriage');
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [waSubmitted, setWaSubmitted] = useState<boolean>(false);

  const activeProcedure =
    PROCEDURES.find((p) => p.id === activeProcedureId) || PROCEDURES[0];

  const totalDocs = activeProcedure.documents.length;
  const readyDocs = activeProcedure.documents.filter((d) => checkedDocs[d.id]).length;
  const progressPercent = Math.round((readyDocs / totalDocs) * 100);

  const toggleDoc = (docId: string) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  const getProcedureTitle = (p: ProcedureItem) => {
    if (language === 'tr') return p.titleTr;
    if (language === 'en') return p.titleEn;
    if (language === 'fr') return p.titleFr;
    return p.titleAr;
  };

  const getProcedureOverview = (p: ProcedureItem) => {
    if (language === 'tr') return p.overviewTr;
    if (language === 'en') return p.overviewEn;
    if (language === 'fr') return p.overviewFr;
    return p.overviewAr;
  };

  const getProcedureNotice = (p: ProcedureItem) => {
    if (language === 'tr') return p.importantNoticeTr;
    if (language === 'en') return p.importantNoticeEn;
    if (language === 'fr') return p.importantNoticeFr;
    return p.importantNoticeAr;
  };

  const getDocGroup = (d: ProcedureItem['documents'][0]) => {
    if (language === 'tr') return d.groupTr;
    if (language === 'en') return d.groupEn;
    if (language === 'fr') return d.groupFr;
    return d.groupAr;
  };

  const getDocText = (d: ProcedureItem['documents'][0]) => {
    if (language === 'tr') return d.textTr;
    if (language === 'en') return d.textEn;
    if (language === 'fr') return d.textFr;
    return d.textAr;
  };

  const handleConsultOnWhatsApp = () => {
    const missingDocs = activeProcedure.documents
      .filter((d) => !checkedDocs[d.id])
      .map((d) => `• لم أجهز بعد: ${getDocText(d)}`);

    const readyDocsList = activeProcedure.documents
      .filter((d) => checkedDocs[d.id])
      .map((d) => `✓ جاهز لدي: ${getDocText(d)}`);

    const lines = [
      '🏛️ *استفسار ومراجعة ملف قنصلي - ELFAZNI SERVICES*',
      '--------------------------------',
      `• *نوع المعاملة:* ${getProcedureTitle(activeProcedure)}`,
      `• *نسبة جاهزية الملف:* ${progressPercent}% (${readyDocs} من أصل ${totalDocs} وثائق)`,
      readyDocsList.length > 0 ? '\n*الوثائق المتوفرة:*\n' + readyDocsList.join('\n') : '',
      missingDocs.length > 0 ? '\n*الوثائق التي أحتاج استفساراً عنها:*\n' + missingDocs.join('\n') : '',
      '--------------------------------',
      'أرجو المساعدة في حجز موعد بالقنصلية ومراجعة الملف للتأكد من قبوله. شكراً لكم!',
    ]
      .filter(Boolean)
      .join('\n');

    const waUrl = `https://wa.me/${SITE_CONTACT.whatsappRaw}?text=${encodeURIComponent(lines)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setWaSubmitted(true);
  };

  const activeNotice = getProcedureNotice(activeProcedure);

  return (
    <section
      id="consular-checklist"
      aria-labelledby="consular-checklist-heading"
      className="py-24 sm:py-32 bg-[#FFFFFF] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-[#5E7086]">
            <Building2 className="w-4 h-4 text-[#004AA5]" />
            <span>{t('دليل المعاملات والقنصلية المغربية')}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#CC9048] font-bold">{t('إسطنبول وأنقرة')}</span>
          </div>
          <SectionTitle sectionId="consular-checklist"
            id="consular-checklist-heading"
            className="tracking-tight"
          >
            {language === 'tr' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Gerekli Konsolosluk Belgeleri</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Dosyanızı Adım Adım Hazırlayın</span>
              </>
            ) : language === 'en' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Required Consular Documents</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Prepare Your File Step by Step</span>
              </>
            ) : language === 'fr' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Documents Consulaires Requis</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Préparez votre dossier pas à pas</span>
              </>
            ) : (
              <>
                <span className="block font-black text-[#0B2E57]">الوثائق القنصلية المطلوبة</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">جهّز ملفك خطوة بخطوة</span>
              </>
            )}
          </SectionTitle>
          <p className="text-base sm:text-lg lg:text-xl text-[#5E7086] font-normal">
            {t('اختر المعاملة للاطّلاع على قائمة الوثائق، وتواصل معنا إذا احتجت مساعدة.')}
          </p>
        </div>

        {/* Interactive Stage */}
        <div className="bg-[#eaf4ff]/60 rounded-3xl border border-[#D7E7F7] shadow-[0_12px_36px_rgba(6,78,168,0.05)] overflow-hidden">
          {/* Top Procedure Selector Bar */}
          <div className="flex border-b border-[#D7E7F7] overflow-x-auto p-3 gap-2.5 bg-[#FFFFFF]">
            {PROCEDURES.map((p) => {
              const isSelected = p.id === activeProcedureId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveProcedureId(p.id)}
                  className={`py-3 px-4 sm:px-5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#004AA5] text-white shadow-xs font-black'
                      : 'text-[#5E7086] hover:text-[#0B2E57] hover:bg-[#eaf4ff]'
                  }`}
                >
                  <span>{getProcedureTitle(p)}</span>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white font-normal' : 'text-[#CC9048] font-semibold'
                    }`}
                  >
                    {t(p.tag)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Procedure Content Grid */}
          <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Checklist Column */}
            <div className="lg:col-span-8 space-y-6">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0B2E57]">
                  {getProcedureTitle(activeProcedure)}
                </h3>
                <p className="text-sm sm:text-base text-[#5E7086] mt-2.5 font-normal">
                  {getProcedureOverview(activeProcedure)}
                </p>
              </div>

              {activeNotice && (
                <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/90 border-2 border-[#004AA5]/25 text-[#0B2E57] flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#004AA5] shrink-0 mt-1" />
                  <p className="text-sm sm:text-base font-bold leading-[1.85]">
                    {activeNotice}
                  </p>
                </div>
              )}

              {/* Document Checkboxes */}
              <div className="space-y-3">
                <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider block">
                  {t('قائمة الوثائق المطلوبة (انقر لتحديد ما لديك)')}:
                </span>

                <div className="space-y-3">
                  {activeProcedure.documents.map((doc, idx) => {
                    const isChecked = Boolean(checkedDocs[doc.id]);
                    const currentGroup = getDocGroup(doc);
                    const prevGroup =
                      idx > 0 ? getDocGroup(activeProcedure.documents[idx - 1]) : undefined;
                    const showGroupHeader = Boolean(currentGroup && currentGroup !== prevGroup);

                    return (
                      <React.Fragment key={doc.id}>
                        {showGroupHeader && (
                          <div className="pt-3 pb-1">
                            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0B2E57] text-white text-xs sm:text-sm font-extrabold shadow-2xs">
                              <FileText className="w-4 h-4 text-[#E3C88F]" />
                              <span>{currentGroup}</span>
                            </span>
                          </div>
                        )}
                        <div
                          onClick={() => toggleDoc(doc.id)}
                          className={`p-4 sm:p-4.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                            isChecked
                              ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                              : 'border-slate-200 hover:border-blue-200 bg-slate-50/50 hover:bg-white'
                          }`}
                        >
                          <div className="mt-1 shrink-0">
                            {isChecked ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1">
                            <span
                              className={`text-sm sm:text-base font-bold block leading-[1.6] ${
                                isChecked ? 'text-emerald-900 line-through opacity-85' : 'text-slate-800'
                              }`}
                            >
                              {getDocText(doc)}
                            </span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Tips & Warnings */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2.5">
                <span className="text-sm font-black text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>{t('نصائح مهمة لتفادي رفض الملف')}:</span>
                </span>
                <ul className="text-xs sm:text-sm text-amber-900/90 space-y-1.5 pr-5 list-disc font-medium leading-[1.8]">
                  {activeProcedure.tipsAr.map((tip, idx) => (
                    <li key={idx}>{t(tip)}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Live Readiness & Booking Column */}
            <div className="lg:col-span-4 bg-gradient-to-br from-blue-50/80 to-slate-100 rounded-3xl p-6 sm:p-7 border border-blue-100 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  {t('مستوى الجاهزية')}
                </span>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-[#0B2E57]">
                      {readyDocs} {t('من أصل')} {totalDocs} {t('وثائق')}
                    </span>
                    <span className="text-[#004AA5] text-base">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#004AA5] to-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t('مواعيد الحجز المتاحة:')}</span>
                  </div>
                  <p>
                    {t(
                      'تفتح المواعيد بشكل دوري؛ نقوم بمتابعة المواعيد الشاغرة فور توفرها لحجز أقرب وقت مناسب لك.'
                    )}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t('البعثات المعتمدة:')}</span>
                  </div>
                  <p>
                    • {t('القنصلية العامة في إسطنبول')}
                    <br />• {t('سفارة المملكة المغربية في أنقرة')}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/5 border border-slate-200/90 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5 font-extrabold text-[#0B2E57]">
                    <AlertCircle className="w-3.5 h-3.5 text-[#004AA5] shrink-0" />
                    <span>{t('إخلاء المسؤولية:')}</span>
                  </div>
                  <ul className="space-y-1 list-disc list-inside leading-[1.7] font-medium text-[11px] sm:text-xs">
                    <li>{t('لا تربطنا أي علاقة رسمية مع القنصلية المغربية أو مع الإدارة العمومية.')}</li>
                    <li>{t('نقوم بتقديم خدمات استشارية وخدمات المساعدة في إصدار الأوراق.')}</li>
                    <li>
                      {t(
                        'لا ننوب عن الشخص، لكن نساعده بالإرشاد حتى نسهل عليه المعاملات، وتكون المعاملات أسهل وأبسط.'
                      )}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Consultation Action */}
              <div className="pt-2 space-y-3">
                {waSubmitted && (
                  <InlineSuccessBanner
                    title={t('تم تجهيز طلبك. يرجى إرسال الرسالة عبر واتساب لإكمال الطلب.')}
                    subtitle={getProcedureTitle(activeProcedure)}
                    onReopenWhatsApp={handleConsultOnWhatsApp}
                    onDismiss={() => setWaSubmitted(false)}
                  />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(true)}
                    className="w-full py-3.5 px-4 rounded-full bg-[#0B2E57] hover:bg-[#004AA5] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{t('إرسال الطلب عبر الموقع')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConsultOnWhatsApp}
                    className="w-full py-3.5 px-4 rounded-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <WhatsAppLogo className="w-4 h-4 shrink-0" />
                    <span>{waSubmitted ? t('إعادة فتح واتساب') : t('إرسال عبر واتساب')}</span>
                  </button>
                </div>
                <p className="text-center text-[11px] text-slate-500 font-medium">
                  {t('أرسل بيانات طلبك عبر واتساب أو عبر الموقع لمراجعة ملفك وتسهيل موعدك القنصلي.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ServiceContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        serviceTag="CONSULAR"
        serviceTitle={`المعاملة القنصلية: ${getProcedureTitle(activeProcedure)}`}
        serviceSummary={`نوع المعاملة: ${getProcedureTitle(activeProcedure)}\nنسبة جاهزية الملف: ${progressPercent}% (${readyDocs} من ${totalDocs} وثائق متوفرة)\n\nالوثائق المتوفرة:\n${activeProcedure.documents.filter((d) => checkedDocs[d.id]).map((d) => `✓ ${getDocText(d)}`).join('\n') || 'لا يوجد'}\n\nالوثائق غير المكتملة:\n${activeProcedure.documents.filter((d) => !checkedDocs[d.id]).map((d) => `• ${getDocText(d)}`).join('\n') || 'الكل جاهز'}`}
        payloadJson={{
          procedureId: activeProcedure.id,
          procedureTitle: getProcedureTitle(activeProcedure),
          progressPercent,
          readyDocsCount: readyDocs,
          totalDocsCount: totalDocs,
          checkedDocIds: Object.keys(checkedDocs).filter((k) => checkedDocs[k]),
        }}
        onSuccess={() => {
          setShowContactModal(false);
        }}
      />
    </section>
  );
};
