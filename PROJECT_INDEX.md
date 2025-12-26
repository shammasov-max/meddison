# Project Index: Medisson Lounge

Generated: 2025-12-26

## Overview

Premium lounge bar website for **Medisson Lounge** chain in Moscow. React 18 SPA with Vite 7, TypeScript, and Tailwind CSS.

- **Domain**: medisson-lounge.ru
- **Locale**: Russian (ru_RU)
- **Locations**: 2 (Butovo active, Select Ramenki coming soon)

---

## Project Structure

```
meddison/
├── src/
│   ├── components/         # UI components by feature
│   │   ├── admin/          # Admin panel (AdminLayout, TelegramChat)
│   │   ├── home/           # Homepage sections
│   │   ├── layout/         # Navbar, Footer
│   │   ├── loyalty/        # Loyalty program
│   │   └── ui/             # Reusable UI components
│   ├── pages/              # Page components
│   │   └── admin/          # Admin pages
│   ├── services/           # Data service (unified)
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript interfaces
│   └── utils/              # Utilities
├── server/                 # Backend API
├── public/data/            # Runtime JSON data
├── tests/                  # Test files
└── docs/                   # Documentation
```

---

## Entry Points

| Type | Path | Description |
|------|------|-------------|
| App Entry | `src/main.tsx` | React bootstrap with Router, Helmet, ErrorBoundary |
| Routes | `src/App.tsx` | All route definitions (public + admin) |
| HTML | `index.html` | Root HTML with SEO meta tags |
| Vite Config | `vite.config.ts` | Build config, API proxy |
| Backend | `server/index.ts` | Data API server (port 3001) |

---

## Core Modules

### Pages

**Public Pages (6)**:
| File | Route | Description |
|------|-------|-------------|
| `Home.tsx` | `/` | Main landing page |
| `LocationPage.tsx` | `/lounge/:slug` | Dynamic location detail |
| `NewsPage.tsx` | `/news` | News listing |
| `NewsDetailPage.tsx` | `/news/:slug` | News article detail |
| `LoyaltyPage.tsx` | `/loyalty` | Loyalty program |
| `PrivacyPolicy.tsx` | `/privacy` | Privacy policy |

**Admin Pages (6)**:
| File | Route | Description |
|------|-------|-------------|
| `AdminDashboard.tsx` | `/admin/dashboard` | Overview dashboard |
| `AdminLocations.tsx` | `/admin/locations` | Manage locations |
| `AdminNews.tsx` | `/admin/news` | Manage news articles |
| `AdminContent.tsx` | `/admin/content` | Edit site content |
| `AdminSEO.tsx` | `/admin/seo` | SEO settings |
| `AdminBookingSettings.tsx` | `/admin/booking-settings` | Booking config |

### Components

| Module | Components |
|--------|------------|
| `home/*` | Hero, About, Advantages, Atmosphere, Locations, MenuCategories, BookingCTA |
| `layout/*` | Navbar, Footer |
| `ui/*` | BookingModal, GlowButton, Preloader, ErrorBoundary, ImageUpload, TrackingScripts, JsonLdInjector, BookingSuccess |
| `loyalty/*` | LoyaltyIntro, LoyaltyLevels, LoyaltyCTA |
| `admin/*` | AdminLayout, TelegramChat |

---

## Data Layer

### Unified Architecture

| Component | Path | Description |
|-----------|------|-------------|
| Data File | `public/data/data.json` | Single source of all content |
| Service | `src/services/dataService.ts` | Unified data operations |
| Types | `src/types/index.ts` | All TypeScript interfaces |

### dataService API

```typescript
// Async methods
load(forceRefresh?): Promise<SiteContent>  // Load data (API → static fallback)
save(data): Promise<boolean>               // Save to backend API

// Sync methods (use after load)
getData(): SiteContent | null              // Get cached data
getLocation(slug): Location | undefined    // Get location by slug
getNewsItem(slug): NewsItem | undefined    // Get news by slug
```

### Data Structure (SiteContent)

```typescript
interface SiteContent {
  hero: HeroContent;
  about: AboutContent;
  advantages: AdvantagesContent;
  atmosphere: AtmosphereContent;
  menuCategories: MenuCategory[];
  contact: ContactInfo;
  seo: SEOConfig;
  locations: Location[];
  news: NewsItem[];
}
```

---

## Hooks

| Hook | Purpose |
|------|---------|
| `useData.ts` | Reactive data loading with event-based updates |
| `useEnterSave.ts` | Ctrl+Enter keyboard shortcut for admin save actions |

---

## Backend API

**File**: `server/index.ts`
**Port**: 3001

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/data` | None | Read data.json |
| POST | `/api/data` | Basic Auth | Write data.json (creates backup) |

**Auth**: `admin:medisson2024` (Basic Auth header)

---

## Tests

| File | Description |
|------|-------------|
| `tests/data-persistence.test.ts` | Backend API save/load tests |
| `tests/content-updates.test.ts` | Content update validation |
| `tests/routes.test.ts` | Route configuration tests |

**Commands**:
```bash
npm run test:api      # Data persistence tests
npm run test:content  # Content update tests
npm run test:routes   # Route tests
npm run test:all      # All tests
```

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3.1 | UI framework |
| react-router-dom | 6.30.1 | Client-side routing |
| framer-motion | 11.0.8 | Animations |
| lucide-react | 0.533.0 | Icons |
| react-quill | 2.0.0 | Rich text editor (admin) |
| react-helmet-async | 2.0.5 | SEO meta tags |
| date-fns | 4.1.0 | Date formatting |
| vite | 7.0.0 | Build tool |
| tailwindcss | 3.4.17 | CSS framework |
| typescript | 5.8.3 | Type checking |

---

## Quick Start

```bash
# Install dependencies
npm install

# Start frontend dev server (http://127.0.0.1:5173)
npm run dev

# Start backend API server (http://localhost:3001)
npm run server

# Build for production
npm run build

# Run all tests
npm run test:all
```

---

## Routing Summary

### Public Routes
- `/` - Homepage
- `/news` - News listing
- `/news/:slug` - News detail
- `/lounge/:slug` - Location detail
- `/loyalty` - Loyalty program
- `/privacy` - Privacy policy

### Redirects
- `/butovo` → `/lounge/butovo`
- `/select` → `/lounge/select`

### Admin Routes
- `/admin` → `/admin/dashboard` (redirect)
- `/admin/dashboard` - Dashboard
- `/admin/locations` - Manage locations
- `/admin/news` - Manage news
- `/admin/content` - Edit content
- `/admin/seo` - SEO settings
- `/admin/booking-settings` - Booking config

---

## Design System

- **Colors**: Black background, gold accents (`#d4af37` / amber-500)
- **Fonts**: Inter (sans-serif), Playfair Display (serif)
- **Theme**: Premium dark luxury aesthetic
- **Animations**: Framer Motion for page transitions

---

## Documentation

| File | Description |
|------|-------------|
| `CLAUDE.md` | AI assistant context |
| `PROJECT_INDEX.md` | This file |
| `docs/ARCHITECTURE.md` | System architecture |
| `docs/API.md` | Service layer reference |
