# خريطة إعدادات المظهر والرموز البصرية — ELFAZNI SERVICES
## Theme Configuration-to-Renderer Mapping Matrix

**المشروع:** ELFAZNI SERVICES  
**النطاق المحلي:** `http://localhost:8080/`  
**التاريخ:** 9 نوفمبر 2026

---

## 1. جدول مصفوفة المناطق البصرية الخمس (The 5 Independent Visual Regions)

| المنطقة البصرية | حقل الإعداد (JSON Token) | المسار في كود التكوين | المكون المسؤول عن الرندرة (Renderer Component) | العنصر المرئي المستهدف في الصفحة (Visible DOM Element) |
| :--- | :--- | :--- | :--- | :--- |
| **Zone A: خلفية الصفحة الخارجية** | `outerBackground.type` | `theme.outerBackground.type` | `HubPage.tsx` / `AdminLogin.tsx` / `ThemeLivePreview.tsx` | نوع الخلفية الكلية (`solid`, `gradient`, `radial_gradient`, `image`, `transparent`) |
| | `outerBackground.color` | `theme.outerBackground.color` | `HubPage.tsx` / `AdminLogin.tsx` | لون الخلفية المصمتة أو الأساسية |
| | `outerBackground.image` | `theme.outerBackground.image` | الطبقة 1: `Layer 1 (Background Asset)` | مسار صورة الخلفية الكلية الممتدة على مساحة المتصفح |
| | `outerBackground.scale` | `theme.outerBackground.scale` | الطبقة 1: `backgroundSize: `${scale}%`` | مقياس تكبير/تصغير صورة الخلفية من 0% إلى 400% |
| | `outerBackground.fit` | `theme.outerBackground.fit` | الطبقة 1: `backgroundSize: cover \| contain \| auto` | وضع ملاءمة الصورة للشاشة |
| | `outerBackground.positionX / positionY` | `theme.outerBackground.positionX/Y` | الطبقة 1: `backgroundPosition: `${x}% ${y}%`` | موضع الصورة الأفقي والرأسي الدقيق |
| | `outerBackground.blur` | `theme.outerBackground.blur` | الطبقة 1: `filter: blur(${blur}px)` | شدة التمويه الزجاجي لصورة الخلفية (0–20px) |
| | `outerBackground.brightness` | `theme.outerBackground.brightness` | الطبقة 1: `filter: brightness(${brightness}%)` | سطوع صورة الخلفية (0–200%) |
| | `outerBackground.opacity` | `theme.outerBackground.opacity` | الطبقة 1: `opacity: ${opacity / 100}` | شفافية طبقة الصورة (0–100%) |
| | `outerBackground.overlay` | `theme.outerBackground.overlay.*` | الطبقة 2: `Layer 2 (Independent Overlay)` | التدرج اللوني العلوي المستقل فوق الصورة لتعتيمها وضمان تباين النصوص |
| | `outerBackground.pattern` | `theme.outerBackground.pattern.*` | الطبقة 3: `Layer 3 (Decorative Grid/Arcs)` | النقوش الهندسية الفيكتورية (شبكة، أقواس، نقاط) مع شدة شفافية مستقلة |
| **Zone B: بطاقة القائمة / الدخول** | `menuPanel.bgColor` | `theme.menuPanel.bgColor` | حاوية البطاقة البيضاء/الرئيسية | لون خلفية البطاقة الداخلية |
| | `menuPanel.borderRadius` | `theme.menuPanel.borderRadius` | حاوية البطاقة: `borderRadius` | انحناء حواف البطاقة (`16px`, `24px`, `32px`, `40px`) |
| | `menuPanel.borderColor` | `theme.menuPanel.borderColor` | حاوية البطاقة: `borderColor` | لون إطار البطاقة (مثل الذهبي `#CC9048` أو الكحلي) |
| | `menuPanel.shadowIntensity` | `theme.menuPanel.shadowIntensity` | حاوية البطاقة: `box-shadow` | شدة الظل ثلاثي الأبعاد للبطاقة (`none`, `sm`, `md`, `lg`, `xl`, `2xl`) |
| | `menuPanel.width` | `theme.menuPanel.width` | حاوية البطاقة: `maxWidth` | أقصى عرض للبطاقة (افتراضي: `520px` إلى `680px`) |
| | `menuPanel.inputBg` | `theme.menuPanel.inputBg` | `AdminLogin.tsx` حقول الإدخال | لون خلفية حقول اسم المستخدم وكلمة المرور |
| | `menuPanel.inputBorder` | `theme.menuPanel.inputBorder` | `AdminLogin.tsx` حقول الإدخال | لون إطار حقول الإدخال عند الراحة والتركيز |
| | `menuPanel.inputTextColor` | `theme.menuPanel.inputTextColor` | `AdminLogin.tsx` حقول الإدخال | لون الخط داخل حقول الإدخال |
| | `menuPanel.primaryButtonBg` | `theme.menuPanel.primaryButtonBg` | `AdminLogin.tsx` / `HubPage.tsx` | لون خلفية زر تسجيل الدخول أو أزرار الانتقال |
| | `menuPanel.primaryButtonTextColor`| `theme.menuPanel.primaryButtonTextColor` | زر الإرسال | لون الخط على زر الإرسال |
| **Zone C: خلفية اللوحة البصرية** | `sidePanel.bgType` | `theme.sidePanel.bgType` | `ThemeVisualPanel.tsx` الحاوية | نوع خلفية اللوحة البصرية (مستقلة تماماً عن Zone A) |
| | `sidePanel.bgColor` | `theme.sidePanel.bgColor` | `ThemeVisualPanel.tsx` الحاوية | لون خلفية اللوحة البصرية |
| | `sidePanel.bgGradient` | `theme.sidePanel.bgGradient.*` | `ThemeVisualPanel.tsx` خلفية التدرج | تدرج خلفية اللوحة (خطي، قطري، زاوي، مع محطات ألوان مخصصة) |
| | `sidePanel.bgImage` | `theme.sidePanel.bgImage` | `ThemeVisualPanel.tsx` طبقة الصورة | صورة مخصصة للوحة الجانبية فقط (دون أن تتسرب للخلفية الكبرى) |
| **Zone D: المجسم التوضيحي 3D** | `sidePanel.foregroundImage` | `theme.sidePanel.foregroundImage` | `ThemeVisualPanel.tsx` عنصر المجسم | صورة المجسم المفرغة الشفافة (PNG/WebP/SVG) |
| | `sidePanel.illustrationScale` | `theme.sidePanel.illustrationScale` | عنصر المجسم: `transform: scale()` | مقياس تكبير/تصغير المجسم من 0% إلى 400% |
| | `sidePanel.illustrationRotation`| `theme.sidePanel.illustrationRotation` | عنصر المجسم: `transform: rotate()` | زاوية تدوير المجسم بالدرجات (-180° إلى +180°) |
| | `sidePanel.illustrationOpacity` | `theme.sidePanel.illustrationOpacity` | عنصر المجسم: `opacity` | شفافية المجسم (0–100%) |
| | `sidePanel.illustrationFit` | `theme.sidePanel.illustrationFit` | عنصر المجسم: `objectFit` | طريقة ملء المجسم (`contain`, `cover`, `scale-down`) |
| | `sidePanel.illustrationCustomX/Y`| `theme.sidePanel.illustrationCustomX/Y` | عنصر المجسم: `translate(x, y)` | إزاحة المجسم الأفقية والرأسية بالبكسل |
| **Zone E: طبقات النصوص والشعارات** | `sidePanel.logoVariant` | `theme.sidePanel.logoVariant` | `BrandLogo.tsx` في اللوحة الجانبية | نموذج الشعار (أبيض، كحلي، أفقي، عمودي) |
| | `sidePanel.headingAr` | `theme.sidePanel.headingAr` | `ThemeVisualPanel.tsx` عنوان اللوحة | العنوان العربي الرئيسي للوحة البصرية |
| | `sidePanel.headingEn` | `theme.sidePanel.headingEn` | `ThemeVisualPanel.tsx` العنوان اللاتيني | العنوان الإنجليزي أسفل أو بجانب العربي |
| | `sidePanel.descriptionAr` | `theme.sidePanel.descriptionAr` | `ThemeVisualPanel.tsx` النص الوصفي | نص الوصف والشرح داخل اللوحة البصرية |
| | `sidePanel.headingColor` | `theme.sidePanel.headingColor` | لون الخط | لون خط العناوين داخل اللوحة الجانبية |
| | `sidePanel.descriptionColor` | `theme.sidePanel.descriptionColor` | لون الخط | لون خط الوصف داخل اللوحة الجانبية |
| | `menuPanel.headingColor` | `theme.menuPanel.headingColor` | `HubPage.tsx` / `AdminLogin.tsx` | لون العنوان الرئيسي في بطاقة القائمة / الدخول |
| | `menuPanel.kickerColor` | `theme.menuPanel.kickerColor` | النص العلوي الصغير (Kicker) | لون العنوان التمهيدي في بطاقة النموذج |
| | `menuPanel.descriptionColor` | `theme.menuPanel.descriptionColor` | النص الفرعي | لون النص الوصفي في بطاقة النموذج |

---

## 2. مصفوفة الأهداف المدعومة (Supported Target Interfaces)

1. **`portal` (بوابة الفزني سيرفيسز الموحدة `/hub`):** تدعم كافة المناطق الخمس، مع أزرار تنقل ثلاثية للوجهات.
2. **`admin_login` (دخول المشرف وإدارة الموقع `/portal/login`):** تدعم كافة المناطق الخمس، ومجسم الوثائق القنصلية، وحقول الإدخال المخصصة.
3. **`crm_login` (دخول نظام العملاء والمعاملات `/crm` أو `/portal/login?next=crm`):** تدعم كافة المناطق الخمس، ومجسم الفنادق والإقامة، والمظهر الكحلي المتقدم.
4. **`website` (الموقع الإلكتروني العام للزوار `/`):** تستقبل الألوان العامة والخطوط عبر متغيرات CSS مع حظر أي تسريب لروابط الإدارة.
5. **`crm` (لوحة تحكم المعاملات الداخلية `/admin/crm/`):** تستقبل ألوان وتصميم نظام إدارة الأعمال عبر خدمة التنسيق الموحدة.
