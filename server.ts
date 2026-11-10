import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { randomBytes } from 'node:crypto';
import helmet from 'helmet';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import { crmRouter } from './server/crmRoutes';
import { apiRouter } from './server/routes';
import { getAuthenticatedUser, hasPermission, generateToken } from './server/auth';
import { readDb, registerCloudSyncCallback, getDefaultSeoPages } from './server/db';
import { initCloudSync, scheduleCloudStatePush } from './server/cloudSync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure NODE_ENV defaults to production unless explicitly set to development
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
  const isProduction = process.env.NODE_ENV === 'production';

  // Disable X-Powered-By
  app.disable('x-powered-by');

  app.set('trust proxy', true);
  app.set('etag', false);

  // Response compression (gzip / br)
  app.use(compression());

  // RFC-compliant representation headers for HEAD requests
  app.use((req, res, next) => {
    if (req.method === 'HEAD') {
      const enc = req.headers['accept-encoding'] || '';
      if (typeof enc === 'string') {
        if (enc.includes('br')) {
          res.setHeader('Content-Encoding', 'br');
        } else if (enc.includes('gzip')) {
          res.setHeader('Content-Encoding', 'gzip');
        }
      }
    }
    next();
  });

  // Security Headers via helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          scriptSrcAttr: ["'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
          connectSrc: ["'self'", 'ws:', 'wss:'],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      xFrameOptions: { action: 'deny' },
      xContentTypeOptions: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    })
  );

  // Strict Permissions-Policy header
  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Body parsing middleware (including text/plain for mobile navigator.sendBeacon)
  app.use(express.json({ limit: '15mb' }));
  app.use(express.text({ type: ['text/plain', 'application/x-www-form-urlencoded'], limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Normalize text/plain JSON bodies sent by navigator.sendBeacon on iOS Safari / Android
  app.use((req, _res, next) => {
    if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        // leave as is
      }
    }
    next();
  });

  // Observability & Structured Request Logging with Request ID
  app.use((req, res, next) => {
    const reqId = (req.headers['x-request-id'] as string) || randomBytes(8).toString('hex');
    res.setHeader('X-Request-Id', reqId);
    (req as any).id = reqId;
    const start = Date.now();
    res.on('finish', () => {
      // Structured JSON logging for observability & audits
      if (req.path.startsWith('/api') || req.path.startsWith('/crm/api') || res.statusCode >= 400) {
        console.log(
          JSON.stringify({
            level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
            requestId: reqId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
            ip: req.ip || req.socket.remoteAddress,
            timestamp: new Date().toISOString(),
          })
        );
      }
    });
    next();
  });

  // Uptime / Monitoring Healthcheck Endpoint (UptimeRobot, Pingdom, AWS/GCP, K8s)
  app.get(['/health', '/api/health'], (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
      status: 'ok',
      service: 'ELFAZNI SERVICES',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: isProduction ? 'production' : 'development',
    });
  });

  // Dynamic robots.txt for search engines
  app.get('/robots.txt', (_req, res) => {
    const baseUrl = process.env.BASE_URL || 'https://elfazni.com';
    const content = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /portal',
      'Disallow: /crm',
      'Disallow: /workspace',
      'Disallow: /hub',
      'Disallow: /admin',
      'Disallow: /api/',
      '',
      `Sitemap: ${baseUrl}/sitemap.xml`,
    ].join('\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  });

  // Dynamic sitemap.xml generated from live SEO pages & published blog posts
  app.get(['/sitemap.xml', '/api/sitemap.xml'], (_req, res) => {
    const db = readDb();
    const baseUrl = process.env.BASE_URL || 'https://elfazni.com';
    const seoPages = db.seoPages && db.seoPages.length > 0 ? db.seoPages : getDefaultSeoPages();
    const publishedPosts = (db.posts || []).filter((p) => p.status === 'published');

    const urls: Array<{ loc: string; lastmod: string; priority: string; changefreq: string }> = [];

    for (const page of seoPages) {
      if ((page.robots || '').toLowerCase().includes('noindex')) continue;
      if (page.pagePath.includes('#')) continue;
      if (page.pagePath.startsWith('/blog/') && !publishedPosts.some((post) => page.pagePath === '/blog/' + post.slug)) continue;
      const loc = page.canonicalUrl || `${baseUrl}${page.pagePath.startsWith('/') ? page.pagePath : `/${page.pagePath}`}`;
      urls.push({
        loc,
        lastmod: (page.updatedAt || new Date().toISOString()).slice(0, 10),
        priority: page.pagePath === '/' ? '1.0' : '0.8',
        changefreq: page.pagePath === '/' ? 'daily' : 'weekly',
      });
    }

    for (const post of publishedPosts) {
      const postLoc = `${baseUrl}/blog/${post.slug}`;
      if (!urls.some((u) => u.loc === postLoc)) {
        urls.push({
          loc: postLoc,
          lastmod: (post.updatedAt || post.createdAt || new Date().toISOString()).slice(0, 10),
          priority: '0.7',
          changefreq: 'weekly',
        });
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  });

  // Static serving for uploaded files with 30-day client cache
  app.use(
    '/uploads',
    express.static(path.join(__dirname, 'public', 'uploads'), {
      maxAge: '30d',
    })
  );

  const crmDist = path.join(__dirname, 'crm', 'dist');
  app.use(['/crm', '/portal/crm', '/admin/crm'], (req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('X-Frame-Options', 'DENY');
    const token =
      req.headers.cookie?.match(/(?:^|; *)elfazni_crm=([^;]+)/)?.[1] ||
      req.headers.cookie?.match(/(?:^|; *)token=([^;]+)/)?.[1] ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);
    const user = getAuthenticatedUser(token, 'crm') || getAuthenticatedUser(token, 'admin');
    if (!user) {
      if (req.accepts('html')) return res.redirect('/portal/login?next=crm');
      return res.status(401).json({ error: 'يلزم تسجيل الدخول أولًا.' });
    }
    const hasCrmPermission =
      user.role === 'superadmin' ||
      user.systemAccess === 'both' ||
      user.systemAccess === 'crm' ||
      hasPermission(user, 'crm.dashboard.view');
    if (!hasCrmPermission) {
      return res.status(403).json({ error: 'لا تملك صلاحية الوصول إلى نظام CRM.' });
    }
    res.locals.crmOwner = user;
    next();
  });
  app.get(['/crm/session', '/portal/crm/session', '/admin/crm/session'], (_req, res) => {
    const user = res.locals.crmOwner;
    const canManageUsers = user.role === 'superadmin' || hasPermission(user, 'crm.users.manage');
    const token = generateToken(user, 'admin');
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      systemAccess: user.systemAccess,
      permissions: user.permissions,
      canManageUsers,
      token,
    });
  });
  app.use(['/crm/api', '/portal/crm/api', '/admin/crm/api'], crmRouter);
  app.use(
    ['/crm', '/portal/crm', '/admin/crm'],
    express.static(crmDist, {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    })
  );
  app.get(['/crm', '/crm/*', '/portal/crm', '/portal/crm/*', '/admin/crm', '/admin/crm/*'], (_req, res) => {
    const indexPath = path.join(crmDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    res.status(503).send('يجب بناء تطبيق CRM أولًا عبر npm run build:crm.');
  });

  // Mount API router
  app.use('/api', apiRouter);

  // Return standard 404 JSON for any unmatched API endpoints
  app.all(['/api', '/api/*'], (_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Connect real-time Firestore CloudSync
  registerCloudSyncCallback(scheduleCloudStatePush);
  initCloudSync().catch((err) => {
    console.warn('CloudSync init error:', err);
  });

  if (!isProduction) {
    // Development mode: Vite middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log(`[DEV] Vite middlewares attached in dev mode`);
  } else {
    // Production mode: Serve built dist with 1-year immutable cache on hashed assets
    const distPath = path.join(__dirname, 'dist');
    app.use(
      express.static(distPath, {
        maxAge: '1y',
        immutable: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
          }
        },
      })
    );
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`[PROD] Serving production build from ${distPath}`);
  }

  const host = process.env.HOST || '0.0.0.0';
  app.listen(PORT, host, () => {
    console.log(`🚀 ELFAZNI SERVICES server running on http://${host}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
