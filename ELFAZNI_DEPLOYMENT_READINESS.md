# ELFAZNI SERVICES — Production Deployment & Performance Readiness Guide

## 1. Production Build & Artifacts

The application is completely prepared and validated for production deployment. Both the public site and the CRM subsystem compile cleanly into optimized, tree-shaken static bundles.

### Build Commands:
```bash
# 1. Ensure Node.js 20+ and npm are in PATH
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

# 2. Build root application and CRM sub-application
npm run build
```

This compiles:
- `dist/`: Public website, Admin portal, Theme manager, and Blog CMS.
- `crm/dist/`: Full CRM workspace, accounting, customers, invoices, and calendar scheduler.

---

## 2. Process Management (PM2)

An optimized PM2 configuration is provided in `ecosystem.config.cjs`:

```bash
# Start or reload production instances
pm2 start ecosystem.config.cjs

# Verify process status
pm2 status

# Monitor live memory and logs
pm2 monit
```

### `ecosystem.config.cjs` Configuration:
```javascript
module.exports = {
  apps: [
    {
      name: 'elfazni-services',
      script: 'server.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
        HOST: '0.0.0.0',
      },
      max_memory_restart: '800M',
      time: true,
    },
  ],
};
```

---

## 3. Recommended Nginx Reverse Proxy Configuration

To maximize caching, TLS offloading, and compression, place Nginx in front of the Node server:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name elfazni.com www.elfazni.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name elfazni.com www.elfazni.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/elfazni.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/elfazni.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml image/svg+xml;

    # Large Media Streaming Buffer
    client_max_body_size 50M;

    # Static Immutable Assets Caching
    location ~* \.(?:ico|css|js|gif|jpe?g|png|webp|svg|woff2?|ttf|eot)$ {
        root /var/www/elfazni/dist;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Video Files (Support Range Requests for Fast Streaming)
    location ~* \.(?:mp4|webm)$ {
        root /var/www/elfazni/public;
        mp4;
        mp4_buffer_size 1m;
        mp4_max_buffer_size 5m;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # Node.js Application Reverse Proxy
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 4. Environment Variables Checklist

Ensure the following variables are configured in `.env` or production server environment:
- `NODE_ENV=production`
- `PORT=8080`
- `HOST=0.0.0.0`
- `JWT_SECRET=<strong-random-key>`
- `FIREBASE_PROJECT_ID=<your-firebase-project>`
- `FIREBASE_CLIENT_EMAIL=<service-account-email>`
- `FIREBASE_PRIVATE_KEY="<service-account-private-key>"`
- `DISABLE_HMR=true`

---

## 5. Rollback Procedures

If an unexpected production issue arises:
1. Revert to git checkpoint:
   ```bash
   git checkout checkpoint/perf-optimization-pre-audit
   npm run build
   pm2 restart elfazni-services
   ```
2. Data safety: Database backups are preserved in `backups/perf-audit-pre-data-20261110_0000/`.
