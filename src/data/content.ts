export interface ServiceItem {
  id: string;
  num: string;
  title: string;
  titleTr: string;
  titleEn: string;
  titleFr: string;
  desc: string;
  descTr: string;
  descEn: string;
  descFr: string;
  actionText: string;
  actionType: 'flight_modal' | 'consular_modal' | 'whatsapp';
  whatsappQuery?: string;
  badge?: string;
}

export interface AirlineItem {
  name: string;
  logo: string;
}

export interface FAQItem {
  q: string;
  qTr: string;
  qEn: string;
  qFr: string;
  a: string;
  aTr: string;
  aEn: string;
  aFr: string;
}

export const SITE_CONTACT = {
  phone: '+90 552 267 7851',
  phoneDisplay: '+90 552 267 7851',
  phoneLocal: '0552 267 7851',
  whatsappRaw: '905522677851',
  email: 'rachidelfazni@gmail.com',
  founderNameAr: 'رشيد الفزني',
  founderNameEn: 'Rachid Elfazni',
  founderTitleAr: 'مؤسس ELFAZNI SERVICES',
  founderTitleEn: 'Founder of ELFAZNI SERVICES',
  founderTitleTr: 'ELFAZNI SERVICES Kurucusu',
  founderTitleFr: 'Fondateur d’ELFAZNI SERVICES',
  instagram: 'https://www.instagram.com/elfazniservices/',
  facebook: 'https://www.facebook.com/alfazni.services',
  instagramHandle: '@elfazniservices',
  facebookHandle: '@alfazni.services',
  locationAr: 'إسطنبول، تركيا',
  workingHoursAr: 'متاحون يومياً عبر واتساب',
};

export const ROTATING_HERO_PHRASES = {
  ar: [
    'مواعيد القنصلية المغربية',
    'حجوزات الطيران والفنادق',
    'توصيل إلى المطار (VIP)',
    'الترجمة المحلفة',
    'تجديد الإقامات',
    'معاملات الجالية في تركيا',
  ],
  tr: [
    'Fas konsolosluk randevuları',
    'Uçak ve otel rezervasyonları',
    'Havalimanı VIP transferi',
    'Yeminli tercüme',
    'İkamet yenileme',
    'Türkiye’deki Faslılara özel işlemler',
  ],
  en: [
    'Moroccan consular appointments',
    'Flight and hotel bookings',
    'VIP Airport transfers',
    'Sworn translation',
    'Residence renewals',
    'Services for Moroccans in Türkiye',
  ],
  fr: [
    'Rendez-vous consulaires marocains',
    'Réservations de vols et hôtels',
    'Transferts aéroport VIP',
    'Traduction assermentée',
    'Renouvellement de séjour en Turquie',
    'Démarches pour Marocains en Turquie',
  ],
};

export const MARQUEE_ITEMS = [
  'مواعيد القنصلية',
  'حجوزات الطيران',
  'توصيل إلى المطار',
  'الترجمة المحلفة',
  'تجديد الإقامات',
  'حجوزات الفنادق',
  'خدمات الجالية',
  'أهلية الزواج',
  'التوكيلات الرسمية',
  'تسجيل المواليد',
];

export const SERVICES_LIST: ServiceItem[] = [
  {
    id: 'consular',
    num: '01',
    title: 'مواعيد القنصلية',
    titleTr: 'Konsolosluk Randevuları',
    titleEn: 'Consular Appointments',
    titleFr: 'Rendez-vous consulaires',
    desc: 'المساعدة في حجز ومتابعة المواعيد القنصلية المغربية والخدمات المرتبطة بها.',
    descTr: 'Fas konsolosluk randevularını ve ilgili işlemleri planlama ve takip desteği.',
    descEn: 'Assistance in booking and managing Moroccan consular appointments in Istanbul and Ankara.',
    descFr: 'Aide à la prise et au suivi des rendez-vous consulaires à Istanbul et Ankara.',
    actionText: 'اختر نوع الموعد',
    actionType: 'consular_modal',
    badge: 'إسطنبول وأنقرة',
  },
  {
    id: 'flights',
    num: '02',
    title: 'حجوزات الطيران',
    titleTr: 'Uçak Rezervasyonları',
    titleEn: 'Flight Bookings',
    titleFr: 'Réservations de vols',
    desc: 'خيارات رحلات داخل تركيا وإلى مختلف دول العالم وفق تاريخك ووجهتك.',
    descTr: 'Tarihinize ve rotanıza göre Türkiye içi ve dünya çapında uçuş seçenekleri.',
    descEn: 'Flight options within Türkiye and worldwide according to your dates and destination.',
    descFr: 'Des vols en Turquie et dans le monde selon vos dates et votre destination.',
    actionText: 'اختر رحلتك',
    actionType: 'flight_modal',
    badge: 'طيران وسفر',
  },
  {
    id: 'airport',
    num: '03',
    title: 'التوصيل للمطار',
    titleTr: 'Havalimanı Transferi',
    titleEn: 'Airport Transfer',
    titleFr: 'Transferts aéroport',
    desc: 'استقبال وتوصيل VIP مريح وآمن من وإلى مطار إسطنبول (IST) ومطار صبيحة (SAW).',
    descTr: 'İstanbul Havalimanı (IST) ve Sabiha Gökçen (SAW) için konforlu VIP transfer.',
    descEn: 'Comfortable and punctual private VIP transfers for Istanbul Airport (IST) and Sabiha Gökçen (SAW).',
    descFr: 'Transferts VIP privés confortables et ponctuels vers l’aéroport d’Istanbul (IST) et Sabiha Gökçen (SAW).',
    actionText: 'اطلب التوصيل',
    actionType: 'whatsapp',
    whatsappQuery: 'مرحباً، أود حجز خدمة توصيل إلى المطار في إسطنبول',
    badge: 'IST & SAW VIP',
  },
  {
    id: 'translation',
    num: '04',
    title: 'الترجمة المحلفة',
    titleTr: 'Yeminli Tercüme',
    titleEn: 'Sworn Translation',
    titleFr: 'Traduction assermentée',
    desc: 'ترجمة الوثائق والمعاملات مع تنظيم الخطوات وإرسال النسخ عن بُعد.',
    descTr: 'Belgelerin yeminli tercümesi, işlem adımları ve uzaktan teslim desteği.',
    descEn: 'Certified translation of official documents with organized steps and remote file delivery.',
    descFr: 'Traduction assermentée de documents officiels avec démarche organisée et envoi à distance.',
    actionText: 'اطلب الخدمة',
    actionType: 'whatsapp',
    whatsappQuery: 'مرحباً، أريد خدمة الترجمة المحلفة للوثائق',
    badge: 'معتمد لدى النوتر',
  },
  {
    id: 'residency',
    num: '05',
    title: 'تجديد الإقامات',
    titleTr: 'İkamet Yenileme',
    titleEn: 'Residence Renewals',
    titleFr: 'Renouvellement de séjour',
    desc: 'المساعدة في تجهيز ومتابعة ملفات الإقامة العائلية أو السياحية في تركيا.',
    descTr: 'Türkiye’de aile veya turistik ikamet dosyalarının hazırlanması ve takibi.',
    descEn: 'Assistance in preparing and following up on family or tourist residence applications in Türkiye.',
    descFr: 'Assistance à la préparation et au suivi des dossiers de séjour familial ou touristique.',
    actionText: 'اطلب الخدمة',
    actionType: 'whatsapp',
    whatsappQuery: 'مرحباً، أريد استشارة بخصوص تجديد الإقامة في تركيا',
    badge: 'سياحية وعائلية',
  },
  {
    id: 'hotels',
    num: '06',
    title: 'حجوزات الفنادق',
    titleTr: 'Otel Rezervasyonları',
    titleEn: 'Hotel Bookings',
    titleFr: 'Réservations d’hôtels',
    desc: 'نساعدك في اختيار وحجز الفندق المناسب لوجهتك وميزانيتك.',
    descTr: 'Rotanıza ve bütçenize uygun oteli seçip rezerve etmenize yardımcı oluyoruz.',
    descEn: 'Helping you select and book the right accommodation matching your destination and budget.',
    descFr: 'Sélection et réservation de l’hôtel adapté à votre destination et à votre budget.',
    actionText: 'اطلب الخدمة',
    actionType: 'whatsapp',
    whatsappQuery: 'مرحباً، أريد خدمة حجز فندق في تركيا',
    badge: 'عروض مميزة',
  },
  {
    id: 'community',
    num: '07',
    title: 'معاملات الجالية',
    titleTr: 'Topluluk İşlemleri',
    titleEn: 'Community Affairs',
    titleFr: 'Démarches communautaires',
    desc: 'أهلية الزواج، الوكالة، تسجيل المواليد وخدمات إدارية أخرى للجالية.',
    descTr: 'Evlenme ehliyet belgesi, vekâletname, doğum kaydı ve diğer idari işlemler.',
    descEn: 'Marriage eligibility certificate, power of attorney, birth registration and official Moroccan community procedures.',
    descFr: 'Certificat de capacité matrimoniale, procuration, déclaration de naissance et démarches administratives.',
    actionText: 'اطلب الخدمة',
    actionType: 'consular_modal',
    badge: 'معاملات إدارية',
  },
];

export const AIRLINES_LIST: AirlineItem[] = [
  { name: 'Royal Air Maroc', logo: '/assets/airlines/royal-air-maroc.svg' },
  { name: 'Turkish Airlines', logo: '/assets/airlines/turkish-airlines.svg' },
  { name: 'Emirates', logo: '/assets/airlines/emirates.svg' },
  { name: 'Qatar Airways', logo: '/assets/airlines/qatar-airways.svg' },
  { name: 'Saudia', logo: '/assets/airlines/saudia.svg' },
  { name: 'Pegasus', logo: '/assets/airlines/pegasus.svg' },
  { name: 'AJet', logo: '/assets/airlines/ajet.svg' },
  { name: 'Air Arabia', logo: '/assets/aistudio/Air_Arabia-Logo.wine__1__ee5bad57.svg' },
  { name: 'Flydubai', logo: '/assets/airlines/flydubai.svg' },
  { name: 'Kuwait Airways', logo: '/assets/airlines/kuwait-airways.svg' },
  { name: 'Middle East Airlines', logo: '/assets/airlines/middle-east-airlines.svg' },
  { name: 'Flyadeal', logo: '/assets/airlines/flyadeal.svg' },
  { name: 'EgyptAir', logo: '/assets/airlines/egyptair.svg' },
  { name: 'Air France', logo: '/assets/airlines/air-france.svg' },
  { name: 'KLM', logo: '/assets/airlines/klm.svg' },
  { name: 'Qantas', logo: '/assets/airlines/qantas.svg' },
];

export const WORK_GALLERY = [
  {
    title: 'أهلية الزواج',
    titleTr: 'Evlenme Ehliyet Belgesi',
    titleEn: 'Marriage Eligibility',
    titleFr: 'Capacité matrimoniale',
    image: '/assets/gallery/01-marriage.webp',
    caption: 'شهادة أهلية الزواج لإتمام عقد الزواج المدني في تركيا',
  },
  {
    title: 'مواعيد الوكالة',
    titleTr: 'Vekâletname Randevusu',
    titleEn: 'Power of Attorney',
    titleFr: 'Rendez-vous procuration',
    image: '/assets/gallery/02-agency.webp',
    caption: 'الوكالات الخاصة العادية للمغرب (الوكالة العقارية عدلية عند العدول بالمغرب)',
  },
  {
    title: 'الترجمة المحلفة',
    titleTr: 'Yeminli Tercüme',
    titleEn: 'Sworn Translation',
    titleFr: 'Traduction assermentée',
    image: '/assets/gallery/03-translation.webp',
    caption: 'ترجمة رسمية معتمدة لكافة الوثائق والشهادات',
  },
  {
    title: 'حجوزات الطيران',
    titleTr: 'Uçak Biletleri',
    titleEn: 'Flight Tickets',
    titleFr: 'Billets d’avion',
    image: '/assets/gallery/04-flights.webp',
    caption: 'بحث وحجز تذاكر الطيران بأفضل الأسعار المتاحة',
  },
  {
    title: 'حجوزات الفنادق',
    titleTr: 'Otel Rezervasyonları',
    titleEn: 'Hotel Bookings',
    titleFr: 'Réservations d’hôtels',
    image: '/assets/gallery/05-hotels.webp',
    caption: 'حجوزات فندقية موثوقة في إسطنبول وجميع مدن تركيا',
  },
  {
    title: 'تجديد الإقامات',
    titleTr: 'İkamet Yenileme',
    titleEn: 'Residence Renewal',
    titleFr: 'Renouvellement de séjour',
    image: '/assets/gallery/06-residency.webp',
    caption: 'مساعدة في تجهيز ملفات الإقامة السياحية والعائلية',
  },
];

export const FAQ_LIST: FAQItem[] = [
  {
    q: 'ما هي الأوراق المطلوبة لاستخراج شهادة أهلية الزواج؟',
    qTr: 'Evlenme ehliyet belgesi için gerekli evraklar nelerdir?',
    qEn: 'What documents are required for the Marriage Eligibility Certificate?',
    qFr: 'Quels sont les documents requis pour le certificat de capacité matrimoniale ?',
    a: 'وثائق الطرف المغربي: (1) شهادة الخطوبة صادرة من المغرب مع الأبوستيل، (2) نسخة كاملة مع الأبوستيل، (3) السجل العدلي مع الأبوستيل، (4) جواز السفر وفي حالة وجود إقامة نسخة عن الإقامة، (5) وثيقة إثبات العنوان Yerleşim Belgesi. بالإضافة إلى أوراق الزوج: (1) بطاقة التعريف الوطنية للزوج، (2) سجل القيد العائلي للزوج، (3) أوراق العمل للزوج، (4) السجل العدلي للزوج. يجب أن تكون جميع الأوراق التركية مصدقة بأبوستيل تركي، والأوراق الصادرة من المغرب تحمل أبوستيل مغربي لتقديم الملف إلى القنصلية.',
    aTr: 'Faslı taraf için: Fas Apostilli nişanlılık belgesi, tam doğum kaydı, adli sicil kaydı, pasaport (ve varsa ikamet) ve Yerleşim Belgesi. Eş için (Türk Apostilli): Kimlik kartı, nüfus kayıt örneği, iş evrakları ve adli sicil kaydı.',
    aEn: 'Moroccan party: Engagement certificate, full birth copy, and criminal record (all with Moroccan Apostille), passport (and residence permit copy if applicable), plus Yerleşim Belgesi. Spouse (with Turkish Apostille): National ID, family registry record, employment documents, and criminal record.',
    aFr: 'Partie marocaine : certificat de fiançailles, copie intégrale et casier judiciaire (avec Apostille marocaine), passeport (et séjour), Yerleşim Belgesi. Conjoint (avec Apostille turque) : pièce d’identité, registre familial, documents de travail et casier judiciaire.',
  },
  {
    q: 'هل تتوفر الوكالة العقارية في القنصلية وما أوراق الوكالة الخاصة وجواز السفر؟',
    qTr: 'Konsoloslukta gayrimenkul vekâleti var mı? Özel vekâlet ve pasaport evrakları nelerdir?',
    qEn: 'Is Real Estate POA available at the Consulate, and what is required for Special POA & Passport?',
    qFr: 'La procuration immobilière est-elle disponible au consulat et quels sont les documents pour la procuration et le passeport ?',
    a: 'بالنسبة للوكالة الخاصة بالعقارات، الوكالة العقارية هي وكالة عدلية في المغرب تقام عند العدول والقنصلية ليس لديها هذه الخدمة. تتوفر في القنصلية خدمة الوكالات الخاصة العادية فقط، وتتطلب: إرسال نص الوكالة، بطاقة التعريف الوطنية، الإقامة، جواز السفر، والنفوس (Yerleşim Belgesi). أما جواز السفر فيحتاج إلى: صورة لبطاقة التعريف الوطنية، الإقامة التركية، وصورة لـ Yerleşim Belgesi أو النفوس.',
    aTr: 'Gayrimenkul vekâleti Fas’ta Adoul nezdinde yapılan adli bir vekâlettir ve konsoloslukta bu hizmet yoktur. Normal özel vekâletname için: vekâlet metni, ulusal kimlik, ikamet, pasaport ve Yerleşim Belgesi gerekir. Pasaport için: ulusal kimlik fotokopisi, Türk ikameti ve Yerleşim Belgesi gerekir.',
    aEn: 'Real estate POA is an Adoul deed executed in Morocco and is NOT available at the Consulate. Ordinary special POA is available and requires: POA text, National ID, Residence permit, Passport, and Yerleşim Belgesi. Passport requires: copy of National ID, Turkish Residence Permit, and copy of Yerleşim Belgesi.',
    aFr: 'La procuration immobilière est un acte adoulaire établi au Maroc chez les Adouls et n’est pas disponible au consulat. Pour une procuration spéciale ordinaire : texte de procuration, CNIE, titre de séjour, passeport et Yerleşim Belgesi. Pour le passeport : copie CNIE, résidence turque et Yerleşim Belgesi.',
  },
  {
    q: 'كيف أبدأ طلب الخدمة؟',
    qTr: 'Hizmet talebini nasıl başlatabilirim?',
    qEn: 'How do I start my service request?',
    qFr: 'Comment démarrer ma demande de service ?',
    a: 'اضغط على زر واتساب أو اختر الخدمة المطلوبة من الموقع، اكتب التفاصيل والمعلومات الأساسية وسنرد عليك فوراً بالخطوات والمتطلبات الدقيقة.',
    aTr: 'WhatsApp butonuna tıklayın veya siteden istediğiniz hizmeti seçin. Temel bilgilerinizi yazın, size gerekli adımları ve şartları hemen iletelim.',
    aEn: 'Click the WhatsApp button or select the desired service on the site, provide your basic details, and we will guide you through the exact steps and requirements.',
    aFr: 'Cliquez sur le bouton WhatsApp ou choisissez le service souhaité sur le site, fournissez vos informations de base et nous vous répondrons aussitôt avec les étapes détaillées.',
  },
  {
    q: 'هل يمكن إتمام المعاملات عن بُعد؟',
    qTr: 'İşlemler tamamen uzaktan yapılabilir mi?',
    qEn: 'Can transactions be completed remotely?',
    qFr: 'Les démarches peuvent-elles être effectuées à distance ?',
    a: 'نعم، معظم خطوات الترتيب والبحث وتجهيز الملفات والمواعيد والترجمة المحلفة تتم بالكامل عن بُعد عبر واتساب دون الحاجة للحضور الشخصي إلا في الموعد القنصلي أو الرسمي نفسه.',
    aTr: 'Evet, randevu alma, dosya hazırlama, uçak arama ve yeminli tercüme gibi işlemlerin çoğu WhatsApp üzerinden tamamen uzaktan yürütülür.',
    aEn: 'Yes, most steps including appointment scheduling, file prep, flights and sworn translation are handled completely remotely via WhatsApp.',
    aFr: 'Oui, la plupart des étapes (rendez-vous, préparation du dossier, vols, traduction assermentée) sont gérées à distance par WhatsApp.',
  },
  {
    q: 'كيف يتم الدفع مقابل الخدمات؟',
    qTr: 'Ödeme nasıl yapılır?',
    qEn: 'How is payment processed?',
    qFr: 'Comment s’effectue le paiement ?',
    a: 'يتم الدفع بسهولة وأمان عبر تحويل بنكي (حوالة بنكية محلية في تركيا أو دولية) بعد الاتفاق على تفاصيل الخدمة.',
    aTr: 'Ödeme, hizmet detayları üzerinde anlaşıldıktan sonra Türkiye içi banka havalesi veya uluslararası transfer ile güvenli bir şekilde yapılır.',
    aEn: 'Payment is made securely via bank transfer (local in Türkiye or international) once service details are finalized.',
    aFr: 'Le paiement s’effectue de manière sécurisée par virement bancaire (en Turquie ou international) une fois les détails du service convenus.',
  },
  {
    q: 'هل تقدمون خدمة التوصيل إلى المطار؟',
    qTr: 'Havalimanı transfer hizmetiniz var mı?',
    qEn: 'Do you provide airport transfer services?',
    qFr: 'Proposez-vous un service de transfert aéroport ?',
    a: 'نعم، نقدم خدمة توصيل واستقبال بسيارات خاصة VIP من وإلى مطار إسطنبول (IST) ومطار صبيحة كوكجن (SAW) بأعلى درجات الالتزام بالمواعيد والراحة.',
    aTr: 'Evet, İstanbul Havalimanı (IST) ve Sabiha Gökçen (SAW) için özel konforlu VIP transfer ve karşılama hizmeti sunuyoruz.',
    aEn: 'Yes, we provide comfortable private VIP pick-up and drop-off transfers for both Istanbul Airport (IST) and Sabiha Gökçen (SAW).',
    aFr: 'Oui, nous proposons des transferts VIP privés confortables et ponctuels depuis et vers l’aéroport d’Istanbul (IST) et Sabiha Gökçen (SAW).',
  },
  {
    q: 'ما الفرق بين خدمات السفارة في أنقرة والقنصلية في إسطنبول؟',
    qTr: 'Ankara Büyükelçiliği ile İstanbul Başkonsolosluğu arasındaki fark nedir?',
    qEn: 'What is the difference between the Embassy in Ankara and Consulate in Istanbul?',
    qFr: 'Quelle est la différence entre l’ambassade à Ankara et le consulat à Istanbul ?',
    a: 'يرتبط التوزيع بالموقع الجغرافي للمقيم والولاية التابع لها ومواعيد المتاحين في كل بعثة. نساعدك في تحديد البعثة الأنسب لمعاملتك وتأكيد حجز موعدك فيها.',
    aTr: 'Seçim, ikamet ettiğiniz şehre, bağlı olduğunuz bölgeye ve her temsilcilikteki randevu uygunluğuna göre yapılır. Dosyanıza en uygun yeri belirlemenize yardımcı oluyoruz.',
    aEn: 'The choice depends on your city of residence in Türkiye, administrative jurisdiction, and appointment availability in each mission.',
    aFr: 'Le choix dépend de votre ville de résidence en Turquie, de votre circonscription et de la disponibilité des rendez-vous.',
  },
];
