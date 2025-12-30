# Infrastructure Documentation

**Version**: 3.0.0
**Last Updated**: 2025-12-30

This document details the server architecture, development/production modes, and client-server infrastructure for Medisson Lounge.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Mode](#development-mode)
3. [Production Mode](#production-mode)
4. [Request Routing](#request-routing)
5. [Vite Middleware Integration](#vite-middleware-integration)
6. [Meta Injection System](#meta-injection-system)
7. [API Layer](#api-layer)
8. [File Storage](#file-storage)
9. [Startup Sequence](#startup-sequence)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Single Entry Point

All server functionality is handled by a single entry point:

```
tsx server/index.ts
```

This unified server combines:
- **Hono API Framework** - REST API endpoints
- **Vite Dev/Preview Server** - Frontend asset serving
- **Meta Injection** - Server-side SEO
- **Telegram Bot** - Notification integration

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    http://localhost:3001                         │
├─────────────────────────────────────────────────────────────────┤
│                     Node.js HTTP Server                          │
│                    (http.createServer)                           │
├──────────┬──────────┬──────────────────┬───────────────────────┤
│  /api/*  │ /uploads │  Static Assets   │     HTML Routes       │
│          │  /data   │  (JS/CSS/images) │     (SPA pages)       │
├──────────┼──────────┼──────────────────┼───────────────────────┤
│   Hono   │  Direct  │      Vite        │  Meta Injection +     │
│   API    │  Serve   │   Middlewares    │  Vite Transform       │
└──────────┴──────────┴──────────────────┴───────────────────────┘
```

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `hono` | API framework |
| `@hono/node-server` | Node.js adapter for Hono |
| `vite` | Dev server & build tool |
| `tsx` | TypeScript execution |
| `cross-env` | Cross-platform env vars |

---

## Development Mode

### Command

```bash
npm run dev
```

### Environment

```
NODE_ENV=undefined (defaults to development)
```

### Vite Configuration

```typescript
vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'custom',
});
```

**Key settings:**
- `middlewareMode: true` - Vite doesn't listen on its own port
- `appType: 'custom'` - Allows custom HTML handling

### Features Enabled

| Feature | Status | Description |
|---------|--------|-------------|
| HMR (Hot Module Replacement) | ✅ | Instant updates without page reload |
| Source Maps | ✅ | Full debugging support |
| TypeScript Transform | ✅ | On-the-fly TS compilation |
| React Fast Refresh | ✅ | Component state preservation |
| Meta Injection | ✅ | Server-side SEO tags |
| API Endpoints | ✅ | Full backend functionality |

### HTML Processing Flow

```
index.html → injectMeta(html, pathname) → vite.transformIndexHtml('/', html)
                     ↓                              ↓
              SEO meta tags                  HMR client scripts
                                             React refresh runtime
```

### Console Output

```
[server] Starting in DEVELOPMENT mode...
[server] Vite dev server initialized (middleware mode)
[server] Server running on http://localhost:3001
[server] Mode: development
[server] HMR enabled via Vite dev server
```

---

## Production Mode

### Commands

```bash
# Build first
npm run build

# Start production server
npm start

# Or combined
npm run preview
```

### Environment

```
NODE_ENV=production
```

### Vite Configuration

```typescript
vite = await createPreviewServer({
  preview: { port: 0 },
});
```

**Key settings:**
- `port: 0` - Preview server doesn't bind to a port (we use our HTTP server)
- Serves pre-built files from `dist/`

### Features

| Feature | Status | Description |
|---------|--------|-------------|
| HMR | ❌ | Not needed in production |
| Optimized Assets | ✅ | Minified, code-split bundles |
| Static File Serving | ✅ | Efficient serving from dist/ |
| Meta Injection | ✅ | Server-side SEO tags |
| API Endpoints | ✅ | Full backend functionality |
| Gzip/Compression | ✅ | Via Vite preview server |

### HTML Processing Flow

```
dist/index.html → injectMeta(html, pathname) → response
                         ↓
                  SEO meta tags
```

Note: `transformIndexHtml` is only called in dev mode.

### Console Output

```
[server] Starting in PRODUCTION mode...
[server] Vite preview server initialized
[server] Server running on http://localhost:3001
[server] Mode: production
[server] Serving static files from: X:\meddison\dist
```

---

## Request Routing

### Route Priority (Top to Bottom)

```typescript
const pathname = new URL(req.url, 'http://localhost').pathname;

// 1. API Routes → Hono
if (pathname.startsWith('/api/')) {
  return getRequestListener(app.fetch)(req, res);
}

// 2. Storage Routes → Direct file serve
if (pathname.startsWith('/uploads/') || pathname.startsWith('/data/')) {
  return serveStorage(req, res, pathname);
}

// 3. Static Assets → Vite middlewares
const hasExtension = /\.[a-zA-Z0-9]+$/.test(pathname);
const isViteInternal = pathname.startsWith('/@') ||
                       pathname.startsWith('/node_modules/') ||
                       pathname.startsWith('/src/');
if (hasExtension || isViteInternal) {
  return vite.middlewares(req, res, next);
}

// 4. HTML Routes (SPA) → Meta injection + serve
if (isHtmlRequest(req)) {
  return serveHtmlWithMeta(req, res, pathname);
}

// 5. Fallback → 404
res.statusCode = 404;
res.end('Not Found');
```

### Route Examples

| Request | Handler | Response |
|---------|---------|----------|
| `GET /api/data` | Hono | JSON data |
| `GET /uploads/image.jpg` | serveStorage | Image file |
| `GET /assets/index-abc123.js` | Vite middlewares | JS bundle |
| `GET /src/main.tsx` (dev) | Vite middlewares | Transformed TS |
| `GET /` | serveHtmlWithMeta | HTML with meta |
| `GET /news/article` | serveHtmlWithMeta | HTML with meta |
| `GET /admin/seo` | serveHtmlWithMeta | HTML (no meta) |

---

## Vite Middleware Integration

### Development Mode

```typescript
import { createServer as createViteServer } from 'vite';

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'custom',
});

// Use as Connect middleware
vite.middlewares(req, res, next);

// Transform HTML for HMR
html = await vite.transformIndexHtml('/', html);
```

### Production Mode

```typescript
import { preview as createPreviewServer } from 'vite';

const vite = await createPreviewServer({
  preview: { port: 0 },
});

// Use as Connect middleware
vite.middlewares(req, res, next);

// Note: transformIndexHtml not available in preview mode
```

### Why `transformIndexHtml('/', html)`?

The first argument should always be `'/'` for SPAs:

```typescript
// ✅ Correct - always use root path
html = await vite.transformIndexHtml('/', html);

// ❌ Wrong - causes CSS parsing errors for paths like /admin/seo
html = await vite.transformIndexHtml(pathname, html);
```

Vite uses the path to resolve relative imports. For SPAs, all routes use the same `index.html`, so `'/'` is always correct.

---

## Meta Injection System

### Overview

Server-side SEO meta tags are injected before HTML is sent to the browser:

```typescript
import { injectMeta, shouldSkipMetaInjection } from './meta-injection';

if (!shouldSkipMetaInjection(pathname)) {
  html = await injectMeta(html, pathname);
}
```

### Supported Routes

| Route Pattern | Meta Source |
|---------------|-------------|
| `/` | `seo.home` |
| `/news` | `seo.news` |
| `/news/:slug` | News article data |
| `/locations/:slug` | Location data |
| `/loyalty` | `seo.loyalty` |
| `/privacy` | `seo.privacy` |

### Skipped Routes

Admin routes don't need SEO:
- `/admin/*`
- `/api/*`
- Static assets

### Injected Tags

```html
<!-- Title -->
<title>Page Title</title>

<!-- Basic Meta -->
<meta name="description" content="..." />
<meta name="keywords" content="..." />

<!-- Open Graph -->
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta property="og:url" content="..." />

<!-- Twitter Card -->
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="..." />

<!-- Canonical -->
<link rel="canonical" href="..." />
```

---

## API Layer

### Hono Integration

```typescript
import { Hono } from 'hono';
import { getRequestListener } from '@hono/node-server';

const app = new Hono();

// Define routes
app.get('/api/data', handler);
app.post('/api/data', handler);
// ...

// Bridge to Node.js HTTP
if (pathname.startsWith('/api/')) {
  return getRequestListener(app.fetch)(req, res);
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data` | Fetch all site data |
| POST | `/api/data` | Save site data |
| POST | `/api/upload` | Upload file |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings` | List bookings |
| PUT | `/api/bookings/:id/status` | Update booking status |
| GET | `/api/booking-settings` | Get booking settings |
| PUT | `/api/booking-settings/:id` | Update booking setting |
| GET | `/api/telegram/status` | Telegram bot status |
| POST | `/api/telegram/configure` | Configure Telegram |
| POST | `/api/telegram/reconfigure` | Reconfigure bot |
| POST | `/api/telegram/test-message` | Send test message |

---

## File Storage

### Directory Structure

```
storage/                    # Runtime data (outside Vite scope)
├── data/
│   └── data.json          # Unified site data
└── uploads/               # User uploaded files

public/                    # Static assets (served by Vite)
└── assets/
    ├── images/            # General images
    └── locations/         # Location-specific images
```

### Why `storage/` is Separate

Vite's dev server watches `public/` for changes. Runtime data (uploads, JSON) should not trigger rebuilds:

```
✅ storage/uploads/photo.jpg  → No rebuild
❌ public/uploads/photo.jpg   → Triggers rebuild
```

### Storage Routes

```typescript
if (pathname.startsWith('/uploads/') || pathname.startsWith('/data/')) {
  const filePath = join(STORAGE_DIR, pathname.replace(/^\//, ''));
  // Serve file with proper content-type
}
```

---

## Startup Sequence

### 1. Environment Detection

```typescript
const isDev = process.env.NODE_ENV !== 'production';
console.log(`[server] Starting in ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'} mode...`);
```

### 2. Vite Initialization

```typescript
if (isDev) {
  vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
} else {
  vite = await createPreviewServer({
    preview: { port: 0 },
  });
}
```

### 3. HTTP Server Creation

```typescript
const server = http.createServer(async (req, res) => {
  // Request handling logic
});
```

### 4. Server Listen

```typescript
server.listen(PORT, () => {
  console.log(`[server] Server running on http://localhost:${PORT}`);
});
```

### 5. Telegram Initialization

```typescript
if (settings.telegram?.botToken) {
  await initTelegram(settings.telegram.botToken, settings.telegram.groupChatId);
}
```

---

## Troubleshooting

### Port Already in Use

```bash
# Error
Error: listen EADDRINUSE: address already in use :::3001

# Fix
npx kill-port 3001
npm run dev
```

### HMR Not Working

1. Check browser console for WebSocket errors
2. Verify `vite.transformIndexHtml` is being called
3. Check Vite dev server is in middleware mode

### Meta Tags Not Injecting

1. Verify route is not in skip list
2. Check `storage/data/data.json` has SEO data
3. Check server logs for `[meta-injection]` messages

### Admin Pages 404

Ensure static file detection runs BEFORE HTML serving:

```typescript
// ✅ Correct order
if (hasExtension || isViteInternal) → Vite
if (isHtmlRequest) → HTML serve

// ❌ Wrong order
if (isHtmlRequest && !shouldSkip) → Some routes missed
```

### CSS/JS Parse Errors

Always use `'/'` for `transformIndexHtml`:

```typescript
// ✅ Correct
await vite.transformIndexHtml('/', html);

// ❌ Wrong - causes parse errors
await vite.transformIndexHtml('/admin/seo', html);
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `undefined` (dev) | `production` for prod mode |
| `PORT` | `3001` | Server port |

### Setting Environment

```bash
# Development (default)
npm run dev

# Production
cross-env NODE_ENV=production tsx server/index.ts
# or
npm start
```

---

## Performance Considerations

### Development

- Vite transforms modules on-demand
- No bundling overhead
- Fast HMR updates (~50ms)

### Production

- Pre-bundled, minified assets
- Code splitting for optimal loading
- Asset fingerprinting for caching
- Gzip compression via preview server

### Recommendations

| Concern | Solution |
|---------|----------|
| High traffic | Consider nginx reverse proxy |
| Static assets | CDN for `/assets/*` |
| API scaling | Separate API server if needed |
| SEO caching | Cache meta-injected HTML |

---

## Related Documentation

- [PROJECT_INDEX.md](../PROJECT_INDEX.md) - Project structure overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API.md](./API.md) - API reference

---

**Maintained by**: Development Team
**Last Review**: 2025-12-30
