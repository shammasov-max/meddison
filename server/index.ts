import http from 'node:http';
import { createServer as createViteServer, preview as createPreviewServer, type ViteDevServer, type PreviewServer } from 'vite';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getRequestListener } from '@hono/node-server';
import { z } from 'zod';
import { readFile, writeFile, copyFile, mkdir, access, constants } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReadStream, statSync } from 'node:fs';

// Telegram service
import * as telegram from './telegram.js';

// Meta injection utilities
import { injectMeta, shouldSkipMetaInjection, isHtmlRequest } from './meta-injection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3001;
const isDev = process.env.NODE_ENV !== 'production';
const DATA_PATH = join(__dirname, '../storage/data/data.json');
const UPLOADS_PATH = join(__dirname, '../storage/uploads');
const SERVER_DATA_PATH = join(__dirname, 'data');
const STORAGE_PATH = join(__dirname, '../storage');

// Ensure directories exist
await mkdir(UPLOADS_PATH, { recursive: true });
await mkdir(SERVER_DATA_PATH, { recursive: true });

// Basic auth credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'medisson2024';

// ==================== ZOD SCHEMAS ====================

const BookingSchema = z.object({
  location: z.string().min(1),
  date: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  guests: z.number().min(1).max(100),
  name: z.string().min(1),
  phone: z.string().min(10),
});

const BookingSettingsSchema = z.object({
  id: z.number().optional(),
  location_slug: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  image: z.string().nullable(),
  working_hours_start: z.string(),
  working_hours_end: z.string(),
  time_slot_interval: z.number(),
  max_guests: z.number(),
  min_guests: z.number(),
  booking_rules: z.string().nullable(),
  contact_phone: z.string().nullable(),
  contact_email: z.string().nullable(),
  telegram_chat_id: z.string().nullable(),
  telegram_bot_token: z.string().nullable(),
});

const ContentSchema = z.object({
  key: z.enum(['seo', 'robotsConfig', 'jsonLdSchemas', 'trackingConfig']),
  value: z.record(z.unknown()),
});

type Booking = z.infer<typeof BookingSchema> & {
  id: number;
  createdAt: string;
  status: 'pending' | 'handled';
  telegramMessageIds?: Record<string, number>;
};
type BookingSettings = z.infer<typeof BookingSettingsSchema>;

// ==================== JSON FILE HELPERS ====================

async function readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
  const filepath = join(SERVER_DATA_PATH, filename);
  try {
    const data = await readFile(filepath, 'utf8');
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  const filepath = join(SERVER_DATA_PATH, filename);
  await writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
}

// ==================== AUTH HELPER ====================

function checkAuth(authHeader: string | undefined): boolean {
  if (!authHeader?.startsWith('Basic ')) return false;
  const [user, pass] = Buffer.from(authHeader.slice(6), 'base64')
    .toString()
    .split(':');
  return user === ADMIN_USER && pass === ADMIN_PASS;
}

// ==================== HONO APP (API ROUTES) ====================

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ==================== DATA API ====================

app.get('/api/data', async (c) => {
  try {
    const data = await readFile(DATA_PATH, 'utf8');
    return c.json(JSON.parse(data));
  } catch (error) {
    return c.json({ error: 'Failed to read data' }, 500);
  }
});

app.post('/api/data', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!checkAuth(authHeader)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.text();
    JSON.parse(body); // Validate JSON

    await copyFile(DATA_PATH, DATA_PATH + '.backup');
    await writeFile(DATA_PATH, body);

    console.log('[server] Data saved successfully');
    return c.json({ success: true });
  } catch (error) {
    console.error('[server] Save error:', error);
    return c.json({ error: 'Failed to save data' }, 500);
  }
});

// ==================== UPLOAD API ====================

app.post('/api/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string | null;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Allowed: jpeg, png, webp, gif' }, 400);
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ error: 'File too large. Max: 10MB' }, 400);
    }

    // Generate unique filename
    const ext = extname(file.name) || '.jpg';
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${safeName}`;

    // Determine upload path
    const uploadDir = folder ? join(UPLOADS_PATH, folder) : UPLOADS_PATH;
    await mkdir(uploadDir, { recursive: true });
    const filepath = join(uploadDir, filename);

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Generate public URL
    const publicPath = folder ? `/uploads/${folder}/${filename}` : `/uploads/${filename}`;

    console.log(`[server] File uploaded: ${publicPath}`);

    return c.json({
      success: true,
      url: publicPath,
      key: publicPath,
      publicUrl: publicPath,
      file_path: publicPath,
    });
  } catch (error) {
    console.error('[server] Upload error:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

// Legacy upload-url endpoint
app.post('/api/upload-url', async (c) => {
  const body = await c.req.json<{ filename: string; contentType: string; folder?: string }>();

  const timestamp = Date.now();
  const safeName = body.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${timestamp}-${safeName}`;
  const folder = body.folder || '';
  const publicPath = folder ? `/uploads/${folder}/${filename}` : `/uploads/${filename}`;

  return c.json({
    url: '/api/upload',
    key: publicPath,
    publicUrl: publicPath,
    file_path: publicPath,
    requiredHeaders: {},
  });
});

// Legacy download-url endpoint
app.post('/api/download-url', async (c) => {
  const body = await c.req.json<{ key: string }>();
  return c.json({ url: body.key });
});

// ==================== BOOKINGS API ====================

app.post('/api/bookings', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = BookingSchema.parse(body);

    const bookings = await readJsonFile<Booking[]>('bookings.json', []);

    const newBooking: Booking = {
      ...parsed,
      id: bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    const telegramMessageIds = await telegram.sendBookingNotification({
      id: newBooking.id,
      location: newBooking.location,
      date: newBooking.date,
      time: newBooking.time,
      guests: newBooking.guests,
      name: newBooking.name,
      phone: newBooking.phone,
    });

    if (Object.keys(telegramMessageIds).length > 0) {
      newBooking.telegramMessageIds = telegramMessageIds;
    }

    bookings.push(newBooking);
    await writeJsonFile('bookings.json', bookings);

    console.log(`[server] New booking: ${newBooking.name} for ${newBooking.date} at ${newBooking.time}`);

    return c.json({ success: true, id: newBooking.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    }
    console.error('[server] Booking error:', error);
    return c.json({ error: 'Failed to create booking' }, 500);
  }
});

app.get('/api/bookings', async (c) => {
  const bookings = await readJsonFile<Booking[]>('bookings.json', []);
  return c.json(bookings);
});

app.put('/api/bookings/:id/status', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json<{ status: 'pending' | 'handled' }>();

    const bookings = await readJsonFile<Booking[]>('bookings.json', []);
    const booking = bookings.find(b => b.id === id);

    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }

    booking.status = body.status;
    await writeJsonFile('bookings.json', bookings);

    console.log(`[server] Booking ${id} status updated to: ${body.status}`);
    return c.json({ success: true, booking });
  } catch (error) {
    console.error('[server] Status update error:', error);
    return c.json({ error: 'Failed to update status' }, 500);
  }
});

// ==================== BOOKING SETTINGS API ====================

const defaultBookingSettings: BookingSettings[] = [
  {
    id: 1,
    location_slug: 'all',
    title: 'Medisson Lounge',
    description: 'Создаем атмосферу, в которую хочется возвращаться.',
    image: null,
    working_hours_start: '11:00',
    working_hours_end: '05:00',
    time_slot_interval: 30,
    max_guests: 20,
    min_guests: 1,
    booking_rules: null,
    contact_phone: null,
    contact_email: null,
    telegram_chat_id: null,
    telegram_bot_token: null,
  }
];

app.get('/api/booking-settings', async (c) => {
  const settings = await readJsonFile<BookingSettings[]>('booking_settings.json', defaultBookingSettings);
  return c.json(settings[0] || defaultBookingSettings[0]);
});

app.get('/api/booking-settings/all', async (c) => {
  const settings = await readJsonFile<BookingSettings[]>('booking_settings.json', defaultBookingSettings);
  return c.json(settings);
});

app.put('/api/booking-settings', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = BookingSettingsSchema.parse(body);

    const settings = await readJsonFile<BookingSettings[]>('booking_settings.json', defaultBookingSettings);

    const newSettings: BookingSettings = {
      ...parsed,
      id: settings.length > 0 ? Math.max(...settings.map(s => s.id || 0)) + 1 : 1,
    };

    settings.push(newSettings);
    await writeJsonFile('booking_settings.json', settings);

    return c.json(newSettings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    }
    return c.json({ error: 'Failed to create settings' }, 500);
  }
});

app.put('/api/booking-settings/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const parsed = BookingSettingsSchema.parse(body);

    const settings = await readJsonFile<BookingSettings[]>('booking_settings.json', defaultBookingSettings);

    let savedSettings: BookingSettings;
    const index = settings.findIndex(s => s.id === id);
    if (index >= 0) {
      settings[index] = { ...parsed, id };
      savedSettings = settings[index];
    } else {
      savedSettings = { ...parsed, id };
      settings.push(savedSettings);
    }

    await writeJsonFile('booking_settings.json', settings);

    // Auto-reconfigure Telegram bot when main settings are saved
    if (savedSettings.location_slug === 'all' || savedSettings.id === 1) {
      console.log('[server] Main settings updated, reconfiguring Telegram bot...');
      try {
        const result = await telegram.reconfigure(
          savedSettings.telegram_bot_token || null,
          savedSettings.telegram_chat_id || null
        );
        if (result.success) {
          console.log(`[server] Telegram bot reconfigured: ${result.botName || 'stopped'}`);
        } else {
          console.log(`[server] Telegram reconfiguration failed: ${result.error}`);
        }
      } catch (err) {
        console.error('[server] Error reconfiguring Telegram:', err);
      }
    }

    return c.json(savedSettings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    }
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// ==================== CONTENT API ====================

app.post('/api/content', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = ContentSchema.parse(body);

    const content = await readJsonFile<Record<string, unknown>>('content.json', {});
    content[parsed.key] = parsed.value;
    await writeJsonFile('content.json', content);

    console.log(`[server] Content saved: ${parsed.key}`);
    return c.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    }
    return c.json({ error: 'Failed to save content' }, 500);
  }
});

app.get('/api/content/:key', async (c) => {
  const key = c.req.param('key');
  const content = await readJsonFile<Record<string, unknown>>('content.json', {});
  return c.json(content[key] || null);
});

// ==================== TELEGRAM API ====================

app.get('/api/telegram/status', async (c) => {
  const status = telegram.getStatus();
  return c.json(status);
});

app.post('/api/telegram/configure', async (c) => {
  try {
    const body = await c.req.json<{ token: string; chatId?: string }>();
    telegram.configure(body.token, body.chatId || null);

    const test = await telegram.testConnection();
    if (test.ok) {
      return c.json({ success: true, botName: test.botName });
    } else {
      return c.json({ success: false, error: test.error }, 400);
    }
  } catch (error) {
    return c.json({ error: 'Failed to configure' }, 500);
  }
});

app.post('/api/telegram/reconfigure', async (c) => {
  try {
    const body = await c.req.json<{ token: string | null; chatId: string | null }>();
    console.log('[server] Telegram reconfigure request:', {
      hasToken: !!body.token,
      chatId: body.chatId || 'none',
    });

    const result = await telegram.reconfigure(body.token, body.chatId);
    if (result.success) {
      return c.json({
        success: true,
        botName: result.botName,
        status: telegram.getStatus(),
      });
    } else {
      return c.json({ success: false, error: result.error }, 400);
    }
  } catch (error) {
    console.error('[server] Telegram reconfigure error:', error);
    return c.json({ error: 'Failed to reconfigure' }, 500);
  }
});

app.post('/api/telegram/validate', async (c) => {
  try {
    const body = await c.req.json<{ token: string }>();
    const result = await telegram.validateToken(body.token);
    return c.json(result);
  } catch (error) {
    return c.json({ valid: false, error: 'Validation failed' }, 500);
  }
});

app.post('/api/telegram/test-message', async (c) => {
  try {
    const body = await c.req.json<{ chatId: string }>();
    const result = await telegram.sendTestMessage(body.chatId);
    return c.json(result);
  } catch (error) {
    return c.json({ ok: false, error: 'Test message failed' }, 500);
  }
});

app.post('/api/telegram/start', async (c) => {
  const started = await telegram.startPolling();
  return c.json({ success: started, polling: telegram.isPollingActive() });
});

app.post('/api/telegram/stop', async (c) => {
  telegram.stopPolling();
  return c.json({ success: true, polling: false });
});

app.get('/api/telegram/test', async (c) => {
  const result = await telegram.testConnection();
  return c.json(result);
});

app.post('/api/telegram/setup', async (c) => {
  console.log('[server] Telegram setup requested');
  const status = telegram.getStatus();
  return c.json({
    telegram_response: {
      ok: status.configured,
      description: status.configured
        ? 'Bot is configured. Use /start, /stop endpoints to control polling.'
        : 'Bot not configured. Use /api/telegram/configure first.',
    },
  });
});

// ==================== TELEGRAM INITIALIZATION ====================

telegram.setBookingHandledCallback(async (bookingId: number, handledBy: string) => {
  const bookings = await readJsonFile<Booking[]>('bookings.json', []);
  const booking = bookings.find(b => b.id === bookingId);

  if (booking) {
    booking.status = 'handled';
    await writeJsonFile('bookings.json', bookings);
    console.log(`[server] Booking ${bookingId} marked as handled by ${handledBy}`);
  }
});

async function initTelegram() {
  try {
    const settings = await readJsonFile<BookingSettings[]>('booking_settings.json', []);
    const mainSettings = settings.find(s => s.location_slug === 'all') || settings[0];

    if (mainSettings?.telegram_bot_token) {
      console.log('[server] Found Telegram settings, initializing...');
      const result = await telegram.reconfigure(
        mainSettings.telegram_bot_token,
        mainSettings.telegram_chat_id || null
      );
      if (result.success) {
        console.log(`[server] Telegram bot started: @${result.botName}`);
        if (mainSettings.telegram_chat_id) {
          console.log(`[server] Telegram notifications target: ${mainSettings.telegram_chat_id}`);
        } else {
          console.log('[server] Telegram group chat not configured - notifications will not be sent');
        }
      } else {
        console.log('[server] Telegram bot token invalid:', result.error);
      }
    } else {
      console.log('[server] Telegram bot not configured (no token in settings)');
    }
  } catch (error) {
    console.error('[server] Failed to init Telegram:', error);
  }
}

// ==================== STATIC FILE SERVING HELPER ====================

function getMimeType(filepath: string): string {
  const ext = extname(filepath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

async function serveStaticFile(res: http.ServerResponse, filepath: string): Promise<boolean> {
  try {
    await access(filepath, constants.R_OK);
    const stat = statSync(filepath);
    if (!stat.isFile()) return false;

    res.setHeader('Content-Type', getMimeType(filepath));
    res.setHeader('Content-Length', stat.size);
    createReadStream(filepath).pipe(res);
    return true;
  } catch {
    return false;
  }
}

// ==================== MAIN SERVER ====================

async function createServer() {
  console.log(`[server] Starting in ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'} mode...`);

  // Initialize Vite
  let vite: ViteDevServer | PreviewServer;

  if (isDev) {
    // Development: Vite dev server with HMR
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    console.log('[server] Vite dev server initialized (middleware mode)');
  } else {
    // Production: Vite preview server for static files
    vite = await createPreviewServer({
      preview: {
        port: 0, // Don't listen on any port - we use middlewares only
      },
    });
    console.log('[server] Vite preview server initialized');
  }

  // Create HTTP server
  const server = http.createServer(async (req, res) => {
    const url = req.url || '/';
    const pathname = new URL(url, `http://localhost:${PORT}`).pathname;

    try {
      // ===== API ROUTES → Hono =====
      if (pathname.startsWith('/api/')) {
        return getRequestListener(app.fetch)(req, res);
      }

      // ===== STORAGE ROUTES (uploads, data) =====
      if (pathname.startsWith('/uploads/') || pathname.startsWith('/data/')) {
        const storagePath = join(STORAGE_PATH, pathname);
        const served = await serveStaticFile(res, storagePath);
        if (served) return;
        // Fall through to 404
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }

      // ===== STATIC FILES → Vite middlewares =====
      // Files with extensions (.js, .css, .png, etc.) or Vite internals
      const hasExtension = /\.[a-zA-Z0-9]+$/.test(pathname);
      const isViteInternal = pathname.startsWith('/@') || pathname.startsWith('/node_modules/') || pathname.startsWith('/src/');

      if (hasExtension || isViteInternal) {
        vite.middlewares(req, res, () => {
          res.statusCode = 404;
          res.end('Not Found');
        });
        return;
      }

      // ===== HTML ROUTES (SPA fallback) =====
      // Only SPA routes (no extension) that accept HTML
      if (isHtmlRequest(req)) {
        try {
          // Read HTML template
          const htmlPath = isDev
            ? join(__dirname, '../index.html')
            : join(__dirname, '../dist/index.html');

          let html = await readFile(htmlPath, 'utf8');

          // Inject meta tags only for public pages (not admin, not static assets)
          if (!shouldSkipMetaInjection(pathname)) {
            html = await injectMeta(html, pathname);
          }

          // In dev mode, transform with Vite (adds HMR scripts, etc.)
          // Always use '/' as the URL since this is an SPA - all routes serve index.html
          if (isDev && 'transformIndexHtml' in vite) {
            html = await vite.transformIndexHtml('/', html);
          }

          res.setHeader('Content-Type', 'text/html');
          res.end(html);
          return;
        } catch (error) {
          console.error('[server] HTML serving error:', error);
          // Fall through to Vite middlewares
        }
      }

      // ===== FALLBACK: 404 for unmatched routes =====
      res.statusCode = 404;
      res.end('Not Found');
    } catch (error) {
      console.error('[server] Request error:', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Start listening
  server.listen(PORT, async () => {
    console.log(`[server] Server running on http://localhost:${PORT}`);
    console.log(`[server] Mode: ${isDev ? 'development' : 'production'}`);
    console.log(`[server] Data file: ${DATA_PATH}`);
    console.log(`[server] Uploads: ${UPLOADS_PATH}`);

    if (isDev) {
      console.log('[server] HMR enabled via Vite dev server');
    }

    console.log('[server] API Endpoints:');
    console.log('  GET  /api/data');
    console.log('  POST /api/data');
    console.log('  POST /api/upload');
    console.log('  POST /api/bookings');
    console.log('  GET  /api/bookings');
    console.log('  PUT  /api/bookings/:id/status');
    console.log('  GET  /api/booking-settings');
    console.log('  PUT  /api/booking-settings/:id');
    console.log('  GET  /api/telegram/status');
    console.log('  POST /api/telegram/configure');
    console.log('  POST /api/telegram/reconfigure');
    console.log('  POST /api/telegram/test-message');

    // Initialize Telegram after server starts
    await initTelegram();
  });
}

// Start the server
createServer().catch((error) => {
  console.error('[server] Failed to start:', error);
  process.exit(1);
});
