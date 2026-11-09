import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Star,
  Send,
  Clock,
  CheckCircle2,
  Trash2,
  Search,
  Paperclip,
  Phone,
  Mail,
  User,
  Sparkles,
  ExternalLink,
  MessageSquare,
  CornerDownLeft,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plane,
  Building,
  Car,
  Landmark,
  MessageCircle,
  AlertTriangle,
  Tag,
  Filter,
  Check,
  Copy,
  Calendar,
  MapPin,
  ChevronDown,
  UserCheck,
  FileText,
  AlertCircle,
  Activity,
  Plus,
  UserPlus,
  CheckSquare,
} from 'lucide-react';
import {
  api,
  ContactMessage,
  MailboxReply,
  ServiceTag,
  FollowUpStatus,
  RequestSource,
  InternalNote,
  ActivityTimelineItem,
} from '../../services/api';
import { WhatsAppLogo } from '../WhatsAppLogo';
import { realtime } from '../../services/realtime';
import { useLanguage } from '../../context/LanguageContext';
import { ResizeHandle } from '../workspace/ResizeHandle';
import { clampPanelSize } from '../workspace/layoutPreferences';

type FolderType = 'inbox' | 'starred' | 'sent' | 'in_progress' | 'resolved' | 'trash';

const SERVICE_TAG_CONFIG: Record<
  ServiceTag,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }
> = {
  FLIGHT: { label: 'طيران', icon: Plane, color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  HOTEL: { label: 'فنادق', icon: Building, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  TRANSFER: { label: 'نقل ومواصلات', icon: Car, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  CONSULAR: { label: 'خدمات قنصلية', icon: Landmark, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  OFFLINE_CHAT: { label: 'دردشة أوفلاين', icon: MessageCircle, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  GENERAL: { label: 'استفسار عام', icon: Mail, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
};

const FOLLOW_UP_STATUS_CONFIG: Record<
  FollowUpStatus,
  { label: string; color: string; bg: string; border: string; dotColor: string }
> = {
  NEW: { label: 'جديد', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dotColor: 'bg-blue-500' },
  INCOMPLETE_CONSENTED: { label: 'طلب غير مكتمل — بيانات محفوظة', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-300', dotColor: 'bg-amber-500' },
  FOLLOW_UP_REQUIRED: { label: 'يحتاج متابعة', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300', dotColor: 'bg-rose-500' },
  IN_PROGRESS: { label: 'قيد المعالجة', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200', dotColor: 'bg-amber-500' },
  WAITING_CUSTOMER: { label: 'بانتظار العميل', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', dotColor: 'bg-purple-500' },
  RESOLVED: { label: 'تمت المعالجة', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dotColor: 'bg-emerald-500' },
  CLOSED: { label: 'مغلق', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300', dotColor: 'bg-slate-400' },
};

const ASSIGNEE_OPTIONS = [
  'غير مسند',
  'رشيد الفزني (المدير العام)',
  'فريق الحجوزات والطيران',
  'فريق الفنادق والنقل',
  'قسم الخدمات القنصلية',
  'خدمة العملاء والدعم',
];

export const AdminMailbox: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState<FolderType>('inbox');
  const [serviceFilter, setServiceFilter] = useState<ServiceTag | 'ALL'>('ALL');
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpStatus | 'ALL'>('ALL');
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [counts, setCounts] = useState<{
    inbox: number;
    starred: number;
    sent: number;
    in_progress: number;
    resolved: number;
    trash: number;
    total: number;
    newCount?: number;
    followUpCount?: number;
    byService?: Record<string, number>;
    byStatus?: Record<string, number>;
  }>({
    inbox: 0,
    starred: 0,
    sent: 0,
    in_progress: 0,
    resolved: 0,
    trash: 0,
    total: 0,
    newCount: 0,
    followUpCount: 0,
    byService: {},
    byStatus: {},
  });
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { isRtl = true } = useLanguage();

  // Resizable Messages List Width (default 340px, min 260px, max 520px)
  const [listWidth, setListWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 340;
    try {
      const saved = localStorage.getItem('elfazni_mailbox_list_width');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num)) return clampPanelSize(num, 260, 520);
      }
    } catch {}
    return 340;
  });

  const handleResize = (delta: number) => {
    setListWidth((prev) => {
      const next = clampPanelSize(prev + delta, 260, 520);
      try {
        localStorage.setItem('elfazni_mailbox_list_width', String(next));
      } catch {}
      return next;
    });
  };

  const handleResetWidth = () => {
    setListWidth(340);
    try {
      localStorage.setItem('elfazni_mailbox_list_width', '340');
    } catch {}
  };

  useEffect(() => {
    loadMailbox();
  }, [activeFolder, serviceFilter, followUpFilter, searchQuery]);

  useEffect(() => {
    const unsubNew = realtime.subscribe('mailbox:new', (payload: any) => {
      const msg = payload?.message as ContactMessage;
      if (!msg) return;
      setCounts((prev) => ({
        ...prev,
        inbox: prev.inbox + 1,
        total: prev.total + 1,
        followUpCount: (prev.followUpCount || 0) + (msg.needsFollowUp || msg.followUpStatus === 'FOLLOW_UP_REQUIRED' ? 1 : 0),
      }));
      if (activeFolder === 'inbox') {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [msg, ...prev];
        });
        setSelectedMessage((curr) => curr || msg);
      }
    });

    const pollInterval = setInterval(() => {
      api
        .getMailbox(activeFolder, searchQuery, {
          serviceTag: serviceFilter !== 'ALL' ? serviceFilter : undefined,
          followUpStatus: followUpFilter !== 'ALL' ? followUpFilter : undefined,
        })
        .then((res) => {
          if (res.counts) setCounts(res.counts);
          if (res.messages) {
            setMessages((prev) => {
              const prevFirstId = prev[0]?.id;
              const newFirstId = res.messages[0]?.id;
              if (res.messages.length !== prev.length || prevFirstId !== newFirstId) {
                return res.messages;
              }
              return prev;
            });
            setSelectedMessage((curr) => {
              if (!curr) return res.messages[0] || null;
              const refreshed = res.messages.find((m) => m.id === curr.id);
              return refreshed || curr;
            });
          }
        })
        .catch(() => {});
    }, 2500);

    return () => {
      unsubNew();
      clearInterval(pollInterval);
    };
  }, [activeFolder, serviceFilter, followUpFilter, searchQuery]);

  const loadMailbox = async () => {
    setLoading(true);
    try {
      const res = await api.getMailbox(activeFolder, searchQuery, {
        serviceTag: serviceFilter !== 'ALL' ? serviceFilter : undefined,
        followUpStatus: followUpFilter !== 'ALL' ? followUpFilter : undefined,
      });
      setMessages(res.messages || []);
      if (res.counts) setCounts(res.counts);
      if (res.messages && res.messages.length > 0) {
        if (!selectedMessage || !res.messages.find((m) => m.id === selectedMessage.id)) {
          setSelectedMessage(res.messages[0]);
        } else {
          const fresh = res.messages.find((m) => m.id === selectedMessage.id);
          if (fresh) setSelectedMessage(fresh);
        }
      } else {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Failed to load mailbox:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async (msg: ContactMessage, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStarred = !msg.starred;
      await api.updateMailboxItem(msg.id, { starred: newStarred });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, starred: newStarred } : m))
      );
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage({ ...selectedMessage, starred: newStarred });
      }
      setCounts((prev) => ({
        ...prev,
        starred: newStarred ? prev.starred + 1 : Math.max(prev.starred - 1, 0),
      }));
    } catch (err) {
      console.error('Failed to star message:', err);
    }
  };

  const handleUpdateFollowUpStatus = async (status: FollowUpStatus) => {
    if (!selectedMessage) return;
    try {
      const needsFollowUp = status === 'FOLLOW_UP_REQUIRED' || status === 'NEW';
      const updated = await api.updateMailboxItem(selectedMessage.id, {
        followUpStatus: status,
        needsFollowUp,
      });
      const finalMsg = updated.message || {
        ...selectedMessage,
        followUpStatus: status,
        needsFollowUp,
      };
      setSelectedMessage(finalMsg);
      setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? finalMsg : m)));
      setFeedbackBanner(`تم تحديث حالة المتابعة إلى: ${FOLLOW_UP_STATUS_CONFIG[status]?.label || status}`);
      setTimeout(() => setFeedbackBanner(null), 3000);
      loadMailbox();
    } catch (err) {
      console.error('Failed to update follow-up status:', err);
      setFeedbackBanner('تعذر تحديث حالة المتابعة');
      setTimeout(() => setFeedbackBanner(null), 3000);
    }
  };

  const handleAssign = async (assignee: string) => {
    if (!selectedMessage) return;
    try {
      const val = assignee === 'غير مسند' ? '' : assignee;
      const updated = await api.updateMailboxItem(selectedMessage.id, {
        assignedTo: val,
      });
      const finalMsg = updated.message || { ...selectedMessage, assignedTo: val };
      setSelectedMessage(finalMsg);
      setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? finalMsg : m)));
      setFeedbackBanner(val ? `تم إسناد الطلب إلى: ${val}` : 'تم إلغاء الإسناد');
      setTimeout(() => setFeedbackBanner(null), 2500);
    } catch (err) {
      console.error('Failed to assign request:', err);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !newNoteText.trim() || addingNote) return;
    setAddingNote(true);
    try {
      const updated = await api.updateMailboxItem(selectedMessage.id, {
        note: newNoteText.trim(),
      });
      const finalMsg = updated.message || {
        ...selectedMessage,
        internalNotes: [
          ...(selectedMessage.internalNotes || []),
          {
            id: `note-${Date.now()}`,
            author: 'رشيد الفزني',
            text: newNoteText.trim(),
            createdAt: new Date().toISOString(),
          },
        ],
      };
      setSelectedMessage(finalMsg);
      setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? finalMsg : m)));
      setNewNoteText('');
      setFeedbackBanner('تمت إضافة الملاحظة الداخلية بنجاح');
      setTimeout(() => setFeedbackBanner(null), 2500);
    } catch (err) {
      console.error('Failed to add internal note:', err);
      setFeedbackBanner('فشل حفظ الملاحظة');
      setTimeout(() => setFeedbackBanner(null), 2500);
    } finally {
      setAddingNote(false);
    }
  };

  const handleDelete = async (permanent: boolean = false) => {
    if (!selectedMessage) return;
    try {
      await api.deleteMailboxMessage(selectedMessage.id, permanent);
      setFeedbackBanner(permanent ? 'تم حذف الطلب نهائياً' : 'تم نقل الطلب لسلة المهملات');
      setTimeout(() => setFeedbackBanner(null), 2500);
      loadMailbox();
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const sendReply = async (channel: 'site' | 'email') => {
    if (!replyText.trim() || !selectedMessage || sendingReply) return;

    setSendingReply(true);
    try {
      const res = await api.replyMailboxMessage(selectedMessage.id, replyText.trim(), channel);
      if (res.success && res.reply) {
        const updatedReplies = [...(selectedMessage.replies || []), res.reply];
        setSelectedMessage({
          ...selectedMessage,
          replies: updatedReplies,
          status: 'resolved',
          followUpStatus: selectedMessage.followUpStatus === 'NEW' ? 'IN_PROGRESS' : selectedMessage.followUpStatus,
        });
        setReplyText('');
        setFeedbackBanner(
          channel === 'email'
            ? 'تم إرسال الرد بالبريد الإلكتروني وحفظه في سجل الطلب.'
            : 'حُفظ الرد في سجل التذكرة.'
        );
        loadMailbox();
        setTimeout(() => setFeedbackBanner(null), 3500);
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
      setFeedbackBanner(err instanceof Error ? err.message : 'فشل إرسال الرد، يرجى المحاولة ثانية.');
      setTimeout(() => setFeedbackBanner(null), 3500);
    } finally {
      setSendingReply(false);
    }
  };

  const handleWhatsAppReply = () => {
    if (!selectedMessage) return;
    const phoneToUse = selectedMessage.whatsappPhone || selectedMessage.phone;
    if (!phoneToUse) return;
    const phoneClean = phoneToUse.replace(/[^0-9]/g, '');
    const refCode = selectedMessage.reference || selectedMessage.ticketNumber;
    const text = `السلام عليكم ورحمة الله أخي ${selectedMessage.name}، بخصوص طلبكم رقم (${refCode}) في ELFAZNI SERVICES (${selectedMessage.subject || selectedMessage.serviceRequested || 'خدمات الفزني'}): \n\n${
      replyText || 'نحن نتابع طلبك وسنوافيك بكافة التفاصيل والخيارات فوراً.'
    }`;
    const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const [convertingCrm, setConvertingCrm] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  const handleConvertToCrm = async () => {
    if (!selectedMessage || convertingCrm) return;
    setConvertingCrm(true);
    try {
      const res = await api.convertMailboxMessageToCrm(selectedMessage.id);
      const updatedMsg: ContactMessage = {
        ...selectedMessage,
        crmContactId: res.contactId,
      };
      setSelectedMessage(updatedMsg);
      setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? updatedMsg : m)));
      setFeedbackBanner(
        (res as any).matched
          ? 'تم ربط الطلب بجهة اتصال موجودة في CRM بنجاح'
          : 'تم إنشاء عميل جديد في CRM وربطه بالتذكرة بنجاح!'
      );
      setTimeout(() => setFeedbackBanner(null), 3500);
    } catch (err) {
      console.error('Failed to convert to CRM:', err);
      setFeedbackBanner('تعذر تحويل الطلب إلى CRM');
      setTimeout(() => setFeedbackBanner(null), 3000);
    } finally {
      setConvertingCrm(false);
    }
  };

  const handleCreateTask = async () => {
    if (!selectedMessage || creatingTask) return;
    setCreatingTask(true);
    try {
      const res = await api.createTaskFromMailboxMessage(selectedMessage.id, {
        title: `متابعة الطلب ${selectedMessage.reference || selectedMessage.ticketNumber} — ${selectedMessage.name}`,
      });
      setFeedbackBanner(`تم إنشاء مهمة المتابعة بنجاح (${res.taskId})`);
      setTimeout(() => setFeedbackBanner(null), 3500);
    } catch (err) {
      console.error('Failed to create task:', err);
      setFeedbackBanner('تعذر إنشاء مهمة المتابعة');
      setTimeout(() => setFeedbackBanner(null), 3000);
    } finally {
      setCreatingTask(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[780px]">
      {feedbackBanner && (
        <div className="px-4 py-2 bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-between border-b border-amber-500 animate-in fade-in duration-150">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-950" />
            {feedbackBanner}
          </span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-slate-950 hover:opacity-75 font-black text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="p-4 bg-gradient-to-r from-[#0B2E57] via-[#103D72] to-[#0B2E57] text-white flex flex-wrap items-center justify-between gap-3 border-b border-[#082241]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 text-[#CC9048]">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                طلبات الموقع والرسائل (Unified Leads & Inbox)
              </h2>
              {counts.inbox > 0 && (
                <span className="text-[11px] bg-sky-500/20 text-sky-200 px-2.5 py-0.5 rounded-full border border-sky-400/30 font-bold">
                  {counts.inbox} وارد جديد
                </span>
              )}
              {(counts.followUpCount || 0) > 0 && (
                <span className="text-[11px] bg-rose-500/20 text-rose-200 px-2.5 py-0.5 rounded-full border border-rose-400/30 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  {counts.followUpCount} يحتاج متابعة
                </span>
              )}
            </div>
            <p className="text-xs text-blue-200/80">
              إدارة طلبات الطيران، الفنادق، التوصيل، الخدمات القنصلية، ورسائل الدردشة الأوفلاين
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadMailbox}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-blue-100 hover:text-white rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Quick Service Pills & Follow-up Status Pills */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Service Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 ml-1 shrink-0">
            <Tag className="w-3.5 h-3.5" />
            الخدمة:
          </span>
          <button
            onClick={() => setServiceFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
              serviceFilter === 'ALL'
                ? 'bg-[#0B2E57] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            الكل
          </button>
          {(['FLIGHT', 'HOTEL', 'TRANSFER', 'CONSULAR', 'OFFLINE_CHAT', 'GENERAL'] as ServiceTag[]).map((tag) => {
            const conf = SERVICE_TAG_CONFIG[tag];
            const Icon = conf.icon;
            const count = counts.byService?.[tag] || 0;
            const isSelected = serviceFilter === tag;
            return (
              <button
                key={tag}
                onClick={() => setServiceFilter(tag)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? `${conf.bg} ${conf.color} border ${conf.border} shadow-xs ring-1 ring-offset-0 ring-current`
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{conf.label}</span>
                {count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/60 text-slate-700 font-mono">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Follow-up Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 ml-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            المتابعة:
          </span>
          <button
            onClick={() => setFollowUpFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
              followUpFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setFollowUpFilter('FOLLOW_UP_REQUIRED')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
              followUpFilter === 'FOLLOW_UP_REQUIRED'
                ? 'bg-rose-100 text-rose-800 border border-rose-300 ring-1 ring-rose-400'
                : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>يحتاج متابعة</span>
          </button>
          <button
            onClick={() => setFollowUpFilter('INCOMPLETE_CONSENTED')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
              followUpFilter === 'INCOMPLETE_CONSENTED'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-1 ring-amber-400'
                : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>طلب غير مكتمل</span>
          </button>
          <button
            onClick={() => setFollowUpFilter('NEW')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
              followUpFilter === 'NEW'
                ? 'bg-blue-100 text-blue-800 border border-blue-300 ring-1 ring-blue-400'
                : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>جديد</span>
          </button>
          <button
            onClick={() => setFollowUpFilter('IN_PROGRESS')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
              followUpFilter === 'IN_PROGRESS'
                ? 'bg-amber-100 text-amber-800 border border-amber-300 ring-1 ring-amber-400'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>قيد المعالجة</span>
          </button>
          <button
            onClick={() => setFollowUpFilter('RESOLVED')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
              followUpFilter === 'RESOLVED'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-1 ring-emerald-400'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>تمت المعالجة</span>
          </button>
        </div>
      </div>

      {/* 3-Column Layout: Folders Sidebar, Messages Index, Reader & Action Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Mailbox Folders Sidebar (w-48 lg:w-56) */}
        <div className="w-48 lg:w-56 border-l border-slate-200 bg-slate-50/70 p-3 space-y-1 shrink-0 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
            المجلدات العامة
          </div>

          <button
            onClick={() => setActiveFolder('inbox')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFolder === 'inbox'
                ? 'bg-[#0B2E57] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              <span>صندوق الوارد</span>
            </span>
            {counts.inbox > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeFolder === 'inbox' ? 'bg-white text-[#0B2E57]' : 'bg-blue-100 text-blue-800'
                }`}
              >
                {counts.inbox}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveFolder('starred')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFolder === 'starred'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>المميزة بنجمة</span>
            </span>
            {counts.starred > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                {counts.starred}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveFolder('in_progress')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFolder === 'in_progress'
                ? 'bg-[#004AA5] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>قيد المتابعة</span>
            </span>
            {counts.in_progress > 0 && (
              <span className="text-[10px] bg-[#EAF4FF] text-[#0B2E57] px-1.5 py-0.5 rounded-full">
                {counts.in_progress}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveFolder('resolved')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFolder === 'resolved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>مكتملة ومردود عليها</span>
            </span>
            {counts.resolved > 0 && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                {counts.resolved}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveFolder('sent')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFolder === 'sent'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span>الردود المرسلة</span>
            </span>
            {counts.sent > 0 && (
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full">
                {counts.sent}
              </span>
            )}
          </button>

          <div className="pt-3 border-t border-slate-200">
            <button
              onClick={() => setActiveFolder('trash')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFolder === 'trash'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>سلة المهملات</span>
              </span>
              {counts.trash > 0 && (
                <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-full">
                  {counts.trash}
                </span>
              )}
            </button>
          </div>

          {/* Quick Summary of Service Leads */}
          <div className="pt-4 border-t border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
              إحصائيات الخدمات
            </div>
            <div className="space-y-1 text-xs">
              {(['FLIGHT', 'HOTEL', 'TRANSFER', 'CONSULAR', 'OFFLINE_CHAT'] as ServiceTag[]).map((tag) => {
                const conf = SERVICE_TAG_CONFIG[tag];
                const Icon = conf.icon;
                const count = counts.byService?.[tag] || 0;
                return (
                  <div
                    key={tag}
                    onClick={() => setServiceFilter(tag)}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/60 cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-1.5 text-[11px] font-medium">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      {conf.label}
                    </span>
                    <span className="text-[10px] font-bold font-mono text-slate-700 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Column 2: Message Index List (Resizable) */}
        <div
          style={{ width: `${listWidth}px` }}
          className="shrink-0 border-l border-slate-200 flex flex-col bg-white transition-[width] duration-75"
        >
          {/* Search Header */}
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم الطلب، الاسم، أو الهاتف..."
                className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Messages Item List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                لا توجد طلبات مطابقة في هذا المجلد
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                const serviceTag = (msg.serviceTag || 'GENERAL') as ServiceTag;
                const serviceConf = SERVICE_TAG_CONFIG[serviceTag] || SERVICE_TAG_CONFIG.GENERAL;
                const ServiceIcon = serviceConf.icon;
                const followStatus = (msg.followUpStatus || 'NEW') as FollowUpStatus;
                const followConf = FOLLOW_UP_STATUS_CONFIG[followStatus] || FOLLOW_UP_STATUS_CONFIG.NEW;
                const refCode = msg.reference || msg.ticketNumber;

                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-r-4 border-r-[#0B2E57]'
                        : 'hover:bg-slate-50'
                    } ${msg.status === 'new' ? 'font-semibold' : ''}`}
                  >
                    {/* Top Row: Star, Customer Name, Date */}
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(msg, e)}
                          className="text-slate-300 hover:text-amber-400 p-0.5 shrink-0"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              msg.starred ? 'text-amber-400 fill-amber-400' : ''
                            }`}
                          />
                        </button>
                        <span className="text-xs text-slate-900 font-bold truncate">{msg.name}</span>
                        {msg.status === 'new' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(msg.createdAt).toLocaleDateString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Second Row: Service Badge & Reference Code */}
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${serviceConf.bg} ${serviceConf.color} ${serviceConf.border}`}
                      >
                        <ServiceIcon className="w-2.5 h-2.5" />
                        {serviceConf.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {refCode}
                      </span>
                      {msg.requestSource === 'offline_chat' && (
                        <span className="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold">
                          دردشة أوفلاين
                        </span>
                      )}
                    </div>

                    {/* Third Row: Follow-up Status Pill */}
                    <div className="flex items-center gap-1 mb-1">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${followConf.bg} ${followConf.color} ${followConf.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${followConf.dotColor}`} />
                        {followConf.label}
                      </span>
                      {msg.assignedTo && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[100px]">{msg.assignedTo}</span>
                        </span>
                      )}
                    </div>

                    {/* Fourth Row: Subject / Message preview */}
                    <p className="text-[11px] text-slate-600 line-clamp-1 leading-relaxed">
                      {msg.subject ? `${msg.subject} — ` : ''}
                      {msg.message}
                    </p>

                    {/* Bottom Extras */}
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                      {msg.phone && (
                        <span className="font-mono text-slate-500" dir="ltr">
                          {msg.phone}
                        </span>
                      )}
                      {msg.internalNotes && msg.internalNotes.length > 0 && (
                        <span className="text-amber-700 font-bold flex items-center gap-0.5">
                          📝 {msg.internalNotes.length}
                        </span>
                      )}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <span className="text-blue-600 flex items-center gap-0.5">
                          <Paperclip className="w-3 h-3" />
                          {msg.attachments.length}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Resizable Divider Handle (Between Message List and Details) */}
        <div className="hidden md:flex shrink-0 items-stretch">
          <ResizeHandle
            id="mailbox-message-list"
            direction="horizontal"
            isRtl={isRtl}
            currentSize={listWidth}
            minSize={260}
            maxSize={520}
            onResize={handleResize}
            onReset={handleResetWidth}
            ariaLabel="مقبض تعديل عرض قائمة الطلبات — Resize mailbox list"
          />
        </div>

        {/* Column 3: Full Message Reader, Structured Payload, Internal Notes & Reply Composer */}
        <div className="flex-1 flex flex-col bg-slate-50/60 overflow-hidden">
          {selectedMessage ? (
            <>
              {/* Message Details Header */}
              <div className="p-4 bg-white border-b border-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-[#0B2E57] font-mono bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                        {selectedMessage.reference || selectedMessage.ticketNumber}
                      </span>
                      {(() => {
                        const tag = (selectedMessage.serviceTag || 'GENERAL') as ServiceTag;
                        const conf = SERVICE_TAG_CONFIG[tag] || SERVICE_TAG_CONFIG.GENERAL;
                        const Icon = conf.icon;
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${conf.bg} ${conf.color} ${conf.border}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {conf.label}
                          </span>
                        );
                      })()}
                      {(() => {
                        const st = (selectedMessage.followUpStatus || 'NEW') as FollowUpStatus;
                        const conf = FOLLOW_UP_STATUS_CONFIG[st] || FOLLOW_UP_STATUS_CONFIG.NEW;
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${conf.bg} ${conf.color} ${conf.border}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${conf.dotColor}`} />
                            {conf.label}
                          </span>
                        );
                      })()}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedMessage.subject || selectedMessage.serviceRequested || 'طلب خدمة عبر الموقع'}
                    </h3>
                  </div>

                  {/* Actions / Follow-up Status Dropdown & Assignee */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Follow-up Status Transition Dropdown */}
                    <div className="flex items-center gap-1">
                      <label className="text-xs font-bold text-slate-500">حالة المتابعة:</label>
                      <select
                        value={selectedMessage.followUpStatus || 'NEW'}
                        onChange={(e) => handleUpdateFollowUpStatus(e.target.value as FollowUpStatus)}
                        className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                      >
                        {(Object.keys(FOLLOW_UP_STATUS_CONFIG) as FollowUpStatus[]).map((statusKey) => (
                          <option key={statusKey} value={statusKey}>
                            {FOLLOW_UP_STATUS_CONFIG[statusKey].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Assignee Dropdown */}
                    <div className="flex items-center gap-1">
                      <label className="text-xs font-bold text-slate-500">المسند إليه:</label>
                      <select
                        value={selectedMessage.assignedTo || 'غير مسند'}
                        onChange={(e) => handleAssign(e.target.value)}
                        className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs max-w-[160px]"
                      >
                        {ASSIGNEE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => handleDelete(activeFolder === 'trash')}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors border border-slate-200 hover:border-red-200 hover:bg-red-50"
                      title={activeFolder === 'trash' ? 'حذف نهائي' : 'نقل لسلة المهملات'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Customer Contact & Meta Card */}
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 font-bold text-slate-900">
                      <User className="w-4 h-4 text-slate-400" />
                      {selectedMessage.name}
                    </span>

                    {/* Phone & Copy */}
                    <div className="flex items-center gap-1 font-mono text-slate-800" dir="ltr">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedMessage.phone}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedMessage.phone, 'phone')}
                        className="p-0.5 text-slate-400 hover:text-slate-700"
                        title="نسخ رقم الهاتف"
                      >
                        {copiedField === 'phone' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* WhatsApp if available */}
                    {(selectedMessage.whatsappPhone || selectedMessage.phone) && (
                      <div className="flex items-center gap-1 font-mono text-emerald-700 font-bold" dir="ltr">
                        <WhatsAppLogo className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{selectedMessage.whatsappPhone || selectedMessage.phone}</span>
                      </div>
                    )}

                    {/* Email if available */}
                    {selectedMessage.email && (
                      <div className="flex items-center gap-1 font-mono text-slate-700" dir="ltr">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <a
                          href={`mailto:${selectedMessage.email}`}
                          className="hover:underline text-blue-700"
                        >
                          {selectedMessage.email}
                        </a>
                      </div>
                    )}

                    <span>📍 {selectedMessage.country || 'المغرب 🇲🇦'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(selectedMessage.createdAt).toLocaleString('ar-EG', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    {selectedMessage.emailDeliveryStatus && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          selectedMessage.emailDeliveryStatus === 'sent'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedMessage.emailDeliveryStatus === 'queued'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                        title="حالة إشعار البريد الإلكتروني الداخلي"
                      >
                        إشعار بريدي: {selectedMessage.emailDeliveryStatus}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fast Action Toolbar (WhatsApp, Email Reply, CRM conversion, Task creation) */}
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action 1: Open WhatsApp */}
                    {(selectedMessage.whatsappPhone || selectedMessage.phone) && (
                      <button
                        type="button"
                        onClick={handleWhatsAppReply}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                        title="فتح محادثة واتساب للتواصل المباشر مع العميل"
                      >
                        <WhatsAppLogo className="w-3.5 h-3.5" />
                        <span>فتح واتساب</span>
                      </button>
                    )}

                    {/* Action 2: Email Reply shortcut */}
                    {selectedMessage.email && (
                      <button
                        type="button"
                        onClick={() => {
                          const ta = document.querySelector('textarea');
                          ta?.focus();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-all shadow-xs cursor-pointer"
                        title="كتابة وإرسال رد بريدي"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>إرسال بريد إلكتروني</span>
                      </button>
                    )}

                    {/* Action 3: Convert to CRM Customer */}
                    <button
                      type="button"
                      disabled={convertingCrm}
                      onClick={handleConvertToCrm}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shadow-xs cursor-pointer ${
                        selectedMessage.crmContactId
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-[#004AA5] hover:bg-[#0B2E57] text-white'
                      }`}
                      title="مزامنة وإنشاء سجل العميل في CRM"
                    >
                      {convertingCrm ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {selectedMessage.crmContactId ? 'مرتبط بالـ CRM ✓' : 'إنشاء عميل في CRM'}
                      </span>
                    </button>

                    {/* Action 4: Create Follow-up Task */}
                    <button
                      type="button"
                      disabled={creatingTask}
                      onClick={handleCreateTask}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                      title="إنشاء مهمة متابعة مسندة للطلب"
                    >
                      {creatingTask ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckSquare className="w-3.5 h-3.5" />
                      )}
                      <span>إنشاء مهمة متابعة</span>
                    </button>
                  </div>

                  {selectedMessage.crmContactId && (
                    <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      CRM ID: {selectedMessage.crmContactId.slice(0, 8)}...
                    </span>
                  )}
                </div>
              </div>

              {/* Message Content & History */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {/* Offline Chat Banner if applicable */}
                {selectedMessage.requestSource === 'offline_chat' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-900">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <div>
                        <div className="font-bold">رسالة عبر الدردشة الحية في غير أوقات العمل</div>
                        <div className="text-[11px] text-rose-700">
                          ترك الزائر رسالته وبيانات التواصل عندما كان المشرف غير متصل.
                        </div>
                      </div>
                    </div>
                    {selectedMessage.chatSessionId && (
                      <span className="text-[11px] font-mono font-bold bg-white px-2 py-1 rounded border border-rose-300 text-rose-800">
                        جلسة: {selectedMessage.chatSessionId.slice(0, 12)}...
                      </span>
                    )}
                  </div>
                )}

                {/* Structured Payload Card if any */}
                {selectedMessage.payloadJson && Object.keys(selectedMessage.payloadJson).length > 0 && (
                  <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
                    <div className="text-xs font-bold text-[#0B2E57] flex items-center gap-1.5 mb-3 pb-2 border-b border-slate-100">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>تفاصيل ومعطيات الحجز والخدمة:</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
                      {Object.entries(selectedMessage.payloadJson).map(([key, val]) => {
                        if (val === null || val === undefined || typeof val === 'object') return null;
                        const labelMap: Record<string, string> = {
                          serviceTag: 'نوع الخدمة',
                          serviceCategory: 'التصنيف',
                          tripType: 'نوع الرحلة',
                          from: 'المغادرة',
                          to: 'الوصول',
                          origin: 'الانطلاق',
                          destination: 'الوجهة',
                          departureDate: 'تاريخ السفر',
                          returnDate: 'تاريخ العودة',
                          pickupDate: 'تاريخ الاستقبال',
                          pickupTime: 'وقت الاستقبال',
                          passengers: 'عدد المسافرين',
                          adults: 'البالغين',
                          children: 'الأطفال',
                          flightClass: 'الدرجة',
                          hotelName: 'الفندق',
                          roomType: 'نوع الغرفة',
                          guests: 'النزلاء',
                          nights: 'الليالي',
                          checkIn: 'تاريخ الوصول',
                          checkOut: 'تاريخ المغادرة',
                          vehicle: 'نوع المركبة',
                          luggage: 'الحقائب',
                          mission: 'الجهة القنصلية',
                          procedure: 'الإجراء المطلوب',
                          passportCountry: 'بلد الجواز',
                        };
                        const displayLabel = labelMap[key] || key;
                        return (
                          <div key={key} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[10px] text-slate-500 font-medium">{displayLabel}</div>
                            <div className="text-xs font-bold text-slate-800 mt-0.5 break-words">
                              {String(val)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Customer Message Card */}
                <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2 pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-700">نص الرسالة والاستفسار:</span>
                    <span>{new Date(selectedMessage.createdAt).toLocaleString('ar-EG')}</span>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>

                  {/* Attachments Preview */}
                  {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                        <span>الملفات والوثائق المرفقة:</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedMessage.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 hover:bg-slate-100 transition-colors"
                          >
                            {att.url && att.url.startsWith('data:image') ? (
                              <img
                                src={att.url}
                                alt={att.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                PDF
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-slate-800 truncate">
                                {att.name}
                              </div>
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
                              >
                                معاينة <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Internal Notes Section */}
                <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/70 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      الملاحظات الداخلية للفريق (Internal Notes):
                    </span>
                    <span className="text-[10px] text-amber-700">خاصة بالإدارة ولا تظهر للعميل</span>
                  </div>

                  {selectedMessage.internalNotes && selectedMessage.internalNotes.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {selectedMessage.internalNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-2.5 bg-white rounded-xl border border-amber-200/80 text-xs shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                            <span className="font-bold text-amber-900">{note.author}</span>
                            <span className="font-mono">
                              {new Date(note.createdAt).toLocaleString('ar-EG', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {note.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-800/70 mb-3 italic">
                      لا توجد ملاحظات داخلية بعد. أضف ملاحظة لمتابعة مسار معالجة الطلب.
                    </div>
                  )}

                  {/* Add Internal Note Form */}
                  <form onSubmit={handleAddInternalNote} className="flex gap-2">
                    <input
                      type="text"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="أضف ملاحظة داخلية (مثال: تم التواصل هاتفياً واتفقنا على موعد العودة)..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={addingNote || !newNoteText.trim()}
                      className="px-3 py-1.5 bg-[#0B2E57] hover:bg-[#12427b] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>حفظ الملاحظة</span>
                    </button>
                  </form>
                </div>

                {/* Audit Activity Timeline Toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTimeline(!showTimeline)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>سجل النشاط وتتبع العمليات ({selectedMessage.activityTimeline?.length || 1})</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${showTimeline ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showTimeline && (
                    <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                      {selectedMessage.activityTimeline && selectedMessage.activityTimeline.length > 0 ? (
                        selectedMessage.activityTimeline.map((item) => (
                          <div key={item.id} className="flex items-start gap-2 text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <div>
                              <span className="font-bold text-slate-800">{item.action}</span>
                              {item.details && <span className="text-slate-500"> — {item.details}</span>}
                              <div className="text-[10px] text-slate-400 font-mono">
                                بواسطة {item.actor} • {new Date(item.createdAt).toLocaleString('ar-EG')}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500">تم إنشاء واستلام الطلب عبر النظام.</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Reply Threads */}
                {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-bold text-slate-500 uppercase">
                      سجل الردود والتواصل مع العميل:
                    </div>
                    {selectedMessage.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 mr-4"
                      >
                        <div className="flex items-center justify-between text-xs text-blue-800 font-bold mb-1">
                          <span>{reply.authorName}</span>
                          <span className="text-slate-400 font-normal">
                            {new Date(reply.sentAt).toLocaleString('ar-EG')}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                          {reply.message}
                        </p>
                        <div className="mt-1 text-[10px] text-blue-600 font-semibold">
                          قناة الرد:{' '}
                          {reply.channel === 'site'
                            ? 'مراسلة داخل الموقع'
                            : reply.channel === 'whatsapp'
                            ? 'واتساب'
                            : 'إيميل'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Integrated Multi-Channel Reply Composer */}
              <div className="p-4 bg-white border-t border-slate-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendReply('site');
                  }}
                  className="space-y-3"
                >
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="اكتب ردك للعميل كإدارة ELFAZNI SERVICES (رشيد الفزني)..."
                    className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Fast External Reply Options */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleWhatsAppReply}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <WhatsAppLogo className="w-3.5 h-3.5" />
                        <span>رد فوري عبر واتساب</span>
                      </button>

                      {selectedMessage.email && (
                        <button
                          type="button"
                          onClick={() => void sendReply('email')}
                          disabled={sendingReply || !replyText.trim()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>إرسال الرد بالبريد</span>
                        </button>
                      )}
                    </div>

                    {/* Primary Button: Save & Send Site Reply */}
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="px-5 py-2 rounded-xl bg-[#0B2E57] hover:bg-[#12427b] disabled:opacity-40 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5 rotate-180" />
                      <span>{sendingReply ? 'جارٍ الإرسال...' : 'حفظ الرد في التذكرة'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Inbox className="w-12 h-12 mb-3 text-slate-300" />
              <p className="font-bold text-sm text-slate-700">
                اختر طلباً من القائمة لعرض تفاصيله ومعطياته والرد عليه
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                يمكنك فرز الطلبات حسب نوع الخدمة (طيران، فنادق، نقل، خدمات قنصلية، دردشة أوفلاين)
                أو حالة المتابعة (يحتاج متابعة، جديد، قيد المعالجة).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
