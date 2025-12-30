import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage } from 'node:http';

// Define __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

// ==================== TYPE DEFINITIONS ====================

interface MetaData {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: string;
}

interface RouteMatch {
  type: 'home' | 'news-list' | 'news-detail' | 'location' | 'privacy' | 'loyalty' | 'not-found';
  slug?: string;
}

interface SiteData {
  seo: {
    home: { title: string; description: string };
    news: { title: string; description: string };
    locations: { title: string; description: string };
    privacy?: { title: string; description: string };
    loyalty?: { title: string; description: string };
  };
  locations: Array<{
    slug: string;
    name: string;
    description: string;
    image?: string;
  }>;
  news: Array<{
    slug: string;
    title: string;
    metaTitle?: string;
    metaDescription?: string;
    description: string;
    image?: string;
    date: string;
  }>;
}

// ==================== CONSTANTS ====================

const BASE_URL = 'https://medisson-lounge.ru';

// Cache for data.json to avoid reading file on every request
let dataCache: SiteData | null = null;
let dataCacheTime = 0;
const CACHE_TTL = 5000; // 5 seconds cache

// ==================== ROUTE PARSING ====================

/**
 * Parse URL pathname and determine route type
 */
function parseRoute(pathname: string): RouteMatch {
  // Normalize path (remove trailing slash)
  const path = pathname.replace(/\/$/, '') || '/';

  // Home page
  if (path === '/' || path === '') {
    return { type: 'home' };
  }

  // News listing
  if (path === '/news') {
    return { type: 'news-list' };
  }

  // News article detail
  const newsMatch = path.match(/^\/news\/([^\/]+)$/);
  if (newsMatch) {
    return { type: 'news-detail', slug: newsMatch[1] };
  }

  // Location detail
  const locationMatch = path.match(/^\/locations\/([^\/]+)$/);
  if (locationMatch) {
    return { type: 'location', slug: locationMatch[1] };
  }

  // Static pages
  if (path === '/privacy') return { type: 'privacy' };
  if (path === '/loyalty') return { type: 'loyalty' };

  return { type: 'not-found' };
}

/**
 * Determine if meta injection should be skipped for this path
 */
export function shouldSkipMetaInjection(pathname: string): boolean {
  return (
    pathname.startsWith('/api') ||      // API endpoints
    pathname.startsWith('/assets') ||   // Static assets
    pathname.startsWith('/uploads') ||  // Uploaded files
    pathname.startsWith('/data') ||     // Data files
    pathname.startsWith('/admin') ||    // Admin panel
    pathname.startsWith('/@') ||        // Vite internals
    pathname.startsWith('/src') ||      // Source files in dev
    pathname.startsWith('/node_modules') || // Node modules
    pathname.includes('.')              // Files with extensions (.js, .css, etc.)
  );
}

/**
 * Check if request is for HTML content (browser or bot)
 */
export function isHtmlRequest(req: IncomingMessage): boolean {
  const acceptHeader = req.headers['accept'] || '';
  const userAgent = req.headers['user-agent'] || '';

  return (
    acceptHeader.includes('text/html') ||
    acceptHeader.includes('*/*') ||
    userAgent.toLowerCase().includes('bot') ||
    userAgent.toLowerCase().includes('facebook') ||
    userAgent.toLowerCase().includes('telegram') ||
    userAgent.toLowerCase().includes('whatsapp') ||
    userAgent.toLowerCase().includes('twitter') ||
    userAgent.toLowerCase().includes('slack') ||
    userAgent.toLowerCase().includes('discord')
  );
}

// ==================== DATA LOADING ====================

/**
 * Load site data from data.json with caching
 */
async function loadSiteData(): Promise<SiteData> {
  const now = Date.now();

  // Return cached data if fresh
  if (dataCache && (now - dataCacheTime) < CACHE_TTL) {
    return dataCache;
  }

  // Load from file (storage/ directory - dynamic content outside Vite's scope)
  const dataPath = join(__dirname, '../storage/data/data.json');
  const data = await readFile(dataPath, 'utf8');
  dataCache = JSON.parse(data);
  dataCacheTime = now;

  return dataCache!;
}

// ==================== METADATA EXTRACTION ====================

/**
 * Get appropriate metadata for the current route
 * Reads SEO data from data.json (updated by admin panel)
 */
async function getMetadataForRoute(pathname: string, data: SiteData): Promise<MetaData> {
  const route = parseRoute(pathname);

  switch (route.type) {
    case 'home':
      return {
        title: data.seo.home.title,
        description: data.seo.home.description,
        image: `${BASE_URL}/assets/images/og-image.jpg`,
        url: `${BASE_URL}/`,
        type: 'website'
      };

    case 'news-list':
      return {
        title: data.seo.news.title,
        description: data.seo.news.description,
        image: `${BASE_URL}/assets/images/og-image.jpg`,
        url: `${BASE_URL}/news`,
        type: 'website'
      };

    case 'news-detail':
      const article = data.news.find(n => n.slug === route.slug);
      if (!article) return getNotFoundMeta(pathname);

      return {
        title: article.metaTitle || article.title,
        description: article.metaDescription || article.description,
        image: article.image
          ? (article.image.startsWith('http') ? article.image : `${BASE_URL}${article.image}`)
          : `${BASE_URL}/assets/images/og-image.jpg`,
        url: `${BASE_URL}/news/${article.slug}`,
        type: 'article'
      };

    case 'location':
      const location = data.locations.find(l => l.slug === route.slug);
      if (!location) return getNotFoundMeta(pathname);

      return {
        title: `${location.name} | Medisson Lounge`,
        description: location.description,
        image: location.image
          ? (location.image.startsWith('http') ? location.image : `${BASE_URL}${location.image}`)
          : `${BASE_URL}/assets/images/og-image.jpg`,
        url: `${BASE_URL}/locations/${location.slug}`,
        type: 'place'
      };

    case 'privacy':
      return {
        title: data.seo.privacy?.title || 'Политика конфиденциальности | Medisson Lounge',
        description: data.seo.privacy?.description || 'Политика конфиденциальности и обработки персональных данных Medisson Lounge',
        image: `${BASE_URL}/assets/images/og-image.jpg`,
        url: `${BASE_URL}/privacy`,
        type: 'website'
      };

    case 'loyalty':
      return {
        title: data.seo.loyalty?.title || 'Программа лояльности | Medisson Lounge',
        description: data.seo.loyalty?.description || 'Присоединяйтесь к программе лояльности Medisson Lounge и получайте эксклюзивные привилегии',
        image: `${BASE_URL}/assets/images/og-image.jpg`,
        url: `${BASE_URL}/loyalty`,
        type: 'website'
      };

    default:
      return getNotFoundMeta(pathname);
  }
}

/**
 * Generate 404 metadata
 */
function getNotFoundMeta(pathname: string): MetaData {
  return {
    title: 'Страница не найдена | Medisson Lounge',
    description: 'Запрашиваемая страница не найдена',
    image: `${BASE_URL}/assets/images/og-image.jpg`,
    url: `${BASE_URL}${pathname}`,
    type: 'website'
  };
}

// ==================== HTML INJECTION ====================

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Inject meta tags into HTML
 */
function injectMetaTags(html: string, meta: MetaData): string {
  let result = html;

  // Replace title
  result = result.replace(
    /<title>.*?<\/title>/,
    `<title>${escapeHtml(meta.title)}</title>`
  );

  // Replace description
  result = result.replace(
    /<meta name="description" content=".*?" \/>/,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`
  );

  // Replace canonical URL
  result = result.replace(
    /<link rel="canonical" href=".*?" \/>/,
    `<link rel="canonical" href="${escapeHtml(meta.url)}" />`
  );

  // Open Graph tags
  result = result.replace(
    /<meta property="og:type" content=".*?" \/>/,
    `<meta property="og:type" content="${escapeHtml(meta.type || 'website')}" />`
  );

  result = result.replace(
    /<meta property="og:url" content=".*?" \/>/,
    `<meta property="og:url" content="${escapeHtml(meta.url)}" />`
  );

  result = result.replace(
    /<meta property="og:title" content=".*?" \/>/,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`
  );

  result = result.replace(
    /<meta property="og:description" content=".*?" \/>/,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`
  );

  if (meta.image) {
    result = result.replace(
      /<meta property="og:image" content=".*?" \/>/,
      `<meta property="og:image" content="${escapeHtml(meta.image)}" />`
    );
  }

  // Twitter Card tags
  result = result.replace(
    /<meta name="twitter:title" content=".*?" \/>/,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`
  );

  result = result.replace(
    /<meta name="twitter:description" content=".*?" \/>/,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`
  );

  if (meta.image) {
    result = result.replace(
      /<meta name="twitter:image" content=".*?" \/>/,
      `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`
    );
  }

  return result;
}

// ==================== MAIN EXPORT ====================

/**
 * Inject meta tags into HTML based on pathname
 * @param html - The HTML content to inject meta tags into
 * @param pathname - The URL pathname to determine which meta tags to use
 * @returns HTML with injected meta tags
 */
export async function injectMeta(html: string, pathname: string): Promise<string> {
  try {
    const data = await loadSiteData();
    const meta = await getMetadataForRoute(pathname, data);
    const injectedHtml = injectMetaTags(html, meta);
    console.log(`[meta-injection] ${pathname} → ${meta.title}`);
    return injectedHtml;
  } catch (error) {
    console.error('[meta-injection] Error:', error);
    return html; // Return original HTML on error
  }
}

/**
 * Clear data cache (useful for testing or after data.json updates)
 */
export function clearMetaCache() {
  dataCache = null;
  dataCacheTime = 0;
}
