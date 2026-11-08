# ELFAZNI CHANGELOG

**Session date:** 2026-11-06
**Scope:** P0 defect batch (**§3–§6** of the master brief `1ELFAZNI_SERVICES_COMPLETE_MASTER_PROMPT_V4_NO_CONSULAR_COVER.md`)
**Project:** ELFAZNI-SERVICES (extracted from `ELFAZNI-SERVICES-file-storage-phase1.zip`)
**Status of changes: local / running dev server — NOT committed, NOT staged, NOT deployed to production.**

---

## 0. Project restoration (prerequisite — the zip was incomplete)

The provided zip was missing source files. Restored from the matching local copy
(`~/Documents/Codex/2026-11-04/https-elfazni-services-ai-studio-admin-3/work/file-storage-project`):

| Problem | Fix |
| --- | --- |
| `src/data/` entirely missing (`siteVisibility`, `content`, `translations`, `extraTranslations`, `guides`, `slides`, `airports`, `worldAirports`, `consularDocuments.json`) → server failed to boot | Copied the folder from the local copy. **⚠ Data files come from the 2026-11-04 copy — verify content is up to date.** |
| `crm/src/data/mockData.ts` missing → `tsc --noEmit` failed | Copied from the same local copy. |
| `esbuild ^0.25.0` conflicts with Vite 8 peer requirement (`^0.27 \|\| ^0.28`) → `npm install` failed | Bumped to `^0.28.0` in `package.json`. |

---

## 1. §3 — Airline logo marquee: seamless two-row ticker (P0)

**Root cause of the reported blank-blue-areas defect (confirmed in code + verified numerically):**
the old implementation used CSS `@keyframes marquee { to { transform: translateX(-50%) } }`
with only **2 copies** of each logo row. Two independent failures:

1. `-50%` assumed the track was an exact 2× of one sequence *including the outer
   gap* — the extra inter-group gap made the loop point misalign (visible jump).
2. On any viewport wider than one track-half (~1350px), the track simply ran out
   of content before the viewport edge → **blank blue areas**. This was measured
   live: with 2 copies the track (2704px) cannot cover a 1432px+ viewport plus one
   loop of travel.

**Fix — new reusable component `src/components/AirlineLogoMarquee.tsx`:**
- Measures the **exact** width of one full logo sequence *including the gap* (no guessing).
- Renders **enough copies** so the track always covers `viewport + one loop`
  (`N = ceil((viewport + loop) / loop)`, clamped 2–8), recalculated on `resize`
  and via `ResizeObserver`.
- Animates by exactly one loop width via the **Web Animations API**
  (`linear`, infinite) — the loop point is invisible; no drift, no jump, no reset flash.
- **RTL geometry fix:** the page is Arabic/RTL where a `w-max` flex track anchors at
  the *right* edge and overflows leftward — positive/negative transforms then leave
  the viewport uncovered. The track wrapper is forced `dir="ltr"` (Unicode bidi keeps
  Arabic airline names rendering correctly inside each card), making the loop math
  hold in both directions.
- Row 1 forward (right‑to‑left), Row 2 reverse (left‑to‑right) — opposite directions as specified.
- `prefers-reduced-motion`: static, fully-populated arrangement (no animation).
- Image `onError` fallback to the airline name text;Pause-on-hover/focus; play/pause control preserved.

**Used by:** `UnifiedBookingsSection.tsx` (the live homepage `#airlines` section)
and `AirlinesSection.tsx` (standalone variant) — both previously had their own
duplicated inline marquee code.

**Verified in browser:** both rows `playState: running` in opposite directions;
track coverage holds at loop position 0, and after jumping +2.5 loops
(left ≤ 0 and right ≥ viewport for both rows); zero console errors.

## 2. §4 — Home link in navigation (P0)

`src/components/Header.tsx`:
- Added **الرئيسية / Home** as the first top-level item (`/`, SPA route) — Arabic
  order is now **الرئيسية | الخدمات | المدونة | من نحن | تواصل معنا** as required.
- Restructured nav so the **الخدمات dropdown** items are selected by explicit ID list
  (adding Home no longer shifts `slice()` indexes into the dropdown).
- Home shows an `aria-current="page"` state on the homepage.
- Mobile drawer automatically includes Home (non-anchor hrefs are always visible).
- Logo link to `/` already existed and is preserved.

**Verified in browser:** nav reads الرئيسية، الخدمات، مواعيد القنصلية، حجوزات الطيران،
التوصيل للمطار، المدونة، من نحن، تواصل معنا; clicking الرئيسية from `/blog` navigates
back to `/` (SPA, no reload).

## 3. §5 — Blog search fully functional (P0)

**Server** (`server/routes.ts`, `GET /api/posts`):
- Search now covers **title, excerpt, full content, tags/keywords, and category** (was: title/excerpt/tags only).
- Added **Arabic normalization** on both query and fields: strips diacritics
  (harakat `064B–0652`, superscript alef, small high marks) and **tatweel**, and
  unifies Alef variants **أ إ آ ٱ → ا** — so «الاقامة» now matches «الإقامة».
- Empty/whitespace query falls through to unfiltered results.

**Client** (`src/components/blog/BlogIndex.tsx`) — fixed the broken search flow:
- The old code fetched on `[activeCategory]` only and the submit handler called
  `loadData()` reading a stale closure; resetting from the empty state didn't
  reload when the category was unchanged.
- New flow: input state (`searchQuery`) + **committed query** (`committedSearch`)
  set on submit; `useEffect([activeCategory, committedSearch])` drives refetching —
  no reload on every keystroke, Enter **and** button both work.
- Added **clear (✕) button** in the search box; "عرض جميع المقالات" reset button
  reliably clears category + search (and force-reloads if state was already clean).
- Search results header shows «نتائج البحث عن: «query»» with `aria-live="polite"`.
- Distinct **no-results** state (shows the searched term) and a new **load-error**
  state with an explicit retry button.
- Loading grid marked `aria-busy`.

**Verified in browser with real data:**
- «الإقامة» → 2 relevant published articles (genuine results, nothing fabricated).
- «الاقامة» (no hamza) → identical 2 results (normalization works).
- Nonsense query → proper no-results state; reset returns all 4 articles.

## 4. §6 — Blog cards and featured image standardization (P0)

`src/components/blog/BlogIndex.tsx`:
- Featured + grid card images: **16:9** (`aspect-video`), `object-cover`, reserved
  space (no CLS), lazy loading for grid, `eager` for the featured hero, plus
  `onError` hiding so broken covers degrade to a clean surface instead of a
  broken-image icon.
- Cards are equal-height in their row (`flex flex-col justify-between`), consistent
  radius/padding/shadow, clamped title (2 lines) and excerpt (2 lines), category
  badge, date, reading time, «اقرأ المزيد» CTA, and view count (real tracking exists — kept).
- **Keyboard accessibility:** both featured and grid cards are `role="button"`,
  `tabIndex=0`, Enter/Space activates, visible focus outline.
- **Date localization per interface language** (was hardcoded `ar-EG` even in EN/TR/FR):
  `ar-EG` / `tr-TR` / `fr-FR` / `en-US`.
- Featured card breadcrumb/hero unchanged; article slugs, metadata and view counts untouched.

## 5. Documentation-only additions

- `ELFAZNI_CHANGELOG.md` (this file).

---

## What was NOT done in this session (per agreed scope)

- §7 design system, §8 HUB, §9 flight forms audit, §10 CRM audit, §11 admin audit,
  §12 SEO/localization/performance, §16 ELFAZNI PLANNER — **not attempted**.
- Multi-viewport (375/430/768/1024/1920/2560px) and reduced-motion where only
  implemented (not every one re-verified live); the marquee math is viewport-driven
  via `ResizeObserver`, but full visual QA across widths remains.
- Not attempted / blocked: production deployment (not authorized; changes are local only).

## Rollback

No git history exists in the project directory (not a repo). A rollback point for
this session is the pristine zip + the restored copies noted in §0. Recommend
`git init` + initial commit **before** further phases.

---

# Session 2 — 2026-11-06: Branded consular-documents guide (PDF + posters + blog article)

## Context
User supplied the official requirements documents for the 6 core consular
services at the Moroccan Consulate in Turkey (AR/TR) and the new ELFAZNI logo
set in SVG. Deliverables produced this session, all on-brand and deployed into
the site's assets.

## New brand assets deployed

- `public/assets/logos/` — all 7 official SVG logos (dashed-name convention):
  `horizontal-logo-bleu-back`, `horizontal-logo-gold-back`, `logo-horizontal`,
  `logo-new`, `logo-vertical`, `vertical-logo-bleu-back`,
  `vertical-logo-gold-back`.
- `public/assets/docs/ELFAZNI-SERVICES-Consular-Documents-Guide-AR-TR.pdf`
  (~450 KB) — 9-page A4 guide: bilingual cover (navy #01336f→#064ea8 gradient,
  gold deboss bar, horizontal bleu-back logo), TOC, 6 full document chapters
  (AR then TR per group, gold/blue language badges), tips box, and a back page
  with CTA, article URL, WhatsApp number. Bahij font family throughout,
  page-break-inside:avoid protection on cards/headers/tips.
- `public/assets/posters/ELFAZNI-konsolosluk-poster-{0..6}.jpg` (1080×1350)
  — 1 summary poster (grid of all 6 services) + 1 poster per service, navy
  gradient, bleu-back horizontal logo, gold check icons, WhatsApp contact
  chip (0552 267 7851) and site URL footer.

## Website changes

- `src/services/api.ts` — added optional `pdfUrl?: string` to `BlogPost`.
- `src/components/blog/BlogPostView.tsx`:
  - Markdown `[text](url)` link support in `formatInline` (branded anchors,
    gold underline).
  - Standalone-image `![alt](src)` figure renderer with caption.
  - New branded PDF download banner rendered when `post.pdfUrl` is set
    (navy gradient, `FileDown` icon, gold CTA, `download` attribute).
- `data/db.json` — inserted new published blog post:
  - id `post_docs_guide_1`, slug
    `required-documents-moroccan-consulate-turkey-guide`, category
    `consular`, cover = summary poster, `pdfUrl` set, bilingual content
    (intro + 6 service chapters + PDF/WhatsApp CTA summary), each chapter
    embeds its service poster as a figure with tips.

## Key root-cause fix (posts appearing to "vanish" after restart)

`server/db.ts` caches the whole DB in `memoryDb` (module scope); every normal
`writeDb` (e.g. visit tracking) flushes that cached object back to
`data/db.json`. Editing db.json while a server process is running therefore
gets overwritten by the running server's memory. Rule adopted: **stop the dev
server (`pkill -f "tsx server.ts"`), then edit the JSON, then restart**.
CloudSync merge logic (`server/cloudSync.ts`) was ruled out — it only touches
messages/chatSessions/chatMessages/analytics, never posts.

## Verification performed

- `npx tsc --noEmit` → exit 0.
- API `/api/posts` listing + `/api/posts/<slug>` (title, pdfUrl, content OK);
  post survives a server restart and a tracked-visit write now.
- Browser (localhost:3000/article): SEO title updates, PDF banner present with
  `download` attr, 7 poster figures render (zero failed images), all Arabic
  H2s correct including the fixed summary heading, 2 inline markdown links,
  zero console errors.
- PDF + posters visually reviewed (cover, TOC, chapter 1 multi-page flow,
  summary poster, service poster 1).

## Scripts kept for regeneration

- `/tmp/elfazni-docs/generate.py` — regenerates the PDF/poster HTML sources and
  renders via headless Chrome (`--print-to-pdf` / `--screenshot 1080x1350`).
- `/tmp/elfazni-docs/insert_post.py` — re-inserts the guide post into
  `data/db.json` (run with the server stopped).

---

# Session 3 — 2026-11-06: ELFAZNI SERVICES HUB (/hub)

## What was built

- `src/components/hub/HubPage.tsx` — new central access portal at **`/hub`**.
  - Header: official bleu-back horizontal logo (`/assets/logos/horizontal-logo-bleu-back.svg`),
    4-language segmented switcher (AR/EN/FR/TR, persisted via the existing
    `LanguageProvider` / `elfazni-language` key), Return-to-Website button.
  - Hero: navy gradient (#012859 → #01336f → #064ea8) with subtle grid texture,
    gold hairlines, kicker, AR h1, gold EN subtitle, description.
  - Three premium cards: Website (Globe), CRM (Users, featured navy card),
    Admin Panel (Settings). Each: large icon tile, AR title, EN subtitle,
    description, gold/navy CTA with arrow, hover lift, ring/shadow, focus ring.
  - Trust strip: unified experience, integrated systems, security, support.
  - Footer: logo, tagline, Return-to-Website, role-based access note, © year.
  - All copy localized in ar/en/fr/tr inside the component.
- `src/App.tsx` — lazy `HubPage` import + `/hub` route (wrapped in
  `LanguageProvider`, before the `/admin` route).

## Destinations (verified from the existing project — nothing invented)

| Card | Target | Verified behavior |
|---|---|---|
| Website | `/` (same app / production site root) | 200 |
| CRM | `/admin/crm` | unauthenticated → server redirect to `/admin/login?next=crm` + CRM login |
| Admin | `/admin` | unauthenticated → Admin login screen (password field) |

- No credentials, tokens or customer data on the HUB; CRM/Admin keep their
  existing session-based auth. No SSO introduced.

## Design-system integration

- Reuses exact site tokens: #01336f navy, #064ea8 royal, #0B70DD sky,
  #b6812e gold, #E6BD67 gold-light, #0D2340 ink, #607087 muted, #DCE8F5 line,
  #eaf4ff tint; Bahij TheSansArabic via the global `--font-sans`; same
  segmented language control pattern as `Header.tsx`.
- Official logo used in header + footer — no replacement mascot/logo.

## Testing (all performed locally against the dev server)

- `npx tsc --noEmit` → exit 0; `npm run build` → success (vite + crm).
- Responsive screenshots (CDP): desktop 1440px (3 cols), tablet 834px
  (Website+Admin row, featured CRM full-width row), mobile 390px (1 col).
  Files: `docs/hub/hub-{desktop,tablet,mobile,desktop-en}.png`.
- Language switching AR/EN/FR/TR verified (dir flips ar=RTL vs ltr, h1/cards/
  CTAs translate, persists in localStorage), 0 console errors.
- Keyboard: Tab order skip-link → logo → 4 language buttons (aria-pressed) →
  Return to Website → first card CTA; every stop shows a visible 3px gold
  `:focus-visible` outline (CDP-dispatched real Tab events).
- Auth boundaries: `/admin/crm` → `/admin/login?next=crm` with password form;
  `/admin` → Admin login with password form.
- Production SPA fallback (`app.get('*')` → index.html) covers `/hub`.
- Logo loads (naturalWidth > 0); Arabic headings render correctly.

## Notes

- `/workspace` (older minimal portal in `WorkspacePortal.tsx`) was left untouched;
  `/hub` is the new official portal. A future session could redirect `/workspace`
  to `/hub` if desired.

---

# Session 4 — 2026-11-06: Working dashboard calendar (tasks & reminders per date)

## Bug reported
The admin dashboard calendar ("التقويم وجدول المواعيد") was purely decorative:
31 fixed cells, `isToday = date === 4`, hardcoded dots, and no `onClick`.
Clicking a date did nothing and it was impossible to schedule anything.

## Fix implemented

### Data model (shared client/server)
- `TodoItem` gained optional `kind?: 'task' | 'reminder'` and `time?: string`
  (`server/db.ts`, `src/services/api.ts`).
- `POST /api/admin/analytics/todos` and `PATCH .../todos/:id` now persist
  `kind` and `time` (validation: kind ∈ task|reminder).
- `api.createTodo` accepts `kind`/`time`.

### AdminAnalytics calendar (`src/components/admin/AdminAnalytics.tsx`)
- Real month engine: first-weekday offset + exact days-in-month (Sunday-first,
  matching the ح ن ث ر خ ج س header), no more static 31 cells.
- Month navigation (prev/next) + "اليوم" shortcut; header shows the real month
  and a live "N موعد/مهمة" counter.
- Real per-day indicators: dot only when that day actually has tasks/reminders;
  legacy `dueDate: "اليوم"` items count as today.
- Today is highlighted correctly (ring), selected day is filled blue.
- Clicking any date opens an accessible day panel (dialog):
  - Full Arabic date title, existing items for that day with done-toggle,
    kind badge (مهمة/تذكير), priority dot, optional time, delete.
  - Add form with **مهمة / تذكير** segmented selector, title, optional time
    (reminders), priority select, disabled state while saving.
  - Closes via ✕, backdrop click, or Escape; `aria-modal`, labels, focus ring.
- Main quick-add now stores today's ISO date so it also appears on the calendar;
  todo rows render ISO dates in Arabic + reminder bell + time.
- Date helpers use local time (no UTC off-by-one): `toISODate`, `parseISODate`,
  `formatISODate`.

## Verification
- `npx tsc --noEmit` → exit 0; dev server restarted cleanly.
- UI flow: clicked 10 Nov → dialog opened; added reminder (high, 09:30) and
  task → both listed, dot appeared on the 10th; done-toggle, month navigation
  (نوفمبر → ديسمبر → back), Escape close all verified.
- Persistence verified in `data/db.json`:
  `dueDate: 2026-11-10`, `kind: task|reminder`, `time: 09:30`.
- Cleanup: test items deleted via API; dots/counter updated (5 items),
  0 console errors.
- Screenshots: `docs/admin-calendar/admin-calendar.png`,
  `admin-calendar-zoom.png`, `admin-day-panel.png`.

## Notes
- Reminders are stored as dated todo items with an optional time. No push
  notifications were added (not requested); a future session could surface a
  "today's reminders" banner in the dashboard header.

---

# Session 5 — توحيد التصميم البصري الشامل (V5)

**التاريخ:** 2026-11-06 · **الطلب:** «قم بتجربة الموقع وملاحظته وتوحيد تصميمه فيه وأسلوب تصميم الألوان وكله» + مرفق طقم شعار SVG.

## ما تم
- **تدقيق حي** بمحاكاة Chrome headless (CDP): لقطات قياس قبل/بعد لكل الأسطح (موقع، مدونة، HUB، Admin، CRM).
- **رموز V5 الحرفية** في `@theme` لكلا المحرّكين (`src/index.css` + `crm/src/index.css`): أزرق `#004AA5`، ذهبي `#CC9048`، كحلي `#01336F`، مشرق `#0B70DD`، mist `#EAF4FF`، ذهب غامق `#9E7336`، ذهب فاتح `#E6BD67`، حبر `#0D2340`، خافت `#607087`، حدود `#DCE8F5`، عاجل `#F7F5EF`.
- **إعادة ربط سلاسل Tailwind v4** (`blue`/`indigo`/`slate`) بدرجات العلامة — فئات قديمة تصبح على الهوية بدون تعديل يدوي.
- **استبدال hex شامل** في src + crm/src (30+ استبدال مختلف) — صفر hex قديم متبقٍ.
- **Admin:** بطاقات KPI بيضاء بجذوع blue/gold/deep + بطاقة LIVE كحلية، دونات الأجهزة بألوان العلامة + مفاتيح، بانر Live زوار كحلي-ذهبي، بطاقات تحليلات المدونة موحّدة، خلفية التطبيق → عاجل، صندوق البريد on-brand.
- **CRM:** بطاقات `ws-metric` موحّدة، فئات الخدمات بألوان نهائية ثابتة، شارات بنفسجي/وردي/سماوي→فضل الأزرق/الذهب، تدرج Modal الطيران والشعار أوتّد على blues.
- **الطباعة:** `.elfazni-display` (clamp 38–68px/900) على H1 الرئيسية وHUB.
- **الدلالية محفوظة:** الأخضر/الأحمر/الكهرماني (فواتير/kanban/حالة) وواتساب `#25D366` — كما هي.
- **الشعار:** الطقم المرفق مؤرشف في `public/assets/logos/kit/` (مرجع فقط — نسخه الأفقية-على-أبيض مقصوص، فلم يُبدّل الشعار الرسمي).
- **مستندات التسليم:** `AUDIT_REPORT.md`, `ELFAZNI_DESIGN_SYSTEM.md`, `IMPLEMENTATION_CHANGELOG.md`, `DEPLOYMENT_STATUS.md`.
- **اختبار نهائي:** 20/20 توليفات CLEAN من أخطاء Console (5 صفحات × 390/768/1440/2560) · `tsc -0` · `build ✅`.
- **لقطات نهائية** في `docs/design-unification/`.

## الحالة
كل التغييرات **محلية على `main` ولم تُنشر** — بانتظار موافقة المالك (انظر `DEPLOYMENT_STATUS.md`).

---

## 2026-11-07 — Translation audit & localization pass

### Scope
Full-site translation verification and repair. The fallback semantics of `t()` (returns the
Arabic key verbatim when a translation is missing) caused large parts of the site (contact
section, blog index/post, footer, header, service cards, modals, live-chat widget) to stay
Arabic when switching to English/French/Turkish.

### What was done
- **Static audit** (`/tmp/trans-audit.mjs`): scanned every `t("…")` literal key in `src/`
  and reported missing entries per language. Initially 74 missing keys × 3 languages.
- **Added 74 missing keys** to `src/data/extraTranslations.ts` (AirlinesSection, ConsularBookingModal,
  ContactFormSection, FlightBookingModal, Footer, GuideReaderModal, Header, Hero, MobileQuickDock,
  StartRequestModal, UnifiedBookingsSection) for tr/en/fr.
- **Wrapped previously hardcoded Arabic UI strings** in `t()` and added translations:
  - `ContactFormSection` (≈40 strings: headings, tabs, labels, placeholders, success/error)
  - `blog/BlogIndex` (hero, search, filters, cards, related CTA)
  - `blog/BlogPostView` (breadcrumb, meta, PDF banner, tags, CTA, related)
  - `Header` (admin dashboard link), `Footer` (admin dashboard link), `VisitorLiveChat`
  - `ServicesSection` (now uses `t(service.title)` / `t(service.desc)` instead of undefined
    `titleTr/En/Fr` fields — service cards now translate)
  - Service titles/descriptions (7) and blog category names (5) added to the dictionary.
- **AdminLogin** converted from Arabic-only to a 4-language `COPY` dictionary driven by
  `useLanguage()` (panel kicker/title/note, form labels, buttons, recovery, security note);
  `dir` now follows `isRtl`.
- **CRM LoginPortal** art panel updated to the new family asset (kicker/title) and the
  error-banner contrast fixed (`text-red-200` → `text-red-600`); new key added to
  `crm/src/i18n/interface-copy.json`.
- **Dynamic settings** (founder title, tagline, address, working hours) added for the current
  values.

### Verification
- `npx tsc --noEmit` — 0 errors (site + CRM).
- `npm run build` — vite + CRM build success.
- Live CDP sweep: landing-page untranslated snippets reduced from 42 → 5 (only brand names
  and admin-managed Arabic data fields remain, by design); blog UI chrome now translates.
- `trans-audit.mjs` reports 0 missing keys for all 3 languages (402 keys total).

### Files touched
`src/data/extraTranslations.ts`, `src/components/ContactFormSection.tsx`, `src/components/Header.tsx`,
`src/components/Footer.tsx`, `src/components/ServicesSection.tsx`, `src/components/blog/BlogIndex.tsx`,
`src/components/blog/BlogPostView.tsx`, `src/components/chat/VisitorLiveChat.tsx`,
`src/components/admin/AdminLogin.tsx`, `crm/src/i18n/interface-copy.json`.

## 2026-11-07 — تطبيق الهوية المعتمدة (Blue-Gold Kit) على كل المشاريع
- استيراد حزمة الهوية المعتمدة `ELFAZNI-APPROVED-BLUE-GOLD-BRAND-KIT` إلى المستودع: `docs/brand/` يحتوي `ELFAZNI-BRAND-IDENTITY.md` و`brand-tokens.json` و`brand-tokens.css`.
- الشعار الرسمي: ملفات `ELFAZNI-Logo-Cobalt` (向量 + PNG) والـ 6 نسخ الرسمية في `public/assets/logos/kit/` وكذلك في `crm/public/assets/logos/`.
- مكتبة الأصول ثلاثية الأبعاد المعتمدة (12 PNG شفافة) في `public/assets/brand/3d/` و`crm/public/assets/brand/3d/`.
- لوحة الألوان: كوبالت `#12559A` + ذهب دافئ `#A67B30` + أزرق مساند `#2A83D5` + حبر `#0B2E57` — أعيد ربط كل المتغيرات في الموقع (Tailwind tokens في `src/index.css`) وفي الـ CRM (`:root` + `brandConfig.ts`) واستبدال كل الألوان القديمة (`#004AA5/#01336F/#012247/#9E7336…`) على كامل الكود المصدري دون تغيير البنية.
- إلغاء القوس المغربي: خانات الدخول (HUB / Admin / CRM / Workspace Portal) أصبحت بيضاء مهيمنة مع موجة الكوبالت (أصل معتمد `06-brand-wave-transparent.png`) ولمسة ذهبية رفيعة؛ استبدال الألواح الفوتوغرافية بالأصول ثلاثية الأبعاد المعتمدة (07 hero for HUB، 02 documents for Admin/CRM، 12 translation for CRM login).
- بوابة مساحة العمل: خلفية فاتحة مع أزيز (orbs) بالكوبالت والذهب، والشعار الأفقي الرسمي الكوبالت على الأبيض بدل نسخة الخلفية الداكنة.
- التركيز (focus): حد ذهبي `#A67B30` حسب الدليل.
- البناء والتحقق: `tsc` نظيف للموقع والـ CRM، `npm run build` و`npm run build:crm` نجاحا، ولقطات CDP موثقة في `docs/design-unification/brandkit/`.

### تعديل 2026-11-07 (طلب المالك): إعادة الخلفية الكحلية لدخول العائلة
- صفحات HUB وAdmin/CRM وWorkspace Portal في العائلة الدخول عاد معها خلفيته الكحلي السابق (`#012247` + أقواس شعاعية) وورقة البطاقة بيضاء، في حين تبقى داخله أصول الهوية المعتمدة: الشعار الرسمي، لوحة ألوان الكوبالت/الذهب، ولوح الأصول 3D (07 HUB/02 Admin/12 CRM).
- شعار بوابة مساحة العمل يعود إلى نسخة الخلفية الزرقاء المجربة بالمعتمدة `kit/elfazni-horizontal-on-blue.svg`.
- لقطات محدثة في `docs/design-unification/brandkit/*-desktop.png`.

## 2026-11-07 — CRM Scheduler Workspace (Calendar + Notebook + Tasks) & Official Logos
- Active CRM shell: `WorkspaceNavbar` (App alias) — built-in logo chips switched to the official SVG kit (`logos/kit/elfazni-horizontal-on-white.svg` expanded / `-vertical-` collapsed; topbar logo chip beside the page title; mobile drawer logo).
- Always-visible topbar logout button (next to the bell) + settings dropdown gains Notebook, Calendar & tasks, and a direct jump link to the website admin panel (`/admin`).
- New `crm/src/components/tools/CalendarWorkspace.tsx` — full scheduler-style workspace dialog (1240px portal, `tools-overlay/tools-dialog`):
  - Tabs: التقويم / المفكرة / المهام / الحجوزات; views Day · Week · Month + Today / prev / next.
  - Week & day grids: full-height day columns (54px hour rail, 08:00–18:00, 40px rows drawn with repeating gradient); timed personal events positioned by time/duration; all-day pill row for CRM records.
  - Month grid with ≤3 chips + «+N», today badge; click a day → day view.
  - Left rail: mini month (event dots, today ring, selection), toggleable calendars legend with live counts ( consulate / flights / debts / personal / dated tasks ), and an «القادم» upcoming rail (opens the event's day).
  - Quick add bar (title + date + time → gold personal event), event popper (fixed-position, ESC/outside close) with delete for personal events and "Open section" jump for CRM records.
- CRM data feeds the calendar: `consulateAppointments.submissionDate` (green CNS), `flightBookings.bookingDate` (blue FLY), `debts.date` (amber DEBT); personal events gold ME; dated tasks violet TASK.
- Per-user persistence in localStorage only (no backend schema change): `elfazni_crm_calendar_<user>`, `elfazni_crm_tasks_<user>`, `elfazni_crm_notebook_<user>` (user key = `elfazni.admin` etc). Empty-state message added for the bookings tab.
- Sidebar gains a «أدوات شخصية» section (تقويمي + CRM-record count badge، مفكرتي) opening the workspace on the matching tab.
- Verified via CDP screenshots (auth by minted owner cookie): week/month/notebook/tasks/bookings + dashboard topbar/sidebar — archived in `docs/design-unification/brandkit/`. Site + CRM builds pass; `data/db.json` untouched.

## 2026-11-07 — CRM Logo Enlargement & Company Bank Accounts Redesign
- الشعار في الـ CRM: تكبير `.ws-brand img` (174×41 → 196×46) و`.ws-sidebar.collapsed .ws-brand img` (40×52 → 44×56) و`.ws-topbar-logo img` (22 → 27px) في `crm/src/workspace.css` (CSS only، SVG vector).
- section `حسابات المؤسسة / Company Bank Accounts` (`TangibleShowcaseFooter.tsx` + `company-studio.css`): إعادة تصميم ببطاقتي TRY/USD متسقتين (شارة عملة، صف مستفيد، IBAN LTR مع تباعد)، زر «نسخ بيانات الحساب» لكل بطاقة (نسخ holder + currency + IBAN الخاص بتلك البطاقة فقط)، زر أساسي «نسخ الحسابين» (holder + كلا الحسابين، صيغة WhatsApp/email)، زر نسخ صغير بجانب اسم المستفيد RACHID EL FAZNI من مصدر واحد (`BRAND_CONFIG.bankAccounts.accountHolder` / `documentSettings.bankAccountHolder`).
- مصادر موحّدة: `BankDetailsShare.tsx` يصدّر `bankCopyText` / `bankAccountCopyText` / `ibanOf` (استخدام في Footer وDropdown لتجنب تكرار holder).
- UX: toast نجاح فقط بعد النسخ (مفتاح copied)، fallback textarea عند فشل clipboard، IBAN LTR مع `overflow-wrap: anywhere`، RTL/EN/FR، hover 150–200ms، بطاقتان جنبًا جنبًا على desktop وصف واحد على mobile (grid `repeat(2,1fr)` → `1fr` تحت 900px).
- كشف IBAN متطابق: `ibansIdentical` → شارة كهرمانية «يلزم التحقق» (لا تكرار صامت). ملاحظة للتحقق: قيم brandConfig IBAN (TRY `…500001` / USD `…500101`) تختلف بحرف واحد — flagged للمالك.
- صور التحقق: `docs/design-unification/brandkit/bank-redesign-desktop-2026-11-07.png`, `bank-redesign-mobile-2026-11-07.png`. `tsc --noEmit` و `npm run build:crm` نجحا. `data/db.json` غير مُدرج.
