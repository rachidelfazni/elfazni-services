# دليل النشر على منصة Google AI Studio و Firebase
## ELFAZNI SERVICES — Google AI Studio & Firebase Deployment Guide

تم إعداد المشروع وربطه بالكامل مع مشروع Google AI Studio المسجل:
* **معرّف المشروع (Project ID):** `gen-lang-client-0723358648`
* **معرّف قاعدة بيانات Firestore:** `ai-studio-elfazniservices-6e0867c9-5307-4d78-9f65-726d9a903289`
* **نطاق الاستضافة المباشر:**
  * `https://gen-lang-client-0723358648.web.app`
  * `https://gen-lang-client-0723358648.firebaseapp.com`

---

## الخيار 1: النشر المباشر عبر Firebase Hosting (سريع وفوري)

تم إنشاء ملفات الإعداد `firebase.json` و `.firebaserc` مسبقاً وتوجيهها إلى مجلد الإنتاج `dist/` مع قواعد أمان `firestore.rules`.

### خطوات النشر من الطرفية (Terminal):
```bash
# 1. الانتقال لمجلد المشروع
cd /Users/elfazni/.gemini/antigravity/scratch/ELFAZNI-SERVICES-AI-STUDIO/ELFAZNI-SERVICES

# 2. تسجيل الدخول بحساب Google المرتبط بالمشروع (يفتح المتصفح للموافقة)
npx firebase-tools login

# 3. نشر الموقع وقواعد الأمان مباشرة إلى خوادم Google
npx firebase-tools deploy --only hosting,firestore:rules
```

بمجرد اكتمال الأمر، سيظهر لك الرابط المباشر للموقع المنشور على شبكة Google CDN العالمية:
`✔ Deploy complete! Hosting URL: https://gen-lang-client-0723358648.web.app`

---

## الخيار 2: النشر عبر واجهة Google AI Studio (Web UI)

إذا كنت تستخدم واجهة **Google AI Studio** على المتصفح:
1. ادخل إلى **[Google AI Studio](https://aistudio.google.com)** بحسابك.
2. اختر مشروع **ELFAZNI SERVICES** من القائمة العلوية أو افتح الـ Applet الخاص به.
3. اضغط على زر **Deploy / Publish (نشر)** في الزاوية العلوية اليمنى.
4. اختر النشر العام (Public URL) للحصول على رابط تطبيق الويب النشط.

---

## الخيار 3: النشر الكامل لخادم Node.js عبر Google Cloud Run

إذا كنت ترغب في تشغيل خادم Express بالكامل مع الـ Rate Limiting وحفظ الملفات وقواعد البيانات المحلية على Google Cloud:
```bash
# تسجيل الدخول إلى Google Cloud SDK
gcloud auth login

# تحديد المشروع
gcloud config set project gen-lang-client-0723358648

# نشر الحاوية إلى Google Cloud Run
gcloud run deploy elfazni-services \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080
```
