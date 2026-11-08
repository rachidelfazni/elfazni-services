import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Search,
  Pin,
  Star,
  Archive,
  Trash2,
  Copy,
  Check,
  Share2,
  MoreVertical,
  Calendar,
  CheckSquare,
  Clock,
  ExternalLink,
  Code2,
  Image as ImageIcon,
  Table as TableIcon,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Palette,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Paperclip,
  Sparkles,
  Link2,
  History,
  FileDown,
  ChevronDown,
  Maximize2,
  Minimize2,
  Tag,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  AlertCircle,
  HelpCircle,
  LayoutGrid,
  LayoutList,
  CheckCircle2,
} from 'lucide-react';
import {
  NoteItem,
  NoteRevision,
  TaskItem,
  productivityService,
} from '../../services/productivityService';
import { useCopy } from '../../i18n/useCopy';
import { useApp } from '../../context/AppContext';

interface ModernNotesEditorProps {
  notes: NoteItem[];
  onNotesChange: (notes: NoteItem[]) => void;
  onConvertToTask: (note: NoteItem, taskOptions?: any) => Promise<any>;
  onCreateTaskFromSelection: (selectedText: string, note: NoteItem) => Promise<any>;
  username?: string;
  onNavigateToTasks?: () => void;
  activeNoteId?: string | null;
  onSelectNoteId?: (id: string | null) => void;
}

const EMOJI_OPTIONS = ['📝', '📌', '💡', '✈️', '🏨', '🏛️', '💼', '📊', '⭐', '🎯', '📞', '⚖️'];

const COLOR_OPTIONS = [
  '#0B2E57', // Navy
  '#004AA5', // Blue
  '#2A83D5', // Cyan/Cobalt
  '#CC9048', // Gold
  '#2E7D5B', // Emerald
  '#8B3A62', // Wine/Rose
  '#4A5568', // Slate
];

const HIGHLIGHT_COLORS = [
  { name: 'أصفر', color: '#FEF08A' },
  { name: 'أخضر', color: '#BBF7D0' },
  { name: 'أزرق', color: '#BAE6FD' },
  { name: 'وردي', color: '#FBCFE8' },
  { name: 'برتقالي', color: '#FED7AA' },
];

export const ModernNotesEditor: React.FC<ModernNotesEditorProps> = ({
  notes,
  onNotesChange,
  onConvertToTask,
  onCreateTaskFromSelection,
  username = 'owner',
  onNavigateToTasks,
  activeNoteId: controlledActiveId,
  onSelectNoteId: setControlledActiveId,
}) => {
  const { l, language } = useCopy();
  const { contactBook, consulateAppointments, flightBookings } = useApp();

  const [internalActiveNoteId, setInternalActiveNoteId] = useState<string | null>(notes[0]?.id || null);
  const activeNoteId = controlledActiveId !== undefined ? controlledActiveId : internalActiveNoteId;
  const setActiveNoteId = (id: string | null) => {
    if (setControlledActiveId) setControlledActiveId(id);
    setInternalActiveNoteId(id);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [filterView, setFilterView] = useState<'all' | 'pinned' | 'favorites' | 'archived'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<'list' | 'cards'>('list');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Editor states
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'failed'>('saved');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState({ top: 0, left: 0 });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [reminderDateDraft, setReminderDateDraft] = useState('');
  const [showLinkEntityModal, setShowLinkEntityModal] = useState(false);
  const [copiedCodeBanner, setCopiedCodeBanner] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<any>(null);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0] || null;

  // Initialize active note on load
  useEffect(() => {
    if (!activeNoteId && notes.length > 0) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId]);

  // Keep content in editable div synchronized with active note
  useEffect(() => {
    if (editorRef.current && activeNote) {
      if (editorRef.current.innerHTML !== activeNote.contentHtml) {
        editorRef.current.innerHTML = activeNote.contentHtml || `<p>${activeNote.body || ''}</p>`;
      }
    }
  }, [activeNote?.id]);

  // Handle note field update with auto-save debounce
  const handleUpdateActiveNote = useCallback(
    (updates: Partial<NoteItem>) => {
      if (!activeNote) return;
      setSaveStatus('saving');

      const updated = {
        ...activeNote,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const nextNotes = notes.map((n) => (n.id === activeNote.id ? updated : n));
      onNotesChange(nextNotes);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await productivityService.saveNote(updated, username);
          setSaveStatus('saved');
        } catch {
          setSaveStatus('failed');
        }
      }, 600);
    },
    [activeNote, notes, onNotesChange, username]
  );

  const handleEditorInput = () => {
    if (!editorRef.current || !activeNote) return;
    const contentHtml = editorRef.current.innerHTML;
    const body = editorRef.current.innerText || '';
    handleUpdateActiveNote({ contentHtml, body });
  };

  const handleCreateNote = async () => {
    const newNote: NoteItem = {
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: username,
      title: 'ملاحظة جديدة',
      icon: '📝',
      coverColor: '#0B2E57',
      body: '',
      contentHtml: '<p>ابدأ بكتابة أفكارك، أو اكتب <strong>/</strong> لإدراج العناوين والجداول والمهام...</p>',
      tags: ['عام'],
      pinned: false,
      favorite: false,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextNotes = [newNote, ...notes];
    onNotesChange(nextNotes);
    setActiveNoteId(newNote.id);
    await productivityService.saveNote(newNote, username);
  };

  const handleDeleteNote = async (id: string) => {
    const nextNotes = notes.filter((n) => n.id !== id);
    onNotesChange(nextNotes);
    if (activeNoteId === id) {
      setActiveNoteId(nextNotes[0]?.id || null);
    }
    await productivityService.deleteNote(id, username);
  };

  // Rich Text Commands
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const insertHtmlAtCursor = (html: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const el = document.createElement('div');
      el.innerHTML = html;
      const frag = document.createDocumentFragment();
      let node;
      while ((node = el.firstChild)) {
        frag.appendChild(node);
      }
      range.insertNode(frag);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editorRef.current.innerHTML += html;
    }
    handleEditorInput();
  };

  // Code Block Insertion with Copy button
  const insertCodeBlock = (lang: string = 'javascript') => {
    const codeId = `code_${Date.now()}`;
    const codeHtml = `
      <div class="my-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 overflow-hidden font-mono text-xs shadow-sm" contenteditable="false" data-code-block="${codeId}">
        <div class="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700 text-[11px] text-slate-400">
          <span class="font-bold text-amber-400">${lang.toUpperCase()}</span>
          <button type="button" onclick="navigator.clipboard.writeText(this.closest('[data-code-block]').querySelector('code').innerText); this.innerText='تم النسخ ✓'; setTimeout(() => this.innerText='نسخ الكود', 2000);" class="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white cursor-pointer transition">
            نسخ الكود
          </button>
        </div>
        <pre class="p-3 overflow-x-auto"><code contenteditable="true">// اكتب الكود هنا...</code></pre>
      </div><p><br/></p>
    `;
    insertHtmlAtCursor(codeHtml);
  };

  // Callout Box Insertion
  const insertCallout = () => {
    const calloutHtml = `
      <div class="my-3 p-3.5 rounded-xl border-r-4 border-r-[#CC9048] bg-[#FFF9ED] border border-[#E3C88F] text-[#0B2E57] text-xs leading-relaxed flex items-start gap-2.5">
        <span class="text-base leading-none select-none">💡</span>
        <div contenteditable="true" class="flex-1 min-w-0">
          <strong>تنبيه هام:</strong> اكتب التفاصيل أو التوجيهات الخاصة بالمعاملة هنا...
        </div>
      </div><p><br/></p>
    `;
    insertHtmlAtCursor(calloutHtml);
  };

  // Table Insertion
  const insertTable = (rows: number = 3, cols: number = 3) => {
    let tbl = `<table class="w-full my-4 border-collapse border border-slate-300 text-xs"><tbody>`;
    for (let r = 0; r < rows; r++) {
      tbl += `<tr>`;
      for (let c = 0; c < cols; c++) {
        tbl += `<td class="border border-slate-300 p-2 min-w-[70px] ${r === 0 ? 'bg-slate-100 font-bold' : ''}">خلايا ${r + 1},${c + 1}</td>`;
      }
      tbl += `</tr>`;
    }
    tbl += `</tbody></table><p><br/></p>`;
    insertHtmlAtCursor(tbl);
  };

  // Image Upload Insertion
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploaded = await productivityService.uploadFile(file);
    if (uploaded) {
      const imgHtml = `
        <figure class="my-4 text-center">
          <img src="${uploaded.url}" alt="${uploaded.name}" class="max-w-full rounded-xl border border-slate-200 mx-auto shadow-xs" style="max-height: 400px; object-fit: contain;" />
          <figcaption class="text-[11px] text-slate-500 mt-1 italic">${uploaded.name}</figcaption>
        </figure><p><br/></p>
      `;
      insertHtmlAtCursor(imgHtml);
    }
  };

  // Document Attachment Upload
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploaded = await productivityService.uploadFile(file);
    if (uploaded) {
      const isPdf = file.type.includes('pdf');
      const attHtml = `
        <div class="my-2.5 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#D7E7F7] bg-white shadow-2xs text-xs" contenteditable="false">
          <span class="p-1.5 rounded-lg ${isPdf ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'} font-bold text-[10px]">
            ${isPdf ? 'PDF' : 'DOC'}
          </span>
          <span class="font-bold text-[#0B2E57]">${uploaded.name}</span>
          <a href="${uploaded.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline ms-2 font-bold flex items-center gap-0.5">
            تحميل <span class="text-[10px]">⬇</span>
          </a>
        </div><p><br/></p>
      `;
      insertHtmlAtCursor(attHtml);
    }
  };

  // Listen to selection for floating toolbar and note-to-task conversion
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      const text = sel.toString().trim();
      setSelectedText(text);
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setFloatingPosition({
        top: Math.max(10, rect.top - 45),
        left: Math.max(10, rect.left + rect.width / 2 - 120),
      });
      setShowFloatingToolbar(true);
    } else {
      setShowFloatingToolbar(false);
    }
  };

  // Keydown for Slash Menu `/`
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '/') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        setSlashMenuPosition({
          top: rect.bottom + window.scrollY + 6,
          left: rect.left + window.scrollX,
        });
        setShowSlashMenu(true);
      }
    } else if (e.key === 'Escape') {
      setShowSlashMenu(false);
      setShowFloatingToolbar(false);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (n.archived && filterView !== 'archived') return false;
    if (!n.archived && filterView === 'archived') return false;
    if (filterView === 'pinned' && !n.pinned) return false;
    if (filterView === 'favorites' && !n.favorite) return false;
    if (selectedTag && !n.tags.includes(selectedTag)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchBody = n.body.toLowerCase().includes(q);
      const matchTags = n.tags.some((t) => t.toLowerCase().includes(q));
      const matchCustomer = n.linkedCustomerName?.toLowerCase().includes(q);
      return matchTitle || matchBody || matchTags || matchCustomer;
    }
    return true;
  });

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])));

  return (
    <div
      className={`tools-body bg-white flex flex-col md:flex-row h-full overflow-hidden ${
        isFullScreen ? 'fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs' : ''
      }`}
    >
      {/* 1. Collapsible Notes Navigator Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-full md:w-64 lg:w-72' : 'w-0 hidden md:block md:w-12'
        } border-e border-[#D7E7F7] bg-slate-50/70 flex flex-col shrink-0 transition-all duration-200 overflow-hidden`}
      >
        {isSidebarOpen ? (
          <>
            {/* Sidebar Top: Search & Actions */}
            <div className="p-3 border-b border-[#D7E7F7] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#0B2E57] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#CC9048]" />
                  {l('المفكرة الذكية', 'Smart Notes', 'Bloc-notes')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setLayoutMode(layoutMode === 'list' ? 'cards' : 'list')}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-200/60"
                    title={layoutMode === 'list' ? 'عرض بطاقات' : 'عرض قائمة'}
                  >
                    {layoutMode === 'list' ? <LayoutGrid size={14} /> : <LayoutList size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                    title="طي القائمة"
                  >
                    <PanelLeftClose size={14} />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute top-1/2 -translate-y-1/2 start-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={l('بحث في الملاحظات والوسوم…', 'Search notes, tags…', 'Rechercher…')}
                  className="w-full ps-8 pe-3 py-1.5 text-xs bg-white border border-[#D7E7F7] rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* View Filters Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => { setFilterView('all'); setSelectedTag(null); }}
                  className={`px-2 py-0.5 rounded-lg font-bold transition ${
                    filterView === 'all' && !selectedTag ? 'bg-[#0B2E57] text-white' : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  الكل ({notes.filter((n) => !n.archived).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterView('pinned')}
                  className={`px-2 py-0.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    filterView === 'pinned' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Pin size={10} /> مثبتة
                </button>
                <button
                  type="button"
                  onClick={() => setFilterView('favorites')}
                  className={`px-2 py-0.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    filterView === 'favorites' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Star size={10} /> مميزة
                </button>
              </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredNotes.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  {l('لا توجد ملاحظات مطابقة.', 'No matching notes.', 'Aucune note.')}
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isSelected = activeNote?.id === note.id;
                  return (
                    <div
                      key={note.id}
                      onClick={() => setActiveNoteId(note.id)}
                      className={`group p-2.5 rounded-xl cursor-pointer transition border text-xs ${
                        isSelected
                          ? 'bg-white border-[#004AA5] shadow-xs'
                          : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-bold text-[#0B2E57] truncate flex items-center gap-1.5 flex-1 min-w-0">
                          <span>{note.icon || '📝'}</span>
                          <span className="truncate">{note.title || l('(بدون عنوان)', '(untitled)', '(sans titre)')}</span>
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {note.pinned && <Pin size={11} className="text-amber-500 fill-amber-500" />}
                          {note.favorite && <Star size={11} className="text-rose-500 fill-rose-500" />}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-1 mb-1.5">
                        {note.body.replace(/\n/g, ' ') || 'فارغة...'}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>
                          {new Date(note.updatedAt).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        {note.linkedCustomerName && (
                          <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-sans truncate max-w-[90px]">
                            👤 {note.linkedCustomerName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar Bottom: New Note CTA */}
            <div className="p-2 border-t border-[#D7E7F7]">
              <button
                type="button"
                onClick={handleCreateNote}
                className="w-full py-2 px-3 rounded-xl bg-[#004AA5] hover:bg-[#2A83D5] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Plus size={14} />
                <span>{l('ملاحظة جديدة', 'New note', 'Nouvelle note')}</span>
              </button>
            </div>
          </>
        ) : (
          <div className="p-2 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/60"
              title="توسيع قائمة الملاحظات"
            >
              <PanelLeftOpen size={16} />
            </button>
            <button
              type="button"
              onClick={handleCreateNote}
              className="p-2 rounded-xl bg-[#004AA5] text-white hover:bg-[#2A83D5]"
              title="ملاحظة جديدة"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </aside>

      {/* 2. Main Editor Canvas */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {activeNote ? (
          <>
            {/* Top Note Action Header (Clean, responsive, NO decorative duplicate logos) */}
            <header className="px-4 py-2.5 border-b border-[#D7E7F7] flex flex-wrap items-center justify-between gap-2 bg-white">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Emoji Selector */}
                <select
                  value={activeNote.icon || '📝'}
                  onChange={(e) => handleUpdateActiveNote({ icon: e.target.value })}
                  className="text-base bg-slate-100 hover:bg-slate-200 rounded-lg p-1 border border-slate-200 cursor-pointer"
                  title="رمز الملاحظة"
                >
                  {EMOJI_OPTIONS.map((em) => (
                    <option key={em} value={em}>
                      {em}
                    </option>
                  ))}
                </select>

                {/* Title Input */}
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
                  placeholder={l('عنوان الملاحظة…', 'Note title…', 'Titre de la note…')}
                  className="text-sm sm:text-base font-bold text-[#0B2E57] bg-transparent border-none focus:outline-none flex-1 min-w-0"
                />
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 text-xs">
                {/* Autosave Status Pill */}
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    saveStatus === 'saved'
                      ? 'bg-emerald-50 text-emerald-700'
                      : saveStatus === 'saving'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      saveStatus === 'saved'
                        ? 'bg-emerald-500'
                        : saveStatus === 'saving'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-rose-500'
                    }`}
                  />
                  {saveStatus === 'saved' ? 'تم الحفظ' : saveStatus === 'saving' ? 'جاري الحفظ…' : 'فشل الحفظ'}
                </span>

                {/* Pin Button */}
                <button
                  type="button"
                  onClick={() => handleUpdateActiveNote({ pinned: !activeNote.pinned })}
                  className={`p-1.5 rounded-lg border transition ${
                    activeNote.pinned
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                  title={activeNote.pinned ? 'إلغاء التثبيت' : 'تثبيت الملاحظة'}
                >
                  <Pin size={13} className={activeNote.pinned ? 'fill-amber-500' : ''} />
                </button>

                {/* Favorite Button */}
                <button
                  type="button"
                  onClick={() => handleUpdateActiveNote({ favorite: !activeNote.favorite })}
                  className={`p-1.5 rounded-lg border transition ${
                    activeNote.favorite
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                  title="المفضلة"
                >
                  <Star size={13} className={activeNote.favorite ? 'fill-rose-500' : ''} />
                </button>

                {/* Convert to Task CTA */}
                <button
                  type="button"
                  onClick={async () => {
                    await onConvertToTask(activeNote);
                    if (onNavigateToTasks) {
                      onNavigateToTasks();
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold flex items-center gap-1 transition"
                  title="تحويل الملاحظة كاملة إلى مهمة"
                >
                  <CheckSquare size={13} />
                  <span className="hidden sm:inline">تحويل لمهمة</span>
                </button>

                {/* Set Reminder Button */}
                <button
                  type="button"
                  onClick={() => setShowReminderPicker(!showReminderPicker)}
                  className={`px-2 py-1.5 rounded-lg border flex items-center gap-1 transition ${
                    activeNote.reminderDateTime
                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title="تذكير الملاحظة"
                >
                  <Clock size={13} />
                  <span className="hidden sm:inline">
                    {activeNote.reminderDateTime ? 'تذكير مضبوط' : 'تذكير'}
                  </span>
                </button>

                {/* Link CRM Record Button */}
                <button
                  type="button"
                  onClick={() => setShowLinkEntityModal(!showLinkEntityModal)}
                  className={`px-2 py-1.5 rounded-lg border flex items-center gap-1 transition ${
                    activeNote.linkedCustomerId || activeNote.linkedRecordId
                      ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title="ربط بسجل عميل أو معاملة"
                >
                  <Link2 size={13} />
                  <span className="hidden sm:inline">ربط CRM</span>
                </button>

                {/* Delete Note */}
                <button
                  type="button"
                  onClick={() => handleDeleteNote(activeNote.id)}
                  className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                  title="حذف الملاحظة"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </header>

            {/* Reminder Picker Popover */}
            {showReminderPicker && (
              <div className="p-3 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  <Clock size={13} />
                  {l('ضبط موعد تذكير للملاحظة:', 'Set note reminder date:', 'Définir un rappel :')}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={reminderDateDraft || activeNote.reminderDateTime?.slice(0, 16) || ''}
                    onChange={(e) => setReminderDateDraft(e.target.value)}
                    className="p-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (reminderDateDraft) {
                        handleUpdateActiveNote({ reminderDateTime: new Date(reminderDateDraft).toISOString() });
                        setShowReminderPicker(false);
                      }
                    }}
                    className="px-3 py-1 bg-[#CC9048] text-white rounded-lg font-bold hover:bg-[#CC9048]"
                  >
                    حفظ التذكير
                  </button>
                  {activeNote.reminderDateTime && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateActiveNote({ reminderDateTime: undefined });
                        setShowReminderPicker(false);
                      }}
                      className="px-2 py-1 text-rose-600 hover:underline"
                    >
                      إلغاء التذكير
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Link CRM Record Popover */}
            {showLinkEntityModal && (
              <div className="p-3 bg-blue-50 border-b border-blue-200 text-xs space-y-2">
                <div className="font-bold text-blue-900 flex items-center justify-between">
                  <span>ربط الملاحظة بسجل عميل أو معاملة:</span>
                  <button type="button" onClick={() => setShowLinkEntityModal(false)} className="text-blue-900 font-bold">✕</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={activeNote.linkedCustomerId || ''}
                    onChange={(e) => {
                      const selectedContact = contactBook.contacts.find((c) => c.id === e.target.value);
                      handleUpdateActiveNote({
                        linkedCustomerId: selectedContact?.id,
                        linkedCustomerName: selectedContact ? selectedContact.name : undefined,
                      });
                    }}
                    className="p-2 bg-white border border-blue-200 rounded-xl"
                  >
                    <option value="">— اختر عميل من جهات الاتصال —</option>
                    {contactBook.contacts.slice(0, 50).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone || c.email || 'عميل'})
                      </option>
                    ))}
                  </select>

                  <select
                    value={activeNote.linkedRecordId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        handleUpdateActiveNote({ linkedRecordId: undefined, linkedRecordType: undefined, linkedRecordTitle: undefined });
                        return;
                      }
                      const [type, id] = val.split(':');
                      if (type === 'cns') {
                        const appt = consulateAppointments.find((c) => c.id === id);
                        handleUpdateActiveNote({
                          linkedRecordType: 'consulate',
                          linkedRecordId: id,
                          linkedRecordTitle: `موعد قنصلية: ${appt?.clientName} (${appt?.appointmentType})`,
                        });
                      } else if (type === 'fly') {
                        const fly = flightBookings.find((f) => f.id === id);
                        handleUpdateActiveNote({
                          linkedRecordType: 'flight',
                          linkedRecordId: id,
                          linkedRecordTitle: `حجز طيران: ${fly?.clientName} (${fly?.airlineAndRoute || fly?.pnr})`,
                        });
                      }
                    }}
                    className="p-2 bg-white border border-blue-200 rounded-xl"
                  >
                    <option value="">— ربط بمعاملة قنصلية أو طيران —</option>
                    <optgroup label="المواعيد القنصلية">
                      {consulateAppointments.slice(0, 15).map((c) => (
                        <option key={c.id} value={`cns:${c.id}`}>
                          {c.clientName} — {c.appointmentType} ({c.submissionDate})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="حجوزات الطيران">
                      {flightBookings.slice(0, 15).map((f) => (
                        <option key={f.id} value={`fly:${f.id}`}>
                          {f.clientName} — {f.airlineAndRoute || f.pnr} ({f.bookingDate})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            )}

            {/* Linked Entity Banner */}
            {(activeNote.linkedCustomerName || activeNote.linkedRecordTitle) && (
              <div className="px-4 py-1.5 bg-[#F0F7FF] border-b border-[#D7E7F7] flex flex-wrap items-center gap-3 text-xs text-[#0B2E57]">
                {activeNote.linkedCustomerName && (
                  <span className="inline-flex items-center gap-1 font-bold">
                    <User size={12} className="text-blue-600" />
                    <span>العميل: {activeNote.linkedCustomerName}</span>
                  </span>
                )}
                {activeNote.linkedRecordTitle && (
                  <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                    <ExternalLink size={12} className="text-amber-600" />
                    <span>{activeNote.linkedRecordTitle}</span>
                  </span>
                )}
                {activeNote.reminderDateTime && (
                  <span className="inline-flex items-center gap-1 font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    ⏰ {new Date(activeNote.reminderDateTime).toLocaleString(language === 'ar' ? 'ar-MA' : 'en-GB')}
                  </span>
                )}
              </div>
            )}

            {/* 3. Rich WYSIWYG Modern Editing Toolbar */}
            <div className="px-3 py-1.5 border-b border-[#D7E7F7] bg-slate-50 flex flex-wrap items-center gap-1 text-xs shrink-0 select-none">
              {/* Headings */}
              <button
                type="button"
                onClick={() => execCmd('formatBlock', '<h1>')}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                title="عنوان رئيسي H1"
              >
                <Heading1 size={14} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('formatBlock', '<h2>')}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                title="عنوان فرعي H2"
              >
                <Heading2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('formatBlock', '<h3>')}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                title="عنوان قسم H3"
              >
                <Heading3 size={14} />
              </button>

              <span className="w-px h-4 bg-slate-300 mx-1" />

              {/* Formatting */}
              <button
                type="button"
                onClick={() => execCmd('bold')}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700 font-bold"
                title="عريض (Ctrl+B)"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('italic')}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700 italic"
                title="مائل (Ctrl+I)"
              >
                <Italic size={14} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('underline')}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700 underline"
                title="تسطير (Ctrl+U)"
              >
                <Underline size={14} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('strikeThrough')}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700 line-through"
                title="يتوسطه خط"
              >
                <Strikethrough size={14} />
              </button>

              <span className="w-px h-4 bg-slate-300 mx-1" />

              {/* Highlights */}
              <div className="flex items-center gap-1">
                {HIGHLIGHT_COLORS.map((hc) => (
                  <button
                    key={hc.color}
                    type="button"
                    onClick={() => execCmd('hiliteColor', hc.color)}
                    style={{ backgroundColor: hc.color }}
                    className="w-4 h-4 rounded-full border border-slate-300 hover:scale-110 transition-transform"
                    title={`تمييز باللون ${hc.name}`}
                  />
                ))}
              </div>

              <span className="w-px h-4 bg-slate-300 mx-1" />

              {/* Alignment */}
              <button
                type="button"
                onClick={() => execCmd('justifyRight')}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                title="محاذاة لليمين"
              >
                <AlignRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('justifyCenter')}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                title="محاذاة للوسط"
              >
                <AlignCenter size={14} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('justifyLeft')}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                title="محاذاة لليسار"
              >
                <AlignLeft size={14} />
              </button>

              <span className="w-px h-4 bg-slate-300 mx-1" />

              {/* Lists */}
              <button
                type="button"
                onClick={() => execCmd('insertUnorderedList')}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                title="قائمة نقطية"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('insertOrderedList')}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                title="قائمة رقمية"
              >
                <ListOrdered size={14} />
              </button>
              <button
                type="button"
                onClick={() =>
                  insertHtmlAtCursor(
                    `<div class="flex items-center gap-2 my-1"><input type="checkbox" class="w-4 h-4 text-emerald-600 rounded" /> <span>مهمة تدقيق…</span></div><p><br/></p>`
                  )
                }
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                title="قائمة مهام تفاعلية"
              >
                <CheckSquare size={14} />
              </button>

              <span className="w-px h-4 bg-slate-300 mx-1" />

              {/* Insertions */}
              <button
                type="button"
                onClick={insertCallout}
                className="p-1.5 rounded hover:bg-slate-200 text-amber-700"
                title="إدراج تنبيه مميز (Callout)"
              >
                <Sparkles size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertCodeBlock('javascript')}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-800"
                title="إدراج كتلة كود مع زر النسخ"
              >
                <Code2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertTable(3, 3)}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                title="إدراج جدول"
              >
                <TableIcon size={14} />
              </button>

              {/* Image & Attachment triggers */}
              <label className="p-1.5 rounded hover:bg-slate-200 text-blue-600 cursor-pointer" title="إدراج صورة">
                <ImageIcon size={14} />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              <label className="p-1.5 rounded hover:bg-slate-200 text-slate-700 cursor-pointer" title="إرفاق ملف">
                <Paperclip size={14} />
                <input type="file" onChange={handleAttachmentUpload} className="hidden" />
              </label>

              {/* Markdown / Print Export */}
              <div className="ms-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const text = `# ${activeNote.title}\n\n${activeNote.body}`;
                    navigator.clipboard.writeText(text);
                    alert('تم نسخ الملاحظة بتنسيق Markdown.');
                  }}
                  className="px-2 py-1 rounded border border-slate-200 hover:bg-white text-slate-700 text-[11px]"
                  title="نسخ بصيغة Markdown"
                >
                  Markdown
                </button>
              </div>
            </div>

            {/* 4. Canvas Body (Document Sheet) */}
            <div
              className="flex-1 p-6 overflow-y-auto outline-none text-[#0B2E57] text-sm leading-relaxed"
              dir="auto"
              onMouseUp={handleMouseUp}
              onKeyUp={handleMouseUp}
            >
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onKeyDown={handleKeyDown}
                className="min-h-[460px] max-w-3xl mx-auto focus:outline-none space-y-3 prose prose-slate"
                style={{ fontFamily: 'Bahij, "Plus Jakarta Sans", sans-serif' }}
              />
            </div>

            {/* 5. Floating Selection Toolbar (appears on text highlight) */}
            {showFloatingToolbar && selectedText && (
              <div
                style={{ position: 'fixed', top: floatingPosition.top, left: floatingPosition.left, zIndex: 60 }}
                className="bg-slate-900 text-white rounded-xl shadow-xl px-2 py-1.5 flex items-center gap-1.5 text-xs animate-in fade-in zoom-in-95 duration-100"
              >
                <button type="button" onClick={() => execCmd('bold')} className="p-1 hover:bg-slate-800 rounded font-bold">
                  B
                </button>
                <button type="button" onClick={() => execCmd('italic')} className="p-1 hover:bg-slate-800 rounded italic">
                  I
                </button>
                <button type="button" onClick={() => execCmd('underline')} className="p-1 hover:bg-slate-800 rounded underline">
                  U
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('hiliteColor', '#FEF08A')}
                  className="p-1 hover:bg-slate-800 rounded text-amber-300"
                >
                  <Highlighter size={13} />
                </button>
                <span className="w-px h-3 bg-slate-700 mx-0.5" />
                <button
                  type="button"
                  onClick={async () => {
                    await onCreateTaskFromSelection(selectedText, activeNote);
                    setShowFloatingToolbar(false);
                    alert('تم إنشاء مهمة جديدة من النص المحدد بنجاح.');
                  }}
                  className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 font-bold flex items-center gap-1"
                >
                  <CheckSquare size={12} />
                  <span>تحويل لمهمة</span>
                </button>
              </div>
            )}

            {/* 6. Slash Command Menu `/` Popover */}
            {showSlashMenu && (
              <div
                style={{ position: 'fixed', top: slashMenuPosition.top, left: slashMenuPosition.left, zIndex: 60 }}
                className="w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 p-1.5 text-xs text-slate-800 space-y-0.5 animate-in fade-in duration-100"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  أوامر الإدراج السريع (/)
                </div>
                <button
                  type="button"
                  onClick={() => { execCmd('formatBlock', '<h1>'); setShowSlashMenu(false); }}
                  className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2"
                >
                  <Heading1 size={14} className="text-blue-600" />
                  <span>عنوان رئيسي H1</span>
                </button>
                <button
                  type="button"
                  onClick={() => { execCmd('formatBlock', '<h2>'); setShowSlashMenu(false); }}
                  className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2"
                >
                  <Heading2 size={14} className="text-blue-600" />
                  <span>عنوان فرعي H2</span>
                </button>
                <button
                  type="button"
                  onClick={() => { insertCallout(); setShowSlashMenu(false); }}
                  className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2"
                >
                  <Sparkles size={14} className="text-amber-600" />
                  <span>صندوق تنبيه (Callout)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { insertCodeBlock('javascript'); setShowSlashMenu(false); }}
                  className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2"
                >
                  <Code2 size={14} className="text-slate-700" />
                  <span>كتلة كود برمجية</span>
                </button>
                <button
                  type="button"
                  onClick={() => { insertTable(3, 3); setShowSlashMenu(false); }}
                  className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2"
                >
                  <TableIcon size={14} className="text-emerald-600" />
                  <span>جدول بيانات</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    insertHtmlAtCursor('<hr class="my-4 border-slate-300"/><p><br/></p>');
                    setShowSlashMenu(false);
                  }}
                  className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2"
                >
                  <span className="font-bold">—</span>
                  <span>خط فاصل (Divider)</span>
                </button>
              </div>
            )}

            {/* Bottom Status bar */}
            <footer className="px-4 py-2 border-t border-[#D7E7F7] bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span>
                  {activeNote.body.trim() ? activeNote.body.trim().split(/\s+/).length : 0} {l('كلمة', 'words', 'mots')}
                </span>
                <span>•</span>
                <span>
                  {activeNote.body.length} {l('حرف', 'chars', 'caractères')}
                </span>
                <span>•</span>
                <span>
                  {Math.max(1, Math.ceil((activeNote.body.trim().split(/\s+/).length || 0) / 180))} {l('دقيقة قراءة', 'min read', 'min de lecture')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span>الحفظ تلقائي ومشفر على الخادم والجهاز.</span>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <span className="text-4xl mb-3">📝</span>
            <p className="font-bold text-sm text-[#0B2E57]">اختر ملاحظة من القائمة أو أنشئ ملاحظة جديدة</p>
          </div>
        )}
      </main>
    </div>
  );
};
