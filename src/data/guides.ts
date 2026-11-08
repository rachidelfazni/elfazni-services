export interface GuideSection {
  title: string;
  items?: string[];
  content?: string;
  note?: string;
}

export interface GuideArticle {
  id: string;
  slug: string;
  tag: string;
  tagTr: string;
  tagEn: string;
  title: string;
  titleTr: string;
  titleEn: string;
  desc: string;
  descTr: string;
  descEn: string;
  image: string;
  headline: string;
  lead: string;
  sections: GuideSection[];
}

export const guidesData: GuideArticle[] = [
  {
    "id": "travel-guide",
    "slug": "travel-guide.html",
    "tag": "السفر",
    "tagTr": "Seyahat",
    "tagEn": "Travel",
    "title": "معلومات مهمة قبل حجز رحلتك",
    "titleTr": "Uçuşunuzu rezerve etmeden önce önemli bilgiler",
    "titleEn": "Important information before booking your flight",
    "desc": "المطارات، التواريخ، الأمتعة والتفاصيل التي تساعد على اختيار الرحلة.",
    "descTr": "Havalimanları, tarihler, bagaj ve uçuş seçimini kolaylaştıran detaylar.",
    "descEn": "Airports, dates, baggage and details that help you pick the best flight.",
    "image": "/assets/gallery/04-flights.webp",
    "headline": "معلومات مهمة قبل حجز رحلتك",
    "lead": "اختيار المطارات والتواريخ وعدد المسافرين بدقة يجعل البحث عن الرحلة أسرع وأوضح، ويقلل احتمال الخطأ عند إعداد الحجز.",
    "sections": [
      {
        "title": "ما المعلومات التي تحتاجها للبحث؟",
        "items": [
          "مدينة أو مطار المغادرة ومطار الوصول.",
          "تاريخ الذهاب والعودة، أو تحديد أن الرحلة ذهاب فقط.",
          "عدد البالغين والأطفال والرضّع كما يظهر في وثائق السفر.",
          "الأمتعة المطلوبة والمرونة في الوقت أو التاريخ."
        ]
      },
      {
        "title": "قبل تأكيد الحجز",
        "content": "راجع تهجئة الاسم كما في جواز السفر، وتحقق من المطارات ومدة التوقف وشروط الأمتعة. لا تعتمد على اسم المدينة وحده، لأن بعض المدن تخدمها عدة مطارات.",
        "note": "أسعار الرحلات وتوفر المقاعد تتغير باستمرار؛ السعر النهائي هو السعر المتاح وقت التأكيد."
      },
      {
        "title": "كيف نسهّل عليك الخدمة؟",
        "content": "ترسل لنا التفاصيل الأساسية عبر نموذج الرحلة أو واتساب، ثم نساعدك على ترتيب الطلب ومقارنة الخيارات المتاحة بما يناسب وجهتك وتاريخك."
      }
    ]
  },
  {
    "id": "documents-guide",
    "slug": "documents-guide.html",
    "tag": "الوثائق",
    "tagTr": "Belgeler",
    "tagEn": "Documents",
    "title": "أوراق الوكالات وجواز السفر",
    "titleTr": "Vekâletname ve Pasaport Belgeleri",
    "titleEn": "POA & Passport Documents",
    "desc": "تفاصيل الوكالات الخاصة العادية، تنبيه الوكالة العقارية، والأوراق المطلوبة لجواز السفر.",
    "descTr": "Normal özel vekâletname, gayrimenkul vekâleti uyarısı ve pasaport için gerekli evraklar.",
    "descEn": "Ordinary special POA requirements, real estate POA notice, and passport document checklist.",
    "image": "/assets/gallery/02-agency.webp",
    "headline": "الوكالات الخاصة، جواز السفر وتجهيز الوثائق",
    "lead": "تعرّف على الوثائق المطلوبة بدقة للوكالة الخاصة العادية وتجديد جواز السفر المغربي في تركيا، مع التنبيه القانوني الخاص بالوكالة العقارية.",
    "sections": [
      {
        "title": "الوكالة الخاصة والوكالة العقارية",
        "items": [
          "إرسال نص الوكالة المطلوب تحريرها.",
          "بطاقة التعريف الوطنية (CNIE).",
          "الإقامة في تركيا (بطاقة الإقامة).",
          "جواز السفر المغربي.",
          "وثيقة إثبات العنوان / النفوس (Yerleşim Belgesi)."
        ],
        "note": "تنبيه هام: بالنسبة للوكالة الخاصة بالعقارات، الوكالة العقارية هي وكالة عدلية في المغرب تقام عند العدول والقنصلية ليس لديها هذه الخدمة. يوجد في القنصلية خدمة الوكالات الخاصة العادية فقط."
      },
      {
        "title": "الأوراق المطلوبة لجواز السفر",
        "items": [
          "صورة لبطاقة التعريف الوطنية (CNIE).",
          "الإقامة في تركيا (الإقامة التركية).",
          "صورة لـ Yerleşim Belgesi أو النفوس (وثيقة إثبات العنوان)."
        ]
      },
      {
        "title": "الترجمة والتصديق (الأبوستيل)",
        "content": "يجب أن تكون جميع الأوراق الصادرة من تركيا مصدقة بأبوستيل تركي، والأوراق الصادرة من المغرب يجب أن تحمل أبوستيل مغربي عند جمع الملفات لتقديمها إلى القنصلية."
      }
    ]
  },
  {
    "id": "consular-services",
    "slug": "consular-services.html",
    "tag": "القنصلية",
    "tagTr": "Konsolosluk",
    "tagEn": "Consular",
    "title": "أوراق أهلية الزواج والمواعيد",
    "titleTr": "Evlenme Ehliyet Belgesi ve Randevular",
    "titleEn": "Marriage Eligibility & Appointments",
    "desc": "القائمة الكاملة لوثائق الطرف المغربي وأوراق الزوج وشروط تصديق الأبوستيل.",
    "descTr": "Faslı başvuru sahibi ve eş adayı için gerekli belgeler ile Apostil tasdik şartları.",
    "descEn": "Complete checklist for Moroccan applicant documents, spouse documents, and Apostille rules.",
    "image": "/assets/gallery/01-marriage.webp",
    "headline": "الأوراق المطلوبة لاستخراج شهادة أهلية الزواج",
    "lead": "لجمع ملف شهادة أهلية الزواج وتقديمه إلى القنصلية المغربية في إسطنبول أو السفارة في أنقرة، يجب توفير وثائق الطرف المغربي بالإضافة إلى أوراق الزوج مصدقة بالأبوستيل.",
    "sections": [
      {
        "title": "أولاً: الوثائق المطلوبة للطرف المغربي",
        "items": [
          "1. شهادة الخطوبة صادرة من المغرب مع الأبوستيل.",
          "2. نسخة كاملة مع الأبوستيل.",
          "3. السجل العدلي مع الأبوستيل.",
          "4. جواز السفر، وفي حالة وجود إقامة، نسخة عن الإقامة.",
          "5. وثيقة إثبات العنوان (Yerleşim Belgesi)."
        ]
      },
      {
        "title": "ثانياً: أوراق الزوج المطلوبة للملف",
        "items": [
          "1. بطاقة التعريف الوطنية الخاصة بالزوج.",
          "2. سجل القيد العائلي الخاص بالزوج.",
          "3. أوراق العمل الخاصة بالزوج.",
          "4. السجل العدلي الخاص بالزوج."
        ],
        "note": "شرط أساسي: راجع القنصلية لتأكيد الوثائق التي تحتاج إلى أبوستيل والجهة المختصة بتصديقها قبل تقديم الملف."
      },
      {
        "title": "الوكالات الخاصة وجواز السفر",
        "content": "بالنسبة للوكالة الخاصة بالعقارات، فهي وكالة عدلية في المغرب تقام عند العدول والقنصلية ليس لديها هذه الخدمة (يتوفر فقط خدمة الوكالات الخاصة العادية وتحتاج: نص الوكالة، بطاقة التعريف الوطنية، الإقامة، جواز السفر، والنفوس Yerleşim Belgesi). أما جواز السفر فيحتاج إلى: صورة لبطاقة التعريف الوطنية، الإقامة التركية، وصورة لـ Yerleşim Belgesi أو النفوس."
      }
    ]
  },
  {
    "id": "tourism-turkey",
    "slug": "tourism-turkey.html",
    "tag": "السياحة",
    "tagTr": "Turizm",
    "tagEn": "Tourism",
    "title": "خطّط لزيارتك إلى تركيا",
    "titleTr": "Türkiye ziyaretinizi planlayın",
    "titleEn": "Plan your trip to Türkiye",
    "desc": "الوجهات والفنادق والتنقلات وكيفية ترتيب الرحلة بخطوات أسهل.",
    "descTr": "Rotalar, oteller, ulaşım ve seyahati daha kolay organize etme rehberi.",
    "descEn": "Destinations, hotels, transportation and organizing your travel smoothly.",
    "image": "/assets/gallery/05-hotels.webp",
    "headline": "خطّط لزيارتك إلى تركيا براحة واطمئنان",
    "lead": "سواء كنت قادماً للسياحة العائلية، الأعمال، أو إنجاز معاملات، فإن التخطيط المسبق للفندق وموقع الإقامة يوفر عليك التعب والتكاليف.",
    "sections": [
      {
        "title": "نصائح لاختيار الإقامة والفندق",
        "items": [
          "اختيار موقع قريب من محطات المترو أو الترامواي في إسطنبول لتجنب الازدحام.",
          "التحقق من توفر وجبة الإفطار وسياسة الإلغاء المرن.",
          "التأكد من بعد الفندق عن المطار المخصص لرحلتك (مطار إسطنبول IST أو صبيحة SAW)."
        ]
      }
    ]
  },
  {
    "id": "residence-turkey",
    "slug": "residence-turkey.html",
    "tag": "الإقامات",
    "tagTr": "İkamet",
    "tagEn": "Residence",
    "title": "معلومات عامة حول الإقامة في تركيا",
    "titleTr": "Türkiye’de ikamet hakkında genel bilgiler",
    "titleEn": "General information about residence in Türkiye",
    "desc": "التحضير الأولي للملف والمتابعة مع الرجوع دائماً إلى الجهات الرسمية.",
    "descTr": "Dosyanın ön hazırlığı, takip adımları ve resmi makamlara uygunluk.",
    "descEn": "Initial preparation of the file and following up with Turkish immigration guidelines.",
    "image": "/assets/gallery/06-residency.webp",
    "headline": "استعد لملفك بخطوات منظمة",
    "lead": "ملفات الإقامة السياحية والعائلية تتطلب تنظيماً مسبقاً لعقد الإيجار المصدق، التأمين الصحي، واستمارة الموعد الإلكتروني.",
    "sections": [
      {
        "title": "المتطلبات الأساسية لملف الإقامة",
        "items": [
          "استمارة طلب الموعد من موقع إدارة الهجرة التركية (Göç İdaresi).",
          "تأمين صحي ساري المفعول يغطي فترة الإقامة المطلوبة.",
          "عقد إيجار مصدق من كاتب العدل (النوتر) أو قيد نفوس منظم.",
          "صور شخصية بيومترية وجواز سفر ساري المفعول لأكثر من 6 أشهر."
        ]
      }
    ]
  },
  {
    "id": "sworn-translation",
    "slug": "sworn-translation.html",
    "tag": "الترجمة",
    "tagTr": "Tercüme",
    "tagEn": "Translation",
    "title": "متى تحتاج إلى ترجمة محلفة؟",
    "titleTr": "Ne zaman yeminli tercümeye ihtiyaç duyarsınız?",
    "titleEn": "When do you need a sworn translation?",
    "desc": "جودة النسخة، تطابق البيانات ومتطلبات التصديق حسب الجهة المستلمة.",
    "descTr": "Fotokopi kalitesi, veri uyumu ve teslim makamına göre tasdik şartları.",
    "descEn": "Copy quality, data consistency and attestation requirements by recipient authorities.",
    "image": "/assets/gallery/03-translation.webp",
    "headline": "ترجمة واضحة للغرض الصحيح",
    "lead": "نساعدك في تنسيق الترجمة المحلّفة وتصديقها لدى كاتب العدل عند الحاجة. تحقّق من متطلبات الجهة التي ستتسلّم الوثيقة.",
    "sections": [
      {
        "title": "الوثائق الأكثر طلباً للترجمة",
        "items": [
          "شهادات الميلاد والوفاة والزواج والطلاق.",
          "عقود التوكيل والأحكام القضائية والشهادات المدرسية والجامعية.",
          "السجلات التجارية والوثائق الضريبية ورخص القيادة.",
          "جوازات السفر والبطاقات الشخصية."
        ]
      }
    ]
  }
];
