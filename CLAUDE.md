# Medisson Lounge - Claude Code Context

> Project index and AI assistant instructions for Claude Code

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
├── services/         # API services (content, locations, news)
├── hooks/            # Custom React hooks (useContent)
├── data/             # Static fallback data
└── utils/            # Utilities (lazyRetry)

public/
├── data/             # Runtime JSON data
│   ├── content.json
│   ├── locations.json
│   └── news.json
└── assets/           # Images, location photos
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

### Service Pattern

```typescript
// All services follow this pattern
export const serviceService = {
  getAll: async () => { /* fetch + fallback */ },
  getById: async (id) => { /* fetch single + fallback */ },
  save: async (item) => { /* PATCH, disabled in local mode */ },
};
```

### Content Hook Pattern

```typescript
const content = useContent();
// Reactive content loading with event-based updates
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
- JSON files in `public/data/`
- Fallback data in `src/data/content.ts`
- Services read from JSON, fallback on error
- `USE_LOCAL_DATA = true` disables API writes

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

1. Add entry to `public/data/locations.json`
2. Add images to `public/assets/locations/`
3. Page auto-generates at `/lounge/{slug}`

### Add News Article

1. Add entry to `public/data/news.json`
2. Add image to `public/assets/images/`
3. Page auto-generates at `/news/{slug}`

### Edit Homepage Content

1. Modify `public/data/content.json`
2. Or use admin panel at `/admin/content`

---

## TypeScript Interfaces

Key interfaces are defined in service files:

- `LocationItem` - `src/services/locationsService.ts:34`
- `NewsItem` - `src/services/newsService.ts:20`
- Content types - `src/data/content.ts`

---

## Testing

Currently no test files. When adding tests:
- Place in `__tests__/` or alongside components as `*.test.tsx`
- Use Vitest (Vite's test runner)

---

## API Proxy

Dev server proxies `/api/*` to `http://localhost:3000`. Currently unused as `USE_LOCAL_DATA = true` in all services.

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
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture and component hierarchy
- **[docs/API.md](./docs/API.md)** - Service layer and data structures
