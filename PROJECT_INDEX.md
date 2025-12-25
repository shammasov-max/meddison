# Project Index: Medisson Lounge

Generated: 2025-12-25

## Overview

Premium lounge bar website for **Medisson Lounge** chain in Moscow. React 18 SPA with Vite, featuring:
- Public-facing landing pages with booking functionality
- Admin panel for content, locations, news, and SEO management
- Multi-location support (Butovo, Select Ramenki)
- Russian language (ru_RU locale)

**Domain**: `medisson-lounge.ru`

---

## Project Structure

```
hookah/main/
├── src/
│   ├── components/
│   │   ├── admin/      # Admin panel components
│   │   ├── home/       # Homepage sections
│   │   ├── layout/     # Navbar, Footer
│   │   ├── loyalty/    # Loyalty program components
│   │   └── ui/         # Reusable UI (Modals, Buttons, etc.)
│   ├── pages/
│   │   ├── admin/      # Admin pages (Dashboard, Locations, News, etc.)
│   │   └── *.tsx       # Public pages (Home, News, Location, etc.)
│   ├── services/       # API services (content, locations, news)
│   ├── hooks/          # Custom React hooks
│   ├── data/           # Static content fallbacks
│   └── utils/          # Utilities (lazyRetry)
├── public/
│   ├── assets/         # Images, location photos
│   └── data/           # JSON data (content, locations, news)
└── [config files]      # Vite, Tailwind, TypeScript configs
```

---

## Entry Points

| Type | Path | Description |
|------|------|-------------|
| App Entry | `src/main.tsx` | React app bootstrap with Router, Helmet, ErrorBoundary |
| Routes | `src/App.tsx` | All routes definition (public + admin) |
| HTML | `index.html` | Root HTML with SEO meta tags |
| Vite Config | `vite.config.ts` | Build config with proxy to `/api` |

---

## Core Modules

### Pages

| File | Route | Description |
|------|-------|-------------|
| `Home.tsx` | `/` | Main landing page with all sections |
| `LocationPage.tsx` | `/lounge/:slug` | Dynamic location detail pages |
| `NewsPage.tsx` | `/news` | News listing page |
| `NewsDetailPage.tsx` | `/news/:slug` | Individual news article |
| `LoyaltyPage.tsx` | `/loyalty` | Loyalty program page |
| `PrivacyPolicy.tsx` | `/privacy` | Privacy policy |

### Admin Pages

| File | Route | Description |
|------|-------|-------------|
| `AdminDashboard.tsx` | `/admin/dashboard` | Main admin dashboard |
| `AdminLocations.tsx` | `/admin/locations` | Manage lounge locations |
| `AdminNews.tsx` | `/admin/news` | Manage news articles |
| `AdminContent.tsx` | `/admin/content` | Edit site content |
| `AdminSEO.tsx` | `/admin/seo` | SEO settings |
| `AdminBookingSettings.tsx` | `/admin/booking-settings` | Booking configuration |

### Components

| Module | Purpose |
|--------|---------|
| `components/home/*` | Hero, About, Advantages, Atmosphere, Locations, MenuCategories, BookingCTA |
| `components/layout/*` | Navbar, Footer |
| `components/ui/*` | BookingModal, GlowButton, Preloader, ErrorBoundary, ImageUpload, TrackingScripts, JsonLdInjector |
| `components/loyalty/*` | LoyaltyIntro, LoyaltyLevels, LoyaltyCTA |
| `components/admin/*` | AdminLayout, TelegramChat |

### Services

| Service | Purpose |
|---------|---------|
| `contentService.ts` | Fetches/saves content from `/data/content.json` |
| `locationsService.ts` | Manages location data from `/data/locations.json` |
| `newsService.ts` | Manages news articles from `/data/news.json` |

### Hooks

| Hook | Purpose |
|------|---------|
| `useContent.ts` | Reactive content loading with event-based updates |

---

## Data Layer

Content is loaded from static JSON files in `public/data/`:

| File | Content |
|------|---------|
| `content.json` | Hero, About, Advantages, Atmosphere, Menu, Contact, SEO |
| `locations.json` | Location details (Butovo, Select) with galleries, features |
| `news.json` | News articles |

Fallback data exists in `src/data/content.ts`.

---

## Configuration

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite build, dev server (port 5173), API proxy |
| `tailwind.config.js` | Tailwind with custom fonts (Inter, Playfair) and gold accent |
| `tsconfig.json` | TypeScript configuration |
| `postcss.config.js` | PostCSS with Tailwind/Autoprefixer |

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 18.3.1 | UI framework |
| `react-router-dom` | 6.30.1 | Routing |
| `framer-motion` | 11.0.8 | Animations |
| `react-helmet-async` | 2.0.5 | SEO meta tags |
| `lucide-react` | 0.533.0 | Icons |
| `react-quill` | 2.0.0 | Rich text editor (admin) |
| `date-fns` | 4.1.0 | Date formatting |
| `vite` | 7.0.0 | Build tool |
| `tailwindcss` | 3.4.17 | CSS framework |
| `typescript` | 5.8.3 | Type checking |

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (http://127.0.0.1:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Routing Summary

### Public Routes
- `/` - Homepage
- `/news` - News listing
- `/news/:slug` - News detail
- `/lounge/:slug` - Location detail (butovo, select)
- `/loyalty` - Loyalty program
- `/privacy` - Privacy policy

### Redirects
- `/butovo` -> `/lounge/butovo`
- `/select` -> `/lounge/select`

### Admin Routes (Protected)
- `/admin/login` - Admin login
- `/admin/dashboard` - Dashboard
- `/admin/locations` - Manage locations
- `/admin/news` - Manage news
- `/admin/content` - Edit content
- `/admin/seo` - SEO settings
- `/admin/booking-settings` - Booking settings

---

## Design System

- **Colors**: Black background, gold accents (`#d4af37`)
- **Fonts**: Inter (sans), Playfair Display (serif)
- **Theme**: Premium, dark luxury aesthetic
- **Animations**: Framer Motion for page transitions and effects
