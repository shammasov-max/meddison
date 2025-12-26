# Medisson Lounge - Claude Code Context

> Project index and AI assistant instructions for Claude Code

## Code Reading Protocol

**BEFORE reading any source code, ALWAYS:**
1. Read `PROJECT_INDEX.md` first - it contains the complete project structure,
   file locations, data architecture, and module reference
2. Use the index to identify which specific files are relevant to the task
3. Only read source files if the index doesn't provide enough context

This reduces token usage by 90%+ and ensures you have accurate project context.

---

## Quick Reference

| Resource | Path |
|----------|------|
| **Project Index** | [PROJECT_INDEX.md](./PROJECT_INDEX.md) |
| **Architecture** | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) |
| **API Reference** | [docs/API.md](./docs/API.md) |

---

## Project Summary

**Medisson Lounge** is a premium lounge bar website for a Moscow-based hookah/restaurant chain.

- **Stack**: React 18 + Vite 7 + TypeScript + Tailwind CSS
- **Domain**: medisson-lounge.ru
- **Locale**: Russian (ru_RU)
- **Locations**: 2 (Butovo active, Select Ramenki coming soon)

---

## Key Entry Points

```
src/main.tsx          # App bootstrap
src/App.tsx           # Routes definition
index.html            # HTML template with SEO
vite.config.ts        # Build configuration
```

---

## Directory Structure

```
src/
├── pages/            # Page components (Home, LocationPage, NewsPage, admin/*)
├── components/       # UI components organized by feature
│   ├── home/         # Homepage sections (Hero, About, Advantages, etc.)
│   ├── layout/       # Navbar, Footer
│   ├── ui/           # Reusable UI (BookingModal, GlowButton, etc.)
│   ├── loyalty/      # Loyalty program components
│   └── admin/        # Admin panel components
├── services/         # Unified data service (dataService.ts)
├── hooks/            # Custom React hooks (useData, useEnterSave)
├── types/            # TypeScript interfaces (index.ts)
└── utils/            # Utilities (lazyRetry, animation, iconResolver)

server/               # Backend API (index.ts - port 3001)
tests/                # Test files (data-persistence, content-updates, routes)
public/data/          # Runtime JSON: data.json (unified)
```

---

## Development Commands

```bash
npm run dev      # Start dev server (http://127.0.0.1:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Coding Patterns

### Component Pattern

```typescript
// Functional components with TypeScript
export const ComponentName = ({ prop }: Props) => {
  return <div className="tailwind-classes">...</div>;
};
```

### Data Service Pattern

```typescript
// Unified data service (src/services/dataService.ts)
import { dataService } from './services/dataService';

await dataService.load();           // Load data (API → static fallback)
const data = dataService.getData(); // Get cached data (sync)
await dataService.save(newData);    // Save to backend API
```

### Data Hook Pattern

```typescript
const { data, loading } = useData();
// Reactive data loading with event-based updates
```

---

## Important Conventions

### Styling
- **Framework**: Tailwind CSS
- **Colors**: Black background, gold accents (`#d4af37` as amber-500)
- **Fonts**: Inter (sans), Playfair Display (serif)
- **Theme**: Dark luxury aesthetic

### Routing
- Public pages at root (`/`, `/news`, `/lounge/:slug`)
- Admin pages under `/admin/*` (protected)
- Legacy redirects: `/butovo` -> `/lounge/butovo`

### Data Layer
- Single unified JSON file: `public/data/data.json`
- Single data service: `src/services/dataService.ts`
- Types defined in: `src/types/index.ts`
- Backend API: `server/index.ts` (port 3001)

### SEO
- `react-helmet-async` for meta tags
- `JsonLdInjector` for structured data
- Canonical URLs on all pages

---

## Common Tasks

### Add a New Page

1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Use lazy loading: `lazyRetry(() => import('./pages/NewPage'))`

### Add a New Location

1. Add entry to `locations` array in `public/data/data.json`
2. Add images to `public/assets/locations/`
3. Page auto-generates at `/lounge/{slug}`

### Add News Article

1. Add entry to `news` array in `public/data/data.json`
2. Add image to `public/assets/images/`
3. Page auto-generates at `/news/{slug}`

### Edit Homepage Content

1. Modify sections in `public/data/data.json`
2. Or use admin panel at `/admin/content`

---

## TypeScript Interfaces

All interfaces defined in `src/types/index.ts`:
- `SiteContent` - Master type containing all data
- `Location`, `NewsItem` - Entity types
- `HeroContent`, `AboutContent`, etc. - Section types

---

## Testing

Test files in `tests/` directory:
- `data-persistence.test.ts` - Backend API tests
- `content-updates.test.ts` - Content update tests
- `routes.test.ts` - Route validation tests

Run: `npm run test:all`

---

## API Proxy

Dev server proxies `/api/*` to `http://localhost:3001` (backend server).
Run backend with: `npm run server`

---

## Notes for Claude

1. **Language**: All user-facing content is in Russian
2. **Images**: Referenced by path from `public/` (e.g., `/assets/images/...`)
3. **Icons**: Using Lucide React icons
4. **Animations**: Framer Motion for transitions
5. **Rich Text**: React Quill in admin panel
6. **Date Handling**: date-fns for formatting

---

## Documentation Index

For detailed documentation, see:

- **[PROJECT_INDEX.md](./PROJECT_INDEX.md)** - Complete project structure and module reference
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture 
