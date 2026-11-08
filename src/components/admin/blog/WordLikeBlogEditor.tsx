import React, { useState, useEffect, useRef, useCallback } from 'react';
import './blog-editor.css';
import {
  ArrowRight,
  ArrowLeft,
  Save,
  Eye,
  Send,
  Calendar,
  MoreHorizontal,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Video,
  FileDown,
  Sparkles,
  Trash2,
  Copy,
  History,
  Archive,
  Upload,
  Check,
  X,
  AlertCircle,
  PanelRightClose,
  PanelRightOpen,
  MoveUp,
  MoveDown,
  RefreshCw,
  Globe,
  ExternalLink,
  Type,
  Palette,
  Highlighter,
  Eraser,
  Minus,
  FileCode,
  Smartphone,
  Monitor,
  Plus,
  BookOpen,
  IndentIncrease,
  IndentDecrease,
  Maximize2,
  Minimize2,
  RotateCcw,
} from 'lucide-react';
import { ResizeHandle } from '../../workspace/ResizeHandle';
import { clampPanelSize } from '../../workspace/layoutPreferences';
import {
  api,
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogRevision,
  BlogTemplate,
  MediaAsset,
  BlogLanguage,
  BlogStatus,
} from '../../../services/api';
import {
  BLOG_UI_STRINGS,
  ensureHtmlContent,
  cleanPastedHtml,
  sanitizeEditorHtmlClient,
  computeContentMetrics,
  buildImageFigureHtml,
} from './blogContentUtils';

interface WordLikeBlogEditorProps {
  initialPost: Partial<BlogPost>;
  categories: BlogCategory[];
  tags: BlogTag[];
  media: MediaAsset[];
  templates: BlogTemplate[];
  allPosts: BlogPost[];
  uiLang: BlogLanguage;
  onChangeUiLang: (lang: BlogLanguage) => void;
  onBack: () => void;
  onSaved: (savedPost: BlogPost, isNew: boolean) => void;
  onMediaUploaded: (asset: MediaAsset) => void;
  onOpenPostById: (id: string) => void;
  onNavigatePublic: (path: string) => void;
}

const BRAND_TEXT_COLORS = [
  { label: 'Navy ELFAZNI', value: '#0B2E57' },
  { label: 'Cobalt Blue', value: '#004AA5' },
  { label: 'Gold Accent', value: '#CC9048' },
  { label: 'Slate Dark', value: '#1E293B' },
  { label: 'Emerald', value: '#047857' },
  { label: 'Crimson', value: '#B91C1C' },
  { label: 'Purple', value: '#6D28D9' },
];

const BRAND_HIGHLIGHTS = [
  { label: 'بدون تظليل / None', value: 'transparent' },
  { label: 'أزرق فاتح / Blue Mist', value: '#EAF4FF' },
  { label: 'ذهبي فاتح / Warm Gold', value: '#FEF3C7' },
  { label: 'أخضر فاتح / Mint', value: '#D1FAE5' },
  { label: 'وردي فاتح / Rose', value: '#FFE4E6' },
  { label: 'رمادي فاتح / Slate', value: '#F1F5F9' },
];

const FONT_FAMILIES = [
  { label: 'Bahij TheSansArabic (الخط الرسمي)', value: 'Bahij_TheSansArabic, sans-serif' },
  { label: 'Plus Jakarta Sans (Latin)', value: '"Plus Jakarta Sans", system-ui, sans-serif' },
  { label: 'Georgia Serif (كلاسيكي)', value: 'Georgia, serif' },
  { label: 'Monospace (كود)', value: 'ui-monospace, SFMono-Regular, monospace' },
];

const FONT_SIZES = [
  { label: 'صغير (14px)', commandVal: '2', px: '14px' },
  { label: 'عادي (16px)', commandVal: '3', px: '16px' },
  { label: 'متوسط (18px)', commandVal: '4', px: '18px' },
  { label: 'كبير (22px)', commandVal: '5', px: '22px' },
  { label: 'عنوان بارز (28px)', commandVal: '6', px: '28px' },
];

export const WordLikeBlogEditor: React.FC<WordLikeBlogEditorProps> = ({
  initialPost,
  categories,
  tags,
  media,
  templates,
  allPosts,
  uiLang,
  onChangeUiLang,
  onBack,
  onSaved,
  onMediaUploaded,
  onOpenPostById,
  onNavigatePublic,
}) => {
  const strings = BLOG_UI_STRINGS[uiLang];
  const isUiRtl = uiLang === 'ar';

  // Post state
  const [post, setPost] = useState<Partial<BlogPost>>(() => ({
    title: '',
    slug: '',
    excerpt: '',
    content: ensureHtmlContent(initialPost.content || ''),
    language: initialPost.language || 'ar',
    category: initialPost.category || categories[0]?.slug || 'consular',
    tags: Array.isArray(initialPost.tags) ? initialPost.tags : [],
    coverImage: initialPost.coverImage || '/assets/slides/10-all-services.webp',
    coverImageAlt: initialPost.coverImageAlt || initialPost.title || '',
    status: initialPost.status || 'draft',
    author: initialPost.author || 'رشيد الفزني',
    readTime: initialPost.readTime || '4 دقائق',
    featured: Boolean(initialPost.featured),
    pdfUrl: initialPost.pdfUrl || '',
    seoTitle: initialPost.seoTitle || '',
    seoDescription: initialPost.seoDescription || '',
    canonicalUrl: initialPost.canonicalUrl || '',
    scheduledAt: initialPost.scheduledAt || '',
    timezone: initialPost.timezone || 'Europe/Istanbul',
    revision: initialPost.revision || 1,
    relatedPostIds: Array.isArray(initialPost.relatedPostIds) ? initialPost.relatedPostIds : [],
    ...initialPost,
  }));

  const articleLang: BlogLanguage = (post.language as BlogLanguage) || 'ar';
  const isArticleRtl = articleLang === 'ar';

  // Save & dirty states
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>(
    initialPost.id ? 'saved' : 'unsaved'
  );
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [conflictModal, setConflictModal] = useState<{ serverVersion?: BlogPost } | null>(null);

  // Undo/Redo history stack for the rich-text canvas
  const [historyStack, setHistoryStack] = useState<string[]>(() => [
    ensureHtmlContent(initialPost.content || ''),
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Editor DOM refs & selection bookmarking
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const inlineImageInputRef = useRef<HTMLInputElement | null>(null);
  const replaceImageInputRef = useRef<HTMLInputElement | null>(null);
  const coverImageInputRef = useRef<HTMLInputElement | null>(null);
  const pdfFileInputRef = useRef<HTMLInputElement | null>(null);

  // UI drawers & modals
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);
  const [isEditorMaximized, setIsEditorMaximized] = useState<boolean>(false);
  const [drawerWidth, setDrawerWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 380;
    try {
      const saved = localStorage.getItem('elfazni_blog_drawer_width');
      const num = saved ? parseInt(saved, 10) : 380;
      return isNaN(num) ? 380 : clampPanelSize(num, 260, 520);
    } catch {
      return 380;
    }
  });

  const handleDrawerResize = (delta: number) => {
    setDrawerWidth((prev) => {
      const next = clampPanelSize(prev - delta, 260, 520);
      try {
        localStorage.setItem('elfazni_blog_drawer_width', String(next));
      } catch {}
      return next;
    });
  };

  const handleResetDrawerWidth = () => {
    setDrawerWidth(380);
    try {
      localStorage.setItem('elfazni_blog_drawer_width', '380');
    } catch {}
  };
  const [sourceMode, setSourceMode] = useState<boolean>(false);
  const [sourceCodeText, setSourceCodeText] = useState<string>('');
  const [moreMenuOpen, setMoreMenuOpen] = useState<boolean>(false);
  const [insertMenuOpen, setInsertMenuOpen] = useState<boolean>(false);
  const [colorMenuOpen, setColorMenuOpen] = useState<'text' | 'highlight' | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [mediaModalMode, setMediaModalMode] = useState<
    null | 'insert_inline' | 'replace_inline' | 'cover' | 'gallery'
  >(null);
  const [gallerySelectedUrls, setGallerySelectedUrls] = useState<string[]>([]);
  const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false);
  const [linkForm, setLinkForm] = useState<{ url: string; text: string; newTab: boolean }>({
    url: 'https://',
    text: '',
    newTab: true,
  });
  const [tableModalOpen, setTableModalOpen] = useState<boolean>(false);
  const [tableSize, setTableSize] = useState<{ rows: number; cols: number }>({ rows: 3, cols: 3 });
  const [ctaModalOpen, setCtaModalOpen] = useState<boolean>(false);
  const [ctaForm, setCtaForm] = useState<{ title: string; buttonText: string; url: string }>({
    title: 'هل تحتاج مساعدة في تجهيز ملفك القنصلي؟',
    buttonText: 'تواصل مع الفزني للخدمات عبر واتساب',
    url: 'https://wa.me/905399202505',
  });
  const [videoModalOpen, setVideoModalOpen] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [internalLinkModalOpen, setInternalLinkModalOpen] = useState<boolean>(false);
  const [templateModalOpen, setTemplateModalOpen] = useState<boolean>(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState<boolean>(false);

  // Image upload progress & drag-drop states
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDraggingOverEditor, setIsDraggingOverEditor] = useState<boolean>(false);
  const dropTargetBlockRef = useRef<HTMLElement | null>(null);

  // Selected image figure inspector state
  const [selectedFigureEl, setSelectedFigureEl] = useState<HTMLElement | null>(null);
  const [selectedFigureAttrs, setSelectedFigureAttrs] = useState<{
    src: string;
    alt: string;
    caption: string;
    size: 'small' | 'medium' | 'wide' | 'full';
    align: 'start' | 'center' | 'end';
  } | null>(null);

  // Floating contextual selection toolbar state
  const [floatingToolbarPos, setFloatingToolbarPos] = useState<{ top: number; left: number } | null>(
    null
  );

  // Revisions & Translations loaded from backend
  const [revisions, setRevisions] = useState<BlogRevision[]>([]);
  const [translations, setTranslations] = useState<
    Array<{ id: string; slug: string; title: string; language: BlogLanguage; status: BlogStatus }>
  >([]);
  const [tagInput, setTagInput] = useState<string>('');

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Initialize editor DOM HTML on mount or when switching post ID
  useEffect(() => {
    const html = ensureHtmlContent(initialPost.content || '');
    setPost({
      title: '',
      slug: '',
      excerpt: '',
      language: initialPost.language || 'ar',
      category: initialPost.category || categories[0]?.slug || 'consular',
      tags: Array.isArray(initialPost.tags) ? initialPost.tags : [],
      coverImage: initialPost.coverImage || '/assets/slides/10-all-services.webp',
      coverImageAlt: initialPost.coverImageAlt || initialPost.title || '',
      status: initialPost.status || 'draft',
      author: initialPost.author || 'رشيد الفزني',
      readTime: initialPost.readTime || '4 دقائق',
      featured: Boolean(initialPost.featured),
      pdfUrl: initialPost.pdfUrl || '',
      seoTitle: initialPost.seoTitle || '',
      seoDescription: initialPost.seoDescription || '',
      canonicalUrl: initialPost.canonicalUrl || '',
      scheduledAt: initialPost.scheduledAt || '',
      timezone: initialPost.timezone || 'Europe/Istanbul',
      revision: initialPost.revision || 1,
      relatedPostIds: Array.isArray(initialPost.relatedPostIds) ? initialPost.relatedPostIds : [],
      ...initialPost,
      content: html,
    });
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
    }
    setSourceCodeText(html);
    setHistoryStack([html]);
    setHistoryIndex(0);
    setSaveState(initialPost.id ? 'saved' : 'unsaved');
    setSelectedFigureEl(null);
    setSelectedFigureAttrs(null);

    if (initialPost.id) {
      api
        .getAdminPost(initialPost.id)
        .then((res) => {
          setRevisions(res.revisions || []);
          setTranslations(res.translations || []);
        })
        .catch(() => {});
    } else {
      setRevisions([]);
      setTranslations([]);
    }
  }, [initialPost.id]);

  // Warn before browser tab close if unsaved changes exist
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveState === 'unsaved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveState]);

  // Save current selection range whenever user interacts inside the editor
  const saveCurrentSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    const range = sel.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }, []);

  const restoreSavedSelection = useCallback(() => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (!sel) return;
    if (savedRangeRef.current && editorRef.current.contains(savedRangeRef.current.commonAncestorContainer)) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }, []);

  // Push HTML snapshot to Undo/Redo stack and update state
  const syncEditorHtml = useCallback(
    (pushHistory: boolean = true) => {
      if (!editorRef.current) return;
      const html = editorRef.current.innerHTML;
      const metrics = computeContentMetrics(html, articleLang);
      setPost((prev) => ({
        ...prev,
        content: html,
        readTime: metrics.readTimeLabel,
      }));
      setSourceCodeText(html);
      setSaveState('unsaved');

      if (pushHistory) {
        setHistoryStack((prev) => {
          const sliced = prev.slice(0, historyIndex + 1);
          if (sliced[sliced.length - 1] === html) return prev;
          const next = [...sliced.slice(-35), html];
          setHistoryIndex(next.length - 1);
          return next;
        });
      }
    },
    [articleLang, historyIndex]
  );

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0 && editorRef.current) {
      const nextIdx = historyIndex - 1;
      const html = historyStack[nextIdx];
      editorRef.current.innerHTML = html;
      setHistoryIndex(nextIdx);
      setPost((prev) => ({ ...prev, content: html }));
      setSourceCodeText(html);
      setSaveState('unsaved');
      setSelectedFigureEl(null);
      setSelectedFigureAttrs(null);
    } else {
      document.execCommand('undo');
      syncEditorHtml(false);
    }
  }, [historyIndex, historyStack, syncEditorHtml]);

  const handleRedo = useCallback(() => {
    if (historyIndex < historyStack.length - 1 && editorRef.current) {
      const nextIdx = historyIndex + 1;
      const html = historyStack[nextIdx];
      editorRef.current.innerHTML = html;
      setHistoryIndex(nextIdx);
      setPost((prev) => ({ ...prev, content: html }));
      setSourceCodeText(html);
      setSaveState('unsaved');
    } else {
      document.execCommand('redo');
      syncEditorHtml(false);
    }
  }, [historyIndex, historyStack, syncEditorHtml]);

  // Execute standard rich-text command
  const execFormat = useCallback(
    (command: string, value?: string) => {
      restoreSavedSelection();
      document.execCommand(command, false, value);
      saveCurrentSelection();
      syncEditorHtml(true);
    },
    [restoreSavedSelection, saveCurrentSelection, syncEditorHtml]
  );

  // Insert arbitrary HTML snippet at the exact caret Range (or after selected figure)
  const insertHtmlAtCursor = useCallback(
    (htmlSnippet: string, targetBlockToInsertAfter?: HTMLElement | null) => {
      if (!editorRef.current) return;

      if (targetBlockToInsertAfter && editorRef.current.contains(targetBlockToInsertAfter)) {
        const temp = document.createElement('div');
        temp.innerHTML = htmlSnippet;
        let refNode: Node = targetBlockToInsertAfter;
        while (temp.firstChild) {
          const child = temp.firstChild;
          refNode.parentNode?.insertBefore(child, refNode.nextSibling);
          refNode = child;
        }
        syncEditorHtml(true);
        return;
      }

      restoreSavedSelection();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const temp = document.createElement('div');
        temp.innerHTML = htmlSnippet;
        const frag = document.createDocumentFragment();
        let lastNode: Node | null = null;
        while (temp.firstChild) {
          lastNode = frag.appendChild(temp.firstChild);
        }
        range.insertNode(frag);
        if (lastNode) {
          const newRange = document.createRange();
          newRange.setStartAfter(lastNode);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          savedRangeRef.current = newRange.cloneRange();
        }
      } else {
        editorRef.current.insertAdjacentHTML('beforeend', htmlSnippet);
      }

      syncEditorHtml(true);
    },
    [restoreSavedSelection, syncEditorHtml]
  );

  // Upload a local image file and insert it at the exact cursor or drop target
  const handleUploadAndInsertImage = useCallback(
    async (file: File, dropBlock?: HTMLElement | null) => {
      if (!file) return;
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowed.includes(file.type)) {
        showToast('نوع الصورة غير مدعوم. يرجى اختيار PNG أو JPG أو WebP أو GIF.', 'error');
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        showToast('حجم الصورة يتجاوز الحد الأقصى المسموح (12MB).', 'error');
        return;
      }

      setUploadProgress(5);
      try {
        const defaultAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
        const res = await api.uploadMediaWithProgress(file, defaultAlt, '', (pct) => {
          setUploadProgress(pct);
        });
        onMediaUploaded(res.asset);
        const figureHtml = buildImageFigureHtml({
          url: res.asset.url,
          altText: res.asset.altText || defaultAlt,
          caption: '',
          size: 'full',
          align: 'center',
          mediaId: res.asset.id,
        });
        insertHtmlAtCursor(figureHtml, dropBlock);
        showToast('تم رفع الصورة وإدراجها في موضع المؤشر بنجاح');
      } catch (err: any) {
        showToast(err.message || 'فشل رفع الصورة', 'error');
      } finally {
        setUploadProgress(null);
      }
    },
    [insertHtmlAtCursor, onMediaUploaded, showToast]
  );

  // Replace currently selected image figure
  const handleReplaceSelectedImageWithUrl = useCallback(
    (url: string, altText?: string, mediaId?: string) => {
      if (!selectedFigureEl) return;
      const img = selectedFigureEl.querySelector('img');
      if (img) {
        img.setAttribute('src', url);
        if (altText !== undefined) img.setAttribute('alt', altText);
      }
      if (mediaId) {
        selectedFigureEl.setAttribute('data-media-id', mediaId);
      }
      setSelectedFigureAttrs((prev) =>
        prev ? { ...prev, src: url, alt: altText ?? prev.alt } : null
      );
      syncEditorHtml(true);
      showToast('تم استبدال الصورة مع الحفاظ على موضعها وتنسيقها');
    },
    [selectedFigureEl, showToast, syncEditorHtml]
  );

  // Click handler inside editor canvas to detect clicked `<figure>` or `<img>`
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      saveCurrentSelection();
      const target = e.target as HTMLElement;
      const figure = target.closest('figure.elfazni-editor-image') as HTMLElement | null;

      // Clear previous selection highlight
      editorRef.current?.querySelectorAll('figure.is-selected-image').forEach((el) => {
        if (el !== figure) el.classList.remove('is-selected-image');
      });

      if (figure) {
        figure.classList.add('is-selected-image');
        const img = figure.querySelector('img');
        const cap = figure.querySelector('figcaption');
        setSelectedFigureEl(figure);
        setSelectedFigureAttrs({
          src: img?.getAttribute('src') || '',
          alt: img?.getAttribute('alt') || '',
          caption: cap?.textContent || '',
          size: (figure.getAttribute('data-size') as any) || 'full',
          align: (figure.getAttribute('data-align') as any) || 'center',
        });
      } else {
        setSelectedFigureEl(null);
        setSelectedFigureAttrs(null);
      }
    },
    [saveCurrentSelection]
  );

  // Update floating selection toolbar position when non-empty text is selected
  const handleSelectionChange = useCallback(() => {
    saveCurrentSelection();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !editorRef.current) {
      setFloatingToolbarPos(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      setFloatingToolbarPos(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    if (rect.width > 8) {
      setFloatingToolbarPos({
        top: Math.max(70, rect.top - 48),
        left: Math.min(window.innerWidth - 280, Math.max(20, rect.left + rect.width / 2 - 130)),
      });
    } else {
      setFloatingToolbarPos(null);
    }
  }, [saveCurrentSelection]);

  // Update selected image attributes (size, align, alt, caption)
  const updateSelectedFigure = useCallback(
    (updates: Partial<NonNullable<typeof selectedFigureAttrs>>) => {
      if (!selectedFigureEl || !selectedFigureAttrs) return;
      const next = { ...selectedFigureAttrs, ...updates };
      if (updates.size) selectedFigureEl.setAttribute('data-size', updates.size);
      if (updates.align) selectedFigureEl.setAttribute('data-align', updates.align);
      if (updates.alt !== undefined) {
        const img = selectedFigureEl.querySelector('img');
        if (img) img.setAttribute('alt', updates.alt);
      }
      if (updates.caption !== undefined) {
        let cap = selectedFigureEl.querySelector('figcaption');
        if (!cap) {
          cap = document.createElement('figcaption');
          selectedFigureEl.appendChild(cap);
        }
        cap.textContent = updates.caption;
      }
      setSelectedFigureAttrs(next);
      syncEditorHtml(true);
    },
    [selectedFigureAttrs, selectedFigureEl, syncEditorHtml]
  );

  // Move any top-level block (or selected image figure) Up or Down
  const moveBlockElement = useCallback(
    (direction: 'up' | 'down', explicitEl?: HTMLElement | null) => {
      if (!editorRef.current) return;
      let block = explicitEl || selectedFigureEl;
      if (!block) {
        const sel = window.getSelection();
        if (sel && sel.anchorNode && editorRef.current.contains(sel.anchorNode)) {
          let node: Node | null = sel.anchorNode;
          while (node && node.parentNode !== editorRef.current) {
            node = node.parentNode;
          }
          if (node instanceof HTMLElement) block = node;
        }
      }
      if (!block || block.parentNode !== editorRef.current) return;

      if (direction === 'up' && block.previousElementSibling) {
        editorRef.current.insertBefore(block, block.previousElementSibling);
        block.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        syncEditorHtml(true);
      } else if (direction === 'down' && block.nextElementSibling) {
        editorRef.current.insertBefore(block.nextElementSibling, block);
        block.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        syncEditorHtml(true);
      }
    },
    [selectedFigureEl, syncEditorHtml]
  );

  // Delete selected image figure with Undo support
  const deleteSelectedFigure = useCallback(() => {
    if (!selectedFigureEl) return;
    selectedFigureEl.remove();
    setSelectedFigureEl(null);
    setSelectedFigureAttrs(null);
    syncEditorHtml(true);
    showToast('تم حذف الصورة (يمكنك التراجع عبر زر تراجع Undo)');
  }, [selectedFigureEl, showToast, syncEditorHtml]);

  // Drag & Drop handlers on the editor canvas
  const handleCanvasDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDraggingOverEditor(true);

    const target = (e.target as HTMLElement)?.closest(
      'p, h1, h2, h3, h4, figure, div.elfazni-callout, ul, ol, table, blockquote'
    ) as HTMLElement | null;

    if (dropTargetBlockRef.current && dropTargetBlockRef.current !== target) {
      dropTargetBlockRef.current.classList.remove('elfazni-drop-target-active');
    }
    if (target && editorRef.current?.contains(target)) {
      target.classList.add('elfazni-drop-target-active');
      dropTargetBlockRef.current = target;
    }
  }, []);

  const handleCanvasDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!editorRef.current?.contains(e.relatedTarget as Node)) {
      setIsDraggingOverEditor(false);
      if (dropTargetBlockRef.current) {
        dropTargetBlockRef.current.classList.remove('elfazni-drop-target-active');
        dropTargetBlockRef.current = null;
      }
    }
  }, []);

  const handleCanvasDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      setIsDraggingOverEditor(false);
      const dropBlock = dropTargetBlockRef.current;
      if (dropBlock) {
        dropBlock.classList.remove('elfazni-drop-target-active');
        dropTargetBlockRef.current = null;
      }

      const files = Array.from(e.dataTransfer.files || []);
      const imageFile = files.find((f) => f.type.startsWith('image/'));
      if (imageFile) {
        e.preventDefault();
        // Also try setting caret from drop coordinates if supported
        if (!dropBlock && document.caretRangeFromPoint) {
          const r = document.caretRangeFromPoint(e.clientX, e.clientY);
          if (r && editorRef.current?.contains(r.commonAncestorContainer)) {
            savedRangeRef.current = r;
          }
        }
        await handleUploadAndInsertImage(imageFile, dropBlock);
      }
    },
    [handleUploadAndInsertImage]
  );

  // Paste handler: supports clipboard image upload + clean Word/Google Docs HTML paste
  const handleCanvasPaste = useCallback(
    async (e: React.ClipboardEvent<HTMLDivElement>) => {
      const files = Array.from(e.clipboardData.files || []);
      const imageFile = files.find((f) => f.type.startsWith('image/'));
      if (imageFile) {
        e.preventDefault();
        await handleUploadAndInsertImage(imageFile);
        return;
      }

      const htmlData = e.clipboardData.getData('text/html');
      if (htmlData && /<(p|h[1-6]|ul|ol|li|table|tr|td|strong|b|em|i|a)\b/i.test(htmlData)) {
        e.preventDefault();
        const cleaned = cleanPastedHtml(htmlData);
        insertHtmlAtCursor(cleaned);
      }
    },
    [handleUploadAndInsertImage, insertHtmlAtCursor]
  );

  // Core save function (manual or autosave)
  const performSave = useCallback(
    async (
      targetStatus?: BlogStatus,
      options?: { isAutosave?: boolean; forceOverwrite?: boolean; summary?: string }
    ) => {
      const currentHtml = sourceMode
        ? sanitizeEditorHtmlClient(sourceCodeText)
        : editorRef.current?.innerHTML || post.content || '';

      const title = (post.title || '').trim();
      if (!title) {
        if (!options?.isAutosave) {
          showToast('يرجى كتابة عنوان المقال قبل الحفظ', 'error');
        }
        return null;
      }

      const statusToSave: BlogStatus = targetStatus || (post.status as BlogStatus) || 'draft';
      const metrics = computeContentMetrics(currentHtml, articleLang);

      setSaveState('saving');
      setSaveErrorMsg(null);

      try {
        const payload: Partial<BlogPost> & { expectedRevision?: number; revisionSummary?: string } = {
          ...post,
          title,
          content: currentHtml,
          status: statusToSave,
          language: articleLang,
          readTime: metrics.readTimeLabel,
          revisionSummary:
            options?.summary ||
            (options?.isAutosave
              ? 'حفظ تلقائي للمسودة'
              : statusToSave === 'published'
              ? 'نشر / تحديث المقال'
              : 'حفظ مسودة'),
        };

        if (post.id && !options?.forceOverwrite && post.revision) {
          payload.expectedRevision = post.revision;
        }

        let saved: BlogPost;
        const isNew = !post.id;
        if (post.id) {
          const res = await api.updatePost(post.id, payload);
          saved = res.post;
        } else {
          const res = await api.createPost(payload);
          saved = res.post;
        }

        setPost(saved);
        setSaveState('saved');
        onSaved(saved, isNew);

        if (saved.id) {
          api
            .getPostRevisions(saved.id)
            .then((r) => setRevisions(r.revisions || []))
            .catch(() => {});
        }

        if (!options?.isAutosave) {
          const msg =
            statusToSave === 'published'
              ? 'تم نشر المقال وتحديثه على المدونة العامة بنجاح'
              : statusToSave === 'scheduled'
              ? 'تمت جدولة نشر المقال بنجاح'
              : 'تم حفظ المسودة بنجاح';
          showToast(msg, 'success');
        }
        return saved;
      } catch (err: any) {
        setSaveState('error');
        setSaveErrorMsg(err.message || 'فشل الحفظ');
        if (err.status === 409) {
          setConflictModal({ serverVersion: err.data?.serverPost });
        } else if (!options?.isAutosave) {
          showToast(err.message || 'حدث خطأ أثناء حفظ المقال', 'error');
        }
        return null;
      }
    },
    [articleLang, onSaved, post, showToast, sourceCodeText, sourceMode]
  );

  // Debounced Autosave for existing drafts or non-empty titled drafts after 4s idle
  useEffect(() => {
    if (saveState !== 'unsaved') return;
    if (!post.title || post.title.trim().length < 3) return;
    // Only autosave automatically when in draft/in_review or already saved post
    const timer = setTimeout(() => {
      void performSave(undefined, { isAutosave: true });
    }, 4500);
    return () => clearTimeout(timer);
  }, [post.title, post.content, post.excerpt, post.tags, saveState, performSave]);

  // Keyboard shortcuts (Ctrl/Cmd+S, Ctrl/Cmd+B, Ctrl/Cmd+I, Ctrl/Cmd+U, Ctrl/Cmd+K)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void performSave();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (document.activeElement === editorRef.current) {
          e.preventDefault();
          saveCurrentSelection();
          const selText = window.getSelection()?.toString() || '';
          setLinkForm({ url: 'https://', text: selText, newTab: true });
          setLinkModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [performSave, saveCurrentSelection]);

  // Tokenized Tag addition & removal
  const addTagToken = (rawTag: string) => {
    const clean = rawTag.replace(/,/g, '').trim();
    if (!clean) return;
    const current = Array.isArray(post.tags) ? post.tags : [];
    if (!current.includes(clean)) {
      setPost({ ...post, tags: [...current, clean] });
      setSaveState('unsaved');
    }
    setTagInput('');
  };

  const removeTagToken = (tagToRemove: string) => {
    const current = Array.isArray(post.tags) ? post.tags : [];
    setPost({ ...post, tags: current.filter((t) => t !== tagToRemove) });
    setSaveState('unsaved');
  };

  // Block insertions (Callout, Table, CTA, Video, Internal Link, PDF Banner, Checklist)
  const handleInsertCallout = (variant: 'info' | 'warning' | 'tip') => {
    const icon = variant === 'warning' ? '⚠️' : variant === 'tip' ? '✅' : '💡';
    const title =
      variant === 'warning'
        ? 'تنبيه قنصلي هام:'
        : variant === 'tip'
        ? 'خطوة أساسية:'
        : 'نصيحة إرشادية من الفزني للخدمات:';
    const html =
      `<div class="elfazni-callout" data-block-type="callout" data-variant="${variant}">` +
      `<p><strong>${icon} ${title}</strong> اكتب تفاصيل التنبيه أو المعلومة المهمة هنا...</p>` +
      `</div><p><br></p>`;
    insertHtmlAtCursor(html);
    setInsertMenuOpen(false);
  };

  const handleInsertChecklist = () => {
    const html =
      `<ul class="elfazni-checklist" data-block-type="checklist">` +
      `<li>☑️ الوثيقة الأولى المطلوبة (أصلية + نسخة)</li>` +
      `<li>☑️ الوثيقة الثانية المطلوبة</li>` +
      `</ul><p><br></p>`;
    insertHtmlAtCursor(html);
  };

  const handleInsertTable = (e: React.FormEvent) => {
    e.preventDefault();
    const rows = Math.min(15, Math.max(1, tableSize.rows));
    const cols = Math.min(8, Math.max(1, tableSize.cols));
    let ths = '';
    for (let c = 1; c <= cols; c++) {
      ths += `<th>العمود ${c}</th>`;
    }
    let trs = '';
    for (let r = 1; r <= rows; r++) {
      let tds = '';
      for (let c = 1; c <= cols; c++) {
        tds += `<td>بيانات ${r}-${c}</td>`;
      }
      trs += `<tr>${tds}</tr>`;
    }
    const html = `<table class="elfazni-table" data-block-type="table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table><p><br></p>`;
    insertHtmlAtCursor(html);
    setTableModalOpen(false);
  };

  const handleInsertCta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctaForm.url.trim()) return;
    const html =
      `<div class="elfazni-cta-block" data-block-type="cta">` +
      `<div><strong style="font-size:1.05rem;display:block;margin-bottom:4px;">${ctaForm.title}</strong>` +
      `<span style="font-size:0.85rem;opacity:0.9;">ELFAZNI SERVICES — الفزني للخدمات</span></div>` +
      `<a href="${ctaForm.url}" target="_blank" rel="noopener noreferrer" class="elfazni-cta-btn">${ctaForm.buttonText}</a>` +
      `</div><p><br></p>`;
    insertHtmlAtCursor(html);
    setCtaModalOpen(false);
  };

  const handleInsertVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = videoUrl.trim();
    let embedUrl = '';
    const ytMatch = raw.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
    );
    const vimeoMatch = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (ytMatch) {
      embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    } else if (vimeoMatch) {
      embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    } else {
      showToast('يرجى إدخال رابط صحيح من YouTube أو Vimeo فقط', 'error');
      return;
    }
    const html =
      `<div data-block-type="video" class="my-6">` +
      `<iframe src="${embedUrl}" title="Embedded Video" loading="lazy" allowfullscreen class="w-full aspect-video rounded-2xl border border-slate-200"></iframe>` +
      `</div><p><br></p>`;
    insertHtmlAtCursor(html);
    setVideoUrl('');
    setVideoModalOpen(false);
  };

  const handleInsertInternalPostCard = (targetPost: BlogPost) => {
    const html =
      `<div class="elfazni-callout" data-block-type="internal-link" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">` +
      `<div><span style="font-size:11px;font-weight:800;color:#CC9048;display:block;">📖 اقرأ أيضاً في مدونة الفزني للخدمات:</span>` +
      `<a href="/blog/${targetPost.slug}" style="font-size:1rem;font-weight:800;color:#0B2E57;">${targetPost.title}</a></div>` +
      `<a href="/blog/${targetPost.slug}" style="padding:6px 14px;border-radius:8px;background:#004AA5;color:#fff;text-decoration:none;font-size:12px;font-weight:700;">قراءة المقال ←</a>` +
      `</div><p><br></p>`;
    insertHtmlAtCursor(html);
    setInternalLinkModalOpen(false);
  };

  const handleApplyTemplate = (tpl: BlogTemplate) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = tpl.contentHtml;
    }
    setPost((prev) => ({
      ...prev,
      title: prev.title || tpl.titleTemplate,
      excerpt: prev.excerpt || tpl.excerptTemplate,
      category: tpl.category || prev.category,
      language: tpl.language || prev.language,
      tags: Array.from(new Set([...(prev.tags || []), ...(tpl.tags || [])])),
      content: tpl.contentHtml,
    }));
    setSourceCodeText(tpl.contentHtml);
    setSaveState('unsaved');
    setTemplateModalOpen(false);
    showToast(`تم تطبيق قالب "${tpl.name}" بنجاح`);
  };

  const handleCreateTranslation = async (targetLang: BlogLanguage) => {
    if (!post.id) {
      showToast('يرجى حفظ المقال أولاً قبل إنشاء نسخة مترجمة له', 'error');
      return;
    }
    try {
      const res = await api.duplicatePost(post.id, { language: targetLang, asTranslation: true });
      showToast(
        `تم إنشاء مسودة الترجمة (${targetLang.toUpperCase()}) بنجاح — يمكنك الآن ترجمتها ومراجعتها قبل النشر.`
      );
      onSaved(res.post, true);
      onOpenPostById(res.post.id);
    } catch (err: any) {
      showToast(err.message || 'تعذر إنشاء نسخة الترجمة', 'error');
    }
  };

  const handleRestoreRevision = async (rev: BlogRevision) => {
    if (!post.id) return;
    try {
      const res = await api.restorePostRevision(post.id, rev.id);
      const html = ensureHtmlContent(res.post.content);
      if (editorRef.current) {
        editorRef.current.innerHTML = html;
      }
      setPost(res.post);
      setSourceCodeText(html);
      setSaveState('saved');
      showToast(`تمت استعادة النسخة رقم #${rev.revision} بنجاح`);
    } catch (err: any) {
      showToast(err.message || 'فشل استعادة النسخة', 'error');
    }
  };

  const metrics = computeContentMetrics(
    sourceMode ? sourceCodeText : post.content || '',
    articleLang
  );

  return (
    <div
      className={
        isEditorMaximized
          ? 'fixed inset-0 z-50 bg-[#F4F7FB] flex flex-col overflow-hidden'
          : 'flex flex-col bg-[#F4F7FB] rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden min-h-[85vh]'
      }
      dir={isUiRtl ? 'rtl' : 'ltr'}
    >
      {/* Hidden File Inputs for Direct Device Uploads */}
      <input
        ref={inlineImageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUploadAndInsertImage(file);
          e.target.value = '';
        }}
      />
      <input
        ref={replaceImageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setUploadProgress(10);
          try {
            const res = await api.uploadMediaWithProgress(file, file.name, '', (p) =>
              setUploadProgress(p)
            );
            onMediaUploaded(res.asset);
            handleReplaceSelectedImageWithUrl(res.asset.url, res.asset.altText, res.asset.id);
          } catch (err: any) {
            showToast(err.message || 'فشل رفع الصورة البديلة', 'error');
          } finally {
            setUploadProgress(null);
          }
        }}
      />
      <input
        ref={coverImageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setUploadProgress(10);
          try {
            const res = await api.uploadMediaWithProgress(file, post.title || file.name, '', (p) =>
              setUploadProgress(p)
            );
            onMediaUploaded(res.asset);
            setPost((prev) => ({
              ...prev,
              coverImage: res.asset.url,
              coverImageAlt: prev.coverImageAlt || res.asset.altText,
            }));
            setSaveState('unsaved');
            showToast('تم رفع وتعيين الصورة البارزة للمقال');
          } catch (err: any) {
            showToast(err.message || 'فشل رفع الصورة البارزة', 'error');
          } finally {
            setUploadProgress(null);
          }
        }}
      />
      <input
        ref={pdfFileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setUploadProgress(10);
          try {
            const res = await api.uploadMediaWithProgress(file, file.name, '', (p) =>
              setUploadProgress(p)
            );
            onMediaUploaded(res.asset);
            setPost((prev) => ({ ...prev, pdfUrl: res.asset.url }));
            setSaveState('unsaved');
            const bannerHtml =
              `<div class="elfazni-cta-block" data-block-type="pdf-banner">` +
              `<div><strong style="display:block;font-size:1rem;">📄 دليل PDF قابل للتحميل: ${file.name}</strong>` +
              `<span style="font-size:0.82rem;opacity:0.9;">نسخة رسمية جاهزة للطباعة من الفزني للخدمات</span></div>` +
              `<a href="${res.asset.url}" target="_blank" rel="noopener noreferrer" download class="elfazni-cta-btn">تحميل ملف PDF ⬇</a>` +
              `</div><p><br></p>`;
            insertHtmlAtCursor(bannerHtml);
            showToast('تم رفع ملف PDF وإدراج بطاقة التحميل');
          } catch (err: any) {
            showToast(err.message || 'فشل رفع ملف PDF', 'error');
          } finally {
            setUploadProgress(null);
          }
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-bold text-white transition-all ${
            toast.type === 'success' ? 'bg-[#0B2E57] border border-[#E3C88F]' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 text-[#E3C88F]" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* 1. TOP ACTION STRIP                                                 */}
      {/* =================================================================== */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (
                saveState === 'unsaved' &&
                !window.confirm('لديك تعديلات غير محفوظة. هل تريد المغادرة دون حفظ؟')
              ) {
                return;
              }
              onBack();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B2E57] text-xs font-bold transition-colors cursor-pointer"
          >
            {isUiRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{strings.backToPosts}</span>
          </button>

          {/* Save Status Indicator */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
              saveState === 'saving'
                ? 'bg-blue-50 text-[#004AA5] border-blue-200'
                : saveState === 'saved'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : saveState === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {saveState === 'saving' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {saveState === 'saved' && <Check className="w-3.5 h-3.5" />}
            {saveState === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
            <span>
              {saveState === 'saving'
                ? strings.saving
                : saveState === 'saved'
                ? strings.saved
                : saveState === 'error'
                ? saveErrorMsg || strings.saveFailed
                : strings.unsavedChanges}
            </span>
          </div>

          {/* Word Count & Reading Time */}
          <div className="hidden xl:flex items-center gap-3 text-xs text-slate-500 font-semibold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span>
              <strong className="text-[#0B2E57]">{metrics.wordCount}</strong> {strings.words}
            </span>
            <span>•</span>
            <span>
              <strong className="text-[#0B2E57]">{metrics.charCount}</strong> {strings.chars}
            </span>
            <span>•</span>
            <span>
              ⏱ <strong className="text-[#004AA5]">{metrics.readTimeLabel}</strong>
            </span>
          </div>
        </div>

        {/* Right Side Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Editor UI Language Switcher (AR / EN / FR) */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-[11px] font-bold">
            {(['ar', 'en', 'fr'] as BlogLanguage[]).map((lng) => (
              <button
                key={lng}
                type="button"
                onClick={() => onChangeUiLang(lng)}
                className={`px-2 py-1 rounded-lg uppercase transition-colors cursor-pointer ${
                  uiLang === lng ? 'bg-[#0B2E57] text-white' : 'text-slate-600 hover:text-[#0B2E57]'
                }`}
                title="تغيير لغة واجهة المحرر"
              >
                {lng}
              </button>
            ))}
          </div>

          {/* Preview Button */}
          <button
            type="button"
            onClick={() => setPreviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B2E57] text-xs font-bold transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#004AA5]" />
            <span>{strings.preview}</span>
          </button>

          {/* Save Draft Button */}
          <button
            type="button"
            disabled={saveState === 'saving'}
            onClick={() => void performSave('draft')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0B2E57] border border-slate-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#004AA5]" />
            <span>{strings.saveDraft}</span>
          </button>

          {/* Schedule Button */}
          <button
            type="button"
            onClick={() => setScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFF9ED] hover:bg-[#F9ECD2] text-[#CC9048] border border-[#E3C88F] text-xs font-bold transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>{strings.schedule}</span>
          </button>

          {/* Publish / Update Primary Button */}
          <button
            type="button"
            disabled={saveState === 'saving'}
            onClick={() => void performSave('published')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004AA5] hover:bg-[#0B2E57] text-white text-xs sm:text-sm font-black shadow-md shadow-[#004AA5]/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{post.status === 'published' && post.id ? strings.update : strings.publish}</span>
          </button>

          {/* More Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreMenuOpen((v) => !v)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              title={strings.moreActions}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {moreMenuOpen && (
              <div className="absolute end-0 mt-2 w-56 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-40 text-xs font-bold text-slate-700">
                {post.id && (
                  <button
                    type="button"
                    onClick={async () => {
                      setMoreMenuOpen(false);
                      try {
                        const res = await api.duplicatePost(post.id!);
                        showToast('تم تكرار المقال كمسودة جديدة');
                        onSaved(res.post, true);
                        onOpenPostById(res.post.id);
                      } catch (err: any) {
                        showToast(err.message || 'فشل تكرار المقال', 'error');
                      }
                    }}
                    className="w-full px-4 py-2.5 text-start hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <Copy className="w-4 h-4 text-[#004AA5]" />
                    <span>{strings.duplicate}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    setTemplateModalOpen(true);
                  }}
                  className="w-full px-4 py-2.5 text-start hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <Sparkles className="w-4 h-4 text-[#CC9048]" />
                  <span>{strings.insertTemplate}</span>
                </button>
                {post.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      void performSave('archived');
                    }}
                    className="w-full px-4 py-2.5 text-start hover:bg-slate-50 flex items-center gap-2.5 text-amber-700"
                  >
                    <Archive className="w-4 h-4" />
                    <span>{strings.archive}</span>
                  </button>
                )}
                {post.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      void performSave('trash');
                    }}
                    className="w-full px-4 py-2.5 text-start hover:bg-red-50 flex items-center gap-2.5 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{strings.moveToTrash}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Maximize / Restore Editor Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsEditorMaximized((v) => !v)}
            className={`p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
              isEditorMaximized
                ? 'bg-[#004AA5] text-white border-[#004AA5]'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title={isEditorMaximized ? 'استعادة حجم المحرر' : 'تكبير المحرر بكامل الشاشة (Focus Mode)'}
          >
            {isEditorMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Toggle Settings Drawer */}
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            className={`p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
              drawerOpen
                ? 'bg-[#EAF4FF] text-[#004AA5] border-[#B9D8F7]'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title="إظهار / إخفاء لوحة إعدادات المقال والـ SEO"
          >
            {drawerOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Upload Progress Banner */}
      {uploadProgress !== null && (
        <div className="bg-[#EAF4FF] border-b border-[#B9D8F7] px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#004AA5]">
            <Upload className="w-4 h-4 animate-bounce" />
            <span>{strings.uploadingImage}</span>
          </div>
          <div className="w-48 h-2 bg-white rounded-full overflow-hidden border border-[#B9D8F7]">
            <div
              className="h-full bg-[#004AA5] transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. STICKY WORD-LIKE RICH TEXT TOOLBAR                               */}
      {/* =================================================================== */}
      <div className="bg-[#F8FAFC] border-b border-slate-200 px-3 py-2 flex flex-wrap items-center gap-1.5 sticky top-[57px] z-20 shadow-xs">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pe-2 border-e border-slate-200">
          <button
            type="button"
            onClick={handleUndo}
            title="تراجع (Ctrl+Z)"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            title="إعادة (Ctrl+Y)"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Heading / Block Format Selector */}
        <div className="flex items-center gap-1.5 pe-2 border-e border-slate-200">
          <select
            aria-label="تنسيق الفقرة أو العنوان"
            onChange={(e) => {
              const val = e.target.value;
              if (val) execFormat('formatBlock', val);
              e.target.value = '';
            }}
            defaultValue=""
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-[#0B2E57] focus:outline-none focus:border-[#004AA5]"
          >
            <option value="" disabled>
              نوع النص / العنوان
            </option>
            <option value="P">فقرة عادية (Paragraph)</option>
            <option value="H1">عنوان رئيسي أول (H1)</option>
            <option value="H2">عنوان قسم رئيسي (H2)</option>
            <option value="H3">عنوان فرعي (H3)</option>
            <option value="H4">عنوان فرعي صغير (H4)</option>
            <option value="BLOCKQUOTE">اقتباس رسمي (Quote)</option>
            <option value="PRE">مقطع كود (Code)</option>
          </select>

          {/* Font Family Selector */}
          <select
            aria-label="نوع الخط"
            onChange={(e) => {
              if (e.target.value) execFormat('fontName', e.target.value);
              e.target.value = '';
            }}
            defaultValue=""
            className="hidden md:block px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 max-w-[155px]"
          >
            <option value="" disabled>
              الخط (Font)
            </option>
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Font Size Selector */}
          <select
            aria-label="حجم الخط"
            onChange={(e) => {
              if (e.target.value) execFormat('fontSize', e.target.value);
              e.target.value = '';
            }}
            defaultValue=""
            className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700"
          >
            <option value="" disabled>
              الحجم
            </option>
            {FONT_SIZES.map((s) => (
              <option key={s.commandVal} value={s.commandVal}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Inline Styles: Bold, Italic, Underline, Strike, Super, Sub, Clear */}
        <div className="flex items-center gap-0.5 pe-2 border-e border-slate-200">
          <button
            type="button"
            onClick={() => execFormat('bold')}
            title="عريض Bold (Ctrl+B)"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-800 cursor-pointer"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('italic')}
            title="مائل Italic (Ctrl+I)"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-800 cursor-pointer"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('underline')}
            title="تسطير Underline (Ctrl+U)"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-800 cursor-pointer"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('strikeThrough')}
            title="يتوسطه خط Strikethrough"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-800 cursor-pointer"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          {/* Text Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setColorMenuOpen((v) => (v === 'text' ? null : 'text'))}
              title="لون النص"
              className="p-1.5 rounded-lg hover:bg-slate-200/80 text-[#004AA5] cursor-pointer"
            >
              <Palette className="w-4 h-4" />
            </button>
            {colorMenuOpen === 'text' && (
              <div className="absolute start-0 mt-1 p-2 bg-white rounded-xl shadow-xl border border-slate-200 z-40 flex items-center gap-1.5">
                {BRAND_TEXT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => {
                      execFormat('foreColor', c.value);
                      setColorMenuOpen(null);
                    }}
                    className="w-6 h-6 rounded-full border border-slate-300 cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Highlight Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setColorMenuOpen((v) => (v === 'highlight' ? null : 'highlight'))}
              title="تظليل خلفية النص"
              className="p-1.5 rounded-lg hover:bg-slate-200/80 text-[#CC9048] cursor-pointer"
            >
              <Highlighter className="w-4 h-4" />
            </button>
            {colorMenuOpen === 'highlight' && (
              <div className="absolute start-0 mt-1 p-2 bg-white rounded-xl shadow-xl border border-slate-200 z-40 flex items-center gap-1.5">
                {BRAND_HIGHLIGHTS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => {
                      execFormat('hiliteColor', c.value);
                      setColorMenuOpen(null);
                    }}
                    className="w-6 h-6 rounded-full border border-slate-300 cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.value === 'transparent' ? '#fff' : c.value }}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => execFormat('removeFormat')}
            title="مسح التنسيق Clear Formatting"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-600 cursor-pointer"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment & Direction */}
        <div className="flex items-center gap-0.5 pe-2 border-e border-slate-200">
          <button
            type="button"
            onClick={() => execFormat('justifyRight')}
            title="محاذاة لليمين"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('justifyCenter')}
            title="توسيط"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('justifyLeft')}
            title="محاذاة لليسار"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('justifyFull')}
            title="ضبط كلي Justify"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('indent')}
            title="زيادة المسافة البادئة"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <IndentIncrease className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('outdent')}
            title="إنقاص المسافة البادئة"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <IndentDecrease className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Quote */}
        <div className="flex items-center gap-0.5 pe-2 border-e border-slate-200">
          <button
            type="button"
            onClick={() => execFormat('insertUnorderedList')}
            title="قائمة نقطية"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('insertOrderedList')}
            title="قائمة مرقمة"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleInsertChecklist}
            title="قائمة مهام / وثائق مطلوبة"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('formatBlock', 'BLOCKQUOTE')}
            title="اقتباس"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        {/* HIGHEST PRIORITY: IMAGE INSERTION & RICH BLOCKS */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 1. Direct Upload Image at Cursor */}
          <button
            type="button"
            onMouseDown={() => saveCurrentSelection()}
            onClick={() => inlineImageInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#004AA5] hover:bg-[#0B2E57] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
            title="رفع صورة من جهازك وإدراجها مباشرة في مكان المؤشر"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{strings.insertImage}</span>
          </button>

          {/* 2. Pick Image from Media Library */}
          <button
            type="button"
            onMouseDown={() => saveCurrentSelection()}
            onClick={() => setMediaModalMode('insert_inline')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#0B2E57] border border-slate-300 text-xs font-bold cursor-pointer"
            title="اختيار صورة من مكتبة الوسائط وإدراجها في مكان المؤشر"
          >
            <Upload className="w-3.5 h-3.5 text-[#004AA5]" />
            <span className="hidden sm:inline">{strings.chooseFromLibrary}</span>
          </button>

          {/* Hyperlink */}
          <button
            type="button"
            onMouseDown={() => saveCurrentSelection()}
            onClick={() => {
              const selText = window.getSelection()?.toString() || '';
              setLinkForm({ url: 'https://', text: selText, newTab: true });
              setLinkModalOpen(true);
            }}
            title="إدراج رابط (Ctrl+K)"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          {/* Table */}
          <button
            type="button"
            onMouseDown={() => saveCurrentSelection()}
            onClick={() => setTableModalOpen(true)}
            title={strings.insertTable}
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <TableIcon className="w-4 h-4" />
          </button>

          {/* + Insert Rich Block Dropdown */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={() => saveCurrentSelection()}
              onClick={() => setInsertMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFF9ED] hover:bg-[#F9ECD2] text-[#CC9048] border border-[#E3C88F] text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إدراج عنصر</span>
            </button>
            {insertMenuOpen && (
              <div className="absolute start-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-40 text-xs font-bold text-slate-700">
                <button
                  type="button"
                  onClick={() => handleInsertCallout('info')}
                  className="w-full px-4 py-2 text-start hover:bg-slate-50 flex items-center gap-2"
                >
                  <span>💡</span>
                  <span>صندوق نصيحة إرشادية (Info Box)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertCallout('warning')}
                  className="w-full px-4 py-2 text-start hover:bg-slate-50 flex items-center gap-2"
                >
                  <span>⚠️</span>
                  <span>صندوق تنبيه هام (Warning Box)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertCallout('tip')}
                  className="w-full px-4 py-2 text-start hover:bg-slate-50 flex items-center gap-2"
                >
                  <span>✅</span>
                  <span>صندوق خطوة رسمية (Step Box)</span>
                </button>
                <hr className="my-1 border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    setInsertMenuOpen(false);
                    setGallerySelectedUrls([]);
                    setMediaModalMode('gallery');
                  }}
                  className="w-full px-4 py-2 text-start hover:bg-slate-50 flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4 text-[#004AA5]" />
                  <span>{strings.insertGallery}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInsertMenuOpen(false);
                    setCtaModalOpen(true);
                  }}
                  className="w-full px-4 py-2 text-start hover:bg-slate-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#CC9048]" />
                  <span>{strings.insertCta}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInsertMenuOpen(false);
                    setInternalLinkModalOpen(true);
                  }}
                  className="w-full px-4 py-2 text-start hover:bg-slate-50 flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-[#004AA5]" />
                  <span>{strings.insertInternalLink}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInsertMenuOpen(false);
                    setVideoModalOpen(true);
                  }}
                  className="w-full px-4 py-2 text-start hover:bg-slate-50 flex items-center gap-2"
                >
                  <Video className="w-4 h-4 text-rose-600" />
                  <span>{strings.insertVideo}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInsertMenuOpen(false);
                    pdfFileInputRef.current?.click();
                  }}
                  className="w-full px-4 py-2 text-start hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4 text-emerald-600" />
                  <span>{strings.insertPdfBanner}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInsertMenuOpen(false);
                    insertHtmlAtCursor('<hr /><p><br></p>');
                  }}
                  className="w-full px-4 py-2 text-start hover:bg-slate-50 flex items-center gap-2"
                >
                  <Minus className="w-4 h-4 text-slate-500" />
                  <span>خط فاصل أفقي (Divider)</span>
                </button>
              </div>
            )}
          </div>

          {/* Move Current Block Up/Down */}
          <button
            type="button"
            onClick={() => moveBlockElement('up')}
            title="تحريك الفقرة أو العنصر المحدد للأعلى"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <MoveUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => moveBlockElement('down')}
            title="تحريك الفقرة أو العنصر المحدد للأسفل"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <MoveDown className="w-4 h-4" />
          </button>

          {/* Sanitized HTML Source Code Toggle */}
          <button
            type="button"
            onClick={() => {
              if (!sourceMode) {
                setSourceCodeText(editorRef.current?.innerHTML || post.content || '');
                setSourceMode(true);
              } else {
                const sanitized = sanitizeEditorHtmlClient(sourceCodeText);
                if (editorRef.current) {
                  editorRef.current.innerHTML = sanitized;
                }
                setPost((prev) => ({ ...prev, content: sanitized }));
                setSourceMode(false);
              }
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
              sourceMode
                ? 'bg-[#0B2E57] text-white border-[#0B2E57]'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
            }`}
            title="التبديل بين المحرر المرئي وكود HTML الآمن"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">
              {sourceMode ? strings.visualMode : strings.sourceCodeMode}
            </span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2B. SELECTED IMAGE INSPECTOR BAR (Shown when an image is clicked)   */}
      {/* =================================================================== */}
      {selectedFigureEl && selectedFigureAttrs && (
        <div className="bg-[#0B2E57] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-blue-900 z-20">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-[#E3C88F] flex items-center gap-1">
              <ImageIcon className="w-4 h-4" />
              <span>تحكم بالصورة المحددة:</span>
            </span>

            {/* Size Presets */}
            <div className="inline-flex items-center rounded-lg bg-white/10 p-0.5 text-[11px] font-bold">
              {(
                [
                  { id: 'small', label: 'صغير 38%' },
                  { id: 'medium', label: 'متوسط 62%' },
                  { id: 'wide', label: 'عريض 85%' },
                  { id: 'full', label: 'كامل 100%' },
                ] as const
              ).map((sz) => (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => updateSelectedFigure({ size: sz.id })}
                  className={`px-2 py-1 rounded-md cursor-pointer ${
                    selectedFigureAttrs.size === sz.id
                      ? 'bg-[#E3C88F] text-[#0B2E57]'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>

            {/* Alignment Presets */}
            <div className="inline-flex items-center rounded-lg bg-white/10 p-0.5 text-[11px] font-bold">
              {(
                [
                  { id: 'start', label: 'بداية السطر' },
                  { id: 'center', label: 'وسط' },
                  { id: 'end', label: 'نهاية السطر' },
                ] as const
              ).map((al) => (
                <button
                  key={al.id}
                  type="button"
                  onClick={() => updateSelectedFigure({ align: al.id })}
                  className={`px-2 py-1 rounded-md cursor-pointer ${
                    selectedFigureAttrs.align === al.id
                      ? 'bg-[#E3C88F] text-[#0B2E57]'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {al.label}
                </button>
              ))}
            </div>

            {/* Move Image Block Up / Down */}
            <button
              type="button"
              onClick={() => moveBlockElement('up', selectedFigureEl)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              title="تحريك الصورة للأعلى بين الفقرات"
            >
              <MoveUp className="w-3.5 h-3.5" />
              <span>للأعلى</span>
            </button>
            <button
              type="button"
              onClick={() => moveBlockElement('down', selectedFigureEl)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              title="تحريك الصورة للأسفل بين الفقرات"
            >
              <MoveDown className="w-3.5 h-3.5" />
              <span>للأسفل</span>
            </button>

            {/* Replace Image */}
            <button
              type="button"
              onClick={() => replaceImageInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold cursor-pointer"
            >
              استبدال من الجهاز
            </button>
            <button
              type="button"
              onClick={() => setMediaModalMode('replace_inline')}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold cursor-pointer"
            >
              استبدال من المكتبة
            </button>
          </div>

          {/* Alt Text, Caption & Delete */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={selectedFigureAttrs.alt}
              onChange={(e) => updateSelectedFigure({ alt: e.target.value })}
              placeholder="النص البديل (Alt Text)..."
              className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-xs text-white placeholder:text-blue-200 w-40"
            />
            <input
              type="text"
              value={selectedFigureAttrs.caption}
              onChange={(e) => updateSelectedFigure({ caption: e.target.value })}
              placeholder="التعليق أسفل الصورة (Caption)..."
              className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-xs text-white placeholder:text-blue-200 w-44"
            />
            <button
              type="button"
              onClick={deleteSelectedFigure}
              className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف</span>
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. MAIN WORKSPACE: DOCUMENT CANVAS + RIGHT SETTINGS DRAWER          */}
      {/* =================================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* CENTER: WORD-LIKE DOCUMENT CANVAS */}
        <div className="flex-1 elfazni-word-canvas-shell overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div
            className="max-w-4xl mx-auto elfazni-word-page p-5 sm:p-10 lg:p-12"
            dir={isArticleRtl ? 'rtl' : 'ltr'}
          >
            {/* Article Metadata Header inside the Document Page */}
            <div className="border-b border-slate-200 pb-6 mb-8 space-y-4">
              {/* Top pills: Article Language & Category */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500">{strings.categoryLabel}:</span>
                  <select
                    value={post.category || categories[0]?.slug || 'consular'}
                    onChange={(e) => {
                      setPost({ ...post, category: e.target.value });
                      setSaveState('unsaved');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#EAF4FF] text-[#004AA5] font-bold text-xs border border-[#B9D8F7]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  <span className="text-xs font-bold text-slate-500 ms-2">
                    {strings.languageLabel}:
                  </span>
                  <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs font-bold">
                    {(
                      [
                        { code: 'ar', label: 'العربية (RTL)' },
                        { code: 'en', label: 'English (LTR)' },
                        { code: 'fr', label: 'Français (LTR)' },
                      ] as const
                    ).map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setPost({ ...post, language: l.code });
                          setSaveState('unsaved');
                        }}
                        className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                          articleLang === l.code
                            ? 'bg-[#004AA5] text-white'
                            : 'text-slate-600 hover:text-[#0B2E57]'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    post.status === 'published'
                      ? 'bg-emerald-100 text-emerald-800'
                      : post.status === 'scheduled'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {strings.statusNames[(post.status as BlogStatus) || 'draft']}
                </span>
              </div>

              {/* Large Editable Article Title */}
              <input
                type="text"
                value={post.title || ''}
                onChange={(e) => {
                  setPost({ ...post, title: e.target.value });
                  setSaveState('unsaved');
                }}
                placeholder={strings.titlePlaceholder}
                className="w-full text-2xl sm:text-3xl lg:text-4xl font-black text-[#0B2E57] placeholder:text-slate-300 border-0 focus:outline-none focus:ring-0 bg-transparent leading-tight"
              />

              {/* Lead Summary / Excerpt */}
              <textarea
                rows={2}
                value={post.excerpt || ''}
                onChange={(e) => {
                  setPost({ ...post, excerpt: e.target.value });
                  setSaveState('unsaved');
                }}
                placeholder={strings.excerptPlaceholder}
                className="w-full text-sm sm:text-base text-slate-600 placeholder:text-slate-400 bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 focus:outline-none focus:border-[#004AA5] font-medium resize-y"
              />

              {/* Tokenized Labels / Tags Bar */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs font-bold text-slate-500 me-1">الوسوم (Tags):</span>
                {(post.tags || []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAF4FF] text-[#004AA5] text-xs font-bold border border-[#B9D8F7]"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => removeTagToken(t)}
                      className="hover:text-red-600 cursor-pointer"
                      aria-label={`حذف الوسم ${t}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTagToken(tagInput);
                    }
                  }}
                  onBlur={() => {
                    if (tagInput.trim()) addTagToken(tagInput);
                  }}
                  placeholder={strings.tagsPlaceholder}
                  className="px-2.5 py-1 rounded-lg border border-dashed border-slate-300 text-xs focus:outline-none focus:border-[#004AA5] min-w-[180px]"
                />
              </div>
            </div>

            {/* Drag-and-drop visual banner when dragging files */}
            {isDraggingOverEditor && (
              <div className="mb-4 p-4 rounded-2xl bg-[#EAF4FF] border-2 border-dashed border-[#004AA5] text-center text-xs sm:text-sm font-black text-[#004AA5]">
                {strings.dropImageHere}
              </div>
            )}

            {/* BODY: EITHER SANITIZED HTML SOURCE MODE OR VISUAL WORD-LIKE EDITOR */}
            {sourceMode ? (
              <div className="space-y-2" dir="ltr">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>HTML Source Code (Sanitized automatically on save & switch)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const clean = sanitizeEditorHtmlClient(sourceCodeText);
                      setSourceCodeText(clean);
                    }}
                    className="text-[#004AA5] font-bold hover:underline"
                  >
                    تنقية الكود الآن (Sanitize HTML)
                  </button>
                </div>
                <textarea
                  rows={22}
                  value={sourceCodeText}
                  onChange={(e) => {
                    setSourceCodeText(e.target.value);
                    setPost((prev) => ({
                      ...prev,
                      content: sanitizeEditorHtmlClient(e.target.value),
                    }));
                    setSaveState('unsaved');
                  }}
                  className="w-full p-4 rounded-2xl bg-slate-950 text-emerald-300 font-mono text-xs leading-relaxed border border-slate-800 focus:outline-none"
                />
              </div>
            ) : (
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                aria-label="محتوى المقال"
                dir={isArticleRtl ? 'rtl' : 'ltr'}
                onClick={handleCanvasClick}
                onKeyUp={handleSelectionChange}
                onMouseUp={handleSelectionChange}
                onInput={() => syncEditorHtml(true)}
                onDragOver={handleCanvasDragOver}
                onDragLeave={handleCanvasDragLeave}
                onDrop={handleCanvasDrop}
                onPaste={handleCanvasPaste}
                className="elfazni-rich-content min-h-[540px] focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 4. RIGHT-SIDE COLLAPSIBLE SETTINGS & SEO DRAWER                   */}
        {/* ================================================================= */}
        {drawerOpen && (
          <>
            {/* Desktop Resizable Separator Handle */}
            <div className="hidden lg:block shrink-0 h-full">
              <ResizeHandle
                id="blog-settings-drawer"
                direction="horizontal"
                isRtl={isArticleRtl}
                onResize={handleDrawerResize}
                onReset={handleResetDrawerWidth}
                currentSize={drawerWidth}
                minSize={260}
                maxSize={520}
                ariaLabel="فاصل تغيير حجم لوحة إعدادات المقال"
              />
            </div>

            <aside
              style={{ width: drawerWidth }}
              className="w-full lg:w-auto bg-white border-t lg:border-t-0 lg:border-s border-slate-200 overflow-y-auto p-5 space-y-6 shrink-0"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-sm text-[#0B2E57]">إعدادات المقال والـ SEO</h3>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleResetDrawerWidth}
                    title="استعادة العرض الافتراضي (380px)"
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#004AA5] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#0B2E57] cursor-pointer"
                    title="إغلاق اللوحة الجانبية"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

            {/* Featured Cover Image */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0B2E57]">
                {strings.featuredImageLabel}
              </label>
              {post.coverImage && (
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={post.coverImage}
                    alt={post.coverImageAlt || post.title || ''}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => coverImageInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#004AA5] hover:bg-[#0B2E57] text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع من الجهاز</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaModalMode('cover')}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B2E57] text-xs font-bold cursor-pointer"
                >
                  من المكتبة
                </button>
              </div>
              <input
                type="text"
                value={post.coverImageAlt || ''}
                onChange={(e) => {
                  setPost({ ...post, coverImageAlt: e.target.value });
                  setSaveState('unsaved');
                }}
                placeholder={strings.altTextLabel}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            {/* Status, Author & Featured Toggle */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {strings.statusLabel}
                </label>
                <select
                  value={post.status || 'draft'}
                  onChange={(e) => {
                    setPost({ ...post, status: e.target.value as BlogStatus });
                    setSaveState('unsaved');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="draft">{strings.statusNames.draft}</option>
                  <option value="in_review">{strings.statusNames.in_review}</option>
                  <option value="scheduled">{strings.statusNames.scheduled}</option>
                  <option value="published">{strings.statusNames.published}</option>
                  <option value="archived">{strings.statusNames.archived}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {strings.authorLabel}
                </label>
                <input
                  type="text"
                  value={post.author || ''}
                  onChange={(e) => {
                    setPost({ ...post, author: e.target.value });
                    setSaveState('unsaved');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(post.featured)}
                  onChange={(e) => {
                    setPost({ ...post, featured: e.target.checked });
                    setSaveState('unsaved');
                  }}
                  className="w-4 h-4 rounded text-[#004AA5]"
                />
                <span className="text-xs font-bold text-[#0B2E57]">{strings.featuredToggleLabel}</span>
              </label>
            </div>

            {/* Trilingual Editorial Workflow (Linked Translations) */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0B2E57] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#004AA5]" />
                  <span>{strings.translationsLabel}</span>
                </label>
              </div>
              {translations.length > 0 ? (
                <div className="space-y-1.5">
                  {translations.map((tr) => (
                    <div
                      key={tr.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-[#004AA5] text-white text-[10px] font-bold uppercase me-1.5">
                          {tr.language}
                        </span>
                        <span className="font-bold text-slate-800 truncate">{tr.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenPostById(tr.id)}
                        className="text-[#004AA5] font-bold hover:underline shrink-0 ms-2"
                      >
                        فتح
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  لا توجد نسخ مترجمة مرتبطة بهذا المقال حالياً.
                </p>
              )}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['ar', 'en', 'fr'] as BlogLanguage[])
                  .filter((l) => l !== articleLang && !translations.some((t) => t.language === l))
                  .map((targetLng) => (
                    <button
                      key={targetLng}
                      type="button"
                      onClick={() => void handleCreateTranslation(targetLng)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#EAF4FF] hover:bg-[#D7E7F7] text-[#004AA5] text-[11px] font-bold cursor-pointer"
                    >
                      + {strings.createTranslation} ({targetLng.toUpperCase()})
                    </button>
                  ))}
              </div>
            </div>

            {/* URL Slug & SEO Meta */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-black text-[#0B2E57]">تحسين محركات البحث (SEO & URLs)</h4>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {strings.slugLabel}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={post.slug || ''}
                  onChange={(e) => {
                    setPost({ ...post, slug: e.target.value });
                    setSaveState('unsaved');
                  }}
                  placeholder="auto-generated-from-title"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>{strings.seoTitleLabel}</span>
                  <span>{(post.seoTitle || post.title || '').length}/60</span>
                </div>
                <input
                  type="text"
                  value={post.seoTitle || ''}
                  onChange={(e) => {
                    setPost({ ...post, seoTitle: e.target.value });
                    setSaveState('unsaved');
                  }}
                  placeholder={post.title || 'عنوان SEO...'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>{strings.seoDescLabel}</span>
                  <span>{(post.seoDescription || post.excerpt || '').length}/160</span>
                </div>
                <textarea
                  rows={2}
                  value={post.seoDescription || ''}
                  onChange={(e) => {
                    setPost({ ...post, seoDescription: e.target.value });
                    setSaveState('unsaved');
                  }}
                  placeholder={post.excerpt || 'وصف ميتا لمحركات البحث...'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              {/* Google Search Snippet Live Preview */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  معاينة نتيجة بحث Google
                </div>
                <div className="text-xs font-bold text-[#1a0dab] truncate">
                  {post.seoTitle || post.title || 'عنوان المقال'} | ELFAZNI SERVICES
                </div>
                <div className="text-[11px] text-emerald-700 font-mono truncate" dir="ltr">
                  https://elfazni.com/blog/{post.slug || 'article-slug'}
                </div>
                <div className="text-[11px] text-slate-600 line-clamp-2">
                  {post.seoDescription || post.excerpt || 'ملخص المقال يظهر هنا في نتائج البحث...'}
                </div>
              </div>
            </div>

            {/* PDF Resource Attachment */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-[#0B2E57]">
                {strings.pdfGuideUrlLabel}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  dir="ltr"
                  value={post.pdfUrl || ''}
                  onChange={(e) => {
                    setPost({ ...post, pdfUrl: e.target.value });
                    setSaveState('unsaved');
                  }}
                  placeholder="/uploads/...pdf"
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => pdfFileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#0B2E57] cursor-pointer"
                >
                  رفع PDF
                </button>
              </div>
            </div>

            {/* Revision History */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-black text-[#0B2E57] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#004AA5]" />
                <span>
                  {strings.revisionHistory} ({revisions.length})
                </span>
              </h4>
              {revisions.length === 0 ? (
                <p className="text-[11px] text-slate-400">
                  سيتم تسجيل النسخ تلقائياً عند حفظ أو تحديث المقال.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {revisions.slice(0, 10).map((rev) => (
                    <div
                      key={rev.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-[11px]"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">
                          نسخة #{rev.revision} — {rev.summary || rev.status}
                        </div>
                        <div className="text-slate-400">
                          {new Date(rev.createdAt).toLocaleString('ar-EG')} · {rev.author}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRestoreRevision(rev)}
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#004AA5] text-[#004AA5] font-bold shrink-0 cursor-pointer"
                      >
                        استعادة
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </>
      )}
      </div>

      {/* =================================================================== */}
      {/* FLOATING CONTEXTUAL SELECTION TOOLBAR                               */}
      {/* =================================================================== */}
      {floatingToolbarPos && !sourceMode && (
        <div
          style={{ top: floatingToolbarPos.top, left: floatingToolbarPos.left }}
          onMouseDown={(e) => e.preventDefault()}
          className="fixed z-50 bg-[#0B2E57] text-white rounded-xl shadow-2xl border border-white/15 px-2 py-1 flex items-center gap-1"
        >
          <button
            type="button"
            onClick={() => execFormat('bold')}
            className="p-1.5 rounded hover:bg-white/15"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('italic')}
            className="p-1.5 rounded hover:bg-white/15"
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('underline')}
            className="p-1.5 rounded hover:bg-white/15"
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('formatBlock', 'H2')}
            className="px-1.5 py-1 rounded hover:bg-white/15 text-[11px] font-black"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => execFormat('formatBlock', 'H3')}
            className="px-1.5 py-1 rounded hover:bg-white/15 text-[11px] font-black"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => {
              const selText = window.getSelection()?.toString() || '';
              setLinkForm({ url: 'https://', text: selText, newTab: true });
              setLinkModalOpen(true);
              setFloatingToolbarPos(null);
            }}
            className="p-1.5 rounded hover:bg-white/15 text-[#E3C88F]"
            title="Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: MEDIA LIBRARY PICKER (Inline Image / Replace / Cover / Gallery) */}
      {/* =================================================================== */}
      {mediaModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-4xl bg-white rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-black text-base text-[#0B2E57]">
                {mediaModalMode === 'gallery'
                  ? 'اختر صور المعرض (يمكنك تحديد عدة صور)'
                  : 'مكتبة الوسائط والصور'}
              </h4>
              <button
                type="button"
                onClick={() => setMediaModalMode(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 py-4 overflow-y-auto flex-1">
              {media
                .filter((m) => m.mimeType?.startsWith('image/') || !m.url.endsWith('.pdf'))
                .map((asset) => {
                  const isSelectedForGallery = gallerySelectedUrls.includes(asset.url);
                  return (
                    <div
                      key={asset.id}
                      onClick={() => {
                        if (mediaModalMode === 'insert_inline') {
                          const html = buildImageFigureHtml({
                            url: asset.url,
                            altText: asset.altText || asset.originalName,
                            caption: asset.caption || '',
                            size: 'full',
                            align: 'center',
                            mediaId: asset.id,
                          });
                          insertHtmlAtCursor(html);
                          setMediaModalMode(null);
                        } else if (mediaModalMode === 'replace_inline') {
                          handleReplaceSelectedImageWithUrl(
                            asset.url,
                            asset.altText || asset.originalName,
                            asset.id
                          );
                          setMediaModalMode(null);
                        } else if (mediaModalMode === 'cover') {
                          setPost((prev) => ({
                            ...prev,
                            coverImage: asset.url,
                            coverImageAlt: prev.coverImageAlt || asset.altText,
                          }));
                          setSaveState('unsaved');
                          setMediaModalMode(null);
                        } else if (mediaModalMode === 'gallery') {
                          setGallerySelectedUrls((prev) =>
                            prev.includes(asset.url)
                              ? prev.filter((u) => u !== asset.url)
                              : [...prev, asset.url]
                          );
                        }
                      }}
                      className={`group aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer bg-slate-100 relative ${
                        isSelectedForGallery
                          ? 'border-[#004AA5] ring-2 ring-[#004AA5]/30'
                          : 'border-transparent hover:border-[#004AA5]'
                      }`}
                    >
                      <img
                        src={asset.url}
                        alt={asset.altText}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2 text-[10px] text-white font-bold truncate">
                        {asset.altText || asset.originalName}
                      </div>
                      {isSelectedForGallery && (
                        <div className="absolute top-2 end-2 w-6 h-6 rounded-full bg-[#004AA5] text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setMediaModalMode(null);
                  inlineImageInputRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EAF4FF] text-[#004AA5] text-xs font-bold cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>رفع صورة جديدة من الكمبيوتر</span>
              </button>

              <div className="flex items-center gap-2">
                {mediaModalMode === 'gallery' && (
                  <button
                    type="button"
                    disabled={gallerySelectedUrls.length === 0}
                    onClick={() => {
                      const imgs = gallerySelectedUrls
                        .map((u) => `<img src="${u}" alt="" loading="lazy" />`)
                        .join('');
                      insertHtmlAtCursor(
                        `<div class="elfazni-gallery" data-block-type="gallery">${imgs}</div><p><br></p>`
                      );
                      setMediaModalMode(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#004AA5] text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    إدراج المعرض ({gallerySelectedUrls.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMediaModalMode(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: HYPERLINK                                                    */}
      {/* =================================================================== */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const url = linkForm.url.trim();
              if (!/^(https?:\/\/|\/|mailto:|tel:|#)/i.test(url)) {
                showToast('الرابط يجب أن يبدأ بـ https:// أو / أو mailto: أو tel:', 'error');
                return;
              }
              const label = linkForm.text.trim() || url;
              const targetAttr = linkForm.newTab
                ? ' target="_blank" rel="noopener noreferrer"'
                : '';
              insertHtmlAtCursor(`<a href="${url}"${targetAttr}>${label}</a>`);
              setLinkModalOpen(false);
            }}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-sm text-[#0B2E57]">إدراج رابط (Hyperlink)</h4>
              <button type="button" onClick={() => setLinkModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نص الرابط</label>
              <input
                type="text"
                value={linkForm.text}
                onChange={(e) => setLinkForm({ ...linkForm, text: e.target.value })}
                placeholder="مثال: احجز موعدك القنصلي الآن"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الرابط (URL)</label>
              <input
                type="text"
                dir="ltr"
                required
                value={linkForm.url}
                onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={linkForm.newTab}
                onChange={(e) => setLinkForm({ ...linkForm, newTab: e.target.checked })}
              />
              <span>فتح في نافذة جديدة</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  execFormat('unlink');
                  setLinkModalOpen(false);
                }}
                className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold"
              >
                إزالة الرابط
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#004AA5] text-white text-xs font-bold"
              >
                إدراج الرابط
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: TABLE GENERATOR                                              */}
      {/* =================================================================== */}
      {tableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <form
            onSubmit={handleInsertTable}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <h4 className="font-black text-sm text-[#0B2E57]">إدراج جدول منسق</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عدد الصفوف</label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={tableSize.rows}
                  onChange={(e) => setTableSize({ ...tableSize, rows: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عدد الأعمدة</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={tableSize.cols}
                  onChange={(e) => setTableSize({ ...tableSize, cols: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTableModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#004AA5] text-white text-xs font-bold"
              >
                إدراج الجدول
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: CTA BUTTON GENERATOR                                         */}
      {/* =================================================================== */}
      {ctaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <form
            onSubmit={handleInsertCta}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <h4 className="font-black text-sm text-[#0B2E57]">إدراج صندوق دعوة للتواصل (CTA)</h4>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الصندوق</label>
              <input
                type="text"
                value={ctaForm.title}
                onChange={(e) => setCtaForm({ ...ctaForm, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نص الزر</label>
              <input
                type="text"
                value={ctaForm.buttonText}
                onChange={(e) => setCtaForm({ ...ctaForm, buttonText: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رابط الزر</label>
              <input
                type="text"
                dir="ltr"
                value={ctaForm.url}
                onChange={(e) => setCtaForm({ ...ctaForm, url: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCtaModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#004AA5] text-white text-xs font-bold"
              >
                إدراج
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: VIDEO EMBED                                                  */}
      {/* =================================================================== */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <form
            onSubmit={handleInsertVideo}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <h4 className="font-black text-sm text-[#0B2E57]">إدراج فيديو (YouTube / Vimeo)</h4>
            <input
              type="url"
              dir="ltr"
              required
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#004AA5] text-white text-xs font-bold"
              >
                إدراج الفيديو
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: INTERNAL ARTICLE LINK CARD                                   */}
      {/* =================================================================== */}
      {internalLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-sm text-[#0B2E57]">اختر مقالاً داخلياً للإشارة إليه</h4>
              <button type="button" onClick={() => setInternalLinkModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto flex-1">
              {allPosts
                .filter((p) => p.id !== post.id)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleInsertInternalPostCard(p)}
                    className="w-full p-3 rounded-2xl border border-slate-200 hover:border-[#004AA5] hover:bg-slate-50 text-start flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0B2E57] truncate">{p.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">/blog/{p.slug}</div>
                    </div>
                    <span className="text-xs font-bold text-[#004AA5] shrink-0">إدراج</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: STARTER TEMPLATES                                            */}
      {/* =================================================================== */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-base text-[#0B2E57]">{strings.templates}</h4>
              <button type="button" onClick={() => setTemplateModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto flex-1">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-[#004AA5] flex flex-col justify-between gap-3 bg-slate-50/50"
                >
                  <div>
                    <span className="px-2 py-0.5 rounded bg-[#EAF4FF] text-[#004AA5] text-[10px] font-bold uppercase">
                      {tpl.language} · {tpl.category}
                    </span>
                    <h5 className="font-black text-sm text-[#0B2E57] mt-1.5">{tpl.name}</h5>
                    <p className="text-xs text-slate-500 mt-1">{tpl.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-full py-2 rounded-xl bg-[#004AA5] hover:bg-[#0B2E57] text-white text-xs font-bold cursor-pointer"
                  >
                    استخدام هذا القالب
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: SCHEDULE PUBLICATION                                         */}
      {/* =================================================================== */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!post.scheduledAt) {
                showToast('يرجى تحديد تاريخ ووقت النشر', 'error');
                return;
              }
              setScheduleModalOpen(false);
              void performSave('scheduled');
            }}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-sm text-[#0B2E57]">{strings.schedule}</h4>
              <button type="button" onClick={() => setScheduleModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {strings.scheduleDateLabel}
              </label>
              <input
                type="datetime-local"
                required
                value={post.scheduledAt ? post.scheduledAt.slice(0, 16) : ''}
                onChange={(e) =>
                  setPost({ ...post, scheduledAt: new Date(e.target.value).toISOString() })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {strings.timezoneLabel}
              </label>
              <select
                value={post.timezone || 'Europe/Istanbul'}
                onChange={(e) => setPost({ ...post, timezone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="Europe/Istanbul">إسطنبول (Europe/Istanbul GMT+3)</option>
                <option value="Africa/Casablanca">الدار البيضاء / الرباط (Africa/Casablanca)</option>
                <option value="UTC">التوقيت العالمي (UTC)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#CC9048] text-white text-xs font-bold cursor-pointer"
              >
                تأكيد الجدولة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: DESKTOP & MOBILE LIVE PREVIEW                                */}
      {/* =================================================================== */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
          <div className="w-full max-w-5xl bg-[#F8FAFD] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#0B2E57] text-white px-6 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-black text-sm">معاينة المقال قبل النشر</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black">
                  {strings.statusNames[(post.status as BlogStatus) || 'draft']}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-white text-[#0B2E57]' : 'text-white/70'
                  }`}
                  title="معاينة سطح المكتب"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-white text-[#0B2E57]' : 'text-white/70'
                  }`}
                  title="معاينة الهاتف المحمول"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
                {post.slug && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewModalOpen(false);
                      onNavigatePublic(`/blog/${post.slug}?preview=1`);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>فتح في صفحة المدونة</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/15"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex justify-center">
              <div
                dir={isArticleRtl ? 'rtl' : 'ltr'}
                className={`bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-10 transition-all ${
                  previewDevice === 'mobile' ? 'w-[390px]' : 'w-full max-w-3xl'
                }`}
              >
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt={post.coverImageAlt || post.title || ''}
                    className="w-full aspect-video object-cover rounded-2xl mb-6"
                  />
                )}
                <h1 className="text-2xl sm:text-3xl font-black text-[#0B2E57] mb-4">
                  {post.title || 'عنوان المقال'}
                </h1>
                {post.excerpt && (
                  <div className="p-4 rounded-xl bg-slate-50 border-s-4 border-[#004AA5] text-sm text-slate-700 font-medium mb-6">
                    {post.excerpt}
                  </div>
                )}
                <div
                  className="elfazni-rich-content"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeEditorHtmlClient(
                      sourceMode ? sourceCodeText : post.content || ''
                    ),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: OPTIMISTIC CONCURRENCY CONFLICT                              */}
      {/* =================================================================== */}
      {conflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h4 className="font-black text-base text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>تعارض في التعديلات (Version Conflict)</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              تم تعديل هذا المقال من قِبل جلسة أخرى أثناء عملك عليه. يمكنك إما تحميل النسخة الأحدث من
              الخادم أو فرض حفظ نسختك الحالية.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (conflictModal.serverVersion) {
                    const html = ensureHtmlContent(conflictModal.serverVersion.content);
                    if (editorRef.current) editorRef.current.innerHTML = html;
                    setPost(conflictModal.serverVersion);
                    setSaveState('saved');
                  }
                  setConflictModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold"
              >
                تحميل نسخة الخادم
              </button>
              <button
                type="button"
                onClick={() => {
                  setConflictModal(null);
                  void performSave(undefined, { forceOverwrite: true });
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                الكتابة فوق نسخة الخادم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
