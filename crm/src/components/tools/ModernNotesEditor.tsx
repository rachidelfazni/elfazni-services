import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Pin,
  Star,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  Link2,
  User,
  ExternalLink,
  Code2,
  Table as TableIcon,
  Image as ImageIcon,
  CheckSquare,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Paperclip,
  Maximize2,
  Minimize2,
  History,
  RotateCcw,
  LayoutGrid,
  LayoutList,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  SlidersHorizontal,
  Info,
  Tag,
  Share2,
} from 'lucide-react';
import { NoteItem } from '../../services/productivityService';
import { productivityService } from '../../services/productivityService';
import { useCopy } from '../../i18n/useCopy';
import { useApp } from '../../context/AppContext';
import {
  WorkspaceShell,
  ResizablePanel,
  ResizeHandle,
  WindowControls,
  UnsavedChangesGuard,
  PanelConfig,
} from '../workspace/resizable';
import '../workspace/resizable/resizable.css';

interface ModernNotesEditorProps {
  notes: NoteItem[];
  onNotesChange: (notes: NoteItem[]) => void;
  onConvertToTask: (note: NoteItem, taskOptions?: any) => Promise<any>;
  onCreateTaskFromSelection: (selectedText: string, note: NoteItem) => Promise<any>;
  username?: string;
  onNavigateToTasks?: () => void;
  activeNoteId?: string | null;
  onSelectNoteId?: (id: string | null) => void;
  onClose?: () => void;
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
  onClose,
}) => {
  const { l, language, isRTL } = useCopy();
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

  // Panel sizing and collapse states
  const [listWidth, setListWidth] = useState(290);
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [propsWidth, setPropsWidth] = useState(280);
  const [isPropsCollapsed, setIsPropsCollapsed] = useState(false);
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);

  // Editor states
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'failed' | 'unsaved'>('saved');
  const [isDirty, setIsDirty] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState({ top: 0, left: 0 });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [reminderDateDraft, setReminderDateDraft] = useState('');
  const [showLinkEntityModal, setShowLinkEntityModal] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showUnsavedGuard, setShowUnsavedGuard] = useState(false);
  const [pendingNoteSwitchId, setPendingNoteSwitchId] = useState<string | null>(null);

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
      setIsDirty(false);
      setSaveStatus('saved');
    }
  }, [activeNote?.id]);

  // Handle note field update with auto-save debounce
  const handleUpdateActiveNote = useCallback(
    (updates: Partial<NoteItem>, immediate: boolean = false) => {
      if (!activeNote) return;
      setSaveStatus('saving');
      setIsDirty(true);

      const updated = {
        ...activeNote,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const nextNotes = notes.map((n) => (n.id === activeNote.id ? updated : n));
      onNotesChange(nextNotes);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      const doSave = async () => {
        try {
          await productivityService.saveNote(updated, username);
          setSaveStatus('saved');
          setIsDirty(false);
        } catch {
          setSaveStatus('failed');
        }
      };

      if (immediate) {
        void doSave();
      } else {
        saveTimeoutRef.current = setTimeout(doSave, 600);
      }
    },
    [activeNote, notes, onNotesChange, username]
  );

  const handleExplicitSave = () => {
    if (!activeNote) return;
    if (editorRef.current) {
      const contentHtml = editorRef.current.innerHTML;
      const body = editorRef.current.innerText || '';
      handleUpdateActiveNote({ contentHtml, body }, true);
    } else {
      handleUpdateActiveNote({}, true);
    }
  };

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
      title: l('ملاحظة جديدة', 'New note', 'Nouvelle note'),
      icon: '📝',
      coverColor: '#0B2E57',
      body: '',
      contentHtml: '<p>ابدأ بكتابة أفكارك، أو اكتب <strong>/</strong> لإدراج العناوين والجداول والمهام...</p>',
      tags: [l('عام', 'General', 'Général')],
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
    if (!confirm(l('هل أنت متأكد من حذف هذه الملاحظة نهائياً؟', 'Are you sure you want to delete this note?', 'Supprimer cette note ?'))) {
      return;
    }
    const nextNotes = notes.filter((n) => n.id !== id);
    onNotesChange(nextNotes);
    if (activeNoteId === id) {
      setActiveNoteId(nextNotes[0]?.id || null);
    }
    await productivityService.deleteNote(id, username);
  };

  // Safe Note Switching with Unsaved Changes Guard
  const handleAttemptSwitchNote = (id: string) => {
    if (isDirty) {
      setPendingNoteSwitchId(id);
      setShowUnsavedGuard(true);
    } else {
      setActiveNoteId(id);
    }
  };

  // Rich Text Formatting Commands
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

  // Table Insertion with horizontal scroll wrapper to PREVENT clipping
  const insertTable = (rows: number = 3, cols: number = 3) => {
    let tbl = `<div class="ws-table-wrapper" contenteditable="false"><table class="w-full border-collapse text-xs" contenteditable="true"><tbody>`;
    for (let r = 0; r < rows; r++) {
      tbl += `<tr>`;
      for (let c = 0; c < cols; c++) {
        tbl += `<td class="p-2 min-w-[90px] border border-slate-200 ${
          r === 0 ? 'bg-slate-100 font-bold text-[#0B2E57]' : ''
        }">خلية ${r + 1},${c + 1}</td>`;
      }
      tbl += `</tr>`;
    }
    tbl += `</tbody></table></div><p><br/></p>`;
    insertHtmlAtCursor(tbl);
  };

  // Code Block Insertion with copy button and horizontal scroll
  const insertCodeBlock = (lang: string = 'javascript') => {
    const codeId = `code_${Date.now()}`;
    const codeHtml = `
      <div class="ws-code-wrapper" contenteditable="false">
        <div class="ws-code-header">
          <span class="font-bold text-[#CC9048]">${lang.toUpperCase()}</span>
          <button type="button" onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.innerText); alert('تم نسخ الكود!');" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] cursor-pointer">
            نسخ الكود
          </button>
        </div>
        <pre class="ws-code-content" contenteditable="true" id="${codeId}"><code>// اكتب الكود هنا...
const status = "success";
console.log("ELFAZNI Workspace Code Runner");</code></pre>
      </div><p><br/></p>
    `;
    insertHtmlAtCursor(codeHtml);
  };

  // Callout Box Insertion
  const insertCallout = () => {
    const calloutHtml = `
      <div class="ws-callout my-3" contenteditable="false">
        <div class="flex items-start gap-2.5">
          <span class="text-base select-none">💡</span>
          <div contenteditable="true" class="flex-1 min-w-0">
            <strong>توجيه إداري:</strong> اكتب الملاحظة أو التعليمات الميدانية هنا...
          </div>
        </div>
      </div><p><br/></p>
    `;
    insertHtmlAtCursor(calloutHtml);
  };

  // Image Upload Insertion
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploaded = await productivityService.uploadFile(file);
    if (uploaded) {
      const imgHtml = `
        <figure class="ws-image-figure my-4 text-center" contenteditable="false">
          <img src="${uploaded.url}" alt="${uploaded.name}" class="max-w-full rounded-xl border border-slate-200 mx-auto shadow-xs" style="max-height: 420px; object-fit: contain;" />
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

  // Selection detection for floating toolbar
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      const text = sel.toString().trim();
      setSelectedText(text);
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setFloatingPosition({
          top: Math.max(10, rect.top - 46),
          left: Math.max(10, rect.left + rect.width / 2 - 100),
        });
        setShowFloatingToolbar(true);
      } catch {
        setShowFloatingToolbar(false);
      }
    } else {
      setShowFloatingToolbar(false);
    }
  };

  // Slash commands '/' handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '/') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSlashMenuPosition({
          top: rect.bottom + 8,
          left: Math.max(10, rect.left - 40),
        });
        setShowSlashMenu(true);
      }
    } else if (e.key === 'Escape') {
      setShowSlashMenu(false);
      setShowFloatingToolbar(false);
    }
  };

  // Tag Management
  const handleAddTag = () => {
    if (!activeNote || !newTagInput.trim()) return;
    const tag = newTagInput.trim();
    if (!activeNote.tags.includes(tag)) {
      handleUpdateActiveNote({ tags: [...activeNote.tags, tag] });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeNote) return;
    handleUpdateActiveNote({
      tags: activeNote.tags.filter((t) => t !== tagToRemove),
    });
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (filterView === 'pinned' && !n.pinned) return false;
    if (filterView === 'favorites' && !n.favorite) return false;
    if (filterView === 'archived' && !n.archived) return false;
    if (filterView !== 'archived' && n.archived) return false;
    if (selectedTag && !n.tags?.includes(selectedTag)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchBody = n.body.toLowerCase().includes(q);
      const matchTags = n.tags.some((t) => t.toLowerCase().includes(q));
      const matchCustomer = n.linkedCustomerName?.toLowerCase().includes(q);
      return matchTitle || matchBody || matchTags || matchCustomer;
    }
    return true;
  });

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])));

  // Word & character counts
  const wordCount = useMemo(() => {
    if (!activeNote?.body) return 0;
    return activeNote.body.trim().split(/\s+/).filter(Boolean).length;
  }, [activeNote?.body]);

  const charCount = activeNote?.body?.length || 0;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  // Reset panels layout
  const handleResetLayout = () => {
    setListWidth(290);
    setIsListCollapsed(false);
    setPropsWidth(280);
    setIsPropsCollapsed(false);
    setIsEditorMaximized(false);
  };

  const workspacePanels: PanelConfig[] = [
    { id: 'list', defaultSize: 290, minSize: 200, maxSize: 480, collapsible: true, collapsedSize: 48 },
    { id: 'editor', defaultSize: 600, minSize: 320, maxSize: 1600 },
    { id: 'properties', defaultSize: 280, minSize: 220, maxSize: 420, collapsible: true, collapsedSize: 0 },
  ];

  return (
    <div className="relative w-full h-full flex flex-col bg-white overflow-hidden text-[#0B2E57]">
      {/* Shell with 3 Resizable Panels */}
      <WorkspaceShell
        workspaceId="my-notes"
        direction="horizontal"
        isRtl={isRTL}
        panels={workspacePanels}
        className="flex-1"
      >
        {/* =========================================================================
            PANEL A: Notes Navigator (Search, Filters, Pinned, Cards, New Note)
           ========================================================================= */}
        <ResizablePanel
          id="list"
          size={listWidth}
          minSize={200}
          maxSize={480}
          isCollapsed={isListCollapsed}
          collapsedSize={48}
          className="border-e border-[#D7E7F7] bg-slate-50/70 shrink-0 flex flex-col transition-[width] duration-150"
        >
          {!isListCollapsed ? (
            <>
              {/* Top Bar: Title & Actions */}
              <div className="p-3 border-b border-[#D7E7F7] space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#0B2E57] flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#CC9048]" />
                    {l('المفكرة الذكية', 'Smart Notes', 'Bloc-notes')}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setLayoutMode(layoutMode === 'list' ? 'cards' : 'list')}
                      className="p-1 rounded-lg text-slate-500 hover:bg-slate-200/60 transition cursor-pointer"
                      title={layoutMode === 'list' ? 'عرض بطاقات' : 'عرض قائمة'}
                    >
                      {layoutMode === 'list' ? <LayoutGrid size={14} /> : <LayoutList size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsListCollapsed(true)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title="طي قائمة الملاحظات (Collapse)"
                      aria-label="طي القائمة"
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
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                  <button
                    type="button"
                    onClick={() => { setFilterView('all'); setSelectedTag(null); }}
                    className={`px-2 py-0.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                      filterView === 'all' && !selectedTag ? 'bg-[#0B2E57] text-white' : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    الكل ({notes.filter((n) => !n.archived).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterView('pinned')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                      filterView === 'pinned' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    <Pin size={10} /> مثبتة
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterView('favorites')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                      filterView === 'favorites' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    <Star size={10} /> مميزة
                  </button>
                </div>
              </div>

              {/* Notes List with Independent Scroll */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
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
                        onClick={() => handleAttemptSwitchNote(note.id)}
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
              <div className="p-2 border-t border-[#D7E7F7] shrink-0">
                <button
                  type="button"
                  onClick={handleCreateNote}
                  className="w-full py-2 px-3 rounded-xl bg-[#004AA5] hover:bg-[#2A83D5] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{l('ملاحظة جديدة', 'New note', 'Nouvelle note')}</span>
                </button>
              </div>
            </>
          ) : (
            /* Collapsed Compact Icon Rail */
            <div className="p-2 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setIsListCollapsed(false)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
                title="توسيع قائمة الملاحظات (Expand)"
                aria-label="توسيع القائمة"
              >
                <PanelLeftOpen size={16} />
              </button>
              <button
                type="button"
                onClick={handleCreateNote}
                className="p-2 rounded-xl bg-[#004AA5] text-white hover:bg-[#2A83D5] transition cursor-pointer"
                title="ملاحظة جديدة"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </ResizablePanel>

        {/* =========================================================================
            RESIZE HANDLE 1 (Between List and Editor)
           ========================================================================= */}
        {!isListCollapsed && !isEditorMaximized && (
          <ResizeHandle
            id="handle-list"
            direction="horizontal"
            isRtl={isRTL}
            currentSize={listWidth}
            minSize={200}
            maxSize={480}
            onResize={(delta) => setListWidth((prev) => Math.max(200, Math.min(480, prev + delta)))}
            onReset={() => setListWidth(290)}
            ariaLabel="مقبض تعديل عرض قائمة الملاحظات"
          />
        )}

        {/* =========================================================================
            PANEL B: Rich Text Editor Canvas (Toolbar, Editable Surface, Window Controls)
           ========================================================================= */}
        <ResizablePanel
          id="editor"
          isMaximized={isEditorMaximized}
          className="flex-1 flex flex-col bg-white overflow-hidden min-w-0"
        >
          {activeNote ? (
            <>
              {/* Top Window & Action Header */}
              <header className="px-4 py-2 border-b border-[#D7E7F7] flex flex-wrap items-center justify-between gap-2 bg-white shrink-0">
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

                {/* Right Header: Status, Properties Toggle & Desktop Window Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Autosave Status Pill */}
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      saveStatus === 'saved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : saveStatus === 'saving'
                        ? 'bg-amber-50 text-amber-700'
                        : saveStatus === 'unsaved'
                        ? 'bg-amber-100 text-amber-800'
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
                    {saveStatus === 'saved' ? 'تم الحفظ' : saveStatus === 'saving' ? 'جاري الحفظ…' : 'تغييرات غير محفوظة'}
                  </span>

                  {/* Pin Button */}
                  <button
                    type="button"
                    onClick={() => handleUpdateActiveNote({ pinned: !activeNote.pinned })}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
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
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
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
                    className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold flex items-center gap-1 transition text-xs cursor-pointer"
                    title="تحويل الملاحظة كاملة إلى مهمة"
                  >
                    <CheckSquare size={13} />
                    <span className="hidden sm:inline">تحويل لمهمة</span>
                  </button>

                  {/* Toggle Note Properties Panel */}
                  <button
                    type="button"
                    onClick={() => setIsPropsCollapsed(!isPropsCollapsed)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-xs ${
                      !isPropsCollapsed
                        ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title="خصائص الملاحظة وتفاصيلها (Panel C)"
                  >
                    <Info size={13} />
                    <span className="hidden md:inline">الخصائص</span>
                  </button>

                  <span className="w-px h-4 bg-slate-200 mx-0.5" />

                  {/* Standardized Window Controls (Save, Maximize, Reset Layout, Close) */}
                  <WindowControls
                    showSave={true}
                    saveStatus={saveStatus}
                    onSave={handleExplicitSave}
                    showReset={true}
                    onResetLayout={handleResetLayout}
                    onMaximize={() => setIsEditorMaximized(!isEditorMaximized)}
                    isMaximized={isEditorMaximized}
                    onClose={onClose}
                    isRtl={isRTL}
                  />

                  {/* Delete Note */}
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(activeNote.id)}
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="حذف الملاحظة"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </header>

              {/* Rich WYSIWYG Modern Editing Toolbar (Wrapped to PREVENT overflow clipping) */}
              <div className="px-3 py-1.5 border-b border-[#D7E7F7] bg-slate-50 flex flex-wrap items-center gap-1 text-xs shrink-0 select-none overflow-x-auto scrollbar-none">
                {/* Headings */}
                <button
                  type="button"
                  onClick={() => execCmd('formatBlock', '<h1>')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="عنوان رئيسي H1"
                >
                  <Heading1 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('formatBlock', '<h2>')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="عنوان فرعي H2"
                >
                  <Heading2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('formatBlock', '<h3>')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="عنوان قسم H3"
                >
                  <Heading3 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('formatBlock', '<p>')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  title="فقرة عادية"
                >
                  P
                </button>

                <span className="w-px h-4 bg-slate-300 mx-1" />

                {/* Inline Formatting */}
                <button
                  type="button"
                  onClick={() => execCmd('bold')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-800 font-bold transition cursor-pointer"
                  title="عريض (Ctrl+B)"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('italic')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-800 italic transition cursor-pointer"
                  title="مائل (Ctrl+I)"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('underline')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-800 underline transition cursor-pointer"
                  title="تسطير (Ctrl+U)"
                >
                  U
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('strikeThrough')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-800 line-through transition cursor-pointer"
                  title="يتوسطه خط"
                >
                  S
                </button>

                <span className="w-px h-4 bg-slate-300 mx-1" />

                {/* Colors */}
                <div className="flex items-center gap-0.5">
                  {COLOR_OPTIONS.slice(0, 4).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => execCmd('foreColor', c)}
                      className="w-4 h-4 rounded-full border border-white/50 shadow-2xs hover:scale-110 transition cursor-pointer"
                      style={{ backgroundColor: c }}
                      title="لون الخط"
                    />
                  ))}
                </div>

                <span className="w-px h-4 bg-slate-300 mx-1" />

                {/* Alignment */}
                <button
                  type="button"
                  onClick={() => execCmd('justifyRight')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="محاذاة لليمين"
                >
                  <AlignRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('justifyCenter')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="محاذاة للوسط"
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('justifyLeft')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="محاذاة لليسار"
                >
                  <AlignLeft size={14} />
                </button>

                <span className="w-px h-4 bg-slate-300 mx-1" />

                {/* Lists & Checkboxes */}
                <button
                  type="button"
                  onClick={() => execCmd('insertUnorderedList')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="قائمة نقطية"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('insertOrderedList')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition cursor-pointer"
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
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="قائمة مهام تفاعلية"
                >
                  <CheckSquare size={14} />
                </button>

                <span className="w-px h-4 bg-slate-300 mx-1" />

                {/* Advanced Structured Inserts */}
                <button
                  type="button"
                  onClick={insertCallout}
                  className="p-1.5 rounded hover:bg-slate-200 text-amber-700 transition cursor-pointer"
                  title="إدراج تنبيه مميز (Callout)"
                >
                  <Sparkles size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => insertCodeBlock('javascript')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-800 transition cursor-pointer"
                  title="إدراج كتلة كود برمجية مع شريط نسخ"
                >
                  <Code2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => insertTable(3, 3)}
                  className="p-1.5 rounded hover:bg-slate-200 text-emerald-700 transition cursor-pointer"
                  title="إدراج جدول بيانات متجاوب"
                >
                  <TableIcon size={14} />
                </button>

                {/* Image & Attachment triggers */}
                <label className="p-1.5 rounded hover:bg-slate-200 text-blue-600 cursor-pointer transition" title="إدراج صورة">
                  <ImageIcon size={14} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <label className="p-1.5 rounded hover:bg-slate-200 text-slate-700 cursor-pointer transition" title="إرفاق ملف">
                  <Paperclip size={14} />
                  <input type="file" onChange={handleAttachmentUpload} className="hidden" />
                </label>

                {/* Markdown Export */}
                <div className="ms-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `# ${activeNote.title}\n\n${activeNote.body}`;
                      navigator.clipboard.writeText(text);
                      alert('تم نسخ الملاحظة بتنسيق Markdown.');
                    }}
                    className="px-2 py-1 rounded border border-slate-200 hover:bg-white text-slate-700 text-[11px] font-mono transition cursor-pointer"
                    title="نسخ بصيغة Markdown"
                  >
                    Markdown
                  </button>
                </div>
              </div>

              {/* Main Document Canvas (With Strict Min-W-0 and Independent Vertical Scroll) */}
              <div
                className="flex-1 p-6 overflow-y-auto overflow-x-hidden outline-none text-[#0B2E57] text-sm leading-relaxed min-w-0"
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
                  className="min-h-[460px] max-w-3xl mx-auto focus:outline-none space-y-3 prose prose-slate w-full"
                  style={{ fontFamily: 'Bahij, "Plus Jakarta Sans", sans-serif' }}
                />
              </div>

              {/* Floating Selection Toolbar */}
              {showFloatingToolbar && selectedText && (
                <div
                  style={{ position: 'fixed', top: floatingPosition.top, left: floatingPosition.left, zIndex: 60 }}
                  className="bg-slate-900 text-white rounded-xl shadow-xl px-2 py-1.5 flex items-center gap-1.5 text-xs animate-in fade-in zoom-in-95 duration-100 select-none"
                >
                  <button type="button" onClick={() => execCmd('bold')} className="p-1 hover:bg-slate-800 rounded font-bold cursor-pointer">
                    B
                  </button>
                  <button type="button" onClick={() => execCmd('italic')} className="p-1 hover:bg-slate-800 rounded italic cursor-pointer">
                    I
                  </button>
                  <button type="button" onClick={() => execCmd('underline')} className="p-1 hover:bg-slate-800 rounded underline cursor-pointer">
                    U
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('hiliteColor', '#FEF08A')}
                    className="p-1 hover:bg-slate-800 rounded text-amber-300 cursor-pointer"
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
                    className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckSquare size={12} />
                    <span>تحويل لمهمة</span>
                  </button>
                </div>
              )}

              {/* Slash Command Menu `/` Popover */}
              {showSlashMenu && (
                <div
                  style={{ position: 'fixed', top: slashMenuPosition.top, left: slashMenuPosition.left, zIndex: 60 }}
                  className="w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 p-1.5 text-xs text-slate-800 space-y-0.5 animate-in fade-in duration-100 select-none"
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    أوامر الإدراج السريع (/)
                  </div>
                  <button
                    type="button"
                    onClick={() => { execCmd('formatBlock', '<h1>'); setShowSlashMenu(false); }}
                    className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <Heading1 size={14} className="text-blue-600" />
                    <span>عنوان رئيسي H1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { execCmd('formatBlock', '<h2>'); setShowSlashMenu(false); }}
                    className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <Heading2 size={14} className="text-blue-600" />
                    <span>عنوان فرعي H2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { insertCallout(); setShowSlashMenu(false); }}
                    className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={14} className="text-amber-600" />
                    <span>صندوق تنبيه (Callout)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { insertCodeBlock('javascript'); setShowSlashMenu(false); }}
                    className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <Code2 size={14} className="text-slate-700" />
                    <span>كتلة كود برمجية</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { insertTable(3, 3); setShowSlashMenu(false); }}
                    className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <TableIcon size={14} className="text-emerald-600" />
                    <span>جدول بيانات متجاوب</span>
                  </button>
                </div>
              )}

              {/* Bottom Document Metrics Footer */}
              <footer className="px-4 py-2 border-t border-[#D7E7F7] bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono">
                    {wordCount} {l('كلمة', 'words', 'mots')}
                  </span>
                  <span>•</span>
                  <span className="font-mono">
                    {charCount} {l('حرف', 'chars', 'caractères')}
                  </span>
                  <span>•</span>
                  <span>
                    {readTimeMinutes} {l('دقيقة قراءة تقريبية', 'min read', 'min de lecture')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">حفظ ذري وتشفير محلي متزامن مع الخادم.</span>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <span className="text-4xl mb-3">📝</span>
              <p className="font-bold text-sm text-[#0B2E57]">اختر ملاحظة من القائمة أو أنشئ ملاحظة جديدة</p>
            </div>
          )}
        </ResizablePanel>

        {/* =========================================================================
            RESIZE HANDLE 2 (Between Editor and Properties Panel)
           ========================================================================= */}
        {!isPropsCollapsed && !isEditorMaximized && activeNote && (
          <ResizeHandle
            id="handle-props"
            direction="horizontal"
            isRtl={isRTL}
            currentSize={propsWidth}
            minSize={220}
            maxSize={420}
            onResize={(delta) => setPropsWidth((prev) => Math.max(220, Math.min(420, prev - delta)))}
            onReset={() => setPropsWidth(280)}
            ariaLabel="مقبض تعديل عرض خصائص الملاحظة"
          />
        )}

        {/* =========================================================================
            PANEL C: Note Properties & Metadata (Tags, CRM Association, Reminders)
           ========================================================================= */}
        {!isPropsCollapsed && !isEditorMaximized && activeNote && (
          <ResizablePanel
            id="properties"
            size={propsWidth}
            minSize={220}
            maxSize={420}
            className="border-s border-[#D7E7F7] bg-slate-50/80 shrink-0 flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div className="p-3 border-b border-[#D7E7F7] flex items-center justify-between shrink-0 bg-white">
              <span className="text-xs font-black text-[#0B2E57] flex items-center gap-1.5">
                <Info size={14} className="text-[#004AA5]" />
                {l('خصائص الملاحظة', 'Note Details', 'Détails de la note')}
              </span>
              <button
                type="button"
                onClick={() => setIsPropsCollapsed(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title="إخفاء لوحة الخصائص"
              >
                <PanelRightClose size={14} />
              </button>
            </div>

            <div className="p-4 space-y-5 text-xs">
              {/* Tags Section */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#0B2E57] uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={12} className="text-[#CC9048]" />
                  <span>الوسوم والتصنيفات:</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {activeNote.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-blue-500 hover:text-rose-600 transition"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="وسم جديد..."
                    className="flex-1 px-2.5 py-1 text-xs bg-white border border-[#D7E7F7] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-2.5 py-1 bg-[#004AA5] text-white rounded-lg font-bold hover:bg-[#003B84] transition"
                  >
                    إضافة
                  </button>
                </div>
              </div>

              {/* Linked CRM Association */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-[11px] font-black text-[#0B2E57] uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 size={12} className="text-blue-600" />
                  <span>ربط بسجل عميل أو معاملة:</span>
                </label>

                {/* Customer Link Select */}
                <select
                  value={activeNote.linkedCustomerId || ''}
                  onChange={(e) => {
                    const selectedContact = contactBook.contacts.find((c) => c.id === e.target.value);
                    handleUpdateActiveNote({
                      linkedCustomerId: selectedContact?.id,
                      linkedCustomerName: selectedContact ? selectedContact.name : undefined,
                    });
                  }}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                >
                  <option value="">— ربط بملف عميل —</option>
                  {contactBook.contacts.slice(0, 50).map((c) => (
                    <option key={c.id} value={c.id}>
                      👤 {c.name} ({c.phone || 'عميل'})
                    </option>
                  ))}
                </select>

                {/* Transaction Link Select */}
                <select
                  value={activeNote.linkedRecordId ? `${activeNote.linkedRecordType}:${activeNote.linkedRecordId}` : ''}
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
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                >
                  <option value="">— ربط بمعاملة قنصلية أو طيران —</option>
                  <optgroup label="المواعيد القنصلية">
                    {consulateAppointments.slice(0, 20).map((c) => (
                      <option key={c.id} value={`cns:${c.id}`}>
                        🏛️ {c.clientName} — {c.appointmentType}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="حجوزات الطيران">
                    {flightBookings.slice(0, 20).map((f) => (
                      <option key={f.id} value={`fly:${f.id}`}>
                        ✈️ {f.clientName} — {f.airlineAndRoute || f.pnr}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Reminder Section */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-[11px] font-black text-[#0B2E57] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={12} className="text-amber-600" />
                  <span>تاريخ وتوقيت التذكير:</span>
                </label>
                <input
                  type="datetime-local"
                  value={activeNote.reminderDateTime?.slice(0, 16) || ''}
                  onChange={(e) => {
                    handleUpdateActiveNote({
                      reminderDateTime: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    });
                  }}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
                {activeNote.reminderDateTime && (
                  <button
                    type="button"
                    onClick={() => handleUpdateActiveNote({ reminderDateTime: undefined })}
                    className="text-[11px] text-rose-600 hover:underline block"
                  >
                    إلغاء التذكير الحالي
                  </button>
                )}
              </div>

              {/* Document Info Metadata */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                <div className="flex justify-between">
                  <span>تاريخ الإنشاء:</span>
                  <span className="font-mono">{new Date(activeNote.createdAt).toLocaleString(language === 'ar' ? 'ar-MA' : 'en-GB')}</span>
                </div>
                <div className="flex justify-between">
                  <span>آخر تعديل:</span>
                  <span className="font-mono">{new Date(activeNote.updatedAt).toLocaleString(language === 'ar' ? 'ar-MA' : 'en-GB')}</span>
                </div>
                <div className="flex justify-between">
                  <span>المستخدم المالك:</span>
                  <span className="font-bold text-slate-700">{activeNote.userId}</span>
                </div>
              </div>
            </div>
          </ResizablePanel>
        )}
      </WorkspaceShell>

      {/* Unsaved Changes Guard Dialog */}
      <UnsavedChangesGuard
        open={showUnsavedGuard}
        onSaveAndClose={() => {
          handleExplicitSave();
          setShowUnsavedGuard(false);
          if (pendingNoteSwitchId) {
            setActiveNoteId(pendingNoteSwitchId);
            setPendingNoteSwitchId(null);
          }
        }}
        onDiscardAndClose={() => {
          setIsDirty(false);
          setShowUnsavedGuard(false);
          if (pendingNoteSwitchId) {
            setActiveNoteId(pendingNoteSwitchId);
            setPendingNoteSwitchId(null);
          }
        }}
        onCancel={() => {
          setShowUnsavedGuard(false);
          setPendingNoteSwitchId(null);
        }}
        isRtl={isRTL}
      />
    </div>
  );
};
