# ELFAZNI SERVICES — Hosting & Production Deployment Guide
## دليل رفع وتشغيل الموقع على الاستضافة والسيرفر

هذا الدليل يشرح كيفية رفع وتشغيل تطبيق **ELFAZNI SERVICES** المتكامل (الموقع العام + بوابة الإدارة والتحكم + نظام CRM لإدارة العملاء والحجوزات).

---

## 1. محتويات الحزمة (Package Overview)

الحزمة المضغوطة مهيأة مسبقاً للإنتاج:
* **واجهة الموقع العام وبوابة الإدارة:** مُترجمة وجاهزة في مجلد `dist/`.
* **نظام إدارة العملاء (CRM):** مُترجم وجاهز في مجلد `crm/dist/`.
* **خادم النظام وواجهات API:** ملف `server.ts` ومجلد `server/`.
* **قواعد البيانات والإعدادات:** مجلد `data/` (`db.json`, `crm.json`, `themes.json`, `productivity.json`).
* **الوسائط والملفات العامة:** مجلد `public/` (الصور، الشعارات، الفيديوهات الترويجية، الخطوط).

---

## 2. متطلبات السيرفر (Server Requirements)

* **Node.js:** إصدار 18.x أو 20.x أو أحدث.
* **NPM:** إصدار 9.x أو أحدث.
* **الذاكرة (RAM):** 1 جيجابايت كحد أدنى (موصى به: 2 جيجابايت).
* **نظام التشغيل:** Linux (Ubuntu / Debian / CentOS / AlmaLinux) أو استضافة cPanel / Plesk تدعم Node.js.

---

## 3. طريقة التثبيت على استضافة cPanel (Node.js App)

إذا كانت استضافتك تدعم **Setup Node.js App** في لوحة cPanel:

1. **رفع الملفات:**
   - ادخل إلى **File Manager** في cPanel.
   - ارفع ملف `elfazni-services-full-deployment.zip` إلى مجلد تطبيقك (مثل `elfazni-app` أو خارج `public_html`).
   - قم بفك الضغط (Extract).

2. **إنشاء تطبيق Node.js:**
   - اذهب إلى **Setup Node.js App** في cPanel.
   - اضغط **Create Application**.
   - اختر **Node.js version:** 20.x أو 18.x.
   - **Application mode:** `Production`.
   - **Application root:** المسار الذي فككت فيه الملفات (مثلاً `elfazni-app`).
   - **Application startup file:** `server.ts`.
   - اضغط **Create**.

3. **تثبيت الحزم (Install Dependencies):**
   - في صفحة التطبيق، اضغط على زر **Run NPM Install** (أو ادخل عبر SSH واكتب `npm install --omit=dev`).

4. **إعداد المتغيرات في ملف `.env`:**
   - تأكد من وجود ملف `.env` في المجلد بنفس إعداداتك:
     ```env
     PORT=8080
     NODE_ENV=production
     ADMIN_PASSWORD=ElfazniServices2026!
     JWT_SECRET=elfazni-services-jwt-auth-secret-key-2026
     ```
5. اضغط **Restart Application**.

---

## 4. طريقة التثبيت على سيرفر خاص (VPS / Ubuntu / Debian)

### الخطوة 1: تثبيت Node.js و PM2
```bash
# تحديث السيرفر
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs unzip git

# تثبيت مدير العمليات PM2 عالمياً
sudo npm install -g pm2
```

### الخطوة 2: رفع وفك الضغط
```bash
# إنشاء مجلد التطبيق
sudo mkdir -p /var/www/elfazni
cd /var/www/elfazni

# فك ضغط الحزمة
unzip /path/to/elfazni-services-full-deployment.zip

# تثبيت الاعتماديات
npm install --omit=dev
```

### الخطوة 3: التشغيل عبر PM2
```bash
# بدء التشغيل باستخدام الإعداد الجاهز
pm2 start ecosystem.config.cjs

# حفظ حالة التشغيل ليعمل السيرفر تلقائياً عند إعادة التشغيل
pm2 save
pm2 startup
```

### الخطوة 4: ضبط Nginx وشهادة SSL (HTTPS)
قم بإنشاء ملف إعداد Nginx:
```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
ثم تفعيل شهادة SSL مجانية:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 5. روابط النظام وحسابات الدخول الافتراضية

* **الموقع العام:** `https://yourdomain.com/`
* **بوابة الإدارة والتحكم (Admin Portal):** `https://yourdomain.com/portal`
  * رابط تسجيل الدخول المباشر: `https://yourdomain.com/portal/login`
  * **اسم المستخدم:** `elfazni.admin`
  * **كلمة المرور:** `ElfazniServices2026!`
* **نظام إدارة العملاء (CRM):** `https://yourdomain.com/admin/crm/` أو `https://yourdomain.com/crm`
  * رابط تسجيل دخول CRM: `https://yourdomain.com/portal/login?next=crm`
* **مدير المظهر والهوية البصرية:** `https://yourdomain.com/portal?section=theme`
* **خريطة تحليلات الزوار العالمية:** `https://yourdomain.com/portal?section=overview`
* **تقويم المواعيد والمتابعات:** داخل نظام CRM عبر تبويب "التقويم" من القائمة العلوية.
