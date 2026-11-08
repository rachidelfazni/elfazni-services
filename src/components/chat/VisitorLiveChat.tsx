import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Paperclip,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  CheckCheck,
  User,
  Check,
  AlertCircle,
} from 'lucide-react';
import { api, ChatMessage, ChatSession, ChatStatus } from '../../services/api';
import { realtime } from '../../services/realtime';
import { tracker } from '../../services/tracker';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { COUNTRY_CODES, CountryCodeOption } from '../common/ServiceContactModal';

// Sound effect generator using Web Audio API
function playChime(type: 'incoming' | 'outgoing' = 'incoming') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'incoming') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.21);
    }
  } catch {
    // audio autoplay restrictions
  }
}

const VISITOR_ID_KEY = 'elfazni_visitor_chat_id';
const VISITOR_NAME_KEY = 'elfazni_visitor_chat_name';
const VISITOR_PHONE_KEY = 'elfazni_visitor_chat_phone';

export const VisitorLiveChat: React.FC = () => {
  const { isRtl, t } = useLanguage();
  const {
    settings,
    isChatOpen: isOpen,
    setIsChatOpen: setIsOpen,
    unreadChatCount: unreadCount,
    setUnreadChatCount: setUnreadCount,
    adminOnline,
    setAdminOnline,
  } = useSiteSettings();

  const [viewport, setViewport] = useState<{ height: number; bottom: number }>();
  const [isMinimized, setIsMinimized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [showIdentityEditor, setShowIdentityEditor] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Offline message intake states
  const [offlineName, setOfflineName] = useState('');
  const [offlinePhone, setOfflinePhone] = useState('');
  const [offlineCountry, setOfflineCountry] = useState<CountryCodeOption>(COUNTRY_CODES[0]);
  const [offlineSameAsPhone, setOfflineSameAsPhone] = useState(true);
  const [offlineWa, setOfflineWa] = useState('');
  const [offlineEmail, setOfflineEmail] = useState('');
  const [offlineCategory, setOfflineCategory] = useState<'flight' | 'hotel' | 'transfer' | 'consular' | 'general'>('general');
  const [offlineMessage, setOfflineMessage] = useState('');
  const [offlinePrivacy, setOfflinePrivacy] = useState(true);
  const [offlineSubmitting, setOfflineSubmitting] = useState(false);
  const [offlineSuccessRef, setOfflineSuccessRef] = useState<string | null>(null);
  const [showOfflineForm, setShowOfflineForm] = useState(true);
  const [showOfflineCountryPicker, setShowOfflineCountryPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const activeSessionIdRef = useRef<string | null>(null);
  const isOpenRef = useRef<boolean>(isOpen);

  useEffect(() => {
    activeSessionIdRef.current = session ? session.id : null;
  }, [session]);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen && session) {
      setUnreadCount(0);
      api.markChatRead(session.id, 'visitor', tracker.getVisitorId()).catch(() => {});
    }
  }, [isOpen, session, setUnreadCount]);

  // Initialize or fetch session safely (compatible with iOS Safari Private Browsing & ITP)
  useEffect(() => {
    const vid = tracker.getVisitorId();
    const savedName = tracker.safeGetStorage(VISITOR_NAME_KEY) || '';
    const savedPhone = tracker.safeGetStorage(VISITOR_PHONE_KEY) || '';
    if (savedName) setVisitorName(savedName);
    if (savedPhone) setVisitorPhone(savedPhone);

    // Initial status fetch
    api.getChatStatus().then((res) => {
      if (res.chatStatus) setAdminOnline(res.chatStatus.adminOnline);
    }).catch(() => {});

    // Look for existing session for this visitor
    api.getChatSessions(vid).then((res) => {
      if (res.sessions && res.sessions.length > 0) {
        const active = res.sessions[0];
        setSession(active);
        activeSessionIdRef.current = active.id;
        if (active.visitorName && !savedName) setVisitorName(active.visitorName);
        if (active.unreadVisitor) setUnreadCount(active.unreadVisitor);
        api.getChatMessages(active.id, vid).then((msgRes) => {
          setMessages(msgRes.messages || []);
        }).catch(() => {});
      }
    }).catch(() => {});

    // Subscribe to Realtime SSE Stream (instant push from admin)
    const unsubMsg = realtime.subscribe('chat:message', (payload: any) => {
      const msg = payload.message as ChatMessage;
      const sId = payload.sessionId;
      const sess = payload.session as ChatSession | undefined;

      if (!msg) return;

      const myVid = tracker.getVisitorId();
      const isMySession =
        (activeSessionIdRef.current && sId === activeSessionIdRef.current) ||
        (sess && sess.visitorId === myVid);

      if (isMySession) {
        if (!activeSessionIdRef.current && sess) {
          setSession(sess);
          activeSessionIdRef.current = sess.id;
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        if (msg.sender === 'admin') {
          if (soundEnabled) playChime('incoming');
          if (!isOpenRef.current) {
            setUnreadCount((c) => c + 1);
          } else {
            api.markChatRead(sId, 'visitor', tracker.getVisitorId()).catch(() => {});
          }
        }
      }
    });

    const unsubTyping = realtime.subscribe('chat:typing', (payload: any) => {
      if (payload.sessionId === activeSessionIdRef.current && payload.sender === 'admin') {
        setAdminTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setAdminTyping(false), 2800);
      }
    });

    const unsubStatus = realtime.subscribe('chat:status', (status: ChatStatus) => {
      if (status) setAdminOnline(status.adminOnline);
    });

    const unsubDeleted = realtime.subscribe('chat:session_deleted', (payload: any) => {
      if (payload?.sessionId && payload.sessionId === activeSessionIdRef.current) {
        setSession(null);
        setMessages([]);
      }
    });

    return () => {
      unsubMsg();
      unsubTyping();
      unsubStatus();
      unsubDeleted();
    };
  }, [soundEnabled, setAdminOnline, setUnreadCount]);

  // Reconcile messages and unread counts even when a mobile proxy buffers SSE.
  useEffect(() => {
    const visitorId = tracker.getVisitorId();
    let disposed = false;
    let refreshing = false;
    const refresh = async () => {
      if (refreshing || document.hidden || (!activeSessionIdRef.current && !isOpen)) return;
      refreshing = true;
      try {
        const { sessions } = await api.getChatSessions(visitorId);
        if (disposed) return;
        const active = sessions.find((item) => item.status === 'active');
        if (!active) return;
        if (active.id !== activeSessionIdRef.current) {
          activeSessionIdRef.current = active.id;
          setSession(active);
        }
        const result = await api.getChatMessages(active.id, visitorId);
        if (disposed || active.id !== activeSessionIdRef.current) return;
        setMessages((previous) => {
          const byId = new Map([...result.messages, ...previous].map((item) => [item.id, item]));
          if (byId.size === previous.length) return previous;
          return [...byId.values()].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
        });
        if (isOpenRef.current && active.unreadVisitor > 0) {
          await api.markChatRead(active.id, 'visitor', visitorId);
        }
        if (!disposed) setUnreadCount(isOpenRef.current ? 0 : active.unreadVisitor);
      } catch {
        // Retry on the next interval or when the visitor resumes the page.
      } finally {
        refreshing = false;
      }
    };
    const timer = setInterval(refresh, 2500);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      disposed = true;
      clearInterval(timer);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [isOpen, setUnreadCount]);

  useEffect(() => {
    const view = window.visualViewport;
    if (!isOpen || !view) return;
    const resize = () => setViewport({
      height: view.height,
      bottom: Math.max(0, window.innerHeight - view.height - view.offsetTop),
    });
    resize();
    view.addEventListener('resize', resize);
    view.addEventListener('scroll', resize);
    return () => {
      view.removeEventListener('resize', resize);
      view.removeEventListener('scroll', resize);
    };
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, adminTyping]);

  // Both the mobile dock and the desktop trigger update the shared open state.
  useEffect(() => {
    if (!isOpen) return;
    setIsMinimized(false);
    if (activeSessionIdRef.current) return;
    const { device, browser, screenW, maxTouchPoints } = tracker.detectDevice();
    const { country, flag, city } = tracker.detectGeoLocation();
    api.createChatSession({
      visitorId: tracker.getVisitorId(),
      visitorName: visitorName.trim() || `زائر (${device})`,
      visitorPhone: visitorPhone.trim(),
      visitorCountry: `${country} ${flag}`,
      currentPage: location.pathname,
      device, browser, country, flag, city, screenW, maxTouchPoints,
    }).then(({ session: openedSession }) => {
      if (!activeSessionIdRef.current) {
        activeSessionIdRef.current = openedSession.id;
        setSession(openedSession);
      }
    }).catch(() => {});
  }, [isOpen]);

  const handleOpenChat = () => {
    setIsMinimized(false);
    setIsOpen(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedFile) || sending) return;

    const text = inputText.trim();
    const file = attachedFile || undefined;
    const vid = tracker.getVisitorId();
    const { device, browser, screenW, maxTouchPoints } = tracker.detectDevice();
    const { country, flag, city } = tracker.detectGeoLocation();
    const senderLabel = visitorName.trim() || `زائر (${device})`;
    const targetSessionId = session?.id || activeSessionIdRef.current || `chat_${vid}`;

    setInputText('');
    setAttachedFile(null);
    setSending(true);
    setErrorBanner(null);

    const tempMsg: ChatMessage = {
      id: `vis_temp_${Date.now()}`,
      sessionId: targetSessionId,
      sender: 'visitor',
      senderName: senderLabel,
      text,
      attachmentUrl: file,
      createdAt: new Date().toISOString(),
    };

    // Optimistically display message immediately on tap
    setMessages((prev) => [...prev, tempMsg]);
    if (soundEnabled) playChime('outgoing');

    try {
      const res = await api.sendChatMessage({
        sessionId: targetSessionId,
        sender: 'visitor',
        senderName: senderLabel,
        text,
        attachmentUrl: file,
        visitorId: vid,
        visitorPhone: visitorPhone.trim(),
        visitorCountry: `${country} ${flag}`,
        currentPage: typeof window !== 'undefined' ? window.location.pathname : 'الرئيسية',
        device,
        browser,
        country,
        flag,
        city,
        screenW,
        maxTouchPoints,
      });

      if (res.session) {
        setSession(res.session);
        activeSessionIdRef.current = res.session.id;
      }

      if (res.message) {
        setMessages((prev) => {
          const alreadyAddedBySSE = prev.some((m) => m.id === res.message.id);
          if (alreadyAddedBySSE) {
            return prev.filter((m) => m.id !== tempMsg.id);
          }
          return prev.map((m) => (m.id === tempMsg.id ? res.message : m));
        });
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setInputText((draft) => draft || text);
      setAttachedFile((draft) => draft || file || null);
      setErrorBanner('تعذر إرسال الرسالة، يرجى التحقق من الاتصال والمحاولة مرة أخرى.');
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    const now = Date.now();
    const sId = session?.id || activeSessionIdRef.current;
    if (sId && now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      api.sendTypingIndicator(sId, 'visitor', tracker.getVisitorId()).catch(() => {});
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorBanner('حجم الملف كبير جداً، الحد الأقصى المسموح به هو 8 ميغابايت.');
      return;
    }

    setErrorBanner(null);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setAttachedFile(loadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (visitorName.trim()) {
      tracker.safeSetStorage(VISITOR_NAME_KEY, visitorName.trim());
    }
    if (visitorPhone.trim()) {
      tracker.safeSetStorage(VISITOR_PHONE_KEY, visitorPhone.trim());
    }
    setShowIdentityEditor(false);
  };

  const handleSendOfflineMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineName.trim()) {
      setErrorBanner('يرجى إدخال اسمك الكامل');
      return;
    }
    if (!offlinePhone.trim() && !offlineEmail.trim()) {
      setErrorBanner('يرجى إدخال رقم الهاتف أو البريد الإلكتروني للتواصل');
      return;
    }
    if (!offlineMessage.trim()) {
      setErrorBanner('يرجى كتابة تفاصيل رسالتك أو استفسارك');
      return;
    }
    if (!offlinePrivacy) {
      setErrorBanner('يرجى الموافقة على سياسة الخصوصية للمتابعة');
      return;
    }

    setOfflineSubmitting(true);
    setErrorBanner(null);

    const fullPhone = offlinePhone.trim() ? `${offlineCountry.dialCode} ${offlinePhone.trim()}` : undefined;
    const fullWa = offlineSameAsPhone
      ? fullPhone
      : offlineWa.trim()
      ? `${offlineCountry.dialCode} ${offlineWa.trim()}`
      : undefined;

    const vid = tracker.getVisitorId();
    const { device } = tracker.detectDevice();
    const { country, flag } = tracker.detectGeoLocation();

    try {
      const res = await api.submitOfflineMessage({
        name: offlineName.trim(),
        phone: fullPhone,
        whatsappPhone: fullWa,
        email: offlineEmail.trim() || undefined,
        serviceCategory: offlineCategory,
        message: offlineMessage.trim(),
        visitorId: vid,
        country: `${country || offlineCountry.nameAr} ${flag || offlineCountry.flag}`,
      });

      if (res.success) {
        setOfflineSuccessRef(res.reference);
        setVisitorName(offlineName.trim());
        if (fullPhone) setVisitorPhone(fullPhone);
        tracker.safeSetStorage(VISITOR_NAME_KEY, offlineName.trim());
        if (fullPhone) tracker.safeSetStorage(VISITOR_PHONE_KEY, fullPhone);

        const newMsg: ChatMessage = {
          id: `vis_offline_${Date.now()}`,
          sessionId: res.sessionId || session?.id || `chat_${vid}`,
          sender: 'visitor',
          senderName: offlineName.trim(),
          text: `[رسالة أثناء عدم التواجد | ${res.reference}]\nالخدمة: ${offlineCategory}\n\n${offlineMessage.trim()}`,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newMsg]);
        setOfflineMessage('');
        setShowOfflineForm(false);
      } else {
        throw new Error(res.message || 'تعذر إرسال الرسالة');
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة لاحقاً.');
    } finally {
      setOfflineSubmitting(false);
    }
  };

  const founderShortName = settings.founderName?.split('(')[0]?.trim() || 'رشيد الفزني';
  const founderAvatar = settings.founderImage || '/assets/founder-rachid-elfazni-v2.webp';

  return (
    <>
      {/* Desktop Floating Trigger Button: Stacked Vertically ABOVE WhatsApp (bottom-24, left-6 in RTL) */}
      <div
        className={`fixed bottom-24 ${
          isRtl ? 'left-6' : 'right-6'
        } z-40 hidden lg:flex items-center gap-3 group`}
      >
        <button
          onClick={() => (isOpen ? setIsOpen(false) : handleOpenChat())}
          aria-label="فتح المحادثة الفورية"
          className={`relative w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all ring-2 ring-white/90 cursor-pointer ${
            isOpen
              ? 'bg-slate-800 hover:bg-slate-900'
              : 'bg-gradient-to-tr from-[#0B2E57] to-[#004AA5]'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}
          {adminOnline && !isOpen && (
            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
          )}
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-white font-extrabold text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white tabular-nums">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Status Pill Next to Chat Button on Desktop */}
        {!isOpen && (
          <div
            onClick={handleOpenChat}
            className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg border border-blue-200/80 cursor-pointer hover:bg-white transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                adminOnline ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-bold text-slate-800">
              {adminOnline ? `${founderShortName} ${t('متصل الآن')}` : t('تواصل مع إدارة الموقع')}
            </span>
          </div>
        )}
      </div>

      {/* Live Chat Modal / Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 font-sans shadow-2xl rounded-2xl overflow-hidden border border-slate-200 bg-white flex flex-col ${
            isMinimized
              ? `bottom-20 lg:bottom-6 ${isRtl ? 'left-4 lg:left-24' : 'right-4 lg:right-24'} w-72 h-14`
              : `bottom-[calc(var(--chat-keyboard,0px)+max(1rem,env(safe-area-inset-bottom)))] lg:bottom-6 inset-x-3 sm:inset-x-auto ${
                  isRtl ? 'sm:left-6 lg:left-24' : 'sm:right-6 lg:right-24'
                } sm:w-[380px] h-[520px] max-h-[calc(var(--chat-height,100dvh)-2rem)] lg:max-h-[82vh]`
          }`}
          role="region"
          aria-label="المحادثة الفورية"
          style={viewport ? {
            '--chat-height': `${viewport.height}px`,
            '--chat-keyboard': `${viewport.bottom}px`,
          } as React.CSSProperties : undefined}
          dir="rtl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0B2E57] via-[#054394] to-[#0B2E57] p-3.5 text-white flex items-center justify-between shadow-md select-none">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={founderAvatar}
                  alt={founderShortName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/60 shadow"
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${
                    adminOnline ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{founderShortName}</h3>
                  <span className="text-[10px] text-amber-300 font-semibold">
                    · المدير العام
                  </span>
                </div>
                <div className="text-[11px] text-blue-200 flex items-center gap-1.5">
                  <span>{adminOnline ? t('متصل الآن للرد الفوري') : t('غير متصل (اترك رسالتك وسنرد عليك)')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={soundEnabled ? 'كتم الصوت' : 'تفعيل التنبيهات'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={isMinimized ? 'تكبير' : 'تصغير'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Brand Top Sub-bar */}
              <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-blue-900 tracking-wider">
                  {settings.siteNameEn || 'ELFAZNI SERVICES'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowIdentityEditor(!showIdentityEditor)}
                  className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <User className="w-3 h-3 text-blue-600" />
                  <span>{visitorName ? visitorName : 'تسجيل اسمك ورقمك (اختياري)'}</span>
                </button>
              </div>

              {/* Error Banner */}
              {errorBanner && (
                <div className="bg-red-50 px-3.5 py-2 border-b border-red-200 flex items-center justify-between text-xs text-red-700 font-medium">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorBanner}</span>
                  </div>
                  <button onClick={() => setErrorBanner(null)} className="text-red-400 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Optional Identity Form Drawer */}
              {showIdentityEditor && (
                <form
                  onSubmit={handleSaveIdentity}
                  className="bg-blue-50/80 p-3 border-b border-blue-200 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between font-bold text-blue-900">
                    <span>بيانات التواصل لتوثيق المحادثة</span>
                    <button
                      type="button"
                      onClick={() => setShowIdentityEditor(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="اسمك الكامل"
                      className="px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-base sm:text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="tel"
                      value={visitorPhone}
                      onChange={(e) => setVisitorPhone(e.target.value)}
                      placeholder="رقم الواتساب"
                      className="px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-base sm:text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>حفظ البيانات</span>
                  </button>
                </form>
              )}

              {/* Chat Body */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-gradient-to-b from-slate-50/60 to-white">
                {/* Friendly Offline Banner when staff is offline */}
                {!adminOnline && (
                  <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 space-y-1.5 text-xs text-amber-900 shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-950">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{t('نحن غير متواجدين حاليًا. اترك رسالتك وسنتواصل معك عند عودتنا.')}</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                      {t('يمكنك ملء النموذج أدناه أو كتابة استفسارك مباشرة، وسيتم تسجيل رسالتك في لوحة الإدارة وإشعار الإدارة فوراً.')}
                    </p>
                  </div>
                )}

                {/* Offline Capture Intake Form when staff is offline and form is shown */}
                {!adminOnline && (showOfflineForm || messages.length === 0) ? (
                  <form onSubmit={handleSendOfflineMessage} className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="font-bold text-slate-800 text-xs">{t('نموذج ترك رسالة أثناء عدم التواجد')}</span>
                      {messages.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowOfflineForm(false)}
                          className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                        >
                          {t('عرض المحادثة')} ({messages.length})
                        </button>
                      )}
                    </div>

                    {offlineSuccessRef ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                          <Check className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-bold text-emerald-900">{t('تم استلام وحفظ رسالتك بنجاح!')}</div>
                        <div className="text-xs text-slate-600">
                          {t('المرجع:')} <strong className="font-mono text-emerald-800">{offlineSuccessRef}</strong>
                        </div>
                        <div className="text-[11px] text-slate-500 leading-normal">
                          {t('هذا إشعار استلام وليس حجزاً أو موعداً نهائياً مؤكداً، وسيتواصل معك فريقنا فور عودتنا.')}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOfflineSuccessRef(null);
                            setShowOfflineForm(false);
                          }}
                          className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {t('متابعة وعرض المحادثة')}
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Name */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {t('الاسم الكامل')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={offlineName}
                            onChange={(e) => setOfflineName(e.target.value)}
                            placeholder={t('اسمك الكريم')}
                            className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Phone with Country Code */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {t('رقم الهاتف للتواصل')} <span className="text-slate-400 font-normal">({t('مطلوب إن لم يتوفر بريد')})</span>
                          </label>
                          <div className="flex gap-1.5">
                            <select
                              value={offlineCountry.code}
                              onChange={(e) => {
                                const found = COUNTRY_CODES.find((c) => c.code === e.target.value);
                                if (found) setOfflineCountry(found);
                              }}
                              className="py-1 px-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 font-mono"
                            >
                              {COUNTRY_CODES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.flag} {c.dialCode}
                                </option>
                              ))}
                            </select>
                            <input
                              type="tel"
                              value={offlinePhone}
                              onChange={(e) => setOfflinePhone(e.target.value)}
                              placeholder="612345678"
                              className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 dir-ltr"
                            />
                          </div>
                        </div>

                        {/* WhatsApp Same as Phone Checkbox */}
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={offlineSameAsPhone}
                            onChange={(e) => setOfflineSameAsPhone(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0"
                          />
                          <span>{t('رقم الواتساب هو نفسه رقم الهاتف')}</span>
                        </label>

                        {!offlineSameAsPhone && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('رقم الواتساب')}</label>
                            <input
                              type="tel"
                              value={offlineWa}
                              onChange={(e) => setOfflineWa(e.target.value)}
                              placeholder="رقم الواتساب مع الرمز"
                              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 dir-ltr"
                            />
                          </div>
                        )}

                        {/* Email */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {t('البريد الإلكتروني')} <span className="text-slate-400 font-normal">({t('مطلوب إن لم يتوفر هاتف')})</span>
                          </label>
                          <input
                            type="email"
                            value={offlineEmail}
                            onChange={(e) => setOfflineEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 dir-ltr"
                          />
                        </div>

                        {/* Service Category */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('تصنيف الخدمة')}</label>
                          <select
                            value={offlineCategory}
                            onChange={(e) => setOfflineCategory(e.target.value as any)}
                            className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          >
                            <option value="flight">✈️ {t('حجز واستعلام طيران')}</option>
                            <option value="hotel">🏨 {t('حجز فندق')}</option>
                            <option value="transfer">🚘 {t('سيارة وتوصيل مطار VIP')}</option>
                            <option value="consular">🏛️ {t('موعد قنصلي مغربي')}</option>
                            <option value="general">💬 {t('استفسار عام')}</option>
                          </select>
                        </div>

                        {/* Message */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {t('رسالتك أو استفسارك')} <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={offlineMessage}
                            onChange={(e) => setOfflineMessage(e.target.value)}
                            placeholder={t('اكتب هنا تفاصيل طلبك أو استفسارك...')}
                            className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                          />
                        </div>

                        {/* Privacy Checkbox */}
                        <label className="flex items-start gap-1.5 text-[10px] text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            required
                            checked={offlinePrivacy}
                            onChange={(e) => setOfflinePrivacy(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-0"
                          />
                          <span>{t('أوافق على استخدام بياناتي للتواصل معي والرد على طلبي.')}</span>
                        </label>

                        <button
                          type="submit"
                          disabled={offlineSubmitting}
                          className="w-full py-2 bg-gradient-to-r from-[#0B2E57] to-[#004AA5] hover:from-[#004AA5] hover:to-[#2A83D5] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {offlineSubmitting ? t('جارٍ الإرسال...') : t('إرسال الرسالة وتأكيد الاستلام')}
                        </button>
                      </>
                    )}
                  </form>
                ) : null}

                {/* Initial Welcome Bubble if no messages and staff is online */}
                {adminOnline && messages.length === 0 && (
                  <div className="space-y-3">
                    <div className="text-center my-1">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {t('محادثة فورية مباشرة مع الإدارة')}
                      </span>
                    </div>

                    <div className="flex gap-2.5 justify-start">
                      <img
                        src={founderAvatar}
                        alt={founderShortName}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover mt-1 border border-blue-300 shadow-sm flex-shrink-0"
                      />
                      <div className="max-w-[85%] rounded-2xl rounded-tr-none px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm bg-white border border-slate-200 text-slate-800">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className="text-[10px] font-bold text-blue-700">{founderShortName}</span>
                          <span className="text-[9px] text-slate-400">{t('الآن')}</span>
                        </div>
                        <p className="whitespace-pre-wrap">
                          {t('أهلاً بك أخي الكريم في')} <span className="font-bold text-blue-900">{settings.siteNameEn || 'ELFAZNI SERVICES'}</span>!{' '}
                          {t('أنا معك الآن مباشرة، يمكنك كتابة أي استفسار حول المواعيد القنصلية، الأوراق الثبوتية، الإقامات، أو تذاكر الطيران وسأجيبك فوراً.')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message History */}
                {messages.map((msg) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isAdmin ? 'justify-start' : 'justify-end'}`}
                    >
                      {isAdmin && (
                        <img
                          src={founderAvatar}
                          alt={founderShortName}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover mt-1 border border-blue-300 shadow-sm flex-shrink-0"
                        />
                      )}

                      <div
                        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                          isAdmin
                            ? 'bg-white border border-slate-200 text-slate-800 rounded-tr-none'
                            : 'bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-tl-none shadow-blue-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className={`text-[10px] font-bold ${isAdmin ? 'text-blue-700' : 'text-blue-200'}`}>
                            {msg.senderName}
                          </span>
                          <span className={`text-[9px] tabular-nums ${isAdmin ? 'text-slate-400' : 'text-blue-200/80'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

                        {msg.attachmentUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-black/10 bg-black/5">
                            <img
                              src={msg.attachmentUrl}
                              alt="مرفق"
                              referrerPolicy="no-referrer"
                              className="max-h-48 w-auto rounded object-cover"
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-end mt-1">
                          <CheckCheck className={`w-3.5 h-3.5 ${isAdmin ? 'text-blue-500' : 'text-blue-200'}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Admin Typing Indicator */}
                {adminTyping && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50/80 px-3 py-1.5 rounded-full w-fit border border-blue-100">
                    <img
                      src={founderAvatar}
                      alt={founderShortName}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span>{founderShortName} يكتب الآن...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input & Attachments */}
              <div className="p-2.5 bg-white border-t border-slate-200">
                {attachedFile && (
                  <div className="mb-2 relative inline-block border border-blue-300 rounded-lg overflow-hidden bg-slate-50 p-1">
                    <img src={attachedFile} alt="معاينة" className="h-14 w-auto rounded object-cover" />
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
                    title="إرفاق صورة أو وثيقة"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="اكتب رسالتك هنا مباشرة..."
                    className="flex-1 min-w-0 px-3.5 py-2 text-base sm:text-sm bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 rounded-xl focus:outline-none transition-all placeholder:text-slate-400"
                  />

                  <button
                    type="submit"
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={(!inputText.trim() && !attachedFile) || sending}
                    className="p-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                    title="إرسال"
                  >
                    <Send className="w-4 h-4 transform rotate-180" />
                  </button>
                </form>

                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>تحديث لحظي فوري</span>
                  <span>الرد مباشر من الإدارة</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
