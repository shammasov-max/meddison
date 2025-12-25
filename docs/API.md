# Medisson Lounge - API & Services Documentation

## Overview

The application uses a service layer pattern with JSON file storage. Services support both local JSON files and remote API endpoints (currently configured for local mode).

## Services

### Content Service

**File**: `src/services/contentService.ts`
**Data Source**: `/data/content.json`

#### Methods

```typescript
// Get all content sections
contentService.getAll(): Promise<ContentData>

// Save content (disabled in local mode)
contentService.save(data: Partial<ContentData>): Promise<boolean>

// Get specific section
contentService.getSection(section: keyof ContentData): Promise<SectionData>
```

#### Content Structure

```typescript
interface ContentData {
  hero: {
    title: string;
    slogan: string;
    description: string;
  };
  about: {
    title: string;
    description1: string;
    description2: string;
    stats: Array<{ value: string; label: string; description: string }>;
  };
  advantages: {
    title: string;
    subtitle: string;
    items: Array<{ id: number; title: string; description: string }>;
  };
  atmosphere: {
    title: string;
    subtitle: string;
    items: Array<{ id: number; title: string; description: string }>;
  };
  menuCategories: Array<{
    id: string;
    title: string;
    subtitle: string;
    description: string;
  }>;
  contact: {
    phone: string;
    address: string;
    email: string;
    socials: Record<string, string>;
  };
  seo: {
    home: { title: string; description: string };
  };
}
```

---

### Locations Service

**File**: `src/services/locationsService.ts`
**Data Source**: `/data/locations.json`

#### Methods

```typescript
// Get all locations
locationsService.getAll(): Promise<LocationItem[]>

// Get location by ID or slug
locationsService.getById(idOrSlug: string | number): Promise<LocationItem | undefined>

// Save location (disabled in local mode)
locationsService.save(item: Partial<LocationItem>): Promise<LocationItem | null>
```

#### Location Interface

```typescript
interface LocationItem {
  id: number;
  slug: string;                    // URL-friendly identifier
  name: string;                    // Display name
  description: string;             // Short description
  fullDescription: string;         // Detailed description
  image: string;                   // Main image path
  imageUrl?: string;               // Alternative image URL
  address: string;                 // Physical address
  phone: string;                   // Contact phone
  hours: string;                   // Working hours
  menuLink: string;                // External menu URL
  gallery: string[];               // Gallery image paths
  galleryUrls?: string[];          // Alternative gallery URLs
  features: LocationFeature[];     // Features list
  comingSoon?: boolean;            // Coming soon flag
  sortOrder?: number;              // Display order
  coordinates?: string;            // Geo coordinates
  socialLinks?: LocationSocialLinks; // Social media links
}

interface LocationFeature {
  icon: string;   // Lucide icon name
  title: string;  // Feature title
  desc: string;   // Feature description
}

interface LocationSocialLinks {
  telegram?: string;
  instagram?: string;
  whatsapp?: string;
  tiktok?: string;
  youtube?: string;
}
```

---

### News Service

**File**: `src/services/newsService.ts`
**Data Source**: `/data/news.json`

#### Methods

```typescript
// Get all news articles
newsService.getAll(): Promise<NewsItem[]>

// Get news by ID or slug
newsService.getById(idOrSlug: number | string): Promise<NewsItem | undefined>

// Save news article (disabled in local mode)
newsService.save(item: Omit<NewsItem, 'id'> & { id?: number }): Promise<NewsItem | null>
```

#### News Interface

```typescript
interface NewsItem {
  id: number;
  slug?: string;              // URL-friendly identifier
  title: string;              // Article title
  date: string;               // Publication date
  category: string;           // Category (Мероприятия, Акции, Меню)
  image: string;              // Cover image path
  imageUrl?: string;          // Alternative image URL
  description: string;        // Short description
  fullContent?: string;       // Full HTML content
  location: string;           // Associated location
  metaTitle?: string;         // SEO title
  metaDescription?: string;   // SEO description
}
```

---

## Hooks

### useContent

**File**: `src/hooks/useContent.ts`

Reactive hook for content loading with automatic updates.

```typescript
const content = useContent();
// Returns ContentData with all sections

// Content updates when 'content-updated' event fires
window.dispatchEvent(new Event('content-updated'));
```

---

## Data Files

### content.json

```json
{
  "hero": { "title": "...", "slogan": "...", "description": "..." },
  "about": { "title": "...", "description1": "...", "description2": "...", "stats": [...] },
  "advantages": { "title": "...", "subtitle": "...", "items": [...] },
  "atmosphere": { "title": "...", "subtitle": "...", "items": [...] },
  "menuCategories": [...],
  "contact": { "phone": "...", "address": "...", "email": "...", "socials": {...} },
  "seo": { "home": { "title": "...", "description": "..." } }
}
```

### locations.json

```json
[
  {
    "id": 1,
    "slug": "butovo",
    "name": "Medisson Бутово",
    "description": "...",
    "fullDescription": "...",
    "image": "/assets/locations/butovo-main-new.png",
    "address": "Москва, ул. Поляны, 8",
    "phone": "+7 (968) 968-00-02",
    "hours": "11:00 - 05:00",
    "menuLink": "#",
    "gallery": [...],
    "features": [...],
    "comingSoon": false,
    "sortOrder": 1,
    "coordinates": "55.542834,37.520177",
    "socialLinks": {...}
  }
]
```

### news.json

```json
[
  {
    "id": 1,
    "slug": "grand-opening-ramenki",
    "title": "Торжественное открытие...",
    "date": "07.12.2025",
    "category": "Мероприятия",
    "image": "/assets/images/news-ramenki-opening.png",
    "description": "...",
    "fullContent": "<p>...</p>",
    "location": "Medisson Select",
    "metaTitle": "...",
    "metaDescription": "..."
  }
]
```

---

## API Proxy Configuration

**File**: `vite.config.ts`

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

When `USE_LOCAL_DATA = false`, services will use `/api/*` endpoints proxied to the backend server.

---

## Error Handling

All services implement:

1. **Logging** - Console logging with service prefix
2. **Fallback Data** - Static data used when API fails
3. **Graceful Degradation** - App continues with fallback content

```typescript
try {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch');
  return await res.json();
} catch (error) {
  console.error('[service] Error:', error);
  return FALLBACK_DATA;
}
```
