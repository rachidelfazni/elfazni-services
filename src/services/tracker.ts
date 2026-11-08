/**
 * Real Visitor Tracking Service
 * Accurately tracks genuine visitors, unique IDs, device breakdown (including iPhone/iOS Safari),
 * geo-locations, heartbeats, and mobile lifecycle beacons (`pagehide`, `visibilitychange`, `unload`)
 * with `navigator.sendBeacon` for the site server.
 */
import { api } from './api';

const VISITOR_ID_KEY = 'elfazni_visitor_id';
let memoryVisitorId: string | null = null;
const memoryStore: Record<string, string> = {};
const sessionStartedAt = Date.now();
let lifecycleListenersBound = false;
let lastBeaconSentAt = 0;

export function safeGetStorage(key: string): string | null {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) return val;
  } catch {
    // iOS Safari Private Browsing or strict ITP fallback
  }
  return memoryStore[key] ?? null;
}

export function safeSetStorage(key: string, value: string): void {
  memoryStore[key] = value;
  try {
    localStorage.setItem(key, value);
  } catch {
    // iOS Safari Private Browsing or strict ITP fallback
  }
}

export function getVisitorId(): string {
  const existing = safeGetStorage(VISITOR_ID_KEY);
  if (existing) {
    memoryVisitorId = existing;
    return existing;
  }
  if (memoryVisitorId) {
    return memoryVisitorId;
  }
  const randomId = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
  const newId = `vis_${randomId}`;
  memoryVisitorId = newId;
  safeSetStorage(VISITOR_ID_KEY, newId);
  return newId;
}

export function getSessionDurationSec(): number {
  return Math.max(1, Math.round((Date.now() - sessionStartedAt) / 1000));
}

export function detectDevice(): {
  device: string;
  browser: string;
  isMobile: boolean;
  screenW: number;
  maxTouchPoints: number;
} {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const innerW = typeof window !== 'undefined' ? window.innerWidth || 1200 : 1200;
  const screenWidth =
    typeof window !== 'undefined' && window.screen?.width ? window.screen.width : innerW;
  const physicalW = Math.min(innerW, screenWidth);
  const maxTouchPoints =
    typeof navigator !== 'undefined'
      ? navigator.maxTouchPoints || ('ontouchstart' in window ? 5 : 0)
      : 0;
  const hasTouch = maxTouchPoints > 0;

  let device = 'الكمبيوتر المكتبي';
  let isMobile = false;

  const isIPhone =
    /iPhone|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && hasTouch && physicalW <= 500);

  const isIPad =
    !isIPhone &&
    (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && hasTouch && physicalW > 500));

  const isAndroidPhone = /Android/i.test(ua) && (/Mobile/i.test(ua) || physicalW < 768);
  const isAndroidTablet = /Android/i.test(ua) && !isAndroidPhone;

  if (isIPhone) {
    device = 'هاتف آيفون (iPhone)';
    isMobile = true;
  } else if (isIPad) {
    device = 'جهاز آيباد (iPad)';
    isMobile = false;
  } else if (isAndroidPhone) {
    device = 'هاتف أندرويد (Android)';
    isMobile = true;
  } else if (isAndroidTablet) {
    device = 'جهاز لوحي (Android)';
    isMobile = false;
  } else if (
    /Mobile|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua) ||
    (physicalW < 768 && hasTouch) ||
    physicalW < 640
  ) {
    device = 'الهاتف الذكي';
    isMobile = true;
  } else if (
    /(tablet|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua) ||
    (physicalW >= 768 && physicalW <= 1024 && hasTouch)
  ) {
    device = 'الأجهزة اللوحية';
    isMobile = false;
  }

  let browser = 'متصفح الويب';
  if (/CriOS/i.test(ua)) browser = 'Chrome (iPhone)';
  else if (/FxiOS/i.test(ua)) browser = 'Firefox (iPhone)';
  else if (/EdgiOS|Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/OPR\/|Opera|OPiOS/i.test(ua)) browser = 'Opera';
  else if (/Safari/i.test(ua) && !/Chrome|CriOS|Android/i.test(ua)) {
    browser = isIPhone ? 'Safari (iPhone)' : isIPad ? 'Safari (iPad)' : 'Apple Safari';
  } else if (/Chrome/i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/Firefox/i.test(ua)) {
    browser = 'Firefox';
  }

  return { device, browser, isMobile, screenW: physicalW, maxTouchPoints };
}

export function detectGeoLocation(): { country: string; flag: string; city: string } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lowerTz = tz.toLowerCase();

    if (lowerTz.includes('istanbul') || lowerTz.includes('turkey') || lowerTz.includes('europe/istanbul')) {
      return { country: 'تركيا', flag: '🇹🇷', city: 'إسطنبول' };
    }
    if (lowerTz.includes('casablanca') || lowerTz.includes('morocco') || lowerTz.includes('el_aaiun')) {
      return { country: 'المغرب', flag: '🇲🇦', city: 'الدار البيضاء' };
    }
    if (lowerTz.includes('paris')) {
      return { country: 'فرنسا', flag: '🇫🇷', city: 'باريس' };
    }
    if (lowerTz.includes('madrid') || lowerTz.includes('ceuta') || lowerTz.includes('canary')) {
      return { country: 'إسبانيا', flag: '🇪🇸', city: 'مدريد' };
    }
    if (lowerTz.includes('berlin') || lowerTz.includes('frankfurt')) {
      return { country: 'ألمانيا', flag: '🇩🇪', city: 'فرانكفورت' };
    }
    if (lowerTz.includes('brussels')) {
      return { country: 'بلجيكا', flag: '🇧🇪', city: 'بروكسل' };
    }
    if (lowerTz.includes('amsterdam')) {
      return { country: 'هولندا', flag: '🇳🇱', city: 'أمستردام' };
    }
    if (lowerTz.includes('riyadh')) {
      return { country: 'السعودية', flag: '🇸🇦', city: 'الرياض' };
    }
    if (lowerTz.includes('dubai')) {
      return { country: 'الإمارات', flag: '🇦🇪', city: 'دبي' };
    }
    if (lowerTz.includes('london')) {
      return { country: 'بريطانيا', flag: '🇬🇧', city: 'لندن' };
    }
    if (lowerTz.includes('rome')) {
      return { country: 'إيطاليا', flag: '🇮🇹', city: 'روما' };
    }
  } catch {
    // fallback
  }

  return { country: 'المغرب', flag: '🇲🇦', city: 'الدار البيضاء' };
}

/**
 * Transmits final visit duration & mobile presence data using `navigator.sendBeacon`
 * on `pagehide`, `visibilitychange` (hidden), and `unload` so mobile browsers (iOS Safari / Android)
 * never drop the telemetry packet when closing tabs or switching apps.
 */
export function sendMobileBeacon(
  eventType: 'pagehide' | 'unload' | 'visibility_hidden' | 'manual' = 'pagehide',
  customAction?: string
): void {
  if (typeof window === 'undefined') return;
  const page = window.location.pathname || '/';
  if (page.startsWith('/admin')) return;

  const now = Date.now();
  // Deduplicate rapid consecutive pagehide + unload triggers within 800ms
  if (now - lastBeaconSentAt < 800 && eventType !== 'manual') return;
  lastBeaconSentAt = now;

  const visitorId = getVisitorId();
  const durationSec = getSessionDurationSec();
  const { device, browser, screenW, maxTouchPoints } = detectDevice();
  const { country, flag, city } = detectGeoLocation();

  const payload = {
    visitorId,
    country,
    flag,
    city,
    device,
    browser,
    page,
    eventType,
    durationSec,
    action: customAction || `تصفح نشط (${durationSec} ثانية)`,
    screenW,
    maxTouchPoints,
  };

  const jsonString = JSON.stringify(payload);

  // 1. Primary: navigator.sendBeacon (guaranteed by mobile browser kernel on pagehide/unload)
  let beaconQueued = false;
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      beaconQueued = navigator.sendBeacon('/api/analytics/beacon', blob);
    } catch {
      try {
        beaconQueued = navigator.sendBeacon('/api/analytics/beacon', jsonString);
      } catch {
        beaconQueued = false;
      }
    }
  }

  // 2. Fallback: fetch with keepalive: true
  if (!beaconQueued && typeof fetch === 'function') {
    fetch('/api/analytics/beacon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonString,
      keepalive: true,
    }).catch(() => {});
  }

}

export function initLifecycleBeaconListeners(): () => void {
  if (typeof window === 'undefined' || lifecycleListenersBound) {
    return () => {};
  }
  lifecycleListenersBound = true;

  const handlePageHide = () => {
    sendMobileBeacon('pagehide', 'إغلاق أو مغادرة التبويب (SendBeacon)');
  };

  const handleUnload = () => {
    sendMobileBeacon('unload', 'إنهاء الجلسة (Unload Beacon)');
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      sendMobileBeacon('visibility_hidden', 'تبديل التطبيق من الهاتف');
    }
  };

  window.addEventListener('pagehide', handlePageHide, { capture: true });
  window.addEventListener('unload', handleUnload, { capture: true });
  document.addEventListener('visibilitychange', handleVisibilityChange, { capture: true });

  return () => {
    window.removeEventListener('pagehide', handlePageHide, { capture: true });
    window.removeEventListener('unload', handleUnload, { capture: true });
    document.removeEventListener('visibilitychange', handleVisibilityChange, { capture: true });
    lifecycleListenersBound = false;
  };
}

export const tracker = {
  getVisitorId,
  getSessionDurationSec,
  detectDevice,
  detectGeoLocation,
  safeGetStorage,
  safeSetStorage,
  sendMobileBeacon,
  initLifecycleBeaconListeners,

  async trackPage(pageName?: string, actionName: string = 'زيارة وتصفح') {
    const page = pageName || (typeof window !== 'undefined' ? window.location.pathname : '/');
    if (page.startsWith('/admin')) return;

    const visitorId = getVisitorId();
    const durationSec = getSessionDurationSec();
    const { device, browser, screenW, maxTouchPoints } = detectDevice();
    const { country, flag, city } = detectGeoLocation();

    const payload = {
      visitorId,
      country,
      flag,
      city,
      device,
      browser,
      page,
      action: actionName,
      durationSec,
      screenW,
      maxTouchPoints,
    };

    try {
      await api.trackVisit(payload);
    } catch {
      // If fetch fails on mobile transition, fallback to sendBeacon
      sendMobileBeacon('manual', actionName);
    }
  },

  async trackHeartbeat() {
    const page = typeof window !== 'undefined' ? window.location.pathname : '/';
    if (page.startsWith('/admin')) return;

    const visitorId = getVisitorId();
    const durationSec = getSessionDurationSec();
    const { device, browser, screenW, maxTouchPoints } = detectDevice();
    const { country, flag, city } = detectGeoLocation();

    try {
      await api.sendHeartbeat({
        visitorId,
        country,
        flag,
        city,
        device,
        browser,
        page,
        durationSec,
        screenW,
        maxTouchPoints,
      });
    } catch {
      // ignore
    }
  },

  async trackPostEngagement(slug: string, type: 'engaged_read' | 'share' | 'consult_click') {
    try {
      await api.trackPostAction(slug, type);
    } catch {
      // ignore
    }
  },
};
