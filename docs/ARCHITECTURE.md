# Medisson Lounge - Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React SPA)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Pages      │  │  Components  │  │     Services         │   │
│  ├──────────────┤  ├──────────────┤  ├──────────────────────┤   │
│  │ Home         │  │ layout/      │  │ contentService.ts    │   │
│  │ LocationPage │  │ home/        │  │ locationsService.ts  │   │
│  │ NewsPage     │  │ ui/          │  │ newsService.ts       │   │
│  │ LoyaltyPage  │  │ loyalty/     │  │                      │   │
│  │ Admin/*      │  │ admin/       │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                         HOOKS & STATE                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ useContent() - Reactive content with event-based updates│    │
│  │ React Router - Client-side routing                      │    │
│  │ React Helmet - SEO meta tags management                 │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────────┐     │
│  │ public/data/*.json  │    │ src/data/content.ts         │     │
│  │ (Runtime data)      │    │ (Compile-time fallback)     │     │
│  ├─────────────────────┤    └─────────────────────────────┘     │
│  │ content.json        │                                        │
│  │ locations.json      │    API Proxy: /api → localhost:3000   │
│  │ news.json           │    (Currently using static JSON)      │
│  └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Page Components

| Component | Route | Responsibility |
|-----------|-------|----------------|
| `Home` | `/` | Main landing page, orchestrates all home sections |
| `LocationPage` | `/lounge/:slug` | Dynamic location detail with gallery, features |
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

### Content Loading Pattern

```typescript
// 1. Hook subscribes to content updates
const content = useContent();

// 2. Service fetches from JSON or API
const data = await contentService.getAll();

// 3. Events trigger re-fetches
window.dispatchEvent(new Event('content-updated'));
```

### Service Pattern

All services follow the same pattern:

```typescript
export const service = {
  getAll: async () => {
    // Fetch from API_URL
    // Fallback to FALLBACK_DATA on error
  },

  getById: async (id) => {
    // Fetch single item
    // Fallback to static data
  },

  save: async (item) => {
    // PATCH to API (disabled in USE_LOCAL_DATA mode)
    // Returns null if local-only
  }
};
```

## TypeScript Interfaces

### Location

```typescript
interface LocationItem {
  id: number;
  slug: string;
  name: string;
  description: string;
  fullDescription: string;
  image: string;
  imageUrl?: string;
  address: string;
  phone: string;
  hours: string;
  menuLink: string;
  gallery: string[];
  galleryUrls?: string[];
  features: LocationFeature[];
  comingSoon?: boolean;
  sortOrder?: number;
  coordinates?: string;
  socialLinks?: LocationSocialLinks;
}
```

### News

```typescript
interface NewsItem {
  id: number;
  slug?: string;
  title: string;
  date: string;
  category: string;
  image: string;
  imageUrl?: string;
  description: string;
  fullContent?: string;
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
/lounge/:slug         → LocationPage (lazy loaded)
/loyalty              → LoyaltyPage (lazy loaded)
/privacy              → PrivacyPolicy (lazy loaded)
```

### Legacy Redirects

```
/butovo  → /lounge/butovo
/select  → /lounge/select
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
# Starts Vite dev server at http://127.0.0.1:5173
# API proxy: /api → http://localhost:3000
```

### Production Build

```bash
npm run build
# Output: dist/
# Generates sourcemaps
```

### Key Build Features

- Code splitting via lazy loading
- Tree shaking
- CSS purging (Tailwind)
- Asset optimization

## SEO Implementation

### Meta Tags

- `react-helmet-async` for dynamic meta tags
- Open Graph and Twitter Card support
- Canonical URLs for each page

### Structured Data

- `JsonLdInjector` component injects JSON-LD
- Organization, LocalBusiness schemas

### Performance

- Lazy loading for all pages
- `lazyRetry` utility for failed chunk recovery
- Preloader component for smooth transitions
