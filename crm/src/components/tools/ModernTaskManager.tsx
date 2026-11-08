import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Tag,
  User,
  Paperclip,
  CheckSquare,
  AlertCircle,
  Search,
  Filter,
  Columns,
  List,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  ExternalLink,
  MessageSquare,
  UploadCloud,
  FileText,
  AlertTriangle,
  ArrowRight,
  MoreVertical,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  productivityService,
  TaskItem,
  TaskStatus,
  TaskPriority,
  SubtaskItem,
  TaskAttachment,
} from '../../services/productivityService';

interface ModernTaskManagerProps {
  initialTasks?: TaskItem[];
  onTasksChange?: (tasks: TaskItem[]) => void;
  onOpenNote?: (noteId: string) => void;
  onGotoTab?: (tab: string) => void;
  lang?: 'ar' | 'en' | 'fr';
  username?: string;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: { ar: string; en: string; fr: string }; bg: string; text: string; border: string; dot: string }
> = {
  todo: {
    label: { ar: 'قيد الانتظار', en: 'To Do', fr: 'À faire' },
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  in_progress: {
    label: { ar: 'قيد التنفيذ', en: 'In Progress', fr: 'En cours' },
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-[#004AA5]',
  },
  waiting: {
    label: { ar: 'بانتظار المستندات', en: 'Waiting', fr: 'En attente' },
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-[#CC9048]',
  },
  done: {
    label: { ar: 'مكتملة', en: 'Completed', fr: 'Terminée' },
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: { ar: 'ملغاة', en: 'Cancelled', fr: 'Annulée' },
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-400',
  },
};

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: { ar: string; en: string; fr: string }; color: string; badge: string }
> = {
  urgent: {
    label: { ar: 'عاجل جدًا', en: 'Urgent', fr: 'Urgent' },
    color: '#DC2626',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  high: {
    label: { ar: 'أولوية عالية', en: 'High', fr: 'Haute' },
    color: '#EA580C',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  medium: {
    label: { ar: 'أولوية متوسطة', en: 'Medium', fr: 'Moyenne' },
    color: '#2563EB',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  low: {
    label: { ar: 'أولوية منخفضة', en: 'Low', fr: 'Basse' },
    color: '#64748B',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

const TEAM_MEMBERS = [
  'رشيد الفزني (المدير)',
  'مريم العلمي (العمليات)',
  'يوسف التازي (التأشيرات)',
  'سارة بنجلون (حجوزات الطيران)',
];

export const ModernTaskManager: React.FC<ModernTaskManagerProps> = ({
  initialTasks = [],
  onTasksChange,
  onOpenNote,
  onGotoTab,
  lang = 'ar',
  username = 'owner',
}) => {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [listGroup, setListGroup] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Quick Add State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDueDate, setQuickDueDate] = useState('');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('medium');

  // Subtask Input
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const l = (ar: string, en: string, fr: string) => {
    if (lang === 'en') return en;
    if (lang === 'fr') return fr;
    return ar;
  };

  useEffect(() => {
    if (initialTasks.length > 0) {
      setTasks(initialTasks);
    } else {
      productivityService.fetchState(username).then((state) => {
        if (state.tasks && state.tasks.length > 0) {
          setTasks(state.tasks);
        }
      });
    }
  }, [initialTasks, username]);

  const commitTasks = (newTasks: TaskItem[]) => {
    setTasks(newTasks);
    onTasksChange?.(newTasks);
    productivityService.saveToLocalCache(
      {
        ...productivityService.migrateLegacyLocalStorage(username),
        tasks: newTasks,
      },
      username
    );
  };

  // Quick Add
  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;

    const newTask: Partial<TaskItem> = {
      title,
      dueDate: quickDueDate || undefined,
      priority: quickPriority,
      status: 'todo',
      assignee: 'رشيد الفزني (المدير)',
      tags: ['عام'],
      subtasks: [],
      attachments: [],
    };

    const saved = await productivityService.saveTask(newTask, username);
    const updated = [saved, ...tasks];
    commitTasks(updated);
    setQuickTitle('');
    setQuickDueDate('');
    setQuickPriority('medium');
  };

  const handleToggleTaskStatus = async (task: TaskItem) => {
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    const now = new Date().toISOString();
    const updatedTask: TaskItem = {
      ...task,
      status: nextStatus,
      completedAt: nextStatus === 'done' ? now : undefined,
      updatedAt: now,
    };

    const nextTasks = tasks.map((t) => (t.id === task.id ? updatedTask : t));
    commitTasks(nextTasks);
    await productivityService.saveTask(updatedTask, username);
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const now = new Date().toISOString();
    const updatedTask: TaskItem = {
      ...task,
      status: newStatus,
      completedAt: newStatus === 'done' ? now : undefined,
      updatedAt: now,
    };

    const nextTasks = tasks.map((t) => (t.id === taskId ? updatedTask : t));
    commitTasks(nextTasks);
    await productivityService.saveTask(updatedTask, username);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (activeTaskId === taskId) setActiveTaskId(null);
    const nextTasks = tasks.filter((t) => t.id !== taskId);
    commitTasks(nextTasks);
    await productivityService.deleteTask(taskId, username);
  };

  // Active Task in Drawer
  const activeTask = useMemo(() => {
    return tasks.find((t) => t.id === activeTaskId) || null;
  }, [tasks, activeTaskId]);

  const updateActiveTask = async (patch: Partial<TaskItem>) => {
    if (!activeTask) return;
    const now = new Date().toISOString();
    const updated: TaskItem = {
      ...activeTask,
      ...patch,
      updatedAt: now,
    };
    const nextTasks = tasks.map((t) => (t.id === activeTask.id ? updated : t));
    commitTasks(nextTasks);
    await productivityService.saveTask(updated, username);
  };

  // Subtask management
  const handleAddSubtask = () => {
    if (!activeTask || !newSubtaskTitle.trim()) return;
    const newSub: SubtaskItem = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: newSubtaskTitle.trim(),
      done: false,
    };
    const nextSubtasks = [...(activeTask.subtasks || []), newSub];
    updateActiveTask({ subtasks: nextSubtasks });
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subId: string) => {
    if (!activeTask) return;
    const nextSubtasks = (activeTask.subtasks || []).map((s) =>
      s.id === subId ? { ...s, done: !s.done } : s
    );
    updateActiveTask({ subtasks: nextSubtasks });
  };

  const handleDeleteSubtask = (subId: string) => {
    if (!activeTask) return;
    const nextSubtasks = (activeTask.subtasks || []).filter((s) => s.id !== subId);
    updateActiveTask({ subtasks: nextSubtasks });
  };

  // Tag management
  const handleAddTag = () => {
    if (!activeTask || !newTagInput.trim()) return;
    const tag = newTagInput.trim().replace(/^#/, '');
    if (!activeTask.tags.includes(tag)) {
      updateActiveTask({ tags: [...activeTask.tags, tag] });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeTask) return;
    updateActiveTask({ tags: activeTask.tags.filter((t) => t !== tagToRemove) });
  };

  // Comments
  const handleAddComment = () => {
    if (!activeTask || !newCommentText.trim()) return;
    const newComment = {
      id: `c_${Date.now()}`,
      author: username === 'owner' ? 'رشيد الفزني' : username,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };
    const nextComments = [...(activeTask.comments || []), newComment];
    updateActiveTask({ comments: nextComments });
    setNewCommentText('');
  };

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeTask || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const res = await productivityService.uploadFile(file);
    if (res) {
      const att: TaskAttachment = {
        id: `att_${Date.now()}`,
        name: res.name,
        url: res.url,
        size: res.size,
        type: res.type,
      };
      updateActiveTask({ attachments: [...(activeTask.attachments || []), att] });
    }
  };

  // Filtered Tasks
  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        const matchesTags = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }
      // Priority
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      // Assignee
      if (assigneeFilter !== 'all' && t.assignee !== assigneeFilter) return false;

      // Grouping tab
      if (listGroup === 'today') {
        return t.dueDate === todayStr;
      }
      if (listGroup === 'upcoming') {
        return Boolean(t.dueDate && t.dueDate > todayStr && t.status !== 'done');
      }
      if (listGroup === 'overdue') {
        return Boolean(t.dueDate && t.dueDate < todayStr && t.status !== 'done');
      }
      if (listGroup === 'done') {
        return t.status === 'done';
      }

      return true;
    });
  }, [tasks, searchQuery, priorityFilter, assigneeFilter, listGroup, todayStr]);

  // Grouped by Kanban columns
  const kanbanColumns: TaskStatus[] = ['todo', 'in_progress', 'waiting', 'done'];

  return (
    <div className="w-full flex flex-col h-full bg-[#FAFBFD] text-[#0B2E57]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Filter and Actions Toolbar */}
      <div className="p-4 bg-white border-b border-[#D7E7F7] flex flex-wrap items-center justify-between gap-3 shadow-sm shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick-add form */}
          <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder={l('أضف مهمة جديدة واضغط Enter…', 'Add a new task and press Enter…', 'Ajouter une tâche…')}
                className="w-56 sm:w-80 h-9 px-3 text-[13px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white focus:border-[#004AA5] outline-none transition"
              />
            </div>
            <input
              type="date"
              value={quickDueDate}
              onChange={(e) => setQuickDueDate(e.target.value)}
              className="h-9 px-2 text-[12px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white focus:border-[#004AA5] outline-none text-[#5E7086]"
              title={l('تاريخ الاستحقاق', 'Due Date', 'Date d’échéance')}
            />
            <select
              value={quickPriority}
              onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
              className="h-9 px-2 text-[12px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white focus:border-[#004AA5] outline-none text-[#0B2E57]"
            >
              <option value="urgent">{l('عاجل', 'Urgent', 'Urgent')}</option>
              <option value="high">{l('عالية', 'High', 'Haute')}</option>
              <option value="medium">{l('متوسطة', 'Medium', 'Moyenne')}</option>
              <option value="low">{l('منخفضة', 'Low', 'Basse')}</option>
            </select>
            <button
              type="submit"
              className="h-9 px-3.5 rounded-xl bg-[#004AA5] hover:bg-[#2A83D5] text-white text-[13px] font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Plus size={15} />
              <span>{l('إضافة', 'Add', 'Ajouter')}</span>
            </button>
          </form>
        </div>

        {/* View Switcher and Filters */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute top-2.5 start-2.5 text-[#5E7086]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={l('بحث في المهام…', 'Search tasks…', 'Rechercher…')}
              className="h-9 ps-8 pe-3 text-[12px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white focus:border-[#004AA5] outline-none w-36 sm:w-48"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-[#D7E7F7] rounded-xl p-0.5 bg-[#F8FAFC]">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 text-[12px] font-bold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'list' ? 'bg-white shadow-xs text-[#004AA5]' : 'text-[#5E7086] hover:text-[#0B2E57]'
              }`}
            >
              <List size={14} />
              <span className="hidden sm:inline">{l('قائمة', 'List', 'Liste')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 text-[12px] font-bold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white shadow-xs text-[#004AA5]' : 'text-[#5E7086] hover:text-[#0B2E57]'
              }`}
            >
              <Columns size={14} />
              <span className="hidden sm:inline">{l('كانبان', 'Kanban', 'Kanban')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* List Sub-tabs / Filters (when in list mode) */}
      {viewMode === 'list' && (
        <div className="px-4 py-2 bg-[#F1F6FB] border-b border-[#D7E7F7] flex items-center justify-between gap-2 overflow-x-auto text-[12px] shrink-0">
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: l('جميع المهام', 'All Tasks', 'Toutes les tâches'), count: tasks.length },
              {
                id: 'today',
                label: l('اليوم', 'Today', 'Aujourd’hui'),
                count: tasks.filter((t) => t.dueDate === todayStr).length,
              },
              {
                id: 'upcoming',
                label: l('القادمة', 'Upcoming', 'À venir'),
                count: tasks.filter((t) => t.dueDate && t.dueDate > todayStr && t.status !== 'done').length,
              },
              {
                id: 'overdue',
                label: l('متأخرة', 'Overdue', 'En retard'),
                count: tasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'done').length,
              },
              {
                id: 'done',
                label: l('مكتملة', 'Completed', 'Terminées'),
                count: tasks.filter((t) => t.status === 'done').length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setListGroup(tab.id as any)}
                className={`px-3 py-1 rounded-lg font-bold transition inline-flex items-center gap-1.5 cursor-pointer ${
                  listGroup === tab.id
                    ? 'bg-white text-[#004AA5] shadow-xs border border-[#D7E7F7]'
                    : 'text-[#5E7086] hover:text-[#0B2E57]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    listGroup === tab.id ? 'bg-[#EAF4FF] text-[#004AA5]' : 'bg-slate-200/60 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[#5E7086] text-[11px] hidden md:inline">{l('الأولوية:', 'Priority:', 'Priorité:')}</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="h-7 px-2 text-[11px] rounded-lg border border-[#D7E7F7] bg-white text-[#0B2E57] outline-none"
            >
              <option value="all">{l('جميع الأولويات', 'All Priorities', 'Toutes les priorités')}</option>
              <option value="urgent">{l('عاجل', 'Urgent', 'Urgent')}</option>
              <option value="high">{l('عالية', 'High', 'Haute')}</option>
              <option value="medium">{l('متوسطة', 'Medium', 'Moyenne')}</option>
              <option value="low">{l('منخفضة', 'Low', 'Basse')}</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex relative">
        {/* Left/Main Task Display */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {viewMode === 'list' ? (
            /* LIST VIEW */
            filteredTasks.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#D7E7F7] rounded-2xl bg-white">
                <CheckSquare size={36} className="text-[#CC9048] mb-2 opacity-60" />
                <h4 className="text-[14px] font-bold text-[#0B2E57]">{l('لا توجد مهام مطابقة', 'No matching tasks', 'Aucune tâche')}</h4>
                <p className="text-[12px] text-[#5E7086] mt-1 max-w-sm">
                  {l(
                    'أنشئ مهمة جديدة باستخدام الشريط العلوي، أو قم بتغيير الفلاتر المختارة.',
                    'Create a new task using the bar above, or modify your filters.',
                    'Créez une tâche ci-dessus ou modifiez vos filtres.'
                  )}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== 'done';
                const subDoneCount = (task.subtasks || []).filter((s) => s.done).length;
                const totalSubCount = (task.subtasks || []).length;
                const progressPct = totalSubCount > 0 ? Math.round((subDoneCount / totalSubCount) * 100) : 0;

                return (
                  <div
                    key={task.id}
                    onClick={() => setActiveTaskId(task.id)}
                    className={`group flex items-center gap-3 p-3 rounded-xl border bg-white hover:border-[#004AA5]/60 hover:shadow-xs transition cursor-pointer ${
                      task.id === activeTaskId
                        ? 'border-[#004AA5] ring-2 ring-[#004AA5]/10 bg-[#FAFBFD]'
                        : task.status === 'done'
                        ? 'border-slate-200 bg-slate-50/50 opacity-75'
                        : 'border-[#D7E7F7]'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTaskStatus(task);
                      }}
                      className={`w-5 h-5 rounded-lg border-2 grid place-items-center transition shrink-0 ${
                        task.status === 'done'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-[#D7E7F7] hover:border-[#004AA5]'
                      }`}
                    >
                      {task.status === 'done' && <Check size={13} strokeWidth={3} />}
                    </button>

                    {/* Priority Indicator Pill */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                        PRIORITY_CONFIG[task.priority]?.badge || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {PRIORITY_CONFIG[task.priority]?.label[lang]}
                    </span>

                    {/* Title & Subtitle */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[13px] font-bold truncate block ${
                            task.status === 'done' ? 'line-through text-slate-400' : 'text-[#0B2E57]'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.linkedNoteTitle && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (task.linkedNoteId) onOpenNote?.(task.linkedNoteId);
                            }}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#EAF4FF] text-[#004AA5] text-[10px] font-bold hover:bg-[#D7E7F7] transition"
                            title={l('مرتبطة بملاحظة', 'Linked to note', 'Liée à une note')}
                          >
                            <FileText size={10} />
                            <span className="truncate max-w-[120px]">{task.linkedNoteTitle}</span>
                          </span>
                        )}
                        {task.linkedCustomerName && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FFF8E7] text-[#CC9048] text-[10px] font-bold">
                            <User size={10} />
                            <span className="truncate max-w-[100px]">{task.linkedCustomerName}</span>
                          </span>
                        )}
                      </div>

                      {/* Subtasks Progress */}
                      {totalSubCount > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPct}%` }} />
                          </div>
                          <span className="text-[10px] text-[#5E7086] font-mono">
                            {subDoneCount}/{totalSubCount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Due Date */}
                    {task.dueDate && (
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono shrink-0 ${
                          isOverdue
                            ? 'bg-rose-50 text-rose-600 border border-rose-200 font-bold'
                            : 'bg-[#F8FAFC] text-[#5E7086] border border-[#D7E7F7]'
                        }`}
                        dir="ltr"
                      >
                        <Calendar size={11} className={isOverdue ? 'text-rose-500' : 'text-[#5E7086]'} />
                        <span>{task.dueDate}</span>
                      </div>
                    )}

                    {/* Status Select */}
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateStatus(task.id, e.target.value as TaskStatus)}
                        className={`text-[11px] font-bold py-1 px-2 rounded-lg border outline-none ${
                          STATUS_CONFIG[task.status]?.bg
                        } ${STATUS_CONFIG[task.status]?.text} ${STATUS_CONFIG[task.status]?.border}`}
                      >
                        <option value="todo">{STATUS_CONFIG.todo.label[lang]}</option>
                        <option value="in_progress">{STATUS_CONFIG.in_progress.label[lang]}</option>
                        <option value="waiting">{STATUS_CONFIG.waiting.label[lang]}</option>
                        <option value="done">{STATUS_CONFIG.done.label[lang]}</option>
                        <option value="cancelled">{STATUS_CONFIG.cancelled.label[lang]}</option>
                      </select>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title={l('حذف', 'Delete', 'Supprimer')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )
          ) : (
            /* KANBAN BOARD VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full items-start">
              {kanbanColumns.map((colStatus) => {
                const colTasks = tasks.filter((t) => t.status === colStatus);
                const cfg = STATUS_CONFIG[colStatus];

                return (
                  <div
                    key={colStatus}
                    className="flex flex-col bg-[#F3F6FA] border border-[#D7E7F7] rounded-2xl p-3 min-h-[400px] max-h-[calc(85vh-160px)]"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#D7E7F7]">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                        <h4 className="text-[13px] font-bold text-[#0B2E57]">{cfg.label[lang]}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-[#D7E7F7] text-[11px] font-mono font-bold text-[#5E7086]">
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Column Tasks */}
                    <div className="flex-1 overflow-y-auto space-y-2 pe-1">
                      {colTasks.length === 0 ? (
                        <div className="text-center py-8 text-[11px] text-[#5E7086] border border-dashed border-[#D7E7F7] rounded-xl bg-white/50">
                          {l('لا مهام في هذه المرحلة', 'No tasks in this stage', 'Aucune tâche')}
                        </div>
                      ) : (
                        colTasks.map((task) => {
                          const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== 'done';
                          const subDoneCount = (task.subtasks || []).filter((s) => s.done).length;
                          const totalSubCount = (task.subtasks || []).length;

                          return (
                            <div
                              key={task.id}
                              onClick={() => setActiveTaskId(task.id)}
                              className={`p-3 rounded-xl border bg-white shadow-xs hover:border-[#004AA5] hover:shadow-sm transition cursor-pointer ${
                                task.id === activeTaskId
                                  ? 'border-[#004AA5] ring-2 ring-[#004AA5]/10'
                                  : 'border-[#D7E7F7]'
                              }`}
                            >
                              {/* Header Badges */}
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                    PRIORITY_CONFIG[task.priority]?.badge
                                  }`}
                                >
                                  {PRIORITY_CONFIG[task.priority]?.label[lang]}
                                </span>
                                {task.dueDate && (
                                  <span
                                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                      isOverdue ? 'bg-rose-50 text-rose-600 font-bold' : 'text-[#5E7086]'
                                    }`}
                                    dir="ltr"
                                  >
                                    {task.dueDate}
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h5 className="text-[12px] font-bold text-[#0B2E57] line-clamp-2 leading-snug mb-1">
                                {task.title}
                              </h5>

                              {/* Footer Meta */}
                              <div className="flex items-center justify-between text-[10px] text-[#5E7086] mt-2 pt-2 border-t border-slate-100">
                                <span className="truncate max-w-[100px]">{task.assignee || '—'}</span>
                                {totalSubCount > 0 && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <CheckSquare size={11} className="text-emerald-600" />
                                    {subDoneCount}/{totalSubCount}
                                  </span>
                                )}
                              </div>

                              {/* Quick Move Action */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2 pt-1 flex items-center justify-end gap-1"
                              >
                                {colStatus !== 'done' && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(task.id, 'done')}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                                  >
                                    {l('إكمال ✓', 'Complete ✓', 'Terminer ✓')}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Drawer / Detail Panel for Active Task */}
        {activeTask && (
          <div className="w-full sm:w-96 border-s border-[#D7E7F7] bg-white flex flex-col h-full shadow-lg z-10 shrink-0">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#D7E7F7] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    STATUS_CONFIG[activeTask.status]?.dot || 'bg-[#004AA5]'
                  }`}
                />
                <span className="text-[12px] font-bold text-[#0B2E57]">
                  {l('تفاصيل المهمة', 'Task Details', 'Détails de la tâche')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTaskId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                  {l('عنوان المهمة', 'Title', 'Titre')}
                </label>
                <input
                  type="text"
                  value={activeTask.title}
                  onChange={(e) => updateActiveTask({ title: e.target.value })}
                  className="w-full p-2.5 text-[13px] font-bold rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white focus:border-[#004AA5] outline-none"
                />
              </div>

              {/* Status and Priority Row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                    {l('الحالة', 'Status', 'Statut')}
                  </label>
                  <select
                    value={activeTask.status}
                    onChange={(e) => handleUpdateStatus(activeTask.id, e.target.value as TaskStatus)}
                    className="w-full h-9 px-2 text-[12px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white outline-none font-bold text-[#0B2E57]"
                  >
                    <option value="todo">{STATUS_CONFIG.todo.label[lang]}</option>
                    <option value="in_progress">{STATUS_CONFIG.in_progress.label[lang]}</option>
                    <option value="waiting">{STATUS_CONFIG.waiting.label[lang]}</option>
                    <option value="done">{STATUS_CONFIG.done.label[lang]}</option>
                    <option value="cancelled">{STATUS_CONFIG.cancelled.label[lang]}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                    {l('الأولوية', 'Priority', 'Priorité')}
                  </label>
                  <select
                    value={activeTask.priority}
                    onChange={(e) => updateActiveTask({ priority: e.target.value as TaskPriority })}
                    className="w-full h-9 px-2 text-[12px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white outline-none font-bold text-[#0B2E57]"
                  >
                    <option value="urgent">{PRIORITY_CONFIG.urgent.label[lang]}</option>
                    <option value="high">{PRIORITY_CONFIG.high.label[lang]}</option>
                    <option value="medium">{PRIORITY_CONFIG.medium.label[lang]}</option>
                    <option value="low">{PRIORITY_CONFIG.low.label[lang]}</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Assignee */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                    {l('تاريخ الاستحقاق', 'Due Date', 'Échéance')}
                  </label>
                  <input
                    type="date"
                    value={activeTask.dueDate || ''}
                    onChange={(e) => updateActiveTask({ dueDate: e.target.value || undefined })}
                    className="w-full h-9 px-2 text-[12px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white outline-none font-mono text-[#0B2E57]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                    {l('المسؤول', 'Assignee', 'Assigné à')}
                  </label>
                  <select
                    value={activeTask.assignee || ''}
                    onChange={(e) => updateActiveTask({ assignee: e.target.value })}
                    className="w-full h-9 px-2 text-[12px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white outline-none text-[#0B2E57]"
                  >
                    {TEAM_MEMBERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subtasks Checklist */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-[#5E7086]">
                    {l('المهام الفرعية', 'Subtasks', 'Sous-tâches')}
                  </label>
                  <span className="text-[10px] font-mono text-[#5E7086]">
                    {(activeTask.subtasks || []).filter((s) => s.done).length}/{(activeTask.subtasks || []).length}
                  </span>
                </div>

                <div className="space-y-1.5 mb-2">
                  {(activeTask.subtasks || []).map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg bg-[#F8FAFC] border border-[#D7E7F7] text-[12px]"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(sub.id)}
                        className={`w-4 h-4 rounded border grid place-items-center cursor-pointer transition ${
                          sub.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-[#D7E7F7] bg-white'
                        }`}
                      >
                        {sub.done && <Check size={11} strokeWidth={3} />}
                      </button>
                      <span className={`flex-1 truncate ${sub.done ? 'line-through text-slate-400' : 'text-[#0B2E57]'}`}>
                        {sub.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(sub.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Subtask Input */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    placeholder={l('أضف بندًا فرعيًا…', 'Add subtask…', 'Ajouter une sous-tâche…')}
                    className="flex-1 h-8 px-2.5 text-[12px] rounded-lg border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="h-8 px-2.5 rounded-lg bg-[#004AA5] text-white text-[11px] font-bold hover:bg-[#2A83D5] cursor-pointer"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                  {l('الوصف والملاحظات', 'Description & Notes', 'Description et notes')}
                </label>
                <textarea
                  rows={4}
                  value={activeTask.description || ''}
                  onChange={(e) => updateActiveTask({ description: e.target.value })}
                  placeholder={l('أدخل تفاصيل إضافية حول المهمة…', 'Add details…', 'Ajoutez des détails…')}
                  className="w-full p-2.5 text-[12px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white focus:border-[#004AA5] outline-none leading-relaxed"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                  {l('الوسوم', 'Tags', 'Étiquettes')}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(activeTask.tags || []).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EAF4FF] text-[#004AA5] text-[11px] font-bold"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder={l('وسم جديد…', 'New tag…', 'Nouvelle étiquette…')}
                    className="flex-1 h-8 px-2.5 text-[11px] rounded-lg border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="h-8 px-2.5 rounded-lg border border-[#D7E7F7] bg-white text-[11px] font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Linked Note or CRM Record */}
              {(activeTask.linkedNoteTitle || activeTask.linkedCustomerName) && (
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D7E7F7] space-y-1.5">
                  <span className="text-[11px] font-bold text-[#5E7086] block">
                    {l('الارتباطات في النظام', 'Linked Records', 'Dossiers liés')}
                  </span>
                  {activeTask.linkedNoteTitle && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-[#004AA5]">
                        <FileText size={12} />
                        <span className="font-bold">{activeTask.linkedNoteTitle}</span>
                      </span>
                      {activeTask.linkedNoteId && (
                        <button
                          type="button"
                          onClick={() => onOpenNote?.(activeTask.linkedNoteId!)}
                          className="text-[10px] text-[#004AA5] underline hover:text-[#2A83D5] cursor-pointer"
                        >
                          {l('فتح الملاحظة', 'Open Note', 'Ouvrir')}
                        </button>
                      )}
                    </div>
                  )}
                  {activeTask.linkedCustomerName && (
                    <div className="flex items-center gap-1 text-[11px] text-[#CC9048]">
                      <User size={12} />
                      <span className="font-bold">{activeTask.linkedCustomerName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-[#5E7086]">
                    {l('المرفقات', 'Attachments', 'Pièces jointes')}
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-bold text-[#004AA5] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <UploadCloud size={12} />
                    <span>{l('رفع ملف', 'Upload file', 'Téléverser')}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                <div className="space-y-1">
                  {(activeTask.attachments || []).map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#D7E7F7] text-[11px]"
                    >
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-[#004AA5] hover:underline font-bold truncate max-w-[200px]"
                      >
                        <Paperclip size={12} />
                        <span className="truncate">{att.name}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          updateActiveTask({
                            attachments: activeTask.attachments.filter((a) => a.id !== att.id),
                          })
                        }
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments / Activity Feed */}
              <div>
                <label className="block text-[11px] font-bold text-[#5E7086] mb-1.5">
                  {l('التعليقات وسجل النشاط', 'Comments & Activity', 'Commentaires')}
                </label>
                <div className="space-y-2 mb-2 max-h-40 overflow-y-auto">
                  {(activeTask.comments || []).map((c) => (
                    <div key={c.id} className="p-2 rounded-lg bg-[#F8FAFC] border border-[#D7E7F7] text-[11px]">
                      <div className="flex items-center justify-between text-[10px] text-[#5E7086] mb-1">
                        <span className="font-bold text-[#0B2E57]">{c.author}</span>
                        <span dir="ltr">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[#0B2E57]">{c.text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder={l('أضف تعليقًا…', 'Add a comment…', 'Commenter…')}
                    className="flex-1 h-8 px-2.5 text-[12px] rounded-lg border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    className="h-8 px-3 rounded-lg bg-[#0B2E57] text-white text-[11px] font-bold hover:bg-[#004AA5] cursor-pointer"
                  >
                    {l('إرسال', 'Post', 'Envoyer')}
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[#D7E7F7] bg-[#F8FAFC] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteTask(activeTask.id)}
                className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-[12px] font-bold hover:bg-rose-100 transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{l('حذف المهمة', 'Delete', 'Supprimer')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTaskId(null)}
                className="px-4 py-1.5 rounded-lg bg-[#004AA5] text-white text-[12px] font-bold hover:bg-[#2A83D5] transition cursor-pointer"
              >
                {l('تم', 'Done', 'Terminé')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
