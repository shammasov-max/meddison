# Medisson Lounge: Route-Data Quick Reference

> Compressed visual guide for Claude Code sessions

**Last Updated:** 2025-12-30 (Route refactoring: `/lounge/:slug` → `/locations/:slug`)

---

## Data Flow Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                              │
├───────────────────────────────────────────────────────────────────┤
│  API: localhost:3001/api/data  │  Static: /data/data.json        │
└────────────────────────┬──────────────────────────────────────────┘
                         │
                         ▼
        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
        ┃   dataService.ts (Service Layer)  ┃
        ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
        ┃ Async: load(), save()             ┃
        ┃ Sync:  getData(), getLocation(),  ┃
        ┃        getNewsItem()              ┃
        ┃ Event: window 'data-updated'      ┃
        ┗━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━┛
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ┌─────────┐           ┌──────────────┐
    │ useData │           │ Direct Calls │
    │  Hook   │           │ (LocationPg) │
    └────┬────┘           └──────────────┘
         │
    ┌────┴─────────────────────────┐
    │                              │
    ▼                              ▼
┌─────────┐                  ┌──────────┐
│  Home   │                  │  Pages   │
│ Sections│                  │ Dynamic  │
└─────────┘                  └──────────┘
```

---

## Route → Data Matrix

```
┌────────────────────┬──────────┬─────────────────────────────────────┬───────────────┐
│       ROUTE        │   TYPE   │          DATA OBJECTS               │    ACCESS     │
├────────────────────┼──────────┼─────────────────────────────────────┼───────────────┤
│ /                  │  Static  │ hero, about, advantages, atmosphere │  useData()    │
│                    │          │ menuCategories, locations, seo.home │               │
├────────────────────┼──────────┼─────────────────────────────────────┼───────────────┤
│ /locations/:slug   │  Dynamic │ locations[slug]                     │  service.get  │
├────────────────────┼──────────┼─────────────────────────────────────┼───────────────┤
│ /news              │  Static  │ news[], seo.news                    │  useData()    │
├────────────────────┼──────────┼─────────────────────────────────────┼───────────────┤
│ /news/:slug        │  Dynamic │ news[slug]                          │  useData()+   │
│                    │          │                                     │  .find()      │
├────────────────────┼──────────┼─────────────────────────────────────┼───────────────┤
│ /loyalty           │  Static  │ NONE (hardcoded)                    │  N/A          │
├────────────────────┼──────────┼─────────────────────────────────────┼───────────────┤
│ /privacy           │  Static  │ NONE (hardcoded)                    │  N/A          │
└────────────────────┴──────────┴─────────────────────────────────────┴───────────────┘
```

---

## SiteContent Schema

```
SiteContent
├─ hero                    ← HeroContent        (4 fields)
├─ about                   ← AboutContent       (5 fields + stats[])
├─ advantages              ← AdvantagesContent  (3 fields + items[4])
├─ atmosphere              ← AtmosphereContent  (3 fields + items[6])
├─ menuCategories[]        ← MenuCategory[3]    (kitchen, bar, hookah)
├─ contact                 ← ContactInfo        (phone, email, socials)
├─ seo                     ← SEOConfig          (home, news, locations)
├─ locations[]             ← Location[2]        (butovo, select)
└─ news[]                  ← NewsItem[4]        (1 event, 3 promos)
```

---

## Data Object → Route Mapping

```
┌──────────────────┬────┬────────────┬──────┬─────────────┬────────┐
│   DATA OBJECT    │ /  │ /locations │ /news│ /news/:slug │ Footer │
├──────────────────┼────┼────────────┼──────┼─────────────┼────────┤
│ hero             │ ●  │            │      │             │        │
│ about            │ ●  │            │      │             │        │
│ advantages       │ ●  │            │      │             │        │
│ atmosphere       │ ●  │            │      │             │        │
│ menuCategories   │ ●  │            │      │             │        │
│ contact          │    │            │      │             │   ●    │
│ seo.home         │ ●  │            │      │             │        │
│ seo.news         │    │            │  ●   │             │        │
│ seo.locations    │    │      ●     │      │             │        │
│ locations[]      │ ●  │      ●     │      │             │        │
│ news[]           │    │            │  ●   │      ●      │        │
└──────────────────┴────┴────────────┴──────┴─────────────┴────────┘
     ● = Used
```

---

## Homepage Component Tree

```
Home.tsx (seo.home)
│
├─ Hero.tsx ──────────────────────▶ { hero }
│
├─ About.tsx ─────────────────────▶ { about }
│  └─ StatItem × 2
│
├─ Advantages.tsx ────────────────▶ { advantages }
│  └─ AdvantageItem × 4
│     └─ Icon (via iconResolver)
│
├─ MenuCategories.tsx ────────────▶ { menuCategories }
│  └─ CategoryCard × 3
│
├─ Locations.tsx ─────────────────▶ { locations }
│  └─ LocationCard × 2 (sorted)
│
└─ Atmosphere.tsx ────────────────▶ { atmosphere }
   └─ Gallery × 6 (masonry)
```

---

## Dynamic Route Patterns

### Location Page Flow

```
URL: /locations/butovo
         │
         ▼
   useParams() → slug="butovo"
         │
         ▼
   dataService.load()
         │
         ▼
   dataService.getLocation("butovo")
         │
         ├─ Found    → Render page
         └─ Not found → navigate('/')
```

### News Detail Flow

```
URL: /news/grand-opening-ramenki
         │
         ▼
   useParams() → slug="grand-opening-ramenki"
         │
         ▼
   useData() → { news }
         │
         ▼
   news.find(i => i.slug === slug)
         │
         ├─ Found    → Render + related articles (3)
         └─ Not found → 404 card
```

---

## Data Service API

```
┌─────────────────────────────────────────────────────────────────┐
│                    dataService Methods                          │
├─────────────────────────────────────────────────────────────────┤
│ ASYNC                                                           │
│  • load(forceRefresh?)  → Promise<SiteContent>                 │
│  • save(newData)        → Promise<boolean>                     │
├─────────────────────────────────────────────────────────────────┤
│ SYNC                                                            │
│  • getData()            → SiteContent | null                   │
│  • getLocation(slug)    → Location | undefined                 │
│  • getNewsItem(slug)    → NewsItem | undefined                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## useData Hook Exports

```
const {
  // State
  data, loading, error,

  // Content Selectors
  hero, about, advantages, atmosphere,
  menuCategories, contact, seo,
  locations, news,

  // Mutations (Admin)
  save, updateLocation, deleteLocation,
  updateNewsItem, deleteNewsItem

} = useData();
```

---

## Event System

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
Update cache
      │
      ▼
window.dispatchEvent('data-updated')
      │
      └──────────────────────────┐
                                 │
      ┌──────────────────────────┘
      │
      ▼
All useData() instances
      │
      ▼
Re-fetch via load()
      │
      ▼
Components re-render
```

---

## Location Object (16 Fields)

```
Location {
  id: number
  slug: string              ← Route param
  name: string              ← Title
  description: string       ← Short text
  fullDescription: string   ← HTML content
  image: string             ← Hero
  gallery: string[]         ← Slider (5 imgs)
  address: string           ← Maps link
  phone: string
  hours: string
  menuLink: string          ← External URL
  features: Feature[]       ← Icons + labels
  socialLinks: SocialLinks  ← 4 platforms
  coordinates: string       ← "lat,lng"
  comingSoon: boolean       ← Status
  sortOrder: number         ← Display order
}
```

---

## NewsItem Object (11 Fields)

```
NewsItem {
  id: number
  slug: string              ← Route param
  title: string
  date: string              ← DD.MM.YYYY
  category: string          ← "Мероприятия" | "Акции"
  image: string
  description: string       ← Preview
  fullContent: string       ← HTML body
  location: string          ← Associated lounge
  metaTitle?: string        ← SEO override
  metaDescription?: string  ← SEO override
}
```

---

## Common Patterns

### Pattern 1: Homepage Section

```typescript
// Component-level data access
const { hero } = useData();
if (!hero) return null;
return <section>{hero.title}</section>;
```

### Pattern 2: Dynamic Lookup (Location)

```typescript
const { slug } = useParams();
useEffect(() => {
  const load = async () => {
    await dataService.load();
    const loc = dataService.getLocation(slug);
    if (!loc) navigate('/');
    setLocation(loc);
  };
  load();
}, [slug]);
```

### Pattern 3: Array Search (News)

```typescript
const { news } = useData();
const item = news?.find(i => i.slug === slug);
if (!item) return <NotFound />;
```

### Pattern 4: Client Filter (News List)

```typescript
const { news } = useData();
const filtered = filter === 'Все'
  ? news
  : news?.filter(i => i.category === filter);
```

---

## Data Transformations

```
┌─────────────────────┬──────────────────────────────────────┐
│   TRANSFORMATION    │              EXAMPLE                 │
├─────────────────────┼──────────────────────────────────────┤
│ Gallery Slider      │ gallery[] → useState(index)          │
│ Icon Resolution     │ "Palette" → <Palette /> component   │
│ Maps URL Gen        │ address → yandex.ru/maps?text=...   │
│ Category Filter     │ news[] → filter(category)            │
│ HTML Rendering      │ fullContent → dangerouslySetInnerHTML│
│ Related Articles    │ news.filter(≠slug).slice(0,3)        │
│ Location Sort       │ locations.sort(sortOrder)            │
└─────────────────────┴──────────────────────────────────────┘
```

---

## Troubleshooting

```
╔═══════════════════════════════════════════════════════════════╗
║ ISSUE: Data is null/undefined                                 ║
╠═══════════════════════════════════════════════════════════════╣
║ FIX: Check loading state                                      ║
║ const { data, loading } = useData();                          ║
║ if (loading || !data) return <Spinner />;                     ║
╚═══════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════╗
║ ISSUE: Slug not found (404)                                   ║
╠═══════════════════════════════════════════════════════════════╣
║ FIX: Verify slug matches data.json                            ║
║ locations: [{ slug: "butovo" }] ← /lounge/butovo             ║
╚═══════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════╗
║ ISSUE: Updates not reflecting                                 ║
╠═══════════════════════════════════════════════════════════════╣
║ FIX: Check event system                                       ║
║ window.dispatchEvent(new CustomEvent('data-updated'));        ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## File Locations

```
┌──────────────────────────┬──────────────────────────────────┐
│         PURPOSE          │             PATH                 │
├──────────────────────────┼──────────────────────────────────┤
│ Routes Config            │ src/App.tsx                      │
│ Data Service             │ src/services/dataService.ts      │
│ Data Hook                │ src/hooks/useData.ts             │
│ Type Definitions         │ src/types/index.ts               │
│ Unified Data Store       │ storage/data/data.json           │
│ Backend API              │ server/index.ts                  │
│ Icon Resolver            │ src/utils/iconResolver.ts        │
├──────────────────────────┼──────────────────────────────────┤
│ Homepage                 │ src/pages/Home.tsx               │
│ Location Page            │ src/pages/LocationPage.tsx       │
│ News List                │ src/pages/NewsPage.tsx           │
│ News Detail              │ src/pages/NewsDetailPage.tsx     │
├──────────────────────────┼──────────────────────────────────┤
│ Hero Component           │ src/components/home/Hero.tsx     │
│ About Component          │ src/components/home/About.tsx    │
│ Advantages Component     │ src/components/home/Advantages.tsx│
│ Atmosphere Component     │ src/components/home/Atmosphere.tsx│
│ Menu Categories          │ src/components/home/MenuCategories.tsx│
│ Locations Component      │ src/components/home/Locations.tsx│
└──────────────────────────┴──────────────────────────────────┘
```

---

## Performance Notes

```
✓ Single data load on app startup
✓ In-memory cache (no repeated API calls)
✓ Static JSON fallback (instant load)
✓ Event-driven updates (save → broadcast)
✓ Zero props drilling (hook-based access)
```

---

## Summary

**6 Public Routes** (2 dynamic, 4 static)
**9 Data Objects** (hero, about, advantages, atmosphere, menuCategories, contact, seo, locations, news)
**2 Access Patterns** (useData hook vs direct service calls)
**1 Event System** ('data-updated' window event)
**1 Data Source** (storage/data/data.json via API)

---

**Last Updated:** 2025-12-30
**Project:** Medisson Lounge (medisson-lounge.ru)
