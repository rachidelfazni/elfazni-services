import { Request, Response, NextFunction } from 'express';

interface LoginAttemptRecord {
  failures: number;
  firstFailureTime: number;
  lastFailureTime: number;
  lockoutUntil?: number;
}

// In-memory store: key is `${ip}:${username.toLowerCase()}`
const loginAttempts = new Map<string, LoginAttemptRecord>();

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_FAILURES_BEFORE_LIMIT = 5;
const MAX_FAILURES_BEFORE_EXTENDED_LOCK = 10;
const EXTENDED_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Periodic cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttempts.entries()) {
    const isLockExpired = !record.lockoutUntil || record.lockoutUntil <= now;
    const isWindowExpired = now - record.lastFailureTime > WINDOW_MS;
    if (isLockExpired && isWindowExpired) {
      loginAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function getRateKey(req: Request): string {
  const ip = getClientIp(req);
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  return `${ip}:${username}`;
}

/**
 * Middleware applied exclusively before POST /api/auth/login.
 * If 5 failed attempts occurred in the window, rejects with HTTP 429 and Retry-After header.
 */
export function loginRateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = getRateKey(req);
  const record = loginAttempts.get(key);

  if (!record) {
    return next();
  }

  const now = Date.now();

  // Check if locked out (15-min lockout after 10 attempts)
  if (record.lockoutUntil && record.lockoutUntil > now) {
    const remainingSeconds = Math.max(1, Math.ceil((record.lockoutUntil - now) / 1000));
    const remainingMinutes = Math.max(1, Math.ceil(remainingSeconds / 60));
    res.setHeader('Retry-After', remainingSeconds.toString());
    res.status(429).json({
      error: `تم تجاوز الحد المسموح من محاولات تسجيل الدخول. يرجى المحاولة بعد ${remainingMinutes} دقيقة.`,
      retryAfter: remainingSeconds,
    });
    return;
  }

  // Check if standard 10-minute window has passed
  if (now - record.firstFailureTime > WINDOW_MS && (!record.lockoutUntil || record.lockoutUntil <= now)) {
    // Window reset
    loginAttempts.delete(key);
    return next();
  }

  // 5 or more failed attempts
  if (record.failures >= MAX_FAILURES_BEFORE_LIMIT) {
    const windowRemainingSeconds = Math.max(1, Math.ceil((record.firstFailureTime + WINDOW_MS - now) / 1000));
    const remainingMinutes = Math.max(1, Math.ceil(windowRemainingSeconds / 60));
    res.setHeader('Retry-After', windowRemainingRemainingOrLock(record, now).toString());
    res.status(429).json({
      error: `تم تجاوز الحد المسموح من محاولات تسجيل الدخول. يرجى المحاولة بعد ${remainingMinutes} دقيقة.`,
      retryAfter: windowRemainingSeconds,
    });
    return;
  }

  next();
}

function windowRemainingRemainingOrLock(record: LoginAttemptRecord, now: number): number {
  if (record.lockoutUntil && record.lockoutUntil > now) {
    return Math.max(1, Math.ceil((record.lockoutUntil - now) / 1000));
  }
  return Math.max(1, Math.ceil((record.firstFailureTime + WINDOW_MS - now) / 1000));
}

/**
 * Record a failed login attempt for the IP + username.
 */
export function recordLoginFailure(req: Request): void {
  const key = getRateKey(req);
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now - record.firstFailureTime > WINDOW_MS) {
    loginAttempts.set(key, {
      failures: 1,
      firstFailureTime: now,
      lastFailureTime: now,
    });
    console.warn(`[AUTH] Failed login attempt 1/${MAX_FAILURES_BEFORE_LIMIT} for ${key}`);
    return;
  }

  record.failures += 1;
  record.lastFailureTime = now;

  if (record.failures >= MAX_FAILURES_BEFORE_EXTENDED_LOCK) {
    record.lockoutUntil = now + EXTENDED_LOCKOUT_MS;
    console.warn(`[AUTH] Account locked (15 mins) after ${record.failures} failed login attempts for ${key}`);
  } else {
    console.warn(`[AUTH] Failed login attempt ${record.failures}/${MAX_FAILURES_BEFORE_LIMIT} for ${key}`);
  }
}

/**
 * Reset rate limit counter on successful login.
 */
export function resetLoginRateLimit(req: Request): void {
  const key = getRateKey(req);
  if (loginAttempts.has(key)) {
    loginAttempts.delete(key);
    console.log(`[AUTH] Login success: rate limiter reset for ${key}`);
  }
}

