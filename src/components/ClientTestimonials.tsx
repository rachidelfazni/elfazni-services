import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
  CheckCircle2,
  MapPin,
  Camera,
  UserCheck,
  ShieldCheck,
  Sparkles,
  MessageSquarePlus,
  Pause,
  Play,
  Send,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../data/translations';
import { AnimatedSuccessBadge } from './SuccessFeedback';

export interface TestimonialItem {
  id: string;
  category: 'consular' | 'translation' | 'residence' | 'flights';
  rating: number;
  date: Record<Language, string>;
  clientName: Record<Language, string>;
  initials: string;
  moroccoCity: Record<Language, string>;
  turkeyCity: Record<Language, string>;
  serviceUsed: Record<Language, string>;
  quote: Record<Language, string>;
  highlightTag: Record<Language, string>;
  avatarGradient: string;
  avatarAccent: string;
  photoLabel: Record<Language, string>;
  verifiedVia: 'WhatsApp' | 'Consulate' | 'Office';
}

const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    id: 'testim-1',
    category: 'consular',
    rating: 5,
    date: {
      ar: 'منذ 3 أيام',
      tr: '3 gün önce',
      en: '3 days ago',
      fr: 'Il y a 3 jours',
    },
    clientName: {
      ar: 'يوسف العلوي',
      tr: 'Youssef El Alaoui',
      en: 'Youssef El Alaoui',
      fr: 'Youssef El Alaoui',
    },
    initials: 'YA',
    moroccoCity: {
      ar: 'الدار البيضاء',
      tr: 'Kazablanka',
      en: 'Casablanca',
      fr: 'Casablanca',
    },
    turkeyCity: {
      ar: 'إسطنبول (الفاتح)',
      tr: 'İstanbul (Fatih)',
      en: 'Istanbul (Fatih)',
      fr: 'Istanbul (Fatih)',
    },
    serviceUsed: {
      ar: 'حجز موعد قنصلي وتجديد جواز السفر البيومتري',
      tr: 'Konsolosluk Randevusu ve Biyometrik Pasaport Yenileme',
      en: 'Consular Appointment & Biometric Passport Renewal',
      fr: 'Rendez-vous consulaire & Renouvellement de passeport',
    },
    quote: {
      ar: 'كنت أحاول حجز موعد في القنصلية المغربية بإسطنبول لأسابيع دون جدوى بسبب ضغط المنصة. تواصلت مع الأستاذ رشيد الفزني وخلال أقل من 24 ساعة تم تأكيد الموعد مع مراجعة كافة الوثائق بدقة قبل الذهاب. خدمة احترافية توفر الكثير من الوقت والقلق.',
      tr: 'Platformdaki yoğunluk nedeniyle haftalarca İstanbul Fas Konsolosluğu’ndan randevu alamamıştım. Rachid Bey ile iletişime geçtikten sonra 24 saatten kısa sürede randevum onaylandı ve gitmeden önce tüm evraklarım eksiksiz kontrol edildi.',
      en: 'I tried booking an appointment at the Moroccan Consulate in Istanbul for weeks without luck. After contacting Mr. Rachid Elfazni, my appointment was confirmed in under 24 hours with a complete document audit beforehand.',
      fr: 'J’essayais de prendre rendez-vous au consulat du Maroc à Istanbul depuis des semaines. En moins de 24h avec M. Rachid Elfazni, mon rendez-vous a été confirmé et mon dossier vérifié de A à Z.',
    },
    highlightTag: {
      ar: 'تأكيد الموعد في أقل من 24 ساعة',
      tr: '24 Saatte Randevu Onayı',
      en: 'Confirmed in under 24h',
      fr: 'Confirmé en moins de 24h',
    },
    avatarGradient: 'from-[#0B2E57] via-[#004AA5] to-[#0B2E57]',
    avatarAccent: '#CC9048',
    photoLabel: {
      ar: 'صورة عميل موثقة · إسطنبول',
      tr: 'Doğrulanmış Müşteri · İstanbul',
      en: 'Verified Client Photo · Istanbul',
      fr: 'Photo Client Vérifié · Istanbul',
    },
    verifiedVia: 'WhatsApp',
  },
  {
    id: 'testim-2',
    category: 'translation',
    rating: 5,
    date: {
      ar: 'منذ أسبوع',
      tr: '1 hafta önce',
      en: '1 week ago',
      fr: 'Il y a 1 semaine',
    },
    clientName: {
      ar: 'سلمى بنجلون',
      tr: 'Salma Benjelloun',
      en: 'Salma Benjelloun',
      fr: 'Salma Benjelloun',
    },
    initials: 'SB',
    moroccoCity: {
      ar: 'الرباط',
      tr: 'Rabat',
      en: 'Rabat',
      fr: 'Rabat',
    },
    turkeyCity: {
      ar: 'أنقرة (تشانكايا)',
      tr: 'Ankara (Çankaya)',
      en: 'Ankara (Cankaya)',
      fr: 'Ankara (Çankaya)',
    },
    serviceUsed: {
      ar: 'الترجمة المحلفة وتصديق النوتر لملف الزواج المختلط',
      tr: 'Evlilik Dosyası İçin Yeminli Tercüme ve Noter Tasdiki',
      en: 'Sworn Translation & Notary Legalization for Marriage File',
      fr: 'Traduction assermentée & Notaire pour dossier de mariage',
    },
    quote: {
      ar: 'إجراءات الزواج في تركيا تتطلب دقة شديدة في مطابقة الأسماء بين شهادة العزوبة المغربية والترجمة التركية المحلفة. فريق تواصل الجالية تكفل بالترجمة المحلفة وتصديق النوتر والأبوستيل بسرعة قياسية وبدون أي خطأ إملائي.',
      tr: 'Türkiye’de evlilik işlemleri, Fas bekârlık belgesi ile Türkçe yeminli tercüme arasında isimlerin birebir uyuşmasını gerektiriyor. Ekip yeminli tercüme, noter ve apostil işlemlerini sıfır hatayla ve rekor sürede tamamladı.',
      en: 'Marriage procedures in Turkey require strict name matching between Moroccan certificates and sworn Turkish translations. The team handled sworn translation, notary legalization, and Apostille in record time with zero errors.',
      fr: 'Les démarches de mariage en Turquie exigent une précision absolue. L’équipe a géré la traduction assermentée, la légalisation chez le notaire et l’Apostille en un temps record sans la moindre erreur.',
    },
    highlightTag: {
      ar: 'دقة 100% في الترجمة والنوتر',
      tr: '%100 Hatasız Tercüme ve Noter',
      en: '100% Accuracy in Notary & Translation',
      fr: '100% Précision Traduction & Notaire',
    },
    avatarGradient: 'from-[#881337] via-[#bf0029] to-[#4c0519]',
    avatarAccent: '#E3C88F',
    photoLabel: {
      ar: 'صورة عميلة موثقة · أنقرة',
      tr: 'Doğrulanmış Müşteri · Ankara',
      en: 'Verified Client Photo · Ankara',
      fr: 'Photo Cliente Vérifiée · Ankara',
    },
    verifiedVia: 'Office',
  },
  {
    id: 'testim-3',
    category: 'residence',
    rating: 5,
    date: {
      ar: 'منذ أسبوعين',
      tr: '2 hafta önce',
      en: '2 weeks ago',
      fr: 'Il y a 2 semaines',
    },
    clientName: {
      ar: 'كريم الإدريسي',
      tr: 'Karim El Idrissi',
      en: 'Karim El Idrissi',
      fr: 'Karim El Idrissi',
    },
    initials: 'KI',
    moroccoCity: {
      ar: 'مراكش',
      tr: 'Marakeş',
      en: 'Marrakech',
      fr: 'Marrakech',
    },
    turkeyCity: {
      ar: 'أنطاليا',
      tr: 'Antalya',
      en: 'Antalya',
      fr: 'Antalya',
    },
    serviceUsed: {
      ar: 'تجهيز ملف الإقامة العائلية والتأمين الصحي (Sigorta)',
      tr: 'Aile İkamet İzni Dosyası ve Sağlık Sigortası Hazırlığı',
      en: 'Family Residence Permit (Ikamet) & Health Insurance',
      fr: 'Dossier de résidence familiale (Ikamet) & Assurance santé',
    },
    quote: {
      ar: 'جهزوا لي ملف الإقامة العائلية بالكامل عن بُعد وأنا في أنطاليا: استمارة الموعد، التأمين الصحي المعتمد لإدارة الهجرة، وترجمة عقود الزواج والازدياد. دخلت للمقابلة وكان الملف مرتباً بشكل أشاد به الموظف المسؤول.',
      tr: 'Ben Antalya’dayken aile ikamet dosyamı uzaktan eksiksiz hazırladılar: randevu formu, Göç İdaresi onaylı sigorta ve belgelerin tercümesi. Görüşmeye girdiğimde dosyamın düzeni memurun bile takdirini kazandı.',
      en: 'They prepared my entire family residence file remotely while I was in Antalya: appointment form, immigration-approved health insurance, and translations. The immigration officer even praised how organized the file was.',
      fr: 'Ils ont préparé tout mon dossier de résidence familiale à distance depuis Antalya : formulaire, assurance santé agréée et traductions. L’agent de l’immigration a même félicité l’organisation du dossier.',
    },
    highlightTag: {
      ar: 'خدمة متكاملة عن بُعد لجميع الولايات',
      tr: 'Tüm İllere Uzaktan Tam Hizmet',
      en: 'Full Remote Service Across Turkey',
      fr: 'Service complet à distance en Turquie',
    },
    avatarGradient: 'from-[#065f46] via-[#059669] to-[#064e3b]',
    avatarAccent: '#CC9048',
    photoLabel: {
      ar: 'صورة عميل موثقة · أنطاليا',
      tr: 'Doğrulanmış Müşteri · Antalya',
      en: 'Verified Client Photo · Antalya',
      fr: 'Photo Client Vérifié · Antalya',
    },
    verifiedVia: 'WhatsApp',
  },
  {
    id: 'testim-4',
    category: 'flights',
    rating: 5,
    date: {
      ar: 'منذ 3 أسابيع',
      tr: '3 hafta önce',
      en: '3 weeks ago',
      fr: 'Il y a 3 semaines',
    },
    clientName: {
      ar: 'فاطمة الزهراء التازي',
      tr: 'Fatima Zahra Tazi',
      en: 'Fatima Zahra Tazi',
      fr: 'Fatima Zahra Tazi',
    },
    initials: 'FT',
    moroccoCity: {
      ar: 'طنجة',
      tr: 'Tanca',
      en: 'Tangier',
      fr: 'Tanger',
    },
    turkeyCity: {
      ar: 'إسطنبول (باشاك شهير)',
      tr: 'İstanbul (Başakşehir)',
      en: 'Istanbul (Basaksehir)',
      fr: 'Istanbul (Başakşehir)',
    },
    serviceUsed: {
      ar: 'حجز تذاكر طيران واستقبال VIP للعائلة من مطار إسطنبول',
      tr: 'Uçak Bileti ve İstanbul Havalimanı Aile VIP Karşılama',
      en: 'Flight Booking & Family VIP Airport Transfer at IST',
      fr: 'Billets d’avion & Transfert VIP famille à l’aéroport IST',
    },
    quote: {
      ar: 'حجزت لوالديّ تذاكر طنجة – إسطنبول مع خدمة الاستقبال الخاص بالسيارة من مطار إسطنبول الجديد. السائق كان في الانتظار بالاسم وتحدث معهم بالعربية بكل احترام حتى باب المنزل في باشاك شهير. راحة بال لا تقدر بثمن.',
      tr: 'Anne ve babam için Tanca – İstanbul uçak bileti ve İstanbul Havalimanı’ndan VIP transfer ayarladım. Şoför isim tabelasıyla karşıladı ve Başakşehir’deki evimizin kapısına kadar Arapça konuşarak eşlik etti.',
      en: 'I booked Tangier–Istanbul flights and VIP airport pickup for my parents. The driver waited with a name sign, spoke Arabic courteously, and drove them safely right to our door in Basaksehir. Priceless peace of mind.',
      fr: 'J’ai réservé les vols Tanger–Istanbul et le transfert VIP pour mes parents. Le chauffeur les attendait avec une pancarte, parlait arabe avec beaucoup de respect et les a déposés devant notre porte à Başakşehir.',
    },
    highlightTag: {
      ar: 'استقبال عائلي آمن ومريح 24/7',
      tr: '7/24 Güvenli Aile Transferi',
      en: 'Safe 24/7 Family VIP Reception',
      fr: 'Accueil VIP familial sécurisé 24/7',
    },
    avatarGradient: 'from-[#1e3a8a] via-[#1d4ed8] to-[#0f172a]',
    avatarAccent: '#CC9048',
    photoLabel: {
      ar: 'صورة عميلة موثقة · إسطنبول',
      tr: 'Doğrulanmış Müşteri · İstanbul',
      en: 'Verified Client Photo · Istanbul',
      fr: 'Photo Cliente Vérifiée · Istanbul',
    },
    verifiedVia: 'WhatsApp',
  },
  {
    id: 'testim-5',
    category: 'consular',
    rating: 5,
    date: {
      ar: 'منذ شهر',
      tr: '1 ay önce',
      en: '1 month ago',
      fr: 'Il y a 1 mois',
    },
    clientName: {
      ar: 'عبد الصمد المنصوري',
      tr: 'Abdessamad El Mansouri',
      en: 'Abdessamad El Mansouri',
      fr: 'Abdessamad El Mansouri',
    },
    initials: 'AM',
    moroccoCity: {
      ar: 'فاس',
      tr: 'Fes',
      en: 'Fes',
      fr: 'Fès',
    },
    turkeyCity: {
      ar: 'بورصة',
      tr: 'Bursa',
      en: 'Bursa',
      fr: 'Bursa',
    },
    serviceUsed: {
      ar: 'تسجيل مولود جديد وإنجاز الدفتر العائلي المغربي',
      tr: 'Yeni Doğan Kaydı ve Fas Aile Cüzdanı İşlemleri',
      en: 'Newborn Consular Registration & Moroccan Family Book',
      fr: 'Transcription de naissance & Livret de famille marocain',
    },
    quote: {
      ar: 'قدمت من بورصة إلى إسطنبول ليوم واحد فقط لتسجيل مولودتي في القنصلية. بفضل التدقيق المسبق للوثائق وترجمة شهادة الميلاد التركية عبر مكتب الأستاذ رشيد، أنهيت الإجراء من الزيارة الأولى دون الحاجة للعودة مرة أخرى.',
      tr: 'Kızımın konsolosluk kaydı için Bursa’dan İstanbul’a sadece bir günlüğüne geldim. Doğum belgesinin tercümesi ve ön evrak kontrolü sayesinde işlemlerimi tek seferde tamamladım, tekrar gelmeme gerek kalmadı.',
      en: 'I traveled from Bursa to Istanbul for just one day to register my newborn at the Consulate. Thanks to the prior document check and birth certificate translation by Mr. Rachid’s office, everything finished on the first visit.',
      fr: 'Je suis venu de Bursa à Istanbul pour une seule journée afin d’enregistrer mon nouveau-né au consulat. Grâce à la vérification préalable et la traduction de l’acte de naissance, tout a été réglé dès la première visite.',
    },
    highlightTag: {
      ar: 'إنجاز المعاملة من الزيارة الأولى',
      tr: 'İlk Ziyarette Eksiksiz İşlem',
      en: 'Completed on First Consular Visit',
      fr: 'Complété dès la première visite',
    },
    avatarGradient: 'from-[#0B2E57] via-[#0B2E57] to-[#1e293b]',
    avatarAccent: '#10B981',
    photoLabel: {
      ar: 'صورة عميل موثقة · بورصة',
      tr: 'Doğrulanmış Müşteri · Bursa',
      en: 'Verified Client Photo · Bursa',
      fr: 'Photo Client Vérifié · Bursa',
    },
    verifiedVia: 'Consulate',
  },
  {
    id: 'testim-6',
    category: 'translation',
    rating: 4.9,
    date: {
      ar: 'منذ شهر',
      tr: '1 ay önce',
      en: '1 month ago',
      fr: 'Il y a 1 mois',
    },
    clientName: {
      ar: 'هدى الشرايبي',
      tr: 'Houda Chraibi',
      en: 'Houda Chraibi',
      fr: 'Houda Chraibi',
    },
    initials: 'HC',
    moroccoCity: {
      ar: 'أكادير',
      tr: 'Agadir',
      en: 'Agadir',
      fr: 'Agadir',
    },
    turkeyCity: {
      ar: 'طرابزون',
      tr: 'Trabzon',
      en: 'Trabzon',
      fr: 'Trabzon',
    },
    serviceUsed: {
      ar: 'تحرير وكالة عدلية وترجمة الشهادات الدراسية مع الأبوستيل',
      tr: 'Vekâletname Hazırlığı ve Diploma Apostil Tercümesi',
      en: 'Power of Attorney & Academic Diploma Apostille Translation',
      fr: 'Procuration & Traduction de diplômes avec Apostille',
    },
    quote: {
      ar: 'أدرس في مدينة طرابزون وكنت بحاجة لترجمة محلفة لشهاداتي وتصديقها مع إرسالها عبر الشحن السريع (Kargo). التعامل كان راقياً جداً، أرسلوا لي نسخ PDF للمراجعة قبل الطباعة والتصديق، ووصلتني الأصول في اليوم التالي.',
      tr: 'Trabzon’da öğrenciyim; diplomalarımın yeminli tercümesi, noter onayı ve kargo ile gönderilmesi gerekiyordu. Baskıdan önce onay için PDF taslağı gönderdiler ve ertesi gün orijinal evraklarım elime ulaştı.',
      en: 'As a student in Trabzon, I needed sworn translation and legalization of my diplomas shipped via express Kargo. They sent PDF proofs before printing and stamping, and the originals arrived the very next day.',
      fr: 'Étudiante à Trabzon, j’avais besoin de la traduction assermentée de mes diplômes avec envoi par Kargo express. Ils m’ont envoyé les PDF pour validation avant impression et j’ai reçu les originaux le lendemain.',
    },
    highlightTag: {
      ar: 'مراجعة PDF قبل التصديق وشحن سريع',
      tr: 'Onay Öncesi PDF Kontrolü ve Hızlı Kargo',
      en: 'PDF Proofing & Express Kargo',
      fr: 'Validation PDF & Envoi Kargo Express',
    },
    avatarGradient: 'from-[#312e81] via-[#1e40af] to-[#0f172a]',
    avatarAccent: '#CC9048',
    photoLabel: {
      ar: 'صورة عميلة موثقة · طرابزون',
      tr: 'Doğrulanmış Müşteri · Trabzon',
      en: 'Verified Client Photo · Trabzon',
      fr: 'Photo Cliente Vérifiée · Trabzon',
    },
    verifiedVia: 'WhatsApp',
  },
];

const UI_TEXT = {
  kicker: {
    ar: 'شهادات وتقييمات الجالية المغربية في تركيا',
    tr: 'Türkiye’deki Fas Topluluğunun Yorumları ve Değerlendirmeleri',
    en: 'Moroccan Community Feedback & Reviews in Turkey',
    fr: 'Témoignages et Avis de la Communauté Marocaine en Turquie',
  },
  titleMain: {
    ar: 'ثقة الجالية المغربية',
    tr: 'Fas Vatandaşlarının Güveni',
    en: 'Trusted by Moroccan Citizens',
    fr: 'La Confiance des Citoyens Marocains',
  },
  titleGold: {
    ar: 'قصص نجاح حقيقية من جميع ولايات تركيا',
    tr: 'Türkiye’nin Dört Bir Yanından Gerçek Deneyimler',
    en: 'Real Experiences Across Turkish Cities',
    fr: 'Expériences Réelles à Travers Toute la Turquie',
  },
  subtitle: {
    ar: 'تقييمات موثقة من مواطنين مغاربة استفادوا من خدمات حجز المواعيد القنصلية، الترجمة المحلفة، ملفات الإقامة، وحجوزات الطيران والاستقبال من المطار.',
    tr: 'Konsolosluk randevusu, yeminli tercüme, ikamet izni ve havalimanı VIP transfer hizmetlerimizden yararlanan Fas vatandaşlarının doğrulanmış değerlendirmeleri.',
    en: 'Verified reviews from Moroccan citizens who used our consular appointment booking, sworn translation, residence permit, and VIP airport transfer services.',
    fr: 'Avis vérifiés de citoyens marocains ayant utilisé nos services de rendez-vous consulaires, traduction assermentée, titre de séjour et transfert VIP.',
  },
  overallRatingLabel: {
    ar: 'متوسط تقييم العملاء',
    tr: 'Ortalama Müşteri Puanı',
    en: 'Average Client Rating',
    fr: 'Note Moyenne des Clients',
  },
  basedOnReviews: {
    ar: 'بناءً على +650 تقييم موثق عبر واتساب والمكتب',
    tr: 'WhatsApp ve ofis üzerinden +650 doğrulanmış yoruma dayanmaktadır',
    en: 'Based on +650 verified reviews via WhatsApp & Office',
    fr: 'Basé sur +650 avis vérifiés via WhatsApp et au bureau',
  },
  filterAll: {
    ar: 'جميع التقييمات',
    tr: 'Tüm Yorumlar',
    en: 'All Reviews',
    fr: 'Tous les avis',
  },
  filterConsular: {
    ar: 'المواعيد القنصلية',
    tr: 'Konsolosluk',
    en: 'Consular Services',
    fr: 'Services Consulaires',
  },
  filterTranslation: {
    ar: 'الترجمة والنوتر',
    tr: 'Tercüme & Noter',
    en: 'Translation & Notary',
    fr: 'Traduction & Notaire',
  },
  filterResidence: {
    ar: 'ملفات الإقامة',
    tr: 'İkamet İzni',
    en: 'Residence Permits',
    fr: 'Titres de Séjour',
  },
  filterFlights: {
    ar: 'الطيران والمطار',
    tr: 'Uçuş & Transfer',
    en: 'Flights & Airport',
    fr: 'Vols & Aéroport',
  },
  photoPlaceholderBadge: {
    ar: 'معاينة الصورة الرمزية',
    tr: 'Fotoğraf Yer Tutucu',
    en: 'Client Photo Placeholder',
    fr: 'Aperçu Photo Client',
  },
  privacyNote: {
    ar: 'حفاظاً على خصوصية أفراد الجالية، يتم عرض إطار الصورة الرمزية الموثقة مع إمكانية إرفاق صورتك اختيارياً عند إضافة تقييمك.',
    tr: 'Topluluk üyelerimizin gizliliğini korumak amacıyla doğrulanmış avatar çerçevesi gösterilmektedir.',
    en: 'To protect community privacy, verified avatar placeholders are shown with optional photo upload when submitting your review.',
    fr: 'Pour protéger la vie privée de la communauté, des cadres photo vérifiés sont affichés avec option d’ajout de photo.',
  },
  verifiedCitizen: {
    ar: 'مواطن مغربي موثق',
    tr: 'Doğrulanmış Fas Vatandaşı',
    en: 'Verified Moroccan Citizen',
    fr: 'Citoyen Marocain Vérifié',
  },
  originToResidence: {
    ar: 'من المغرب إلى تركيا',
    tr: 'Fas’tan Türkiye’ye',
    en: 'Morocco to Turkey',
    fr: 'Du Maroc vers la Turquie',
  },
  addReviewBtn: {
    ar: 'أضف تقييمك وتجربتك',
    tr: 'Deneyiminizi Paylaşın',
    en: 'Share Your Experience',
    fr: 'Partagez Votre Expérience',
  },
  pauseCarousel: {
    ar: 'إيقاف التمرير التلقائي',
    tr: 'Otomatik Kaydırmayı Durdur',
    en: 'Pause Auto-Play',
    fr: 'Mettre en pause',
  },
  playCarousel: {
    ar: 'تشغيل التمرير التلقائي',
    tr: 'Otomatik Kaydırmayı Başlat',
    en: 'Resume Auto-Play',
    fr: 'Lecture automatique',
  },
  prevSlide: {
    ar: 'التقييم السابق',
    tr: 'Önceki Yorum',
    en: 'Previous Review',
    fr: 'Avis précédent',
  },
  nextSlide: {
    ar: 'التقييم التالي',
    tr: 'Sonraki Yorum',
    en: 'Next Review',
    fr: 'Avis suivant',
  },
  modalTitle: {
    ar: 'شارك تجربتك مع الجالية المغربية',
    tr: 'Deneyiminizi Fas Topluluğu İle Paylaşın',
    en: 'Share Your Feedback with the Community',
    fr: 'Partagez votre avis avec la communauté',
  },
  modalSub: {
    ar: 'تقييمك يساعد إخوانك المغاربة في تركيا على إتمام معاملاتهم بثقة وأمان.',
    tr: 'Değerlendirmeniz Türkiye’deki diğer Fas vatandaşlarına yol gösterir.',
    en: 'Your rating helps fellow Moroccan citizens in Turkey complete their procedures with confidence.',
    fr: 'Votre évaluation aide les citoyens marocains en Turquie dans leurs démarches.',
  },
  yourRatingLabel: {
    ar: 'تقييمك للخدمة (اختر عدد النجوم)',
    tr: 'Hizmet Puanınız (Yıldız Seçin)',
    en: 'Your Service Rating (Select Stars)',
    fr: 'Votre note (Sélectionnez les étoiles)',
  },
  yourNameLabel: {
    ar: 'الاسم الكامل أو الكنية',
    tr: 'Adınız Soyadınız',
    en: 'Full Name',
    fr: 'Nom complet',
  },
  yourCitiesLabel: {
    ar: 'مدينتك في المغرب / الإقامة في تركيا',
    tr: 'Fas Şehri / Türkiye’deki Şehir',
    en: 'Moroccan City / Turkish City',
    fr: 'Ville au Maroc / Ville en Turquie',
  },
  yourCitiesPlaceholder: {
    ar: 'مثال: الدار البيضاء ← إسطنبول',
    tr: 'Örn: Kazablanka → İstanbul',
    en: 'e.g., Casablanca → Istanbul',
    fr: 'ex. Casablanca → Istanbul',
  },
  serviceCategoryLabel: {
    ar: 'الخدمة التي استفدت منها',
    tr: 'Aldığınız Hizmet',
    en: 'Service Used',
    fr: 'Service utilisé',
  },
  photoPlaceholderUpload: {
    ar: 'صورة الملف الشخصي (إطار معاينة اختياري)',
    tr: 'Profil Fotoğrafı (İsteğe Bağlı Önizleme)',
    en: 'Profile Photo Placeholder (Optional Preview)',
    fr: 'Photo de profil (Aperçu optionnel)',
  },
  uploadPhotoBtn: {
    ar: 'اختر صورة أو استخدم الرمز الافتراضي الموثق',
    tr: 'Fotoğraf Seçin veya Varsayılan Avatarı Kullanın',
    en: 'Select Photo or Use Verified Placeholder',
    fr: 'Choisir une photo ou utiliser l’avatar vérifié',
  },
  yourCommentLabel: {
    ar: 'تفاصيل تجربتك',
    tr: 'Deneyiminiz ve Yorumunuz',
    en: 'Your Feedback',
    fr: 'Votre commentaire',
  },
  yourCommentPlaceholder: {
    ar: 'اكتب رأيك بصراحة حول سرعة الإنجاز، دقة المواعيد، أو جودة الترجمة...',
    tr: 'İşlem hızı, randevu doğruluğu veya tercüme kalitesi hakkındaki görüşünüzü yazın...',
    en: 'Share your honest thoughts on speed, accuracy, or customer support...',
    fr: 'Partagez votre avis sur la rapidité, la précision ou l’accompagnement...',
  },
  submitReviewBtn: {
    ar: 'إرسال التقييم وتوثيقه',
    tr: 'Değerlendirmeyi Gönder',
    en: 'Submit Verified Review',
    fr: 'Envoyer l’avis vérifié',
  },
  successTitle: {
    ar: 'شكراً لك! تم استلام تقييمك بنجاح',
    tr: 'Teşekkürler! Değerlendirmeniz Alındı',
    en: 'Thank You! Your Review Was Received',
    fr: 'Merci ! Votre avis a bien été reçu',
  },
  successSub: {
    ar: 'تمت إضافة تقييمك إلى قائمة شهادات الجالية المغربية بنجاح.',
    tr: 'Yorumunuz Fas topluluğu referans listesine başarıyla eklendi.',
    en: 'Your feedback has been added to our Moroccan community testimonials carousel.',
    fr: 'Votre témoignage a été ajouté au carrousel des avis de la communauté.',
  },
};

export const ClientTestimonials: React.FC = () => {
  const { language, isRtl } = useLanguage();
  const dir = isRtl ? 'rtl' : 'ltr';
  const [selectedCategory, setSelectedCategory] = useState<'all' | TestimonialItem['category']>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [customTestimonials, setCustomTestimonials] = useState<TestimonialItem[]>([]);
  const [showPhotoFrameInfo, setShowPhotoFrameInfo] = useState<string | null>(null);

  // Add Review Modal / Drawer State
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [newName, setNewName] = useState('');
  const [newCities, setNewCities] = useState('');
  const [newCategory, setNewCategory] = useState<TestimonialItem['category']>('consular');
  const [newComment, setNewComment] = useState('');
  const [customPhotoPreview, setCustomPhotoPreview] = useState<string | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const allTestimonials = [...customTestimonials, ...TESTIMONIALS_DATA];

  const filteredTestimonials =
    selectedCategory === 'all'
      ? allTestimonials
      : allTestimonials.filter((item) => item.category === selectedCategory);

  const totalSlides = filteredTestimonials.length;

  // Keep activeIndex in bounds when filter changes
  useEffect(() => {
    setActiveIndex(0);
  }, [selectedCategory]);

  const handleNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    if (totalSlides <= 1) return;
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto-advance timer
  useEffect(() => {
    if (!isAutoPlaying || isHovered || isReviewFormOpen || totalSlides <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5500);
    return () => clearInterval(timer);
  }, [isAutoPlaying, isHovered, isReviewFormOpen, totalSlides, handleNext]);

  // Get 3 visible items for desktop carousel view starting at activeIndex
  const getVisibleItems = () => {
    if (filteredTestimonials.length === 0) return [];
    if (filteredTestimonials.length <= 3) return filteredTestimonials;
    const items: TestimonialItem[] = [];
    for (let i = 0; i < 3; i++) {
      items.push(filteredTestimonials[(activeIndex + i) % filteredTestimonials.length]);
    }
    return items;
  };

  const visibleItems = getVisibleItems();
  const featuredItem = filteredTestimonials[activeIndex] || filteredTestimonials[0];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newComment.trim()) return;

    const parts = newCities.split(/[-←→/]/).map((s) => s.trim()).filter(Boolean);
    const moroccoCity = parts[0] || (language === 'ar' ? 'المغرب' : 'Morocco');
    const turkeyCity = parts[1] || (language === 'ar' ? 'إسطنبول' : 'Istanbul');

    const initials = newName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || 'M')
      .join('');

    const serviceMap: Record<TestimonialItem['category'], Record<Language, string>> = {
      consular: UI_TEXT.filterConsular,
      translation: UI_TEXT.filterTranslation,
      residence: UI_TEXT.filterResidence,
      flights: UI_TEXT.filterFlights,
    };

    const createdItem: TestimonialItem = {
      id: `custom-${Date.now()}`,
      category: newCategory,
      rating: newRating,
      date: {
        ar: 'الآن',
        tr: 'Şimdi',
        en: 'Just now',
        fr: 'À l’instant',
      },
      clientName: {
        ar: newName.trim(),
        tr: newName.trim(),
        en: newName.trim(),
        fr: newName.trim(),
      },
      initials: initials || 'MC',
      moroccoCity: {
        ar: moroccoCity,
        tr: moroccoCity,
        en: moroccoCity,
        fr: moroccoCity,
      },
      turkeyCity: {
        ar: turkeyCity,
        tr: turkeyCity,
        en: turkeyCity,
        fr: turkeyCity,
      },
      serviceUsed: serviceMap[newCategory],
      quote: {
        ar: newComment.trim(),
        tr: newComment.trim(),
        en: newComment.trim(),
        fr: newComment.trim(),
      },
      highlightTag: {
        ar: 'تقييم مضاف حديثاً',
        tr: 'Yeni Eklenen Değerlendirme',
        en: 'Newly Added Review',
        fr: 'Avis récemment ajouté',
      },
      avatarGradient: 'from-[#0B2E57] via-[#004AA5] to-[#0B2E57]',
      avatarAccent: '#CC9048',
      photoLabel: {
        ar: customPhotoPreview ? 'صورة مرفقة من العميل' : 'صورة عميل موثقة',
        tr: customPhotoPreview ? 'Müşteri Fotoğrafı' : 'Doğrulanmış Müşteri',
        en: customPhotoPreview ? 'Uploaded Client Photo' : 'Verified Client Photo',
        fr: customPhotoPreview ? 'Photo téléchargée' : 'Photo Client Vérifié',
      },
      verifiedVia: 'WhatsApp',
    };

    setCustomTestimonials((prev) => [createdItem, ...prev]);
    setSelectedCategory('all');
    setActiveIndex(0);
    setReviewSubmitted(true);
  };

  const resetAndCloseForm = () => {
    setReviewSubmitted(false);
    setIsReviewFormOpen(false);
    setNewName('');
    setNewCities('');
    setNewComment('');
    setNewRating(5);
    setCustomPhotoPreview(null);
  };

  const renderStars = (rating: number, sizeClass = 'w-4 h-4') => {
    return (
      <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= Math.round(rating);
          return (
            <Star
              key={starIndex}
              className={`${sizeClass} transition-transform duration-200 ${
                isFilled
                  ? 'text-[#CC9048] fill-[#CC9048] drop-shadow-[0_1px_2px_rgba(245,158,11,0.35)]'
                  : 'text-slate-300 fill-slate-200'
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <section
      id="testimonials"
      dir={dir}
      aria-labelledby="testimonials-heading"
      className="py-16 md:py-24 bg-gradient-to-b from-[#fbfbfd] via-[#f4f8fd] to-[#fbfbfd] relative overflow-hidden border-t border-slate-200/70"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle Moroccan-Turkish Geometric Background Accents */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#0B2E57]/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#CC9048]/10 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header + Overall Rating Summary Card */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0B2E57] tracking-wide mb-3">
              <Sparkles className="w-4 h-4 text-[#CC9048]" />
              <span>{UI_TEXT.kicker[language]}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-[#bf0029] font-extrabold">MA 🇲🇦 ↔ TR 🇹🇷</span>
            </div>

            <h2
              id="testimonials-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0B2E57] leading-tight"
            >
              <span className="block">{UI_TEXT.titleMain[language]}</span>
              <span className="gold-heading-title block mt-1.5 text-xl sm:text-2xl md:text-3xl">
                {UI_TEXT.titleGold[language]}
              </span>
            </h2>

            <p className="mt-3 text-sm sm:text-base text-[#414752] leading-relaxed">
              {UI_TEXT.subtitle[language]}
            </p>
          </div>

          {/* Rating Summary Box + Share Review CTA */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_12px_32px_-12px_rgba(18,85,154,0.1)] flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[#0B2E57] text-white flex flex-col items-center justify-center shadow-inner shrink-0">
                <span className="text-xl font-extrabold leading-none text-[#E3C88F]">4.9</span>
                <span className="text-[10px] text-white/80 font-medium mt-0.5">/ 5.0</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {renderStars(5, 'w-4 h-4')}
                  <span className="text-xs font-extrabold text-emerald-700">99.2%</span>
                </div>
                <p className="text-xs font-bold text-[#0B2E57] mt-1">
                  {UI_TEXT.overallRatingLabel[language]}
                </p>
                <p className="text-[11px] text-[#717783]">
                  {UI_TEXT.basedOnReviews[language]}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto sm:border-s sm:border-slate-200 sm:ps-5">
              <button
                type="button"
                onClick={() => setIsReviewFormOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow cursor-pointer"
              >
                <MessageSquarePlus className="w-4 h-4 text-[#E3C88F]" />
                <span>{UI_TEXT.addReviewBtn[language]}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Category Filter Bar & Carousel Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Segmented Category Filter Controls */}
          <div
            role="tablist"
            aria-label="Filter testimonials by service"
            className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-xl overflow-x-auto max-w-full"
          >
            {(
              [
                { id: 'all', label: UI_TEXT.filterAll[language] },
                { id: 'consular', label: UI_TEXT.filterConsular[language] },
                { id: 'translation', label: UI_TEXT.filterTranslation[language] },
                { id: 'residence', label: UI_TEXT.filterResidence[language] },
                { id: 'flights', label: UI_TEXT.filterFlights[language] },
              ] as const
            ).map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0B2E57] text-white shadow-sm'
                      : 'text-[#414752] hover:text-[#0B2E57] hover:bg-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Carousel Navigation Buttons + AutoPlay Control */}
          <div className="flex items-center gap-2 ms-auto">
            <button
              type="button"
              onClick={() => setIsAutoPlaying((prev) => !prev)}
              aria-label={
                isAutoPlaying
                  ? UI_TEXT.pauseCarousel[language]
                  : UI_TEXT.playCarousel[language]
              }
              title={
                isAutoPlaying
                  ? UI_TEXT.pauseCarousel[language]
                  : UI_TEXT.playCarousel[language]
              }
              className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0B2E57] flex items-center justify-center transition-colors cursor-pointer"
            >
              {isAutoPlaying ? (
                <Pause className="w-4 h-4 text-[#0B2E57]" />
              ) : (
                <Play className="w-4 h-4 text-[#0B2E57]" />
              )}
            </button>

            <button
              type="button"
              onClick={dir === 'rtl' ? handleNext : handlePrev}
              aria-label={UI_TEXT.prevSlide[language]}
              className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-[#0B2E57] hover:text-white hover:border-[#0B2E57] text-[#0B2E57] flex items-center justify-center transition-all shadow-xs cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-xs font-extrabold text-[#0B2E57] px-2 tabular-nums">
              {activeIndex + 1} / {totalSlides}
            </span>

            <button
              type="button"
              onClick={dir === 'rtl' ? handlePrev : handleNext}
              aria-label={UI_TEXT.nextSlide[language]}
              className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-[#0B2E57] hover:text-white hover:border-[#0B2E57] text-[#0B2E57] flex items-center justify-center transition-all shadow-xs cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Featured Spotlight Banner + 3-Card Carousel Grid */}
        {featuredItem && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left/Start Featured Testimonial with Dedicated Client Photo Placeholder Frame */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#0B2E57] via-[#072a57] to-[#0B2E57] text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-xl border border-white/10">
              <Quote className="w-24 h-24 text-white/5 absolute -top-2 -end-2 pointer-events-none" />

              <div>
                {/* Top Photo Placeholder Card & Client Identity */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-white/15">
                  {/* Interactive Photo Placeholder Frame */}
                  <div className="relative group shrink-0">
                    <div
                      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${featuredItem.avatarGradient} p-0.5 shadow-lg border-2 border-[#CC9048]/70 overflow-hidden relative flex items-center justify-center`}
                    >
                      {/* Portrait Silhouette & Initials Placeholder */}
                      <div className="w-full h-full rounded-[14px] bg-[#0a192f]/60 backdrop-blur-xs flex flex-col items-center justify-center relative overflow-hidden">
                        {/* Stylized SVG Portrait Placeholder */}
                        <svg
                          viewBox="0 0 80 80"
                          className="w-16 h-16 text-white/20 absolute -bottom-2"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <circle cx="40" cy="26" r="14" />
                          <path d="M14 72c0-14.36 11.64-26 26-26s26 11.64 26 26H14z" />
                        </svg>

                        <span className="relative z-10 text-xl sm:text-2xl font-extrabold tracking-wider text-white drop-shadow">
                          {featuredItem.initials}
                        </span>
                        <span className="relative z-10 text-[9px] font-semibold text-[#E3C88F] tracking-tight mt-0.5 flex items-center gap-1">
                          <Camera className="w-2.5 h-2.5" />
                          <span>PHOTO</span>
                        </span>
                      </div>
                    </div>

                    {/* Verified Check Badge */}
                    <div
                      className="absolute -bottom-1.5 -end-1.5 w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#0B2E57] flex items-center justify-center shadow"
                      title={UI_TEXT.verifiedCitizen[language]}
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Client Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {renderStars(featuredItem.rating, 'w-4 h-4')}
                      <span className="text-xs font-bold text-[#E3C88F]">
                        {featuredItem.rating.toFixed(1)}
                      </span>
                      <span aria-hidden="true" className="text-white/30">·</span>
                      <span className="text-xs text-white/75">{featuredItem.date[language]}</span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1.5 truncate">
                      {featuredItem.clientName[language]}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-[#B9D5F6] mt-1 flex-wrap">
                      <MapPin className="w-3.5 h-3.5 text-[#E3C88F] shrink-0" />
                      <span>🇲🇦 {featuredItem.moroccoCity[language]}</span>
                      <span aria-hidden="true" className="text-white/40">↔</span>
                      <span>🇹🇷 {featuredItem.turkeyCity[language]}</span>
                    </div>

                    <p className="text-[11px] text-emerald-300 font-semibold mt-1.5 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>{featuredItem.photoLabel[language]}</span>
                    </p>
                  </div>
                </div>

                {/* Featured Quote Text */}
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#E3C88F] mb-2">
                    {featuredItem.serviceUsed[language]}
                  </p>
                  <blockquote className="text-sm sm:text-base md:text-lg leading-relaxed text-white/95 font-medium">
                    "{featuredItem.quote[language]}"
                  </blockquote>
                </div>
              </div>

              {/* Bottom Highlight & Privacy Note */}
              <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between gap-3 flex-wrap text-xs text-white/80">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{featuredItem.highlightTag[language]}</span>
                </div>
                <span className="text-[11px] text-white/60">
                  {UI_TEXT.verifiedCitizen[language]} · {featuredItem.verifiedVia}
                </span>
              </div>
            </div>

            {/* Right/End 3-Card Interactive Selector Column */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {visibleItems.map((item, idx) => {
                const isCurrent = item.id === featuredItem.id;
                return (
                  <article
                    key={`${item.id}-${idx}`}
                    onClick={() => {
                      const targetIndex = filteredTestimonials.findIndex((t) => t.id === item.id);
                      if (targetIndex !== -1) setActiveIndex(targetIndex);
                    }}
                    className={`group rounded-2xl p-5 transition-all duration-300 cursor-pointer border flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-white border-[#0B2E57] shadow-[0_12px_30px_-10px_rgba(18,85,154,0.18)] ring-1 ring-[#0B2E57]/20'
                        : 'bg-white/85 hover:bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        {/* Avatar Photo Placeholder + Name */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative shrink-0">
                            <div
                              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.avatarGradient} flex flex-col items-center justify-center text-white shadow-sm border border-slate-200 relative overflow-hidden`}
                            >
                              <svg
                                viewBox="0 0 64 64"
                                className="w-12 h-12 text-white/15 absolute -bottom-1.5"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <circle cx="32" cy="22" r="11" />
                                <path d="M12 58c0-11.05 8.95-20 20-20s20 8.95 20 20H12z" />
                              </svg>
                              <span className="relative z-10 text-sm font-extrabold">
                                {item.initials}
                              </span>
                              <span className="relative z-10 text-[8px] text-[#E3C88F] font-bold flex items-center gap-0.5">
                                <ImageIcon className="w-2 h-2" />
                                <span>IMG</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowPhotoFrameInfo(
                                  showPhotoFrameInfo === item.id ? null : item.id
                                );
                              }}
                              title={UI_TEXT.photoPlaceholderBadge[language]}
                              className="absolute -bottom-1 -end-1 w-5 h-5 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-[#0B2E57] hover:bg-[#0B2E57] hover:text-white transition-colors"
                            >
                              <Camera className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm sm:text-base font-extrabold text-[#0B2E57] truncate">
                                {item.clientName[language]}
                              </h4>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[#717783] mt-0.5">
                              <span>{item.moroccoCity[language]}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-[#0B2E57]">
                                {item.turkeyCity[language]}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{item.date[language]}</span>
                            </div>
                          </div>
                        </div>

                        {/* Star Rating */}
                        <div className="flex flex-col items-end shrink-0">
                          {renderStars(item.rating, 'w-3.5 h-3.5')}
                          <span className="text-[11px] font-bold text-[#414752] mt-1">
                            {item.serviceUsed[language].split(' ')[0]}{' '}
                            {item.serviceUsed[language].split(' ')[1]}
                          </span>
                        </div>
                      </div>

                      {/* Optional Photo Placeholder Privacy Tooltip */}
                      {showPhotoFrameInfo === item.id && (
                        <div className="mt-3 p-2.5 rounded-xl bg-[#eaf4ff] border border-[#0B2E57]/15 text-[11px] text-[#0B2E57] flex items-center justify-between gap-2">
                          <span>{UI_TEXT.privacyNote[language]}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPhotoFrameInfo(null);
                            }}
                            className="text-[#0B2E57] font-bold px-1.5"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* Quote Preview */}
                      <p className="mt-3 text-xs sm:text-sm text-[#414752] line-clamp-2 leading-relaxed">
                        "{item.quote[language]}"
                      </p>
                    </div>

                    {/* Footer Metadata */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#717783]">
                      <span className="font-semibold text-[#0B2E57] truncate">
                        {item.serviceUsed[language]}
                      </span>
                      <span className="font-bold text-emerald-700 shrink-0 ms-2">
                        ✓ {item.highlightTag[language]}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* Carousel Pagination Dots & Privacy Note */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2" role="tablist" aria-label="Testimonial slides">
            {filteredTestimonials.map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`${item.clientName[language]} - ${idx + 1}`}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'w-8 bg-[#0B2E57]'
                      : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              );
            })}
          </div>

          <p className="text-xs text-[#717783] flex items-center gap-1.5 text-center sm:text-end">
            <Camera className="w-3.5 h-3.5 text-[#0B2E57] shrink-0" />
            <span>{UI_TEXT.privacyNote[language]}</span>
          </p>
        </div>
      </div>

      {/* Interactive Modal to Submit a New Client Testimonial with Star Rating & Photo Placeholder */}
      {isReviewFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-review-modal-title"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={resetAndCloseForm}
              aria-label="Close"
              className="absolute top-5 end-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {reviewSubmitted ? (
              <div className="py-6 text-center flex flex-col items-center">
                <AnimatedSuccessBadge size="lg" className="mb-4" />
                <h4 className="text-lg font-extrabold text-[#0B2E57]">
                  {UI_TEXT.successTitle[language]}
                </h4>
                <p className="text-xs sm:text-sm text-[#414752] mt-1.5 max-w-sm">
                  {UI_TEXT.successSub[language]}
                </p>
                <button
                  type="button"
                  onClick={resetAndCloseForm}
                  className="mt-6 w-full py-3 px-6 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  OK
                </button>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <h3
                    id="add-review-modal-title"
                    className="text-xl font-extrabold text-[#0B2E57]"
                  >
                    {UI_TEXT.modalTitle[language]}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#414752] mt-1">
                    {UI_TEXT.modalSub[language]}
                  </p>
                </div>

                {/* Interactive 5-Star Rating Picker */}
                <div className="p-4 rounded-2xl bg-[#f7f9fb] border border-slate-200/80">
                  <label className="block text-xs font-bold text-[#0B2E57] mb-2">
                    {UI_TEXT.yourRatingLabel[language]}
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating || newRating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setNewRating(star)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 transition-transform hover:scale-110 cursor-pointer"
                          aria-label={`${star} Stars`}
                        >
                          <Star
                            className={`w-7 h-7 ${
                              active
                                ? 'text-[#CC9048] fill-[#CC9048]'
                                : 'text-slate-300 fill-slate-100'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="ms-2 text-sm font-extrabold text-[#0B2E57]">
                      {hoverRating || newRating}.0 / 5.0
                    </span>
                  </div>
                </div>

                {/* Client Photo Placeholder Preview / Upload */}
                <div>
                  <label className="block text-xs font-bold text-[#0B2E57] mb-1.5">
                    {UI_TEXT.photoPlaceholderUpload[language]}
                  </label>
                  <div className="flex items-center gap-3.5 p-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0B2E57] to-[#0B2E57] text-white flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                      {customPhotoPreview ? (
                        <img
                          src={customPhotoPreview}
                          alt="Client preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-[#E3C88F]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B2E57] hover:underline cursor-pointer">
                        <span>{UI_TEXT.uploadPhotoBtn[language]}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="sr-only"
                        />
                      </label>
                      <p className="text-[11px] text-[#717783] mt-0.5 truncate">
                        {UI_TEXT.photoPlaceholderBadge[language]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name & Cities */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0B2E57] mb-1">
                      {UI_TEXT.yourNameLabel[language]} *
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0B2E57] focus:outline-none focus:ring-2 focus:ring-[#0B2E57]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0B2E57] mb-1">
                      {UI_TEXT.yourCitiesLabel[language]}
                    </label>
                    <input
                      type="text"
                      value={newCities}
                      onChange={(e) => setNewCities(e.target.value)}
                      placeholder={UI_TEXT.yourCitiesPlaceholder[language]}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0B2E57] focus:outline-none focus:ring-2 focus:ring-[#0B2E57]"
                    />
                  </div>
                </div>

                {/* Service Category */}
                <div>
                  <label className="block text-xs font-bold text-[#0B2E57] mb-1">
                    {UI_TEXT.serviceCategoryLabel[language]}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as TestimonialItem['category'])
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0B2E57] bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2E57]"
                  >
                    <option value="consular">{UI_TEXT.filterConsular[language]}</option>
                    <option value="translation">{UI_TEXT.filterTranslation[language]}</option>
                    <option value="residence">{UI_TEXT.filterResidence[language]}</option>
                    <option value="flights">{UI_TEXT.filterFlights[language]}</option>
                  </select>
                </div>

                {/* Feedback Textarea */}
                <div>
                  <label className="block text-xs font-bold text-[#0B2E57] mb-1">
                    {UI_TEXT.yourCommentLabel[language]} *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={UI_TEXT.yourCommentPlaceholder[language]}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0B2E57] focus:outline-none focus:ring-2 focus:ring-[#0B2E57]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{UI_TEXT.submitReviewBtn[language]}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
