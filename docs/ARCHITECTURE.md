# Medisson Lounge - Architecture Documentation

**Version**: 3.0.0
**Updated**: 2025-12-30

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React SPA)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Pages      │  │  Components  │  │     Services         │   │
│  ├──────────────┤  ├──────────────┤  ├──────────────────────┤   │
│  │ Home         │  │ layout/      │  │ dataService.ts       │   │
│  │ LocationPage │  │ home/        │  │ (Unified data layer) │   │
│  │ NewsPage     │  │ ui/          │  │                      │   │
│  │ LoyaltyPage  │  │ loyalty/     │  │                      │   │
│  │ Admin/*      │  │ admin/       │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                         HOOKS & STATE                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ useData() - Reactive content with event-based updates   │    │
│  │ React Router - Client-side routing                      │    │
│  │ react-helmet-async - SEO meta tags management           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER (Hono + Vite)                      │
├─────────────────────────────────────────────────────────────────┤
│  Entry: server/index.ts (unified dev/prod)                       │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Hono API        │  │ Meta Injection  │  │ Vite Middleware │  │
│  │ /api/*          │  │ SSR SEO tags    │  │ Assets & HMR    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                         DATA LAYER                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ storage/data/data.json - Unified runtime data            │    │
│  │ storage/uploads/       - User uploaded files             │    │
│  │ public/assets/         - Static assets (images, fonts)   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Server Architecture

### Single Entry Point

```bash
tsx server/index.ts  # Handles both dev and production
```

### Development Mode (`npm run dev`)
- Vite runs in middleware mode with HMR
- `vite.transformIndexHtml()` injects HMR scripts
- Source files transformed on-the-fly

### Production Mode (`npm start`)
- Vite preview server serves dist/
- Pre-built, minified assets
- Meta injection still active

See [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) for detailed server documentation.

## Component Architecture

### Page Components

| Component | Route | Responsibility |
|-----------|-------|----------------|
| `Home` | `/` | Main landing page, orchestrates all home sections |
| `LocationPage` | `/locations/:slug` | Dynamic location detail with gallery, features |
| `NewsPage` | `/news` | News listing with filtering |
| `NewsDetailPage` | `/news/:slug` | Individual news article with SEO |
| `LoyaltyPage` | `/loyalty` | Loyalty program information |
| `PrivacyPolicy` | `/privacy` | Privacy policy static page |

### Admin Components

| Component | Route | Responsibility |
|-----------|-------|----------------|
| `AdminDashboard` | `/admin/dashboard` | Overview and statistics |
| `AdminLocations` | `/admin/locations` | CRUD for locations |
| `AdminNews` | `/admin/news` | CRUD for news articles |
| `AdminContent` | `/admin/content` | Edit site content sections |
| `AdminSEO` | `/admin/seo` | SEO meta tags configuration |
| `AdminBookingSettings` | `/admin/booking-settings` | Booking form settings |

### Component Hierarchy

```
App
├── TrackingScripts (analytics)
├── Suspense (lazy loading)
└── Routes
    ├── Home
    │   ├── Navbar
    │   ├── Hero
    │   ├── About
    │   ├── Advantages
    │   ├── MenuCategories
    │   ├── Locations
    │   ├── Atmosphere
    │   ├── Footer
    │   └── BookingModal
    │
    ├── LocationPage
    │   ├── Navbar
    │   ├── Location details
    │   ├── Gallery
    │   ├── Features grid
    │   └── Footer
    │
    ├── NewsPage / NewsDetailPage
    │   ├── Navbar
    │   ├── News list/detail
    │   └── Footer
    │
    └── Admin (Protected)
        └── AdminLayout
            ├── Sidebar navigation
            └── Outlet (child routes)
```

## Data Flow

### Unified Data Service

```typescript
// src/services/dataService.ts - Single source of truth
import { dataService } from './services/dataService';

// Async operations
await dataService.load();           // Load from API (fallback to static)
await dataService.save(newData);    // Save to backend

// Sync operations (cached data)
const data = dataService.getData();
const location = dataService.getLocation('butovo');
const newsItem = dataService.getNewsItem('article-slug');
```

### Data Hook Pattern

```typescript
// React components use the useData() hook
const { data, loading, hero, about, locations, news } = useData();

// Hook subscribes to 'data-updated' events for real-time updates
```

### Event System

```
Admin Save Action
      │
      ▼
dataService.save(newData)
      │
      ▼
POST /api/data
      │
      ▼
Update cache → window.dispatchEvent('data-updated')
      │
      ▼
All useData() instances re-render
```

## TypeScript Interfaces

All types defined in `src/types/index.ts`:

### Location

```typescript
interface Location {
  id: number;
  slug: string;
  name: string;
  description: string;
  fullDescription: string;
  image: string;
  gallery: string[];
  address: string;
  phone: string;
  hours: string;
  menuLink: string;
  features: Feature[];
  socialLinks: SocialLinks;
  coordinates: string;
  comingSoon: boolean;
  sortOrder: number;
}
```

### NewsItem

```typescript
interface NewsItem {
  id: number;
  slug: string;
  title: string;
  date: string;
  category: string;
  image: string;
  description: string;
  fullContent: string;
  location: string;
  metaTitle?: string;
  metaDescription?: string;
}
```

## Routing Architecture

### Public Routes

```
/                     → Home (lazy loaded)
/news                 → NewsPage (lazy loaded)
/news/:slug           → NewsDetailPage (lazy loaded)
/locations/:slug      → LocationPage (lazy loaded)
/loyalty              → LoyaltyPage (lazy loaded)
/privacy              → PrivacyPolicy (lazy loaded)
```

### Legacy Redirects

```
/butovo  → /locations/butovo
/select  → /locations/select
```

### Admin Routes (Protected)

```
/admin/login          → AdminLogin
/admin                → Redirect to /admin/dashboard
/admin/dashboard      → AdminDashboard
/admin/locations      → AdminLocations
/admin/news           → AdminNews
/admin/content        → AdminContent
/admin/seo            → AdminSEO
/admin/booking-settings → AdminBookingSettings
```

## Build & Deployment

### Development

```bash
npm run dev
# Starts unified server at http://localhost:3001
# HMR enabled via Vite middleware mode
```

### Production Build

```bash
npm run build     # Build to dist/
npm start         # Run production server
npm run preview   # Build + start
```

### Key Build Features

- Code splitting via lazy loading
- Tree shaking
- CSS purging (Tailwind)
- Asset optimization
- Sourcemaps

## SEO Implementation

### Server-Side Meta Injection

- `server/meta-injection.ts` injects tags before HTML sent to browser
- Works for all public routes
- Supports Open Graph and Twitter Cards

### Client-Side

- `react-helmet-async` for dynamic updates
- `JsonLdInjector` for structured data (JSON-LD)
- Organization and LocalBusiness schemas

## Related Documentation

- [PROJECT_INDEX.md](../PROJECT_INDEX.md) - Project structure overview
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) - Detailed server/deployment docs
- [ROUTE_DATA_QUICK_REF.md](./ROUTE_DATA_QUICK_REF.md) - Route-data mapping
