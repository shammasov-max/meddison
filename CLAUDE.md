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
| **Infrastructure** | [docs/INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md) |

---

## Project Summary

**Medisson Lounge** is a premium lounge bar website for a Moscow-based hookah/restaurant chain.

- **Stack**: React 18 + Vite 7 + TypeScript + Tailwind CSS + Hono
- **Domain**: medisson-lounge.ru
- **Locale**: Russian (ru_RU)
- **Locations**: 2 (Butovo active, Select Ramenki coming soon)

---

## Key Entry Points

```
src/main.tsx          # App bootstrap
src/App.tsx           # Routes definition
server/index.ts       # Unified server (API + Vite middleware)
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

server/               # Backend (Hono + Vite middleware)
├── index.ts          # Unified server entry (port 3001)
├── meta-injection.ts # Server-side SEO meta injection
└── telegram.ts       # Telegram bot integration

storage/              # Runtime data (outside Vite scope)
├── data/data.json    # Unified site data
└── uploads/          # User uploaded files

tests/                # Test suites
public/assets/        # Static assets (images, fonts)
```

---

## Development Commands

```bash
npm run dev      # Start dev server (http://localhost:3001) with HMR
npm run build    # Production build → dist/
npm start        # Production server (http://localhost:3001)
npm run preview  # Build + start production server
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

await dataService.load();           // Load data from API
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
- Public pages at root (`/`, `/news`, `/locations/:slug`)
- Admin pages under `/admin/*` (protected)
- Legacy redirects: `/butovo` -> `/locations/butovo`

### Data Layer
- Single unified JSON file: `storage/data/data.json`
- Single data service: `src/services/dataService.ts`
- Types defined in: `src/types/index.ts`
- Server handles API + static serving: `server/index.ts`

### SEO
- Server-side meta injection: `server/meta-injection.ts`
- `react-helmet-async` for client-side meta updates
- `JsonLdInjector` for structured data
- Canonical URLs on all pages

---

## Common Tasks

### Add a New Page

1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Use lazy loading: `lazyRetry(() => import('./pages/NewPage'))`
4. Add meta injection in `server/meta-injection.ts` (if SEO needed)

### Add a New Location

1. Add entry to `locations` array in `storage/data/data.json`
2. Add images to `public/assets/locations/`
3. Page auto-generates at `/locations/{slug}`

### Add News Article

1. Add entry to `news` array in `storage/data/data.json`
2. Add image to `public/assets/images/`
3. Page auto-generates at `/news/{slug}`

### Edit Homepage Content

1. Use admin panel at `/admin/content`
2. Or modify sections in `storage/data/data.json`

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
- `meta-injection.test.ts` - Server-side meta injection tests

Run: `npm run test:all`

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
- **[docs/INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md)** - Server dev/prod modes
- **[docs/ROUTE_DATA_QUICK_REF.md](./docs/ROUTE_DATA_QUICK_REF.md)** - Route-data mapping
