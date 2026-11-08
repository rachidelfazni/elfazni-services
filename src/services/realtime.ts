import { getVisitorId } from './tracker';
import { api } from './api';
/**
 * ELFAZNI SERVICES - Realtime EventSource (SSE) Client
 * Connects browser tabs and mobile devices to server events with instant real-time sync
 */

type RealtimeEventHandler = (data: any) => void;

class RealtimeClient {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<RealtimeEventHandler>> = new Map();
  private reconnectTimer: any = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 10000;
  private isConnecting = false;
  private statusListeners: Set<(connected: boolean) => void> = new Set();
  public isConnected = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();

      // Mobile sleep/resume handler: reconnect immediately when page becomes visible or comes back online
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.connect();
        }
      });

      window.addEventListener('popstate', () => this.connect());
      window.addEventListener('online', () => {
        this.connect();
      });
    }
  }

  private init() {
    this.connect();
  }

  public connect() {
    if (typeof window === 'undefined') return;
    clearTimeout(this.reconnectTimer);

    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }

    this.isConnecting = true;
    this.isConnected = false;

    try {
      const audience = location.pathname.startsWith('/admin') && api.getToken()
        ? 'admin=1'
        : `visitorId=${encodeURIComponent(getVisitorId())}`;
      this.eventSource = new EventSource(`/api/realtime/stream?${audience}`);

      this.eventSource.onopen = () => {
        this.isConnecting = false;
        this.isConnected = true;
        this.reconnectDelay = 1000;
        this.notifyStatus(true);
      };

      this.eventSource.onerror = () => {
        this.isConnecting = false;
        this.isConnected = false;
        this.notifyStatus(false);
        try {
          this.eventSource?.close();
        } catch {}
        this.eventSource = null;
        this.scheduleReconnect();
      };

      // Register standard listeners
      const knownEvents = [
        'connected',
        'chat:message',
        'chat:session',
        'chat:typing',
        'chat:status',
        'chat:read',
        'analytics:visit',
        'analytics:heartbeat',
        'analytics:reset',
        'analytics:post',
        'mailbox:new',
        'mailbox:updated',
        'settings:updated',
        'services:updated',
        'chat:session_deleted',
        'seo:updated',
      ];

      for (const evt of knownEvents) {
        this.eventSource.addEventListener(evt, (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            const payload = parsed.data !== undefined ? parsed.data : parsed;
            this.emit(evt, payload);
          } catch {
            this.emit(evt, e.data);
          }
        });
      }
    } catch (err) {
      this.isConnecting = false;
      this.isConnected = false;
      this.notifyStatus(false);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
    }, this.reconnectDelay);
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((fn) => {
      try {
        fn(connected);
      } catch {}
    });
  }

  public onStatusChange(callback: (connected: boolean) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.isConnected);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public subscribe(eventType: string, handler: RealtimeEventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(handler);
      }
    };
  }

  private emit(eventType: string, data: any) {
    const set = this.listeners.get(eventType);
    if (set) {
      set.forEach((handler) => {
        try {
          handler(data);
        } catch (err) {
          console.error(`Error in realtime handler for ${eventType}:`, err);
        }
      });
    }
  }
}

export const realtime = new RealtimeClient();
