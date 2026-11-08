import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Paperclip,
  CheckCheck,
  Globe2,
  Phone,
  User,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  Search,
  CheckCircle2,
  X,
  Power,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { api, ChatMessage, ChatSession, ChatStatus } from '../../services/api';
import { realtime } from '../../services/realtime';

// Soft audio chime
function playAdminChime(type: 'incoming' | 'outgoing' = 'incoming') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'incoming') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.21);
    }
  } catch (e) {}
}

const CANNED_REPLIES = [
  'أهلاً بك أخي الكريم في ELFAZNI SERVICES! كيف يمكنني مساعدتك اليوم بخصوص معاملاتك في تركيا؟',
  'وعليكم السلام ورحمة الله. تفضل بإرسال صورة واضحة للوثائق هنا وسأقوم بمراجعتها وتدقيقها فوراً.',
  'يمكننا حجز موعد القنصلية المغربية بإسطنبول لك وتأكيد كافة الأوراق الثبوتية خلال 24 ساعة.',
  'بخصوص حجز الطيران، تتوفر لدينا أسعار خاصة على الخطوط الملكية المغربية والخطوط التركية مع أمتعة إضافية.',
  'يرجى تزويدنا برقم الواتساب الخاص بك لنرسل لك ملف التأكيد وموقع الاستقبال بدقة.',
];

export const AdminLiveChat: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatStatus, setChatStatus] = useState<ChatStatus>({ adminOnline: true, lastActive: new Date().toISOString() });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const visitorTypingTimeout = useRef<NodeJS.Timeout | null>(null);
  const selectedSessionRef = useRef<ChatSession | null>(null);

  useEffect(() => {
    selectedSessionRef.current = selectedSession;
  }, [selectedSession]);

  useEffect(() => {
    loadChatData();

    // 1. Subscribe to Realtime SSE Message Stream (Instant cross-device push from mobile)
    const unsubMsg = realtime.subscribe('chat:message', (payload: any) => {
      const msg = payload.message as ChatMessage;
      const sId = payload.sessionId;
      const sess = payload.session as ChatSession;

      if (!msg) return;

      // Play chime for visitor messages
      if (msg.sender === 'visitor') {
        if (soundEnabled) playAdminChime('incoming');
      }

      // If this message belongs to the currently active conversation, append immediately!
      if (selectedSessionRef.current && selectedSessionRef.current.id === sId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Clear unread on admin side since admin is actively viewing this conversation
        api.markChatRead(sId, 'admin').catch(() => {});
      }

      // Update session list with latest message and unread count
      setSessions((prev) => {
        const existingIdx = prev.findIndex((s) => s.id === sId);
        if (existingIdx !== -1) {
          const updated = [...prev];
          const isCurrent = selectedSessionRef.current?.id === sId;
          updated[existingIdx] = {
            ...updated[existingIdx],
            lastMessageAt: msg.createdAt,
            unreadAdmin: isCurrent ? 0 : (sess?.unreadAdmin ?? updated[existingIdx].unreadAdmin),
          };
          // Move active session to top
          const [s] = updated.splice(existingIdx, 1);
          return [s, ...updated];
        } else if (sess) {
          return [sess, ...prev];
        }
        return prev;
      });

    });

    // 2. Subscribe to new chat sessions created (e.g. newly opened mobile chat)
    const unsubSess = realtime.subscribe('chat:session', (payload: any) => {
      const newSession = payload.session as ChatSession;
      if (!newSession) return;

      if (soundEnabled) playAdminChime('incoming');

      setSessions((prev) => {
        if (prev.some((s) => s.id === newSession.id)) return prev;
        return [newSession, ...prev];
      });

    });

    // 3. Subscribe to typing indicator from visitor
    const unsubTyping = realtime.subscribe('chat:typing', (payload: any) => {
      if (
        selectedSessionRef.current &&
        payload.sessionId === selectedSessionRef.current.id &&
        payload.sender === 'visitor'
      ) {
        setVisitorTyping(true);
        if (visitorTypingTimeout.current) clearTimeout(visitorTypingTimeout.current);
        visitorTypingTimeout.current = setTimeout(() => setVisitorTyping(false), 2800);
      }
    });

    // 4. Background polling fallback (every 2s) to guarantee zero desync with mobile/iPhone
    const interval = setInterval(() => {
      loadSessionsList();
      if (selectedSessionRef.current) {
        const currentId = selectedSessionRef.current.id;
        api.getChatMessages(currentId).then((res) => {
          if (res.messages && selectedSessionRef.current?.id === currentId) {
            setMessages((prev) => {
              const prevLastId = prev[prev.length - 1]?.id;
              const newLastId = res.messages[res.messages.length - 1]?.id;
              if (res.messages.length !== prev.length || prevLastId !== newLastId) {
                const latestMsg = res.messages[res.messages.length - 1];
                if (latestMsg && latestMsg.sender === 'visitor' && latestMsg.id !== prevLastId && soundEnabled) {
                  playAdminChime('incoming');
                }
                return res.messages;
              }
              return prev;
            });
          }
        }).catch(() => {});
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      unsubMsg();
      unsubSess();
      unsubTyping();
    };
  }, [soundEnabled]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, visitorTyping]);

  const loadChatData = async () => {
    setLoading(true);
    try {
      const [statusRes, sessionsRes] = await Promise.all([
        api.getChatStatus().catch(() => ({ chatStatus: { adminOnline: true, lastActive: new Date().toISOString() } })),
        api.getChatSessions().catch(() => ({ sessions: [] })),
      ]);

      if (statusRes.chatStatus) setChatStatus(statusRes.chatStatus);
      const sessList = sessionsRes.sessions || [];
      setSessions(sessList);
    } catch (err) {
      console.error('Failed to load chat data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionsList = async () => {
    try {
      const res = await api.getChatSessions();
      const newSessions = res.sessions || [];
      setSessions((prev) => {
        const prevTotalUnread = prev.reduce((sum, s) => sum + (s.unreadAdmin || 0), 0);
        const newTotalUnread = newSessions.reduce((sum, s) => sum + (s.unreadAdmin || 0), 0);
        if (newTotalUnread > prevTotalUnread && soundEnabled) {
          playAdminChime('incoming');
        }
        return newSessions;
      });
    } catch (e) {}
  };

  const selectSession = async (sess: ChatSession) => {
    if (selectedSessionRef.current?.id !== sess.id) setMessages([]);
    setSelectedSession(sess);
    selectedSessionRef.current = sess;
    try {
      const msgRes = await api.getChatMessages(sess.id);
      if (selectedSessionRef.current?.id !== sess.id) return;
      setMessages(msgRes.messages || []);
      // Mark as read on server
      api.markChatRead(sess.id, 'admin').catch(() => {});
      // Locally reset unread counter
      setSessions((prev) =>
        prev.map((s) => (s.id === sess.id ? { ...s, unreadAdmin: 0 } : s))
      );
    } catch (err) {
      console.error('Failed to load messages for session:', err);
    }
  };

  const handleToggleOnline = async () => {
    const newState = !chatStatus.adminOnline;
    try {
      const res = await api.updateChatStatus(newState);
      setChatStatus(res.chatStatus);
    } catch (err) {
      console.error('Failed to toggle admin status:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await api.deleteChatSession(sessionId);
      setSessions((prev) => {
        const remaining = prev.filter((s) => s.id !== sessionId);
        if (selectedSession?.id === sessionId) {
          if (remaining.length > 0) {
            selectSession(remaining[0]);
          } else {
            setSelectedSession(null);
            setMessages([]);
          }
        }
        return remaining;
      });
    } catch (err) {
      console.error('Failed to delete chat session:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedFile) || !selectedSession) return;

    const text = inputText.trim();
    const attachmentUrl = attachedFile || undefined;

    setInputText('');
    setAttachedFile(null);

    const tempMsg: ChatMessage = {
      id: `admin_msg_${Date.now()}`,
      sessionId: selectedSession.id,
      sender: 'admin',
      senderName: 'رشيد الفزني (Rachid ELFAZNI)',
      text,
      attachmentUrl,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    if (soundEnabled) playAdminChime('outgoing');

    try {
      const { message } = await api.sendChatMessage({
        sessionId: selectedSession.id,
        sender: 'admin',
        senderName: 'رشيد الفزني (Rachid ELFAZNI)',
        text,
        attachmentUrl,
      });
      if (selectedSessionRef.current?.id === message.sessionId) {
        setMessages((previous) => {
          const confirmed = previous.filter((item) => item.id !== tempMsg.id);
          return confirmed.some((item) => item.id === message.id) ? confirmed : [...confirmed, message];
        });
      }
    } catch (err) {
      setMessages((previous) => previous.filter((item) => item.id !== tempMsg.id));
      if (selectedSessionRef.current?.id === tempMsg.sessionId) {
        setInputText((draft) => draft || text);
        setAttachedFile((draft) => draft || attachmentUrl || null);
      }
      alert('تعذّر إرسال الرد. تحقق من الاتصال ثم حاول مرة أخرى.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setAttachedFile(loadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const lastAdminTypingRef = useRef<number>(0);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    const now = Date.now();
    if (selectedSession && now - lastAdminTypingRef.current > 2000) {
      lastAdminTypingRef.current = now;
      api.sendTypingIndicator(selectedSession.id, 'admin').catch(() => {});
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return s.visitorName.toLowerCase().includes(q) || (s.visitorPhone && s.visitorPhone.includes(q));
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[740px]">
      {/* Top Bar with Online/Offline Control & Sound */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-blue-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-400/30 text-amber-300">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>غرفة الدردشة الحية المباشرة (Admin Live Chat Center)</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                {sessions.length} محادثة نشطة
              </span>
            </h2>
            <p className="text-xs text-blue-200/80">
              تواصل فوري وسريع مع زوار الموقع وعملاء الجالية المغربية في تركيا
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Status Toggle Button */}
          <button
            onClick={handleToggleOnline}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              chatStatus.adminOnline
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{chatStatus.adminOnline ? '🟢 متصل الآن للدردشة (Online)' : '🔴 غير متصل (Offline)'}</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-white/10 hover:bg-white/15 text-blue-200 hover:text-white rounded-xl transition-colors"
            title={soundEnabled ? 'كتم الصوت' : 'تفعيل التنبيه الصوتي'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={loadChatData}
            className="p-2 bg-white/10 hover:bg-white/15 text-blue-200 hover:text-white rounded-xl transition-colors"
            title="تحديث المحادثات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Chat Workspace: 2 Columns */}
      <div className="min-h-0 flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Active Chat Sessions List */}
        <div className="w-full max-h-52 shrink-0 md:max-h-none md:w-72 xl:w-96 border-b md:border-b-0 md:border-l border-slate-200 flex flex-col bg-slate-50">
          {/* Search box */}
          <div className="p-3 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث عن زائر أو رقم هاتف..."
                className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/70">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                لا توجد محادثات نشطة حالياً
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isSelected = selectedSession?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => selectSession(s)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/90 border-r-4 border-r-blue-600'
                        : 'hover:bg-slate-100/80 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {s.visitorName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{s.visitorName}</span>
                            <span className="text-sm">{s.visitorCountry?.includes('تركيا') ? '🇹🇷' : '🇲🇦'}</span>
                          </div>
                          {s.visitorPhone && (
                            <div className="text-[10px] text-slate-500 font-mono" dir="ltr">
                              {s.visitorPhone}
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {new Date(s.lastMessageAt || s.createdAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 truncate flex items-center justify-between mt-2">
                      <span className="truncate max-w-[200px]">صفحة: {s.currentPage || 'الرئيسية'}</span>
                      {s.unreadAdmin > 0 && (
                        <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {s.unreadAdmin}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Conversation Stream & Composer */}
        <div className="flex-1 flex flex-col bg-slate-100/50">
          {selectedSession ? (
            <>
              {/* Chat Session Header */}
              <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                    {selectedSession.visitorName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span>{selectedSession.visitorName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                        {selectedSession.visitorCountry || 'المغرب 🇲🇦'}
                      </span>
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      {selectedSession.visitorPhone && (
                        <span className="flex items-center gap-1 font-mono text-slate-700" dir="ltr">
                          <Phone className="w-3 h-3 text-slate-400" /> {selectedSession.visitorPhone}
                        </span>
                      )}
                      <span>يتصفح حالياً: {selectedSession.currentPage || 'الرئيسية'}</span>
                    </div>
                  </div>
                </div>

                {/* Direct 1-Click WhatsApp Link & Close Session Button */}
                <div className="flex items-center gap-2">
                  {selectedSession.visitorPhone && (
                    <a
                      href={`https://wa.me/${selectedSession.visitorPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all"
                    >
                      <span>فتح محادثة واتساب</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteSession(selectedSession.id)}
                    title="إنهاء وحذف المحادثة"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">إنهاء</span>
                  </button>
                </div>
              </div>

              {/* Messages View */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
                {messages.map((msg) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isAdmin && (
                        <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                          {msg.senderName?.charAt(0) || 'ز'}
                        </div>
                      )}

                      <div
                        className={`max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm shadow-sm leading-relaxed ${
                          isAdmin
                            ? 'bg-blue-600 text-white rounded-tl-none shadow-blue-500/20'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tr-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className={`text-[10px] font-bold ${isAdmin ? 'text-blue-100' : 'text-blue-600'}`}>
                            {msg.senderName}
                          </span>
                          <span className={`text-[9px] ${isAdmin ? 'text-blue-200' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                        {msg.attachmentUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-black/10">
                            <img
                              src={msg.attachmentUrl}
                              alt="مرفق"
                              className="max-h-56 w-auto rounded object-cover cursor-pointer hover:opacity-95"
                              onClick={() => window.open(msg.attachmentUrl, '_blank')}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-end mt-1 text-[10px]">
                          <CheckCheck className={`w-3.5 h-3.5 ${isAdmin ? 'text-blue-200' : 'text-blue-500'}`} />
                        </div>
                      </div>

                      {isAdmin && (
                        <img
                          src="/assets/founder-rachid-elfazni-v2.webp"
                          alt="رشيد"
                          className="w-8 h-8 rounded-full object-cover shrink-0 mt-1 border border-blue-400 shadow-sm"
                        />
                      )}
                    </div>
                  );
                })}

                {/* Visitor Typing Indicator */}
                {visitorTyping && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full w-fit animate-pulse border border-emerald-200">
                    <span>{selectedSession.visitorName} يكتب الآن...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Canned Replies Bar */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">ردود سريعة:</span>
                {CANNED_REPLIES.map((reply, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInputText(reply)}
                    className="text-[11px] bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-3 py-1 rounded-full border border-slate-200 whitespace-nowrap transition-colors shadow-sm"
                  >
                    {reply.substring(0, 32)}...
                  </button>
                ))}
              </div>

              {/* Message Composer */}
              <div className="p-3.5 bg-white border-t border-slate-200">
                {attachedFile && (
                  <div className="mb-2 relative inline-block border border-blue-300 rounded-lg overflow-hidden bg-slate-50 p-1">
                    <img src={attachedFile} alt="معاينة" className="h-16 w-auto rounded object-cover" />
                    <button
                      onClick={() => setAttachedFile(null)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
                    title="إرفاق صورة أو مستند للزائر"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="اكتب ردك كمدير عام (رشيد الفزني)..."
                    className="flex-1 min-w-0 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() && !attachedFile}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>إرسال</span>
                    <Send className="w-4 h-4 rotate-180" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
              <p className="font-bold text-sm">اختر محادثة من القائمة للبدء بالرد والتواصل</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
