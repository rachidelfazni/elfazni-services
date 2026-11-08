import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Eye,
  MessageSquare,
  Globe2,
  TrendingUp,
  Smartphone,
  Laptop,
  Tablet,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  Bell,
  X,
} from 'lucide-react';
import { api, AnalyticsState, TodoItem } from '../../services/api';
import { BlogPostAnalyticsWidget } from './BlogPostAnalyticsWidget';
import { realtime } from '../../services/realtime';

// ---------------------------------------------------------------------------
// Date helpers for the dashboard calendar (local time, no UTC drift)
// ---------------------------------------------------------------------------
const pad2 = (n: number) => String(n).padStart(2, '0');

/** Local date -> "YYYY-MM-DD" */
const toISODate = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** "YYYY-MM-DD" -> local Date at midnight */
const parseISODate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** Arabic short display: 6 نوفمبر 2026 */
const formatISODate = (iso: string): string =>
  parseISODate(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });

const PRIORITY_LABEL: Record<'high' | 'medium' | 'low', string> = {
  high: 'عالية',
  medium: 'متوسطة',
  low: 'منخفضة',
};
const PRIORITY_DOT: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
};

export const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showMobileLinkPanel, setShowMobileLinkPanel] = useState(false);
  const [copiedMobileUrl, setCopiedMobileUrl] = useState(false);
  const [testingIphonePing, setTestingIphonePing] = useState(false);
  const [trafficPeriod, setTrafficPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [mapZoom, setMapZoom] = useState(1);
  const [newTodoText, setNewTodoText] = useState('');
  const [todoPriority, setTodoPriority] = useState<'high' | 'medium' | 'low'>('medium');
  // Dashboard calendar: real month view + day panel (task / reminder)
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => toISODate(new Date()));
  const [dayPanelOpen, setDayPanelOpen] = useState(false);
  const [dayText, setDayText] = useState('');
  const [dayKind, setDayKind] = useState<'task' | 'reminder'>('task');
  const [dayPriority, setDayPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dayTime, setDayTime] = useState('');
  const [daySaving, setDaySaving] = useState(false);
  const [recentFlash, setRecentFlash] = useState<string | null>(null);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevVisitsCountRef = useRef<number | null>(null);

  useEffect(() => {
    loadAnalytics();

    // Subscribe to Realtime SSE Visitor Events (Instant reflection on phone entrance)
    const unsubVisit = realtime.subscribe('analytics:visit', (payload: any) => {
      setAnalytics((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          totalVisits: payload.totalVisits ?? prev.totalVisits + 1,
          uniqueVisitors: payload.uniqueVisitors ?? prev.uniqueVisitors,
          activeVisitors: payload.activeVisitors ?? prev.activeVisitors,
          deviceBreakdown: payload.deviceBreakdown ?? prev.deviceBreakdown,
          recentVisits: payload.recentVisits ?? (payload.newVisit ? [payload.newVisit, ...prev.recentVisits.slice(0, 24)] : prev.recentVisits),
          topCountries: payload.topCountries ?? prev.topCountries,
          trafficHistory: payload.trafficHistory ?? prev.trafficHistory,
          trafficPeriods: payload.trafficPeriods ?? prev.trafficPeriods,
        };
      });

      // Visual flash badge
      const dev = payload.newVisit?.device || 'الهاتف الذكي';
      const city = payload.newVisit?.city || 'الزائر';
      setRecentFlash(`🟢 دخل زائر جديد الآن من ${dev} (${city})!`);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setRecentFlash(null), 4000);
    });

    const unsubHeartbeat = realtime.subscribe('analytics:heartbeat', (payload: any) => {
      setAnalytics((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          activeVisitors: payload.activeVisitors ?? prev.activeVisitors,
          totalVisits: payload.totalVisits ?? prev.totalVisits,
        };
      });
    });

    const unsubReset = realtime.subscribe('analytics:reset', () => {
      prevVisitsCountRef.current = 0;
      loadAnalytics();
    });

    const unsubChatMsg = realtime.subscribe('chat:message', (payload: any) => {
      if (payload?.message?.sender === 'visitor') {
        setRecentFlash(`💬 رسالة فورية جديدة من ${payload.message.senderName || 'زائر الهاتف'}: "${payload.message.text || 'مرفق'}"`);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setRecentFlash(null), 5000);
        loadAnalytics();
      }
    });

    const unsubMailNew = realtime.subscribe('mailbox:new', (payload: any) => {
      if (payload?.message) {
        setRecentFlash(`📬 رسالة بريد جديدة من ${payload.message.name} (${payload.message.serviceRequested || 'طلب خدمة'})!`);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setRecentFlash(null), 5000);
        loadAnalytics();
      }
    });

    // 2-second live polling to guarantee instant synchronization even across mobile networks
    const pollInterval = setInterval(() => {
      api.getAnalytics().then((res) => {
        if (res.analytics) {
          if (
            prevVisitsCountRef.current !== null &&
            res.analytics.totalVisits > prevVisitsCountRef.current
          ) {
            const latestVisit = res.analytics.recentVisits?.[0];
            const dev = latestVisit?.device || 'الهاتف الذكي';
            const city = latestVisit?.city || 'الزائر';
            setRecentFlash(`🟢 دخل زائر جديد الآن من ${dev} (${city})!`);
            if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
            flashTimerRef.current = setTimeout(() => setRecentFlash(null), 4500);
          }
          prevVisitsCountRef.current = res.analytics.totalVisits;
          setAnalytics(res.analytics);
        }
      }).catch(() => {});
    }, 2000);

    return () => {
      unsubVisit();
      unsubHeartbeat();
      unsubReset();
      unsubChatMsg();
      unsubMailNew();
      clearInterval(pollInterval);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const loadAnalytics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.getAnalytics();
      if (res.analytics) {
        prevVisitsCountRef.current = res.analytics.totalVisits;
        setAnalytics(res.analytics);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const publicMobileUrl =
    typeof window !== 'undefined'
      ? window.location.origin.replace('ais-dev-', 'ais-pre-')
      : '';

  const handleCopyMobileUrl = () => {
    if (!publicMobileUrl) return;
    navigator.clipboard.writeText(publicMobileUrl);
    setCopiedMobileUrl(true);
    setTimeout(() => setCopiedMobileUrl(false), 3000);
  };

  const handleTestIphoneSignal = async () => {
    setTestingIphonePing(true);
    try {
      const testVid = `vis_iphone_test_${Date.now()}`;
      await api.trackVisit({
        visitorId: testVid,
        device: 'هاتف آيفون (iPhone)',
        browser: 'Safari (iPhone)',
        country: 'المغرب',
        flag: '🇲🇦',
        city: 'الدار البيضاء',
        page: '/',
        action: 'فحص اتصال مباشر من هاتف آيفون (iPhone)',
        screenW: 390,
        maxTouchPoints: 5,
      });
      await api.sendChatMessage({
        sessionId: `chat_${testVid}`,
        visitorId: testVid,
        sender: 'visitor',
        senderName: 'زائر (هاتف آيفون iPhone)',
        text: 'السلام عليكم، هذه رسالة تجربة فورية من هاتف الآيفون للتأكد من التزامن اللحظي.',
        device: 'هاتف آيفون (iPhone)',
        browser: 'Safari (iPhone)',
        country: 'المغرب',
        flag: '🇲🇦',
        city: 'الدار البيضاء',
        screenW: 390,
        maxTouchPoints: 5,
      });
      await loadAnalytics(true);
    } catch (err) {
      console.error('Test ping error:', err);
    } finally {
      setTestingIphonePing(false);
    }
  };

  const handleResetToZero = async () => {
    setResetting(true);
    try {
      await api.resetAnalytics();
      await loadAnalytics();
      setShowResetConfirm(false);
    } catch (err) {
      console.error('Failed to reset analytics:', err);
    } finally {
      setResetting(false);
    }
  };

  const handleToggleTodo = async (id: string, currentDone: boolean) => {
    try {
      const res = await api.updateTodo(id, { done: !currentDone });
      if (analytics && res.todoList) {
        setAnalytics({ ...analytics, todoList: res.todoList });
      }
    } catch (err) {
      console.error('Failed to toggle todo:', err);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    try {
      const res = await api.createTodo({
        text: newTodoText.trim(),
        priority: todoPriority,
        dueDate: toISODate(new Date()),
        kind: 'task',
      });
      if (analytics && res.todoList) {
        setAnalytics({ ...analytics, todoList: res.todoList });
      }
      setNewTodoText('');
    } catch (err) {
      console.error('Failed to create todo:', err);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      const res = await api.deleteTodo(id);
      if (analytics && res.todoList) {
        setAnalytics({ ...analytics, todoList: res.todoList });
      }
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin ml-3" />
        <span>جارٍ فحص وتحميل إحصائيات الزوار الفعلية للموقع...</span>
      </div>
    );
  }

  // Genuine KPI calculations with zero fallbacks
  const kpis = {
    totalVisits: analytics?.totalVisits ?? 0,
    totalLeads: (analytics?.trafficHistory?.reduce((s, t) => s + (t.chats || 0) + (t.messages || 0), 0) ?? 0),
    uniqueVisitors: analytics?.uniqueVisitors ?? 0,
    activeVisitors: analytics?.activeVisitors ?? 0,
  };

  const countries = analytics?.topCountries || [];
  const recentVisits = analytics?.recentVisits || [];

  const defaultPeriods = {
    daily: [
      { label: '00:00', visits: 0, chats: 0, messages: 0 },
      { label: '03:00', visits: 0, chats: 0, messages: 0 },
      { label: '06:00', visits: 0, chats: 0, messages: 0 },
      { label: '09:00', visits: 0, chats: 0, messages: 0 },
      { label: '12:00', visits: 0, chats: 0, messages: 0 },
      { label: '15:00', visits: 0, chats: 0, messages: 0 },
      { label: '18:00', visits: 0, chats: 0, messages: 0 },
      { label: '21:00', visits: 0, chats: 0, messages: 0 },
    ],
    weekly: analytics?.trafficHistory || [
      { label: 'السبت', visits: 0, chats: 0, messages: 0 },
      { label: 'الأحد', visits: 0, chats: 0, messages: 0 },
      { label: 'الإثنين', visits: 0, chats: 0, messages: 0 },
      { label: 'الثلاثاء', visits: 0, chats: 0, messages: 0 },
      { label: 'الأربعاء', visits: 0, chats: 0, messages: 0 },
      { label: 'الخميس', visits: 0, chats: 0, messages: 0 },
      { label: 'الجمعة', visits: 0, chats: 0, messages: 0 },
    ],
    monthly: [
      { label: 'الأسبوع 1 (1-7)', visits: 0, chats: 0, messages: 0 },
      { label: 'الأسبوع 2 (8-14)', visits: 0, chats: 0, messages: 0 },
      { label: 'الأسبوع 3 (15-21)', visits: 0, chats: 0, messages: 0 },
      { label: 'الأسبوع 4 (22-28)', visits: 0, chats: 0, messages: 0 },
      { label: 'نهاية الشهر (29-31)', visits: 0, chats: 0, messages: 0 },
    ],
    yearly: [
      { label: 'يناير', visits: 0, chats: 0, messages: 0 },
      { label: 'فبراير', visits: 0, chats: 0, messages: 0 },
      { label: 'مارس', visits: 0, chats: 0, messages: 0 },
      { label: 'أبريل', visits: 0, chats: 0, messages: 0 },
      { label: 'مايو', visits: 0, chats: 0, messages: 0 },
      { label: 'يونيو', visits: 0, chats: 0, messages: 0 },
      { label: 'يوليو', visits: 0, chats: 0, messages: 0 },
      { label: 'أغسطس', visits: 0, chats: 0, messages: 0 },
      { label: 'سبتمبر', visits: 0, chats: 0, messages: 0 },
      { label: 'أكتوبر', visits: 0, chats: 0, messages: 0 },
      { label: 'نوفمبر', visits: 0, chats: 0, messages: 0 },
      { label: 'ديسمبر', visits: 0, chats: 0, messages: 0 },
    ],
  };

  const trafficData =
    analytics?.trafficPeriods?.[trafficPeriod] && analytics.trafficPeriods[trafficPeriod].length > 0
      ? analytics.trafficPeriods[trafficPeriod]
      : defaultPeriods[trafficPeriod];

  const periodMetadata: Record<
    'daily' | 'weekly' | 'monthly' | 'yearly',
    { titleAr: string; subtitleAr: string; badgeAr: string }
  > = {
    daily: {
      titleAr: 'التوزيع اليومي (24 ساعة)',
      subtitleAr: 'حجم الزيارات والمحادثات الحقيقية الموزعة حسب ساعات اليوم الحالي',
      badgeAr: 'ساعات اليوم',
    },
    weekly: {
      titleAr: 'التوزيع الأسبوعي (7 أيام)',
      subtitleAr: 'حجم الزيارات والمحادثات الحقيقية الموزعة حسب أيام الأسبوع الحالي',
      badgeAr: 'أيام الأسبوع',
    },
    monthly: {
      titleAr: 'التوزيع الشهري (أسابيع الشهر)',
      subtitleAr: 'حجم الزيارات والمحادثات الحقيقية الموزعة حسب أسابيع الشهر الحالي',
      badgeAr: 'أسابيع الشهر',
    },
    yearly: {
      titleAr: `التوزيع السنوي (${new Date().getFullYear()})`,
      subtitleAr: `حجم الزيارات والمحادثات الحقيقية الموزعة حسب أشهر السنة الحالية (${new Date().getFullYear()})`,
      badgeAr: 'أشهر السنة',
    },
  };

  const periodTotalVisits = trafficData.reduce((acc, d) => acc + (d.visits || 0), 0);
  const periodTotalInteractions = trafficData.reduce((acc, d) => acc + (d.chats || 0) + (d.messages || 0), 0);
  const peakPoint = [...trafficData].sort(
    (a, b) => b.visits + b.chats + b.messages - (a.visits + a.chats + a.messages)
  )[0];

  const todoList = analytics?.todoList || [];

  /** Todos attached to a given calendar day (legacy "اليوم" counts as today). */
  const todosForDate = (iso: string): TodoItem[] =>
    todoList.filter(
      (t) => t.dueDate === iso || (t.dueDate === 'اليوم' && iso === toISODate(new Date()))
    );

  const openDayPanel = (iso: string) => {
    setSelectedDate(iso);
    setDayPanelOpen(true);
    setDayText('');
    setDayKind('task');
    setDayPriority('medium');
    setDayTime('');
  };

  const closeDayPanel = () => setDayPanelOpen(false);

  const handleDayAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayText.trim() || daySaving) return;
    setDaySaving(true);
    try {
      const res = await api.createTodo({
        text: dayText.trim(),
        priority: dayPriority,
        dueDate: selectedDate,
        kind: dayKind,
        ...(dayKind === 'reminder' && dayTime ? { time: dayTime } : {}),
      });
      if (analytics && res.todoList) {
        setAnalytics({ ...analytics, todoList: res.todoList });
      }
      setDayText('');
      setDayTime('');
    } catch (err) {
      console.error('Failed to create day item:', err);
    } finally {
      setDaySaving(false);
    }
  };
  const rawDevices = analytics?.deviceBreakdown || { desktop: 0, mobile: 0, tablet: 0 };
  const totalDeviceVisits = rawDevices.desktop + rawDevices.mobile + rawDevices.tablet;
  const devices = {
    desktop: totalDeviceVisits > 0 ? Math.round((rawDevices.desktop / totalDeviceVisits) * 100) : 0,
    mobile: totalDeviceVisits > 0 ? Math.round((rawDevices.mobile / totalDeviceVisits) * 100) : 0,
    tablet: totalDeviceVisits > 0 ? Math.round((rawDevices.tablet / totalDeviceVisits) * 100) : 0,
  };

  // Max value for dynamic chart scaling across both visits and interactions
  const maxVisits = Math.max(
    ...trafficData.map((d) => Math.max(d.visits || 0, (d.chats || 0) + (d.messages || 0))),
    5
  );

  // Dynamic X-step so any number of points (5, 7, 8, or 12) spans cleanly from x=58 to x=662
  const xStep = trafficData.length > 1 ? 604 / (trafficData.length - 1) : 0;

  // Dynamic SVG points for Visits (Blue) and Interactions (Green)
  const points = trafficData.map((d, idx) => {
    const x = Math.round(58 + idx * xStep);
    const interactions = (d.chats || 0) + (d.messages || 0);
    const y = maxVisits > 0 ? 170 - ((d.visits || 0) / maxVisits) * 140 : 170;
    const yInteractions = maxVisits > 0 ? 170 - (interactions / maxVisits) * 140 : 170;
    return { x, y, yInteractions, interactions, ...d };
  });

  let splineStrokePath = '';
  let interactionsStrokePath = '';
  if (points.length > 0) {
    splineStrokePath = `M ${points[0].x},${points[0].y}`;
    interactionsStrokePath = `M ${points[0].x},${points[0].yInteractions}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      splineStrokePath += ` C ${cpX1},${prev.y} ${cpX2},${curr.y} ${curr.x},${curr.y}`;
      interactionsStrokePath += ` C ${cpX1},${prev.yInteractions} ${cpX2},${curr.yInteractions} ${curr.x},${curr.yInteractions}`;
    }
  }
  const splineAreaPath = splineStrokePath
    ? `${splineStrokePath} L ${points[points.length - 1].x},170 L ${points[0].x},170 Z`
    : '';
  const interactionsAreaPath = interactionsStrokePath
    ? `${interactionsStrokePath} L ${points[points.length - 1].x},170 L ${points[0].x},170 Z`
    : '';

  // Geographic pin mapping coordinates
  const geoCoords: Record<string, { cx: number; cy: number }> = {
    TR: { cx: 535, cy: 145 },
    MA: { cx: 445, cy: 175 },
    FR: { cx: 475, cy: 120 },
    ES: { cx: 455, cy: 140 },
    DE: { cx: 495, cy: 108 },
    BE: { cx: 485, cy: 100 },
    NL: { cx: 490, cy: 95 },
    SA: { cx: 585, cy: 195 },
    AE: { cx: 605, cy: 190 },
    GB: { cx: 465, cy: 95 },
    IT: { cx: 495, cy: 135 },
  };

  return (
    <div className="space-y-6">
      {/* Analytics Action Bar (Reset to 0 + Live Refresh) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-black text-[#0B2E57]">
              نشاط الموقع
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تابع الزيارات ومصادر التفاعل والرسائل الواردة. تتحدّث الأرقام تلقائيًا.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowMobileLinkPanel(!showMobileLinkPanel)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              showMobileLinkPanel
                ? 'bg-[#0B2E57] text-white shadow-md'
                : 'bg-blue-50 hover:bg-blue-100 text-[#004AA5] border border-blue-200'
            }`}
            title="رابط ورمز QR للدخول المباشر من هاتف الآيفون أو الأندرويد"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>فحص الوصول من الهاتف</span>
          </button>

          <button
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            title="تحديث البيانات لحظياً"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>تحديث لحظي</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all cursor-pointer"
            title="إعادة تصفير جميع المبيانات إلى الصفر"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة التصفير (0)</span>
          </button>
        </div>
      </div>

      {/* Direct Mobile / iPhone Connection & QR Code Panel */}
      {showMobileLinkPanel && (
        <div className="bg-gradient-to-l from-[#0B2E57] via-[#004AA5] to-[#0B2E57] text-white rounded-2xl p-5 shadow-lg border border-blue-400/30 flex flex-col lg:flex-row items-center justify-between gap-5">
          <div className="space-y-2.5 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold">
              <QrCode className="w-3.5 h-3.5" />
              <span>بوابة المزامنة اللحظية للهاتف المحمول والآيفون (iOS Safari)</span>
            </div>
            <h3 className="text-base sm:text-lg font-black">
              ادخل من هاتفك الآيفون عبر هذا الرابط المباشر أو امسح رمز QR بكاميرا الآيفون
            </h3>
            <p className="text-xs text-blue-100 leading-relaxed max-w-2xl">
              هذا الرابط يتصل مباشرة بنفس الخادم الحي المفتوح أمامك الآن بدون الحاجة لتسجيل دخول على الهاتف. بمجرد فتحه من الآيفون أو إرسال رسالة في المحادثة الفورية، ستظهر الزيارة والرسالة هنا في نفس اللحظة.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div
                dir="ltr"
                className="px-3 py-2 rounded-xl bg-black/25 border border-white/20 text-xs font-mono text-blue-100 select-all max-w-full truncate"
              >
                {publicMobileUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyMobileUrl}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#0B2E57] hover:bg-blue-50 text-xs font-black transition-all cursor-pointer shadow"
              >
                {copiedMobileUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#CC9048]" />
                    <span>تم نسخ رابط الهاتف!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ رابط الهاتف</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleTestIphoneSignal}
                disabled={testingIphonePing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#004AA5] hover:bg-[#2A83D5] text-white text-xs font-black transition-all cursor-pointer shadow disabled:opacity-50"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{testingIphonePing ? 'جارٍ إرسال إشارة الفحص...' : 'محاكاة دخول ورسالة آيفون الآن'}</span>
              </button>
            </div>
          </div>

          {publicMobileUrl && (
            <div className="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center gap-1.5 shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(publicMobileUrl)}`}
                alt="QR Code for iPhone"
                className="w-28 h-28 rounded-lg"
              />
              <span className="text-[10px] font-black text-[#0B2E57]">امسح بكاميرا الآيفون</span>
            </div>
          )}
        </div>
      )}

      {/* Live Visitor Hit Alert Banner */}
      {recentFlash && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-l from-[#0B2E57] to-[#004AA5] text-white font-bold text-xs flex items-center justify-between shadow-lg border border-[#2A83D5]/40">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E3C88F] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E3C88F]" />
            </span>
            <span className="text-sm font-black">{recentFlash}</span>
          </div>
          <span className="text-[11px] bg-white/25 px-2.5 py-1 rounded-full font-bold">
            مباشر الآن (Real-Time)
          </span>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900 font-bold">
            <AlertTriangle className="w-5 h-5 text-[#5E7086] shrink-0" />
            <span>
              هل تؤكد إعادة تصفير كافة الإحصائيات، سجل الزوار، وقراءات المقالات إلى الصفر (0) لبدء التتبع من جديد؟
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetToZero}
              disabled={resetting}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all disabled:opacity-50"
            >
              {resetting ? 'جارٍ التصفير...' : 'نعم، صفر الكل الآن'}
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Unified ELFAZNI brand KPI cards (white surfaces + one deep-blue live card) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total visits */}
        <div className="group relative overflow-hidden rounded-2xl bg-white border border-[#D7E7F7] p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#004AA5] to-[#2A83D5]" aria-hidden="true" />
          <div className="flex items-start justify-between">
            <div>
              <div className="text-3xl font-black tracking-tight text-[#0B2E57] tabular-nums">
                {kpis.totalVisits.toLocaleString()}
              </div>
              <div className="text-[11px] font-bold text-[#5E7086] uppercase mt-1 tracking-wider">
                إجمالي الزيارات والمشاهدات
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#EAF4FF] text-[#004AA5]">
              <Eye className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EAF4FF] flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 font-bold text-[#CC9048]">
              <TrendingUp className="w-3.5 h-3.5" />
              {kpis.totalVisits > 0 ? `${kpis.totalVisits} زيارة فعلية` : 'جاهز للرصد (0)'}
            </span>
            <span className="text-[#5E7086]">تحديث فوري</span>
          </div>
        </div>

        {/* Messages, chats & leads */}
        <div className="group relative overflow-hidden rounded-2xl bg-white border border-[#D7E7F7] p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#CC9048] to-[#E3C88F]" aria-hidden="true" />
          <div className="flex items-start justify-between">
            <div>
              <div className="text-3xl font-black tracking-tight text-[#0B2E57] tabular-nums">
                {kpis.totalLeads.toLocaleString()}
              </div>
              <div className="text-[11px] font-bold text-[#5E7086] uppercase mt-1 tracking-wider">
                الرسائل والشات وطلبات واتساب
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#F7F5EF] text-[#CC9048]">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EAF4FF] flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 font-bold text-[#CC9048]">
              <ArrowUpRight className="w-3.5 h-3.5" /> طلبات حقيقية
            </span>
            <span className="text-[#5E7086]">Mailbox &amp; Chat</span>
          </div>
        </div>

        {/* Unique visitors */}
        <div className="group relative overflow-hidden rounded-2xl bg-white border border-[#D7E7F7] p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#0B2E57] to-[#004AA5]" aria-hidden="true" />
          <div className="flex items-start justify-between">
            <div>
              <div className="text-3xl font-black tracking-tight text-[#0B2E57] tabular-nums">
                {kpis.uniqueVisitors.toLocaleString()}
              </div>
              <div className="text-[11px] font-bold text-[#5E7086] uppercase mt-1 tracking-wider">
                الزوار الفريدون الجدد
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#EAF4FF] text-[#004AA5]">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EAF4FF] flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 font-bold text-[#CC9048]">
              <TrendingUp className="w-3.5 h-3.5" /> أجهزة مختلفة
            </span>
            <span className="text-[#5E7086]">بالمعرف الفريد</span>
          </div>
        </div>

        {/* Live visitors & countries — single deep-blue emphasis card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B2E57] to-[#004AA5] p-5 text-white shadow-sm hover:shadow-md transition-shadow">
          <span className="absolute inset-x-0 top-0 h-1 bg-[#CC9048]" aria-hidden="true" />
          <div className="flex items-start justify-between">
            <div>
              <div className="text-3xl font-black tracking-tight flex items-center gap-2 tabular-nums">
                <span>{kpis.activeVisitors}</span>
                {kpis.activeVisitors > 0 && <span className="w-3 h-3 rounded-full bg-[#E3C88F] animate-ping" />}
              </div>
              <div className="text-[11px] font-bold text-[#B9D5F6] uppercase mt-1 tracking-wider">
                زوار متصلون الآن (Live)
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/10 text-[#E3C88F]">
              <Globe2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[11px]">
            <span className="font-bold text-white">
              {countries.length > 0 ? `${countries.length} دول مسجلة` : 'في انتظار أول زائر'}
            </span>
            <span className="text-[#B9D5F6]">نبض لحظي (3 د)</span>
          </div>
        </div>
      </div>

      {/* Row 2: Interactive World Map & Top Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* World Map Box */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                خريطة التوزيع الجغرافي للزوار (World Geo-Analytics)
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setMapZoom((z) => Math.min(z + 0.25, 2.5))}
                className="p-1 text-slate-600 hover:text-blue-600 hover:bg-white rounded transition-colors"
                title="تكبير الخريطة"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMapZoom((z) => Math.max(z - 0.25, 0.75))}
                className="p-1 text-slate-600 hover:text-blue-600 hover:bg-white rounded transition-colors"
                title="تصغير الخريطة"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMapZoom(1)}
                className="p-1 text-slate-600 hover:text-blue-600 hover:bg-white rounded transition-colors"
                title="إعادة ضبط"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SVG Map Container */}
          <div className="relative h-[320px] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-800">
            <div
              className="w-full h-full transition-transform duration-300 flex items-center justify-center relative"
              style={{ transform: `scale(${mapZoom})` }}
            >
              {/* Authentic World Vector Map */}
              <img
                src="/assets/aistudio/world_d364c888.svg"
                alt="World Geo Map"
                className="absolute inset-0 w-full h-full object-contain opacity-25 invert contrast-125 brightness-150 pointer-events-none"
              />

              <svg viewBox="0 0 1000 500" className="relative w-full h-full max-h-[300px]">
                {/* Dynamic Visitor Pins based on genuine tracked countries */}
                {countries.map((c) => {
                  const pos = geoCoords[c.code] || { cx: 500, cy: 160 };
                  return (
                    <g key={c.code} className="cursor-pointer">
                      <circle cx={pos.cx} cy={pos.cy} r="14" fill="#004AA5" opacity="0.3" className="animate-ping" />
                      <circle cx={pos.cx} cy={pos.cy} r="6" fill="#2A83D5" />
                      <text x={pos.cx + 12} y={pos.cy + 4} fill="#F8FAFC" fontSize="11" fontWeight="bold">
                        {c.flag} {c.name} ({c.percentage}%)
                      </text>
                    </g>
                  );
                })}

                {countries.length === 0 && (
                  <text x="500" y="250" fill="#8CA0B7" fontSize="13" textAnchor="middle" fontWeight="bold">
                    🌐 في انتظار دخول الزوار لتسجيل الإحداثيات الجغرافية المباشرة
                  </text>
                )}
              </svg>
            </div>

            <div className="absolute bottom-2 left-2 bg-slate-950/80 px-3 py-1 rounded text-[11px] text-slate-300 border border-slate-800">
              🟢 رصد جغرافي حقيقي ومباشر
            </div>
          </div>
        </div>

        {/* Top Countries Progress Bars */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <span>الدول الأكثر زيارة وتفاعلاً</span>
            </h3>
            <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
              {countries.length} دول مسجلة
            </span>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[320px] pr-1">
            {countries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 text-xs">
                <Globe2 className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
                <p className="font-bold text-slate-600">لا توجد زيارات مسجلة حتى الآن</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  ستظهر الدول والمدن التي يدخل منها الزوار هنا تلقائياً بنسبتها الحقيقية.
                </p>
              </div>
            ) : (
              countries.map((c) => (
                <div key={c.code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.flag}</span>
                      <span>{c.name}</span>
                      {c.city && <span className="text-[10px] text-slate-400 font-normal">({c.city})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-normal">{c.visits.toLocaleString()} زيارة</span>
                      <span className="font-bold text-blue-700">{c.percentage}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(c.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Area Spline Chart & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Area Spline Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  منحنى الزيارات والتفاعل (Real Traffic Curve)
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {periodMetadata[trafficPeriod].titleAr}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {periodMetadata[trafficPeriod].subtitleAr}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setTrafficPeriod(p);
                    setHoveredPointIdx(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    trafficPeriod === p
                      ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-600 font-black'
                      : 'hover:text-blue-600 hover:bg-white/60'
                  }`}
                >
                  {p === 'daily' ? 'يومي' : p === 'weekly' ? 'أسبوعي' : p === 'monthly' ? 'شهري' : 'سنوي'}
                </button>
              ))}
            </div>
          </div>

          {/* Period Summary Strip */}
          <div className="grid grid-cols-3 gap-2.5 mb-3 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center justify-between px-2.5 py-1 bg-white rounded-lg border border-slate-100">
              <span className="text-slate-500 font-semibold">زيارات المدة:</span>
              <span className="font-black text-[#004AA5] tabular-nums">{periodTotalVisits} زيارة</span>
            </div>
            <div className="flex items-center justify-between px-2.5 py-1 bg-white rounded-lg border border-slate-100">
              <span className="text-slate-500 font-semibold">المحادثات والرسائل:</span>
              <span className="font-black text-[#CC9048] tabular-nums">{periodTotalInteractions} تفاعل</span>
            </div>
            <div className="flex items-center justify-between px-2.5 py-1 bg-white rounded-lg border border-slate-100">
              <span className="text-slate-500 font-semibold">ذروة النشاط:</span>
              <span className="font-bold text-slate-800 truncate max-w-[110px]">
                {peakPoint && peakPoint.visits + peakPoint.chats + peakPoint.messages > 0
                  ? `${peakPoint.label} (${peakPoint.visits})`
                  : 'لا توجد ذروة بعد'}
              </span>
            </div>
          </div>

          {/* SVG Dynamic Area Spline */}
          <div className="h-64 w-full relative pt-2">
            {hoveredPointIdx !== null && points[hoveredPointIdx] && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold shadow-lg flex items-center gap-3 pointer-events-none">
                <span className="text-amber-300">{points[hoveredPointIdx].label}:</span>
                <span className="text-[#B9D5F6] tabular-nums">{points[hoveredPointIdx].visits} زيارات</span>
                <span className="text-emerald-300 tabular-nums">
                  {points[hoveredPointIdx].interactions} محادثات ورسائل
                </span>
              </div>
            )}

            <svg viewBox="0 0 700 220" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="splineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#004AA5" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#004AA5" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="greenSplineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#CC9048" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#CC9048" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="20" x2="680" y2="20" stroke="#D7E7F7" strokeDasharray="3 3" />
              <line x1="40" y1="70" x2="680" y2="70" stroke="#D7E7F7" strokeDasharray="3 3" />
              <line x1="40" y1="120" x2="680" y2="120" stroke="#D7E7F7" strokeDasharray="3 3" />
              <line x1="40" y1="170" x2="680" y2="170" stroke="#C4D6E8" strokeWidth="1.5" />

              {/* Y Axis Labels based on real maxVisits */}
              <text x="30" y="24" fill="#8CA0B7" fontSize="10" textAnchor="end">{maxVisits}</text>
              <text x="30" y="74" fill="#8CA0B7" fontSize="10" textAnchor="end">{Math.round(maxVisits * 0.66)}</text>
              <text x="30" y="124" fill="#8CA0B7" fontSize="10" textAnchor="end">{Math.round(maxVisits * 0.33)}</text>
              <text x="30" y="174" fill="#8CA0B7" fontSize="10" textAnchor="end">0</text>

              {/* Green Interactions Area & Stroke */}
              {interactionsAreaPath && <path d={interactionsAreaPath} fill="url(#greenSplineGrad)" />}
              {interactionsStrokePath && (
                <path
                  d={interactionsStrokePath}
                  fill="none"
                  stroke="#CC9048"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  strokeLinecap="round"
                />
              )}

              {/* Blue Visits Spline Area & Stroke */}
              {splineAreaPath && <path d={splineAreaPath} fill="url(#splineGrad)" />}
              {splineStrokePath && (
                <path
                  d={splineStrokePath}
                  fill="none"
                  stroke="#004AA5"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}

              {/* Dynamic Spline Points */}
              {points.map((d, idx) => {
                const isHovered = hoveredPointIdx === idx;
                return (
                  <g
                    key={`${trafficPeriod}_${idx}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIdx(idx)}
                    onMouseLeave={() => setHoveredPointIdx(null)}
                    onClick={() => setHoveredPointIdx(idx === hoveredPointIdx ? null : idx)}
                  >
                    {/* Vertical guide line on hover */}
                    {isHovered && (
                      <line
                        x1={d.x}
                        y1="20"
                        x2={d.x}
                        y2="170"
                        stroke="#8CA0B7"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Green interaction dot */}
                    <circle
                      cx={d.x}
                      cy={d.yInteractions}
                      r={isHovered ? 5 : 4}
                      fill="#FFFFFF"
                      stroke="#CC9048"
                      strokeWidth="2.5"
                    />

                    {/* Blue visits dot */}
                    <circle
                      cx={d.x}
                      cy={d.y}
                      r={isHovered ? 7 : 5}
                      fill="#FFFFFF"
                      stroke="#004AA5"
                      strokeWidth="3"
                    />

                    <text
                      x={d.x}
                      y="195"
                      fill={isHovered ? '#004AA5' : '#5E7086'}
                      fontSize={trafficData.length > 8 ? '9.5' : '10.5'}
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {d.label}
                    </text>

                    {d.visits > 0 && (
                      <text
                        x={d.x}
                        y={d.y - 10}
                        fill="#004AA5"
                        fontSize="10"
                        textAnchor="middle"
                        fontWeight="black"
                      >
                        {d.visits}
                      </text>
                    )}

                    {d.interactions > 0 && (
                      <text
                        x={d.x + (d.visits === d.interactions ? 10 : 0)}
                        y={d.yInteractions - 10}
                        fill="#CC9048"
                        fontSize="9.5"
                        textAnchor="middle"
                        fontWeight="black"
                      >
                        {d.interactions}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            <div className="flex items-center justify-center gap-6 mt-2 text-xs text-slate-600 font-semibold">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#004AA5]" /> الزيارات الفعلية ({periodTotalVisits})
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#CC9048]" /> المحادثات والرسائل ({periodTotalInteractions})
              </span>
            </div>
          </div>
        </div>

        {/* Donut Chart: Devices & Distribution */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              توزيع الأجهزة المستخدمة
            </h3>
            <p className="text-xs text-slate-500">حسب نوع المتصفح والجهاز الفعلي لكل زائر</p>
          </div>

          {/* SVG Donut */}
          <div className="flex items-center justify-center my-2">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#EAF4FF" strokeWidth="14" />
                {totalDeviceVisits > 0 && (
                  <>
                    {/* Mobile */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#004AA5"
                      strokeWidth="14"
                      strokeDasharray={`${devices.mobile * 2.38} 238`}
                      strokeDashoffset="0"
                    />
                    {/* Desktop */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#CC9048"
                      strokeWidth="14"
                      strokeDasharray={`${devices.desktop * 2.38} 238`}
                      strokeDashoffset={`-${devices.mobile * 2.38}`}
                    />
                    {/* Tablet */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#5E7086"
                      strokeWidth="14"
                      strokeDasharray={`${devices.tablet * 2.38} 238`}
                      strokeDashoffset={`-${(devices.mobile + devices.desktop) * 2.38}`}
                    />
                  </>
                )}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900">{totalDeviceVisits}</span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {totalDeviceVisits > 0 ? 'إجمالي الأجهزة' : 'بانتظار الزوار'}
                </span>
              </div>
            </div>
          </div>

          {/* Device Breakdown List */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#004AA5]" />
                الهواتف الذكية (Mobile)
              </span>
              <span className="font-bold text-[#004AA5]">{devices.mobile}% ({rawDevices.mobile})</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-[#CC9048]" />
                أجهزة الكمبيوتر (Desktop)
              </span>
              <span className="font-bold text-[#CC9048]">{devices.desktop}% ({rawDevices.desktop})</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Tablet className="w-4 h-4 text-[#5E7086]" />
                الأجهزة اللوحية (Tablet)
              </span>
              <span className="font-bold text-[#5E7086]">{devices.tablet}% ({rawDevices.tablet})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Blog Posts Visitor & Engagement Analytics Widget */}
      <BlogPostAnalyticsWidget />

      {/* Row 5: Real-time Visitor Log Table & To-Do List & Mini Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-time Visitor Log Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#CC9048]" />
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                سجل الزوار الحقيقي المباشر (Real-Time Visitor Activity Log)
              </h3>
            </div>
            <span className="text-xs text-[#CC9048] bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              مباشر ولحظي
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3 font-bold">الدولة والمدينة</th>
                  <th className="py-2.5 px-3 font-bold">الجهاز والمتصفح</th>
                  <th className="py-2.5 px-3 font-bold">الصفحة التي زارها</th>
                  <th className="py-2.5 px-3 font-bold">الإجراء والتفاعل</th>
                  <th className="py-2.5 px-3 font-bold">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentVisits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      سجل الزوار فارغ حالياً (0 زيارة). بمجرد دخول أي زائر للموقع سيتم تسجيل دولته وجهازه فوراً.
                    </td>
                  </tr>
                ) : (
                  recentVisits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="text-base">{v.flag}</span>
                        <span>{v.country}</span>
                        {v.city && <span className="text-[10px] text-slate-400 font-normal">({v.city})</span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div>{v.device}</div>
                        <div className="text-[10px] text-slate-400">{v.browser}</div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-blue-700">{v.page}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold text-[10px] border border-blue-200">
                          {v.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{v.time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* To-Do List & Mini Calendar */}
        <div className="lg:col-span-4 space-y-6">
          {/* To-Do List Widget */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                قائمة المهام اليومية (To-Do List)
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                {todoList.filter((t) => t.done).length} من {todoList.length} منجزة
              </span>
            </div>

            <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
              {todoList.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-start justify-between gap-2 p-2 rounded-xl border text-xs transition-all ${
                    todo.done
                      ? 'bg-slate-50 border-slate-200 opacity-60 line-through'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTodo(todo.id, todo.done)}
                    className="mt-0.5 text-blue-600 hover:text-blue-800 shrink-0"
                  >
                    {todo.done ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </button>

                  <div className="flex-1 font-medium text-slate-700 leading-snug">
                    {todo.text}
                    {todo.dueDate && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        {todo.kind === 'reminder' && <Bell className="w-3 h-3 text-[#5E7086]" />}
                        <span>
                          {/^\d{4}-\d{2}-\d{2}$/.test(todo.dueDate)
                            ? formatISODate(todo.dueDate)
                            : todo.dueDate}
                          {todo.time ? ` · ${todo.time}` : ''}
                        </span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="text-slate-400 hover:text-red-500 p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Todo Input */}
            <form onSubmit={handleAddTodo} className="flex items-center gap-1.5">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="أضف مهمة جديدة..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="إضافة مهمة"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Interactive Mini Calendar Widget */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                التقويم وجدول المواعيد
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)
                    )
                  }
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                  aria-label="الشهر السابق"
                  title="الشهر السابق"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                    openDayPanel(toISODate(now));
                  }}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                  title="اليوم"
                >
                  اليوم
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)
                    )
                  }
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                  aria-label="الشهر التالي"
                  title="الشهر التالي"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">
                {calendarMonth.toLocaleDateString('ar-EG', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="text-[10px] font-bold text-indigo-600">
                {todoList.filter((t) => t.dueDate).length} موعد/مهمة
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map((day, i) => (
                <div key={i} className="font-bold text-slate-400 py-1" aria-hidden="true">
                  {day}
                </div>
              ))}
              {(() => {
                const year = calendarMonth.getFullYear();
                const month = calendarMonth.getMonth();
                const firstWeekday = new Date(year, month, 1).getDay(); // 0 = الأحد
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const todayISO = toISODate(new Date());
                const cells: Array<number | null> = [
                  ...Array.from({ length: firstWeekday }, () => null),
                  ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                ];
                return cells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} aria-hidden="true" />;
                  }
                  const iso = `${year}-${pad2(month + 1)}-${pad2(day)}`;
                  const count = todosForDate(iso).length;
                  const isToday = iso === todayISO;
                  const isSelected = iso === selectedDate;
                  return (
                    <button
                      type="button"
                      key={iso}
                      onClick={() => openDayPanel(iso)}
                      aria-label={`${day} ${calendarMonth.toLocaleDateString('ar-EG', {
                        month: 'long',
                      })}${count ? ` — ${count} عنصر` : ''}`}
                      aria-pressed={isSelected}
                      className={`relative py-1.5 rounded-lg font-medium transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : isToday
                          ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-400 hover:bg-blue-100'
                          : count > 0
                          ? 'text-slate-800 hover:bg-slate-100'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                      title={
                        count
                          ? `${count} مهمة/تذكير — اضغط للعرض والإضافة`
                          : 'اضغط لإضافة مهمة أو تذكير'
                      }
                    >
                      {day}
                      {count > 0 && (
                        <span
                          className={`block mx-auto w-1 h-1 rounded-full mt-0.5 ${
                            isSelected ? 'bg-white' : 'bg-blue-600'
                          }`}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                });
              })()}
            </div>

            <p className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center">
              اضغط على أي تاريخ لإضافة مهمة أو تذكير وعرض مواعيده
            </p>
          </div>
        </div>
      </div>

      {/* ================= Day panel: tasks & reminders for a chosen date ================= */}
      {dayPanelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-panel-title"
          onClick={closeDayPanel}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeDayPanel();
          }}
        >
          <div
            className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-l from-indigo-700 to-blue-700 text-white px-5 py-4 rounded-t-3xl sm:rounded-t-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold text-blue-100">مهام ومواعيد اليوم المحدد</p>
                  <h3 id="day-panel-title" className="text-base font-black mt-0.5">
                    {formatISODate(selectedDate)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeDayPanel}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {/* Existing items of that day */}
              {todosForDate(selectedDate).length > 0 ? (
                <ul className="space-y-2 mb-4">
                  {todosForDate(selectedDate).map((todo) => (
                    <li
                      key={todo.id}
                      className={`flex items-start gap-2 rounded-xl border p-2.5 text-xs ${
                        todo.done
                          ? 'bg-slate-50 border-slate-200 opacity-60 line-through'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTodo(todo.id, todo.done)}
                        className="mt-0.5 text-blue-600 hover:text-blue-800 shrink-0 cursor-pointer"
                        aria-label={todo.done ? 'إعادة فتح' : 'تم الإنجاز'}
                      >
                        {todo.done ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-700 leading-snug">{todo.text}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-semibold">
                          <span className="inline-flex items-center gap-1">
                            {todo.kind === 'reminder' ? (
                              <>
                                <Bell className="w-3 h-3 text-[#5E7086]" /> تذكير
                              </>
                            ) : (
                              <>
                                <CheckSquare className="w-3 h-3 text-blue-500" /> مهمة
                              </>
                            )}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[todo.priority]}`} />
                            {PRIORITY_LABEL[todo.priority]}
                          </span>
                          {todo.time && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {todo.time}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="text-slate-400 hover:text-red-500 p-0.5 shrink-0 cursor-pointer"
                        aria-label="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 px-3 py-3 text-center text-xs text-slate-500 font-semibold">
                  لا توجد مهام أو تذكيرات في هذا اليوم بعد.
                </p>
              )}

              {/* Add form */}
              <form onSubmit={handleDayAdd} className="space-y-3">
                {/* Task / Reminder selector */}
                <div
                  className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
                  role="group"
                  aria-label="نوع العنصر"
                >
                  <button
                    type="button"
                    onClick={() => setDayKind('task')}
                    aria-pressed={dayKind === 'task'}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer ${
                      dayKind === 'task'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> مهمة
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayKind('reminder')}
                    aria-pressed={dayKind === 'reminder'}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer ${
                      dayKind === 'reminder'
                        ? 'bg-white text-[#5E7086] shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" /> تذكير
                  </button>
                </div>

                <input
                  type="text"
                  value={dayText}
                  onChange={(e) => setDayText(e.target.value)}
                  placeholder={dayKind === 'reminder' ? 'محتوى التذكير...' : 'عنوان المهمة...'}
                  autoFocus
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label={dayKind === 'reminder' ? 'محتوى التذكير' : 'عنوان المهمة'}
                />

                <div className={`grid gap-2 ${dayKind === 'reminder' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {dayKind === 'reminder' && (
                    <label className="flex flex-col gap-1 text-[10px] font-bold text-slate-500">
                      الوقت
                      <input
                        type="time"
                        value={dayTime}
                        onChange={(e) => setDayTime(e.target.value)}
                        className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  )}
                  <label className="flex flex-col gap-1 text-[10px] font-bold text-slate-500">
                    الأولوية
                    <select
                      value={dayPriority}
                      onChange={(e) =>
                        setDayPriority(e.target.value as 'high' | 'medium' | 'low')
                      }
                      className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="high">عالية</option>
                      <option value="medium">متوسطة</option>
                      <option value="low">منخفضة</option>
                    </select>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!dayText.trim() || daySaving}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 transition-colors cursor-pointer"
                >
                  {daySaving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {dayKind === 'reminder' ? 'إضافة التذكير' : 'إضافة المهمة'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
