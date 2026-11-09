# ELFAZNI SERVICES — Complete Website Blueprint & Architecture
**Official Website:** `https://elfazni.com`  
**Brand Name:** ELFAZNI SERVICES (الـفـزنـي للـخـدمـات)  
**Founder:** Rachid Elfazni (رشيد الفزني)  
**Location:** Istanbul, Türkiye (إسطنبول، تركيا)  
**Languages Supported (Full 4-Language Support + RTL/LTR):**
- **Arabic (`ar`)** — Default (`dir="rtl"`)
- **Turkish (`tr`)** — (`dir="ltr"`)
- **English (`en`)** — (`dir="ltr"`)
- **French (`fr`)** — (`dir="ltr"`)

---

## 1. Brand Identity, Colors & Typography Rules

### 1.1 Color Palette (CSS Variables & Hex Codes)
- **Primary Brand Blue:** `#064EA8`
- **Dark Royal Navy:** `#01336F`
- **Deep Midnight Navy (Dark Sections & Cards):** `#012247` / `#0D2340`
- **Primary Brand Gold (Light Background Headings & Accents):** `#B6812E`
- **Soft Luminous Gold (Dark Background Headings & Accents):** `#E6BD67`
- **Page Background:** `#FBFBFD`
- **Soft Ice Blue Surface:** `#EAF4FF`
- **Border Blue-Grey:** `#DCE8F5`
- **Body Text Muted:** `#607087`

### 1.2 Two-Line Heading System (Strict Rule Across All Sections)
Every section heading (`h1`, `h2`) uses a signature **2-line typographic hierarchy**:
1. **First Line (السطر الأول):**
   - **Font Weight:** Extra Bold / Black (`font-black`, weight `800–900`)
   - **Color:** Primary Dark Blue (`#01336F` or `#064EA8` on light backgrounds, `#FFFFFF` on dark navy sections)
   - **Font Family:** `Bahij TheSansArabic` (weight 800) for Arabic; `Plus Jakarta Sans` (weight 800) for Turkish, English, and French.
2. **Second Line (السطر الثاني — العناوين الذهبية):**
   - **Font Weight:** SemiBold (`Bahij TheSansArabic-SemiBold`, weight `600`)
   - **Color:** Gold (`#B6812E` on light backgrounds, `#E6BD67` on dark backgrounds)
   - **Font Family:** `Bahij TheSansArabic-SemiBold` for Arabic; `Plus Jakarta Sans` (weight 600) for Turkish, English, and French.

---

## 2. Official Contact & Social Channels (`SITE_CONTACT`)
- **Phone / WhatsApp:** `+90 552 267 7851` (Local: `0552 267 7851`)
- **WhatsApp Direct Link:** `https://wa.me/905522677851`
- **Email:** `rachidelfazni@gmail.com`
- **Instagram:** `https://www.instagram.com/elfazniservices/` (`@elfazniservices`)
- **Facebook:** `https://www.facebook.com/alfazni.services` (`@alfazni.services`)
- **Working Hours:** Available daily via WhatsApp (`متاحون يومياً عبر واتساب`)

---

## 3. Complete Section-by-Section Architecture

### Section 1: Sticky Header & Navigation (`Header.tsx`)
- **Brand Logo & Title:** `ELFAZNI SERVICES` with official emblem.
- **Navigation Links:**
  1. `الرئيسية` (Home) — `#hero`
  2. `خدماتنا` (Services) — `#services`
  3. `مواعيد القنصلية` (Consular Appointments) — `#consular-checklist`
  4. `الحجوزات والتوصيل` (Flights, Hotels & Airport Transfer) — `#flights`
  5. `الأدلة الشاملة` (Guides) — `#guides`
  6. `الأسئلة الشائعة` (FAQ) — `#faq`
  7. `تواصل معنا` (Contact Us) — `#contact-form`
- **Language Switcher:** Instant toggle between `العربية (AR)`, `Türkçe (TR)`, `English (EN)`, `Français (FR)` with automatic `dir="rtl"` / `dir="ltr"` and font switching.
- **Primary CTA Button:** Direct WhatsApp consultation button.

---

### Section 2: Hero Section (`Hero.tsx`)
- **Location Badge:** `ELFAZNI SERVICES · إسطنبول`
- **Two-Line Main Heading (`h1`):**
  - **Line 1 (Dark Blue, Black Weight):** Rotating dynamic service title:
    - `مواعيد القنصلية المغربية` / `حجوزات الطيران والفنادق` / `توصيل إلى المطار (VIP)` / `الترجمة المحلفة` / `تجديد الإقامات` / `معاملات الجالية في تركيا`
  - **Line 2 (Gold `#B6812E`, SemiBold):** `كل ما تحتاجه، بخطوات واضحة`
- **Subtitle:**
  - `من حجز المواعيد القنصلية وتذاكر الطيران والفنادق واستقبال المطار إلى الترجمة المحلفة ومتابعة الإقامة في تركيا، نوفر لك خدمة دقيقة وسريعة ومتابعة مباشرة عبر واتساب حتى إنجاز معاملتك.`
- **Action Buttons:**
  1. Primary Blue Button: `طلب هذه الخدمة` (Opens WhatsApp with the currently active rotating service)
  2. Secondary Outlined Button: `ابدأ طلبك` (Opens 4-Step Guided Request Modal)
- **Trust Pills:**
  - `متابعة مباشرة عبر واتساب`
  - `تدقيق الملفات قبل الموعد`
  - `ترجمة معتمدة لدى النوتير`
  - `استجابة سريعة ومستمرة`
- **Visual Showcase Card:** Interactive service showcase card with floating trust badges (`خدمة مباشرة — عن بُعد عبر واتساب` & `ضمان الخدمة — متابعة خطوة بخطوة`).

---

### Section 3: 3-Step Fast Banner & Infinite Service Marquee (`StatsMarquee.tsx`)
- **3 Quick Steps Bar (Dark Navy `#012247`):**
  - `01` — **اختر الخدمة المطلوبة:** طيران، مواعيد قنصلية، استقبال مطار، أو ترجمة محلفة
  - `02` — **أرسل بياناتك عبر واتساب:** معلومات أولية وصور واضحة للوثائق المطلوبة
  - `03` — **متابعة شخصية حتى الإنجاز:** تدقيق دقيق، حجز مؤكد، واستلام وثائقك دون تعقيد
- **Infinite Scrolling Marquee:**
  - `مواعيد القنصلية` · `حجوزات الطيران` · `توصيل إلى المطار` · `الترجمة المحلفة` · `تجديد الإقامات` · `حجوزات الفنادق` · `خدمات الجالية` · `أهلية الزواج` · `التوكيلات الرسمية` · `تسجيل المواليد`

---

### Section 4: Core Services Grid (`ServicesSection.tsx`)
- **Heading:**
  - **Line 1 (Blue):** `خدماتنا المتكاملة`
  - **Line 2 (Gold):** `كل ما تحتاجه، بخطوات واضحة`
- **Filter Tabs:** `جميع الخدمات` | `مواعيد قنصلية` | `حجوزات وسفر` | `إقامة وترجمة`
- **7 Core Service Cards:**
  1. **`01` مواعيد القنصلية (Consular Appointments):** المساعدة في حجز ومتابعة المواعيد القنصلية المغربية في إسطنبول وأنقرة.
  2. **`02` حجوزات الطيران (Flight Bookings):** خيارات رحلات داخل تركيا وإلى مختلف دول العالم وفق تاريخك ووجهتك.
  3. **`03` التوصيل للمطار (VIP Airport Transfer):** استقبال وتوصيل VIP مريح وآمن من وإلى مطارات إسطنبول وتركيا.
  4. **`04` الترجمة المحلفة (Sworn Translation):** ترجمة الوثائق والمعاملات المعتمدة لدى النوتير مع تنظيم الخطوات عن بُعد.
  5. **`05` تجديد الإقامات (Residence Renewals):** إرشاد ومتابعة لملفات الإقامة السياحية والعائلية في تركيا خطوة بخطوة.
  6. **`06` حجوزات الفنادق (Hotel Bookings):** خيارات إقامة مناسبة ومؤكدة في مختلف المدن التركية وحول العالم.
  7. **`07` خدمات الجالية (Community Services):** مواكبة شاملة لمختلف الاحتياجات الإدارية والعملية للمقيمين والزوار في تركيا.

---

### Section 5: Interactive Moroccan Consular Checklist (`InteractiveConsularChecklist.tsx`)
- **Heading:**
  - **Line 1 (Blue):** `مواعيد القنصلية المغربية`
  - **Line 2 (Gold):** `إسطنبول وأنقرة — الوثائق والمتابعة`
- **8 Consular Procedures with Interactive Document Checklists & Readiness Meter:**
  1. **شهادة الكفاءة للزواج (شهادة العزوبية / أهلية الزواج):**
     - شهادة العزوبة (أو الطلاق) مصدقة بأبوستيل المغرب
     - عقد الازدياد (نسخة كاملة + فردية) مصدق بأبوستيل المغرب
     - السجل العدلي من المغرب (أقل من 3 أشهر) مع أبوستيل
     - شهادة طبية خاصة بالزواج صادرة من تركيا
     - جواز السفر المغربي + بطاقة التعريف الوطنية (CNIE)
     - بطاقة الإقامة التركية أو تأشيرة الدخول السارية
     - **Important Note:** جميع الوثائق التركية تصدق بأبوستيل تركي، والوثائق المغربية تصدق بأبوستيل مغربي.
  2. **الوكالة الخاصة العادية (Ordinary Special Power of Attorney):**
     - نص الوكالة المراد تحريرها (مكتوب بوضوح أو بصيغة Word/PDF)
     - بطاقة التعريف الوطنية المغربية (CNIE) سارية الصلاحية
     - بطاقة الإقامة التركية السارية الصلاحية
     - جواز السفر المغربي الأصلي
     - شهادة السكنى / عنوان النفوس من تركيا (`Yerleşim Yeri Belgesi` عبر `e-Devlet`)
     - صورة من بطاقة التعريف الوطنية للموكَّل له في المغرب
     - **Important Legal Note:** الوكالة العقارية (بيع/شراء عقار) هي وكالة عدلية تُنجز في المغرب لدى العدول ولا تُنجز في القنصلية.
  3. **جواز السفر البيومتري (Biometric Passport Renewal/Issuance):**
     - بطاقة التعريف الوطنية الإلكترونية (CNIE) سارية الصلاحية
     - جواز السفر القديم (في حال التجديد)
     - شهادة السكنى التركية (`Yerleşim Yeri Belgesi`)
     - بطاقة الإقامة التركية السارية
     - صور شمسية بيومترية حديثة بخلفية مناسبة
     - تصريح بالضياع من الشرطة التركية (في حال ضياع الجواز)
  4. **البطاقة الوطنية للتعريف الإلكترونية (CNIE):**
     - البطاقة الوطنية القديمة (عند التجديد) أو شهادة الجنسية/الازدياد (لأول مرة)
     - شهادة السكنى التركية (`Yerleşim Yeri Belgesi` من `e-Devlet`)
     - بطاقة الإقامة التركية وجواز السفر المغربي
     - صور شمسية حديثة بمعايير البطاقة البيومترية
     - شهادة العمل أو الدراسة لتحديث المهنة (اختياري)
  5. **تسجيل المولود الجديد والحالة المدنية (Newborn Registration & Civil Status):**
     - شهادة الميلاد التركية (`Doğum Belgesi` - Formül A) مصدقة بأبوستيل
     - ترجمة محلفة لشهادة الميلاد التركية مصدقة لدى النوتر
     - عقد الزواج المغربي أو الدفتر العائلي المغربي
     - جوازا السفر وبطاقتا التعريف الوطنية للوالدين
     - بطاقة الإقامة التركية للوالدين
  6. **شهادة حسن السيرة والسلوك (السجل العدلي القنصلي):**
     - نسخة واضحة من بطاقة التعريف الوطنية (CNIE)
     - نسخة من جواز السفر المغربي
     - بطاقة الإقامة التركية وعنوان السكن (`Yerleşim Yeri Belgesi`)
  7. **تصحيح الإمضاء ومطابقة النسخ للأصل (Signature Legalization & Certified Copies):**
     - الوثيقة الأصلية المراد تصحيح الإمضاء عليها أو مطابقتها
     - الحضور الشخصي لصاحب التوقيع
     - بطاقة التعريف الوطنية المغربية (CNIE) أو جواز السفر الساري
     - وثيقة تثبت الإقامة في تركيا (`Yerleşim Yeri Belgesi` / الإقامة)
  8. **تذييل العقود والوثائق ومصادقة القنصلية (Consular Attestation):**
     - الوثيقة الأصلية مصدقة بأبوستيل تركي أو مغربي حسب مصدرها
     - ترجمة محلفة ومصدقة لدى النوتر للوثائق الصادرة باللغة التركية
     - بطاقة التعريف الوطنية وجواز السفر المغربي
     - بطاقة الإقامة التركية أو شهادة السكن (`Yerleşim Yeri Belgesi`)

---

### Section 6: Unified Bookings Hub — Flights · Hotels · VIP Airport Transfer (`UnifiedBookingsSection.tsx`)
All travel bookings are unified into **one interactive hub** with 3 switchable tabs:
- **Heading:**
  - **Line 1 (White, Black Weight):** `حجوزات الطيران والفنادق وتوصيل المطار`
  - **Line 2 (Gold `#E6BD67`, SemiBold):** `قارن الخيارات واطلب عرض السعر في قسم واحد`

#### Tab 1: حجوزات الطيران (Flight Bookings)
- **Trip Type:** `ذهاب فقط (One Way)` | `ذهاب وعودة (Round Trip)` | `رحلات مباشرة فقط (Non-stop)`
- **World Airports Autocomplete (`From` & `To`):**
  - Searchable dropdown of major Turkish, Moroccan, European, Middle Eastern, and global airports (`IST`, `SAW`, `ESB`, `AYT`, `TZX`, `ADB`, `BJV`, `CMN`, `TNG`, `RAK`, `RBA`, `FEZ`, `AGA`, `NDR`, `OUD`, `CDG`, `ORY`, `LHR`, `FRA`, `MUC`, `AMS`, `BRU`, `MAD`, `BCN`, `FCO`, `MXP`, `ZRH`, `GVA`, `DXB`, `AUH`, `DOH`, `JED`, `RUH`, `MED`, `CAI`, `AMM`, `KWI`, `ALG`, `TUN`, `JFK`, `YUL`) + free-text entry for any city worldwide.
  - One-click **Swap** button between Departure and Arrival airports.
- **Dates:** Departure Date + Return Date picker.
- **Passengers & Cabin Class Popover:** Adults (`+12`), Children (`2–11`), Infants (`<2`), Cabin Class (`الدرجة السياحية Economy` / `رجال الأعمال Business`), Checked Baggage (`23+ kg`) checkbox.
- **Dual-Row Airlines Marquee:** Turkish Airlines, Royal Air Maroc, Pegasus Airlines, Air Arabia, Corendon Airlines, Saudia, Emirates, Qatar Airways, Flydubai, Lufthansa, Air France, EgyptAir.
- **CTA:** Sends structured flight search inquiry directly to WhatsApp.

#### Tab 2: حجز الفنادق (Hotel Bookings)
- **Star Rating Selector:** `4 أو 5 نجوم` | `5 نجوم فاخرة` | `4 نجوم مميزة` | `شقق فندقية عائلية`
- **Meal Plan Selector:** `شامل الإفطار` | `إقامة فقط` | `نصف إقامة / شامل كلياً`
- **Destination / Hotel Autocomplete:**
  - Istanbul (Fatih/Sultanahmet, Taksim/Şişli/Beşiktaş, Bosphorus), Antalya, Trabzon & Uzungöl, Bursa, Sapanca & Maşukiye, Cappadocia, Morocco (Casablanca, Marrakech, Tangier, Rabat), or custom hotel name.
- **Check-in & Check-out Dates:** Automatic night count calculation (`ليالٍ`).
- **Rooms & Guests Selector:** Rooms count, Adults, Children, plus special requests input (e.g. sea view, connecting rooms, official hotel voucher for consulate/airport).

#### Tab 3: توصيل المطار VIP (VIP Airport Transfer — `InteractiveTransferWidget.tsx`)
- **Step 1 — Searchable Airport Dropdown (`src/data/airports.ts`):**
  - Searchable dropdown covering all major Turkish airports (`IST`, `SAW`, `AYT`, `TZX`, `ESB`, `ADB`, `BJV`, `DLM`, `RZV`, `YEI`, `ASR`, `NAV`, `GZT`, `COV`, `GZP`, `KYA`, `SZF`, `DIY`) and international airports (`CMN`, `TNG`, `RAK`, `DXB`, `JED`, `CDG`, `LHR`, `FRA`, etc.) with filter tabs (`جميع المطارات`, `مطارات تركيا`, `مطارات دولية`) and quick-select buttons (`IST`, `SAW`, `AYT`, `TZX`, `ESB`, `BJV`).
- **Step 2 — Transfer Type:** `استقبال من المطار` | `توصيل إلى المطار` | `ذهاب وعودة`
- **Step 3 — Destination Zone or Custom Address:**
  - Pre-configured zones with distance (`km`) and duration (`min`) from `IST` and `SAW`:
    - `الفاتح / السلطان أحمد` (`~42 km` IST / `~48 km` SAW)
    - `تقسيم / شيشلي / بيوغلو` (`~39 km` IST / `~43 km` SAW)
    - `كاديكوي / أوسكودار (الطرف الآسيوي)` (`~54 km` IST / `~32 km` SAW)
    - `باشاك شهير / كايا شهير` (`~28 km` IST / `~65 km` SAW)
    - `بيليك دوزو / إسن يورت` (`~48 km` IST / `~78 km` SAW)
    - `بكركوي / فلوريا / زيتون بورنو` (`~44 km` IST / `~52 km` SAW)
    - **`عنوان آخر / فندق أو منطقة أخرى` (Custom Destination / Hotel Option):** Lets the user type any hotel name, district, or city manually.
- **Step 4 — Vehicle Category:**
  - `مرسيدس فيتو VIP (1-6 ركاب)` — 6 bags, leather seats, Wi-Fi, AC
  - `مرسيدس سبرينتر VIP (7-14 راكب)` — 15+ bags, spacious family/group cabin
- **Step 5 — Passengers & Luggage Counter + Live Route Summary Card:** Shows selected airport, estimated distance/time, vehicle, and sends a formatted WhatsApp booking request.

---

### Section 7: 10-Service Auto-Rotating Campaign Slider (`CampaignSlider.tsx`)
Interactive showcase highlighting 10 specialized services with visual cards:
1. شهادة الكفاءة للزواج (شهادة العزوبية)
2. الوكالات الخاصة العادية في القنصلية
3. الترجمة المحلفة وتصديق النوتير والأبوستيل
4. حجوزات تذاكر الطيران الدولية والداخلية
5. حجوزات الفنادق والشقق الفندقية
6. استقبال وتوصيل مطارات إسطنبول VIP
7. تجديد جواز السفر البيومتري والبطاقة الوطنية
8. تسجيل المواليد الجدد والحالة المدنية
9. الإقامة السياحية والعائلية في تركيا
10. متابعة شاملة لمعاملات الجالية المغربية والعربية

---

### Section 8: In-Depth Guides & Knowledge Hub (`GuidesSection.tsx` & `GuideReaderModal.tsx`)
- **Heading:**
  - **Line 1 (Blue):** `أدلة المعاملات في تركيا`
  - **Line 2 (Gold):** `معلومات عملية خطوة بخطوة`
- Comprehensive clickable articles covering:
  - دليل الزواج المدني للمغاربة في تركيا وشهادة الكفاءة للزواج
  - دليل تصديق الوثائق (الأبوستيل) والترجمة المحلفة والنوتير
  - دليل الإقامة السياحية والعائلية في تركيا وتجديدها
  - دليل الوكالات القنصلية وتجديد الجواز والبطاقة الوطنية

---

### Section 9: How It Works (`HowItWorks.tsx`) & Visual Portfolio (`WorkGallery.tsx`)
- **How It Works Heading:**
  - **Line 1 (Blue):** `كيف نعمل معك؟`
  - **Line 2 (Gold):** `3 خطوات بسيطة`
- **Steps:**
  1. `01` — أرسل طلبك عبر واتساب
  2. `02` — تدقيق التفاصيل وشرح المسار
  3. `03` — متابعة مستمرة حتى إتمام المعاملة
- **Visual Gallery (`WorkGallery.tsx`):** High-resolution visual cards for Marriage Eligibility, POA, Sworn Translation, Flights, Hotels, VIP Airport Transfer, and Residence Permits.

---

### Section 10: Founder Section (`FounderSection.tsx`)
- **Heading:**
  - **Line 1 (Blue):** `رشيد الفزني` (`Rachid Elfazni`)
  - **Line 2 (Gold):** `المؤسس وإدارة الخدمات` (`Founder & Service Management`)
- **Bio:**
  - يشرف رشيد الفزني شخصياً على متابعة طلبات العملاء وتنسيق خدمات القنصلية، حجوزات الطيران، الترجمة المحلفة، وتوصيل المطار في إسطنبول، لضمان الدقة والسرعة والوضوح في كل خطوة.
- **4 Pillars:**
  1. تواصل سريع واستجابة مباشرة
  2. خبرة دقيقة بالمعاملات القنصلية والتركية
  3. توجيه للمسار الأقل تكلفة والأسرع إنجازاً
  4. سرية تامة وأمان في معالجة الوثائق

---

### Section 11: FAQ Accordion (`FAQSection.tsx`) & Legal Disclaimer (`DisclaimerSection.tsx`)
- **FAQ Heading:**
  - **Line 1 (Blue):** `الأسئلة الشائعة`
  - **Line 2 (Gold):** `إجابات سريعة وواضحة`
- **6 Key FAQs:** Remote document processing via WhatsApp, Consular appointment availability in Istanbul & Ankara, Flight/Hotel booking steps, VIP Airport Transfer flight tracking, Sworn translation & Notary certification, and Residence permit guidance.
- **Official Legal Disclaimer (`إخلاء المسؤولية`):**
  - لا تربطنا أي علاقة رسمية مع القنصلية المغربية أو مع الإدارة العمومية.
  - نقوم بتقديم خدمات استشارية وخدمات المساعدة في إصدار الأوراق.
  - لا ننوب عن الشخص، لكن نساعده بالإرشاد حتى نسهل عليه المعاملات، وتكون المعاملات أسهل وأبسط.

---

### Section 12: Direct Contact Form, CTA Banner, Footer & Mobile Dock
- **Direct Contact Form (`ContactFormSection.tsx`):**
  - Name, Phone/WhatsApp, Service Category dropdown, Message details, and dual submit buttons: `إرسال فوري عبر واتساب` & `إرسال عبر البريد الإلكتروني`.
- **Bottom High-Impact CTA (`ContactCTA.tsx`):**
  - **Line 1 (White):** `تواصل معنا عبر واتساب` (`WhatsApp’tan Bize Ulaşın`)
  - **Line 2 (Gold `#E6BD67`):** `ولنبدأ معاملتك فوراً` (`İşleminizi Hemen Başlatalım`)
- **Mobile Quick Dock (`MobileQuickDock.tsx`) & Floating WhatsApp Button (`FloatingWhatsApp.tsx`):**
  - Persistent bottom navigation bar on mobile devices for 1-tap access to Consular Appointments, Flights/Hotels, VIP Transfer, and WhatsApp.

---

## 4. Ready-to-Paste Master Prompt for ChatGPT

Copy the prompt block below and paste it directly into your AI assistant to develop or upgrade `https://elfazni.com`:

```markdown
You are a senior frontend architect and UI/UX designer. I want you to build/upgrade the official website for **ELFAZNI SERVICES (الـفـزنـي للـخـدمـات)** (`https://elfazni.com`), founded by **Rachid Elfazni (رشيد الفزني)** in Istanbul, Türkiye.

### 1. Core Brand & Contact Details
- **Brand Name:** ELFAZNI SERVICES
- **Founder:** Rachid Elfazni (رشيد الفزني)
- **Phone & WhatsApp:** +90 552 267 7851 (`https://wa.me/905522677851`)
- **Email:** rachidelfazni@gmail.com
- **Instagram:** https://www.instagram.com/elfazniservices/
- **Facebook:** https://www.facebook.com/alfazni.services
- **Location:** Istanbul, Türkiye

### 2. Design System, Colors & Strict Two-Line Typography
- **Colors:**
  - Primary Blue: `#064EA8`
  - Dark Royal Navy: `#01336F`
  - Deep Navy (Dark Sections): `#012247`
  - Primary Gold (Light backgrounds): `#B6812E`
  - Luminous Gold (Dark backgrounds): `#E6BD67`
  - Surface / Background: `#FBFBFD` and `#EAF4FF`
- **Strict Two-Line Heading Rule (Apply to every Section Title `h1` and `h2`):**
  - **Line 1:** Extra-bold / Black (`font-weight: 800/900`) in Dark Blue (`#01336F` or `#064EA8`, or `#FFFFFF` on dark sections).
  - **Line 2:** Golden subtitle in `Bahij TheSansArabic-SemiBold` (`font-weight: 600`) for Arabic and `Plus Jakarta Sans` (`font-weight: 600`) for Turkish/English/French, colored Gold (`#B6812E` on light sections, `#E6BD67` on dark sections).
- **Multilingual Support (4 Languages with 100% Complete Translations):**
  - Arabic (`ar` - default, RTL), Turkish (`tr` - LTR), English (`en` - LTR), and French (`fr` - LTR). Ensure zero untranslated strings when switching languages.

### 3. Required Interactive Sections
1. **Sticky Header:** Logo, section navigation links, 4-language switcher (`AR`, `TR`, `EN`, `FR`), and direct WhatsApp CTA.
2. **Hero Section:** Rotating headline for the 6 core services, golden second line, trust badges, visual showcase card, and dual CTAs (Direct WhatsApp + Guided 4-Step Request Modal).
3. **3-Step Fast Bar & Infinite Service Marquee:** Dark navy bar with steps `01`, `02`, `03` and an infinite scrolling marquee of services.
4. **Core Services Section (Filterable):** 7 numbered service cards (`01` Consular Appointments, `02` Flight Bookings, `03` VIP Airport Transfer, `04` Sworn Translation, `05` Residence Renewals, `06` Hotel Bookings, `07` Community Services).
5. **Interactive Moroccan Consular Checklist (`مواعيد القنصلية المغربية`):**
   - 8 selectable procedures (Marriage Eligibility Certificate, Ordinary Special POA, Biometric Passport, CNIE Renewal, Newborn Registration, Police Clearance, Signature Legalization, Document Attestation).
   - Interactive document checkboxes with a live readiness progress bar (`%`), Apostille & legal notes (clarifying that Real Estate POA is an Adoul deed in Morocco), and 1-click WhatsApp review button.
6. **Unified Bookings Section (`منصة الحجوزات الموحدة` — All in One Section with 3 Tabs):**
   - **Tab 1: Flight Bookings (`حجوزات الطيران`):** One-way/Round-trip, searchable World Airports autocomplete (`From` & `To`) with IATA codes, dates, passenger/cabin selector, dual-row airline logos marquee, and WhatsApp deal request.
   - **Tab 2: Hotel Bookings (`حجز الفنادق`):** Star rating selector (4/5 stars, luxury 5-star, aparthotels), board basis (Breakfast included, Room only, All-inclusive), searchable Turkish & Moroccan destinations or custom hotel name, check-in/out dates with automatic night counter, rooms/guests selector, and WhatsApp quote request.
   - **Tab 3: VIP Airport Transfer (`توصيل المطار VIP`):**
     - Searchable dropdown of Turkish (`IST`, `SAW`, `AYT`, `TZX`, `ESB`, `ADB`, `BJV`, `DLM`, `RZV`, `YEI`, `ASR`, `NAV`, `GZT`, `COV`, etc.) and international airports + quick-select pills.
     - Transfer direction (Pickup, Drop-off, Round-trip).
     - Destination zones (Fatih/Sultanahmet, Taksim/Şişli, Kadıköy/Üsküdar, Başakşehir, Beylikdüzü, Bakırköy/Florya) + **"Other Destination / Custom Hotel or Address" (`عنوان آخر / فندق أو منطقة أخرى`)** with manual address input.
     - Vehicle selector: Mercedes Vito VIP (1–6 Pax) & Mercedes Sprinter VIP (7–14 Pax).
     - Live Route Summary Card showing estimated distance (`km`), duration (`min`), and direct WhatsApp booking button.
7. **10-Service Auto-Rotating Campaign Slider & In-Depth Guides Section** with modal article reader.
8. **How It Works (3 Steps), Visual Portfolio Gallery, and Founder Section (Rachid Elfazni).**
9. **FAQ Accordion & Official Legal Disclaimer Section (`إخلاء المسؤولية`).**
10. **Direct WhatsApp / Email Contact Form, High-Impact Bottom CTA Banner, Footer, Floating WhatsApp Button, and Mobile Bottom Quick Dock.**
```
