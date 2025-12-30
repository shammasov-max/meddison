# Project Index: Medisson Lounge

**Generated**: 2025-12-30
**Version**: 3.0.0
**Purpose**: Fast codebase reference for AI assistants (94% token reduction)

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **Total Source Files** | 48 TypeScript/TSX files |
| **Frontend Components** | 20 components |
| **Page Components** | 12 pages (7 public + 5 admin) |
| **Test Files** | 4 test suites |
| **Backend Services** | 3 services (API + Telegram + Meta Injection) |
| **Data Types** | 14 TypeScript interfaces |
| **Index Size** | ~4KB (vs 60KB full codebase) |

---

## Entry Points

### Application Bootstrap
- **Frontend**: `src/main.tsx` - React 18 app initialization with React Router
- **Routes**: `src/App.tsx` - Route definitions and lazy loading setup
- **Backend Server**: `server/index.ts` - Unified Hono + Vite server (port 3001)
- **Meta Injection**: `server/meta-injection.ts` - Server-side SEO meta tag injection
- **Telegram Bot**: `server/telegram.ts` - Telegram bot integration
- **HTML Template**: `index.html` - SEO meta tags template
- **Build Config**: `vite.config.ts` - Vite 7 configuration

### Key Commands
```bash
npm run dev          # Dev server with Vite HMR (http://localhost:3001)
npm run build        # Production build → dist/
npm run start        # Production server (http://localhost:3001)
npm run preview      # Build + start production server
npm run test:all     # Run all test suites
```

---

## Server Architecture (v3.0)

**Single Entry Point**: `tsx server/index.ts` handles both dev and production modes.

### Request Flow
```
Browser → http://localhost:3001
  ├── /api/* → Hono API handlers
  ├── /uploads/*, /data/* → storage/ directory
  ├── /src/*, /@*, *.js, *.css → Vite middlewares
  └── HTML routes → meta injection → Vite transform (dev) / static serve (prod)
```

### Development Mode (`npm run dev`)
- Vite runs in middleware mode: `createServer({ middlewareMode: true })`
- HMR enabled via `vite.transformIndexHtml()`
- Hot reloading for React components

### Production Mode (`npm run start`)
- Vite preview server serves dist/ folder
- Static assets served efficiently
- Meta injection still active for SEO

---

## Project Structure

```
meddison/
├── src/                          # Frontend source (TypeScript + React)
│   ├── pages/                    # Page components (12 total)
│   │   ├── Home.tsx              # Main landing page
│   │   ├── LocationPage.tsx      # Dynamic location pages (/locations/:slug)
│   │   ├── NewsPage.tsx          # News listing
│   │   ├── NewsDetailPage.tsx    # Individual news article
│   │   ├── LoyaltyPage.tsx       # Loyalty program info
│   │   ├── PrivacyPolicy.tsx     # Privacy policy
│   │   └── admin/                # Admin panel (6 pages)
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminLocations.tsx
│   │       ├── AdminNews.tsx
│   │       ├── AdminContent.tsx
│   │       ├── AdminSEO.tsx
│   │       └── AdminBookingSettings.tsx
│   │
│   ├── components/               # Reusable components (20 total)
│   │   ├── layout/               # Site structure
│   │   │   ├── Navbar.tsx        # Main navigation
│   │   │   └── Footer.tsx        # Site footer
│   │   │
│   │   ├── home/                 # Homepage sections
│   │   │   ├── Hero.tsx          # Hero section
│   │   │   ├── About.tsx         # About section with stats
│   │   │   ├── Advantages.tsx    # Advantages grid
│   │   │   ├── MenuCategories.tsx # Menu category cards
│   │   │   ├── Locations.tsx     # Locations showcase
│   │   │   ├── Atmosphere.tsx    # Atmosphere gallery
│   │   │   └── BookingCTA.tsx    # Booking call-to-action
│   │   │
│   │   ├── ui/                   # Reusable UI components
│   │   │   ├── BookingModal.tsx  # Booking form modal
│   │   │   ├── BookingSuccess.tsx # Success confirmation
│   │   │   ├── GlowButton.tsx    # Animated gold button
│   │   │   ├── Preloader.tsx     # Loading spinner
│   │   │   ├── ErrorBoundary.tsx # Error handling wrapper
│   │   │   ├── JsonLdInjector.tsx # SEO structured data
│   │   │   ├── TrackingScripts.tsx # Analytics integration
│   │   │   └── ImageUpload.tsx   # Admin image upload
│   │   │
│   │   ├── loyalty/              # Loyalty program components
│   │   │   ├── LoyaltyIntro.tsx
│   │   │   ├── LoyaltyLevels.tsx
│   │   │   └── LoyaltyCTA.tsx
│   │   │
│   │   └── admin/                # Admin panel components
│   │       ├── AdminLayout.tsx   # Admin sidebar & layout
│   │       └── TelegramChat.tsx  # Telegram bot chat UI
│   │
│   ├── services/                 # Data & API services
│   │   └── dataService.ts        # UNIFIED data service (single source)
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useData.ts            # Reactive data loading hook
│   │   ├── useEnterSave.ts       # Ctrl+Enter save handler
│   │   └── usePasteAutoSave.ts   # Auto-save on paste
│   │
│   ├── types/                    # TypeScript definitions
│   │   └── index.ts              # All interfaces (14 types)
│   │
│   ├── utils/                    # Utility functions
│   │   ├── lazyRetry.ts          # Lazy loading with retry logic
│   │   ├── animation.ts          # Framer Motion variants
│   │   └── iconResolver.ts       # Lucide icon dynamic import
│   │
│   ├── main.tsx                  # React app entry point
│   └── App.tsx                   # Route configuration
│
├── server/                       # Backend (Hono + Vite middleware)
│   ├── index.ts                  # Unified server (API + Vite + static)
│   ├── meta-injection.ts         # Server-side SEO meta tag injection
│   └── telegram.ts               # Telegram bot integration
│
├── storage/                      # Runtime data (outside Vite scope)
│   ├── data/
│   │   └── data.json             # UNIFIED runtime data (single JSON)
│   └── uploads/                  # User uploaded files
│
├── public/                       # Static assets (served by Vite)
│   └── assets/
│       ├── images/               # General images
│       └── locations/            # Location-specific images
│
├── tests/                        # Test suites
│   ├── data-persistence.test.ts  # Backend API tests
│   ├── content-updates.test.ts   # Content update tests
│   ├── routes.test.ts            # Route validation tests
│   └── meta-injection.test.ts    # Server-side meta injection tests
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md           # System architecture
│   └── ROUTE_DATA_QUICK_REF.md   # Route/data quick reference
│
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config (base)
├── vite.config.ts                # Vite build configuration
├── tailwind.config.js            # Tailwind CSS config
├── index.html                    # HTML template with SEO
├── CLAUDE.md                     # AI assistant instructions
└── PROJECT_INDEX.md              # This file
```

---

## Core Modules

### Data Service (Single Source of Truth)
**Path**: `src/services/dataService.ts`
**Purpose**: Unified data service for all content

**Methods**:
- `load(forceRefresh?)` - Load from API with static fallback
- `save(newData)` - Save to backend API
- `getData()` - Get cached data (sync)
- `getLocation(slug)` - Get location by slug
- `getNewsItem(slug)` - Get news by slug

**Data Flow**:
```
API (/api/data) → In-memory cache → React components
     ↓ (fallback)
Static file (/storage/data/data.json)
```

### Meta Injection Service
**Path**: `server/meta-injection.ts`
**Purpose**: Server-side SEO meta tag injection for social sharing

**Exports**:
- `injectMeta(html, pathname)` - Inject meta tags into HTML
- `shouldSkipMetaInjection(pathname)` - Check if route needs meta
- `isHtmlRequest(req)` - Check if request expects HTML

**Supported Routes**:
- `/` - Home page SEO
- `/news` - News listing SEO
- `/news/:slug` - Individual article SEO (title, description, image)
- `/locations/:slug` - Location SEO
- `/privacy`, `/loyalty` - Static page SEO

### Routing System
**Path**: `src/App.tsx`

**Public Routes**:
- `/` → Home
- `/news` → NewsPage
- `/news/:slug` → NewsDetailPage
- `/locations/:slug` → LocationPage
- `/loyalty` → LoyaltyPage
- `/privacy` → PrivacyPolicy

**Admin Routes** (under `/admin/*`):
- `/admin/dashboard` → AdminDashboard
- `/admin/locations` → AdminLocations
- `/admin/news` → AdminNews
- `/admin/content` → AdminContent
- `/admin/seo` → AdminSEO
- `/admin/booking-settings` → AdminBookingSettings

---

## Configuration Files

### TypeScript
- **tsconfig.json** - Base configuration
- **tsconfig.app.json** - Frontend config (strict mode)
- **tsconfig.node.json** - Server config

### Build Tools
- **vite.config.ts** - Vite 7 configuration (no proxy - server handles all)
- **tailwind.config.js** - Dark theme, gold accents (#d4af37)
- **postcss.config.js** - PostCSS with Tailwind & Autoprefixer

### Dependencies (Key)
| Package | Purpose |
|---------|---------|
| react 18 | UI framework |
| react-router-dom 6 | Client-side routing |
| hono 4 | Backend API framework |
| vite 7 | Build tool + middleware |
| framer-motion | Animations |
| tailwindcss 3 | CSS framework |
| cross-env | Cross-platform env vars |

---

## Test Coverage

**Location**: `tests/`

| Test File | Purpose |
|-----------|---------|
| `data-persistence.test.ts` | Backend API CRUD operations |
| `content-updates.test.ts` | Content modification tests |
| `routes.test.ts` | Route accessibility & redirects |
| `meta-injection.test.ts` | Server-side meta tag injection |

**Run Tests**:
```bash
npm run test:api      # Backend API tests
npm run test:content  # Content tests
npm run test:routes   # Route tests
npm run test:meta     # Meta injection tests
npm run test:all      # All tests
```

---

## SEO Implementation

### Server-Side Meta Injection
Meta tags are injected server-side before HTML is sent to browser:
- Title, Description, Keywords
- Open Graph (og:title, og:description, og:image)
- Twitter Card (twitter:title, twitter:description, twitter:image)
- Canonical URLs

### Admin SEO Control
- `/admin/seo` - Manage SEO for all pages
- Per-page title, description, OG image
- Real-time preview

### Structured Data
- JSON-LD via `JsonLdInjector` component
- Organization schema
- LocalBusiness schema per location

---

## Quick Reference

### Adding a New Page
1. Create component in `src/pages/`
2. Add route in `src/App.tsx` using `lazyRetry()`
3. Add meta injection route in `server/meta-injection.ts` (if SEO needed)

### Adding a Location
1. Edit `storage/data/data.json` → `locations` array
2. Add images to `public/assets/locations/`
3. Page auto-generates at `/locations/{slug}`

### Modifying SEO
1. Use admin panel at `/admin/seo`
2. Or edit `storage/data/data.json` → `seo` object

---

## Changelog

### v3.0.0 (2025-12-30)
- **Major**: Unified Vite middleware architecture
- Server now handles both dev (HMR) and production modes
- Added server-side meta injection for SEO
- Moved data to `storage/` directory (outside Vite scope)
- Added `meta-injection.test.ts`
- Updated npm scripts for new architecture

### v2.0.0 (2025-12-27)
- Comprehensive rewrite with detailed module reference
- Added Quick Stats section

### v1.0.0 (2025-12-26)
- Initial project index

---

**Last Updated**: 2025-12-30
**Status**: Production Ready
