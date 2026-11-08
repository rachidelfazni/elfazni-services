import { BlogLanguage, BlogStatus } from '../../../services/api';

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export const BLOG_UI_STRINGS: Record<
  BlogLanguage,
  {
    blogSection: string;
    allPosts: string;
    newPost: string;
    drafts: string;
    scheduled: string;
    categoriesAndTags: string;
    mediaLibrary: string;
    templates: string;
    blogSettings: string;
    backToPosts: string;
    preview: string;
    saveDraft: string;
    publish: string;
    update: string;
    schedule: string;
    moreActions: string;
    duplicate: string;
    revisionHistory: string;
    archive: string;
    moveToTrash: string;
    deletePermanently: string;
    saving: string;
    saved: string;
    unsavedChanges: string;
    saveFailed: string;
    words: string;
    chars: string;
    readingTime: string;
    titlePlaceholder: string;
    excerptPlaceholder: string;
    tagsPlaceholder: string;
    categoryLabel: string;
    languageLabel: string;
    statusLabel: string;
    authorLabel: string;
    featuredImageLabel: string;
    altTextLabel: string;
    slugLabel: string;
    canonicalUrlLabel: string;
    seoTitleLabel: string;
    seoDescLabel: string;
    scheduleDateLabel: string;
    timezoneLabel: string;
    translationsLabel: string;
    createTranslation: string;
    relatedPostsLabel: string;
    featuredToggleLabel: string;
    pdfGuideUrlLabel: string;
    insertImage: string;
    uploadFromDevice: string;
    chooseFromLibrary: string;
    insertGallery: string;
    insertTable: string;
    insertCallout: string;
    insertCta: string;
    insertVideo: string;
    insertPdfBanner: string;
    insertInternalLink: string;
    insertTemplate: string;
    sourceCodeMode: string;
    visualMode: string;
    dropImageHere: string;
    uploadingImage: string;
    statusNames: Record<BlogStatus, string>;
  }
> = {
  ar: {
    blogSection: 'المدونة والمقالات',
    allPosts: 'جميع المقالات',
    newPost: 'مقال جديد',
    drafts: 'المسودات',
    scheduled: 'المجدولة',
    categoriesAndTags: 'التصنيفات والوسوم',
    mediaLibrary: 'مكتبة الوسائط',
    templates: 'قوالب المقالات',
    blogSettings: 'إعدادات المدونة',
    backToPosts: 'العودة للمقالات',
    preview: 'معاينة',
    saveDraft: 'حفظ مسودة',
    publish: 'نشر المقال',
    update: 'تحديث المقال',
    schedule: 'جدولة النشر',
    moreActions: 'المزيد',
    duplicate: 'تكرار المقال',
    revisionHistory: 'سجل النسخ والتعديلات',
    archive: 'أرشفة / إخفاء',
    moveToTrash: 'نقل إلى سلة المحذوفات',
    deletePermanently: 'حذف نهائي',
    saving: 'جاري الحفظ…',
    saved: 'تم الحفظ',
    unsavedChanges: 'تغييرات غير محفوظة',
    saveFailed: 'فشل الحفظ',
    words: 'كلمة',
    chars: 'حرف',
    readingTime: 'وقت القراءة',
    titlePlaceholder: 'اكتب عنوان المقال الرئيسي هنا...',
    excerptPlaceholder: 'ملخص تمهيدي مختصر للمقال يظهر في البطاقات ومحركات البحث...',
    tagsPlaceholder: 'اكتب وسماً ثم اضغط Enter...',
    categoryLabel: 'التصنيف',
    languageLabel: 'لغة المقال واتجاه النص',
    statusLabel: 'حالة النشر',
    authorLabel: 'الكاتب',
    featuredImageLabel: 'الصورة البارزة (Cover)',
    altTextLabel: 'النص البديل للصورة (Alt Text)',
    slugLabel: 'الرابط الدائم (Slug)',
    canonicalUrlLabel: 'الرابط الأساسي (Canonical URL)',
    seoTitleLabel: 'عنوان محركات البحث (SEO Title)',
    seoDescLabel: 'وصف محركات البحث (Meta Description)',
    scheduleDateLabel: 'تاريخ ووقت النشر المجدول',
    timezoneLabel: 'المنطقة الزمنية',
    translationsLabel: 'الترجمات المرتبطة للمقال',
    createTranslation: 'إنشاء نسخة مترجمة',
    relatedPostsLabel: 'مقالات ذات صلة',
    featuredToggleLabel: 'تمييز المقال في صدارة المدونة',
    pdfGuideUrlLabel: 'رابط ملف PDF المرفق (اختياري)',
    insertImage: 'إدراج صورة',
    uploadFromDevice: 'رفع صورة من الكمبيوتر',
    chooseFromLibrary: 'اختيار من مكتبة الوسائط',
    insertGallery: 'معرض صور',
    insertTable: 'جدول',
    insertCallout: 'صندوق تنبيه / نصيحة',
    insertCta: 'زر تفاعلي (CTA)',
    insertVideo: 'فيديو يوتيوب / فيميو',
    insertPdfBanner: 'بطاقة تحميل ملف PDF',
    insertInternalLink: 'بطاقة مقال داخلي',
    insertTemplate: 'قالب جاهز',
    sourceCodeMode: 'كود HTML آمن',
    visualMode: 'المحرر المرئي',
    dropImageHere: 'أفلت الصورة هنا لإدراجها في هذا الموضع من المقال',
    uploadingImage: 'جاري رفع الصورة وإدراجها في موضع المؤشر...',
    statusNames: {
      published: 'منشور',
      draft: 'مسودة',
      in_review: 'قيد المراجعة',
      scheduled: 'مجدول',
      archived: 'مؤرشف',
      trash: 'سلة المحذوفات',
    },
  },
  en: {
    blogSection: 'Blog & Articles',
    allPosts: 'All Posts',
    newPost: 'New Post',
    drafts: 'Drafts',
    scheduled: 'Scheduled',
    categoriesAndTags: 'Categories & Tags',
    mediaLibrary: 'Media Library',
    templates: 'Article Templates',
    blogSettings: 'Blog Settings',
    backToPosts: 'Back to Posts',
    preview: 'Preview',
    saveDraft: 'Save Draft',
    publish: 'Publish',
    update: 'Update Post',
    schedule: 'Schedule',
    moreActions: 'More',
    duplicate: 'Duplicate Post',
    revisionHistory: 'Revision History',
    archive: 'Archive',
    moveToTrash: 'Move to Trash',
    deletePermanently: 'Delete Permanently',
    saving: 'Saving…',
    saved: 'Saved',
    unsavedChanges: 'Unsaved changes',
    saveFailed: 'Save failed',
    words: 'words',
    chars: 'chars',
    readingTime: 'Read time',
    titlePlaceholder: 'Enter article title here...',
    excerptPlaceholder: 'Write a concise summary/excerpt for cards and search engines...',
    tagsPlaceholder: 'Type a tag and press Enter...',
    categoryLabel: 'Category',
    languageLabel: 'Article Language & Direction',
    statusLabel: 'Publication Status',
    authorLabel: 'Author',
    featuredImageLabel: 'Featured Image',
    altTextLabel: 'Image Alt Text',
    slugLabel: 'URL Slug',
    canonicalUrlLabel: 'Canonical URL',
    seoTitleLabel: 'SEO Title',
    seoDescLabel: 'Meta Description',
    scheduleDateLabel: 'Scheduled Date & Time',
    timezoneLabel: 'Timezone',
    translationsLabel: 'Linked Translations',
    createTranslation: 'Create Translation',
    relatedPostsLabel: 'Related Articles',
    featuredToggleLabel: 'Feature on Blog Hero',
    pdfGuideUrlLabel: 'Attached PDF Guide URL (Optional)',
    insertImage: 'Insert Image',
    uploadFromDevice: 'Upload from Computer',
    chooseFromLibrary: 'Choose from Media Library',
    insertGallery: 'Image Gallery',
    insertTable: 'Table',
    insertCallout: 'Callout / Tip Box',
    insertCta: 'CTA Button',
    insertVideo: 'YouTube / Vimeo Embed',
    insertPdfBanner: 'PDF Download Banner',
    insertInternalLink: 'Internal Article Card',
    insertTemplate: 'Starter Template',
    sourceCodeMode: 'Sanitized HTML',
    visualMode: 'Visual Editor',
    dropImageHere: 'Drop image here to insert at this position',
    uploadingImage: 'Uploading image and inserting at cursor...',
    statusNames: {
      published: 'Published',
      draft: 'Draft',
      in_review: 'In Review',
      scheduled: 'Scheduled',
      archived: 'Archived',
      trash: 'Trash',
    },
  },
  fr: {
    blogSection: 'Blogue & Articles',
    allPosts: 'Tous les articles',
    newPost: 'Nouvel article',
    drafts: 'Brouillons',
    scheduled: 'Planifiés',
    categoriesAndTags: 'Catégories & Étiquettes',
    mediaLibrary: 'Médiathèque',
    templates: "Modèles d'articles",
    blogSettings: 'Paramètres du blogue',
    backToPosts: 'Retour aux articles',
    preview: 'Aperçu',
    saveDraft: 'Enregistrer le brouillon',
    publish: 'Publier',
    update: 'Mettre à jour',
    schedule: 'Planifier',
    moreActions: 'Plus',
    duplicate: 'Dupliquer',
    revisionHistory: 'Historique des versions',
    archive: 'Archiver',
    moveToTrash: 'Mettre à la corbeille',
    deletePermanently: 'Supprimer définitivement',
    saving: 'Enregistrement…',
    saved: 'Enregistré',
    unsavedChanges: 'Modifications non enregistrées',
    saveFailed: "Échec de l'enregistrement",
    words: 'mots',
    chars: 'caractères',
    readingTime: 'Temps de lecture',
    titlePlaceholder: "Saisissez le titre de l'article...",
    excerptPlaceholder: 'Résumé court pour les cartes et le référencement SEO...',
    tagsPlaceholder: 'Tapez une étiquette puis Entrée...',
    categoryLabel: 'Catégorie',
    languageLabel: "Langue et direction de l'article",
    statusLabel: 'Statut de publication',
    authorLabel: 'Auteur',
    featuredImageLabel: 'Image à la une',
    altTextLabel: "Texte alternatif (Alt)",
    slugLabel: 'Permalien (Slug)',
    canonicalUrlLabel: 'URL canonique',
    seoTitleLabel: 'Titre SEO',
    seoDescLabel: 'Méta-description',
    scheduleDateLabel: 'Date et heure de publication',
    timezoneLabel: 'Fuseau horaire',
    translationsLabel: 'Traductions liées',
    createTranslation: 'Créer une traduction',
    relatedPostsLabel: 'Articles connexes',
    featuredToggleLabel: 'Mettre en avant à la une',
    pdfGuideUrlLabel: 'URL du guide PDF joint (Optionnel)',
    insertImage: 'Insérer une image',
    uploadFromDevice: "Téléverser depuis l'ordinateur",
    chooseFromLibrary: 'Choisir dans la médiathèque',
    insertGallery: "Galerie d'images",
    insertTable: 'Tableau',
    insertCallout: 'Encadré conseil / alerte',
    insertCta: 'Bouton CTA',
    insertVideo: 'Vidéo YouTube / Vimeo',
    insertPdfBanner: 'Bannière PDF téléchargeable',
    insertInternalLink: 'Carte article interne',
    insertTemplate: 'Modèle de départ',
    sourceCodeMode: 'HTML assaini',
    visualMode: 'Éditeur visuel',
    dropImageHere: "Déposez l'image ici pour l'insérer à cet endroit",
    uploadingImage: "Téléversement et insertion de l'image...",
    statusNames: {
      published: 'Publié',
      draft: 'Brouillon',
      in_review: 'En révision',
      scheduled: 'Planifié',
      archived: 'Archivé',
      trash: 'Corbeille',
    },
  },
};

export function isRichHtmlContent(raw: string): boolean {
  if (!raw) return false;
  return /<(p|h[1-6]|figure|div|table|ul|ol|blockquote|section|article|hr)\b/i.test(raw);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatInlineMarkdownToHtml(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*|mailto:[^)\s]+|tel:[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

/**
 * Converts either existing Markdown posts or rich HTML posts into clean semantic HTML
 * suitable for both the Word-like visual editor and the public article renderer.
 */
export function ensureHtmlContent(raw: string): string {
  if (!raw || !raw.trim()) {
    return '<p><br></p>';
  }
  if (isRichHtmlContent(raw)) {
    return raw;
  }

  const lines = raw.split('\n');
  const blocks: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  const flushList = () => {
    if (listItems.length === 0) return;
    const tag = listOrdered ? 'ol' : 'ul';
    blocks.push(`<${tag}>${listItems.map((li) => `<li>${li}</li>`).join('')}</${tag}>`);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (imgMatch) {
      flushList();
      const alt = escapeHtml(imgMatch[1] || '');
      const src = escapeHtml(imgMatch[2] || '');
      blocks.push(
        `<figure class="elfazni-editor-image" data-block-type="image" data-size="full" data-align="center">` +
          `<img src="${src}" alt="${alt}" loading="lazy" />` +
          (alt ? `<figcaption>${alt}</figcaption>` : `<figcaption></figcaption>`) +
          `</figure>`
      );
      continue;
    }

    if (line.startsWith('#### ')) {
      flushList();
      blocks.push(`<h4>${formatInlineMarkdownToHtml(line.slice(5))}</h4>`);
    } else if (line.startsWith('### ')) {
      flushList();
      blocks.push(`<h3>${formatInlineMarkdownToHtml(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      flushList();
      blocks.push(`<h2>${formatInlineMarkdownToHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      flushList();
      blocks.push(`<h1>${formatInlineMarkdownToHtml(line.slice(2))}</h1>`);
    } else if (line.startsWith('> ')) {
      flushList();
      blocks.push(
        `<div class="elfazni-callout elfazni-callout-info" data-block-type="callout" data-variant="info">` +
          `<p>💡 ${formatInlineMarkdownToHtml(line.slice(2))}</p>` +
          `</div>`
      );
    } else if (line === '---' || line === '***') {
      flushList();
      blocks.push('<hr />');
    } else if (/^\d+\.\s+/.test(line)) {
      if (!listOrdered && listItems.length > 0) flushList();
      listOrdered = true;
      listItems.push(formatInlineMarkdownToHtml(line.replace(/^\d+\.\s+/, '')));
    } else if (/^[-*]\s+/.test(line)) {
      if (listOrdered && listItems.length > 0) flushList();
      listOrdered = false;
      listItems.push(formatInlineMarkdownToHtml(line.replace(/^[-*]\s+/, '')));
    } else {
      flushList();
      blocks.push(`<p>${formatInlineMarkdownToHtml(line)}</p>`);
    }
  }

  flushList();
  return blocks.join('\n');
}

/**
 * Cleans HTML pasted from Microsoft Word, Google Docs, or external websites.
 * Preserves semantic structure (H1-H4, P, UL/OL/LI, TABLE, A, B/STRONG, I/EM, U, S)
 * while stripping MSO junk, dangerous tags, inline event handlers, and random external fonts.
 */
export function cleanPastedHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  let cleaned = rawHtml
    // Remove Word/XML comments and declarations
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?(?:o|w|m|v):[^>]*>/gi, '')
    .replace(/<(script|style|meta|link|object|embed|form|iframe)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|meta|link|object|embed|form|iframe)[^>]*\/?>/gi, '')
    // Strip inline event handlers
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Strip class="Mso..." and style="mso-..."
    .replace(/\s+class\s*=\s*(?:"[^"]*Mso[^"]*"|'[^']*Mso[^']*')/gi, '')
    .replace(/\s+style\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
    // Strip unsafe URLs
    .replace(/(href|src)\s*=\s*(?:"\s*(?:javascript:|vbscript:|data:text\/html|blob:)[^"]*"|'\s*(?:javascript:|vbscript:|data:text\/html|blob:)[^']*')/gi, '$1="#"');

  // Convert empty spans/font tags
  cleaned = cleaned.replace(/<\/?(?:font|span)[^>]*>/gi, '');
  return cleaned.trim();
}

/**
 * Client-side HTML sanitizer for Source Mode round-trip and preview safety.
 */
export function sanitizeEditorHtmlClient(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<(script|style|object|embed|applet|meta|link|form|base)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|object|embed|applet|meta|link|form|base)[^>]*\/?>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(
      /(href|src|action|formaction)\s*=\s*(?:"\s*(?:javascript:|vbscript:|data:text\/html|blob:)[^"]*"|'\s*(?:javascript:|vbscript:|data:text\/html|blob:)[^']*')/gi,
      '$1="#"'
    )
    .replace(/<iframe\b([^>]*)>[\s\S]*?<\/iframe>/gi, (_match, attrs) => {
      const srcMatch = String(attrs).match(/src\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
      const src = srcMatch ? srcMatch[1] || srcMatch[2] || '' : '';
      if (/^https:\/\/(www\.)?(youtube\.com\/embed\/|player\.vimeo\.com\/video\/)[a-zA-Z0-9_-]+/i.test(src)) {
        return `<iframe src="${src}" title="Embedded Video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="w-full aspect-video rounded-2xl border border-slate-200 my-4"></iframe>`;
      }
      return '';
    });
}

export function computeContentMetrics(html: string, language: BlogLanguage = 'ar'): {
  wordCount: number;
  charCount: number;
  minutes: number;
  readTimeLabel: string;
} {
  const plainText = (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const charCount = plainText.length;
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const minutes = Math.max(1, Math.ceil(wordCount / 180));
  const readTimeLabel =
    language === 'en'
      ? `${minutes} min read`
      : language === 'fr'
      ? `${minutes} min de lecture`
      : `${minutes} دقائق`;

  return { wordCount, charCount, minutes, readTimeLabel };
}

export function injectHeadingIdsAndExtractToc(html: string): {
  htmlWithIds: string;
  toc: TocHeading[];
} {
  const toc: TocHeading[] = [];
  let index = 0;
  const htmlWithIds = (html || '').replace(/<(h[23])\b([^>]*)>([\s\S]*?)<\/\1>/gi, (_full, tag, attrs, inner) => {
    index += 1;
    const level = tag.toLowerCase() === 'h2' ? 2 : 3;
    const plain = String(inner).replace(/<[^>]+>/g, '').trim();
    const id = `section-${index}`;
    if (plain) {
      toc.push({ id, text: plain, level });
    }
    const cleanAttrs = String(attrs).replace(/\s+id\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
    return `<${tag}${cleanAttrs} id="${id}">${inner}</${tag}>`;
  });
  return { htmlWithIds, toc };
}

export function buildImageFigureHtml(params: {
  url: string;
  altText?: string;
  caption?: string;
  size?: 'small' | 'medium' | 'wide' | 'full';
  align?: 'start' | 'center' | 'end';
  linkUrl?: string;
  mediaId?: string;
}): string {
  const size = params.size || 'full';
  const align = params.align || 'center';
  const alt = escapeHtml(params.altText || '');
  const cap = escapeHtml(params.caption || '');
  const url = escapeHtml(params.url);
  const mediaAttr = params.mediaId ? ` data-media-id="${escapeHtml(params.mediaId)}"` : '';
  const imgTag = `<img src="${url}" alt="${alt}" loading="lazy" />`;
  const wrappedImg = params.linkUrl
    ? `<a href="${escapeHtml(params.linkUrl)}" target="_blank" rel="noopener noreferrer">${imgTag}</a>`
    : imgTag;

  return (
    `<figure class="elfazni-editor-image" data-block-type="image" data-size="${size}" data-align="${align}"${mediaAttr}>` +
    wrappedImg +
    `<figcaption contenteditable="true" data-placeholder="أضف تعليقاً توضيحياً للصورة (اختياري)...">${cap}</figcaption>` +
    `</figure><p><br></p>`
  );
}
