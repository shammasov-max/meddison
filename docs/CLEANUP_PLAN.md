# Cleanup Plan: Unused and Redundant Code Removal

**Created**: 2026-01-06
**Status**: Pending execution

## Summary

Analysis identified **15 cleanup items** across 3 categories: unused imports, dead code/exports, and unused npm dependencies.

---

## 1. Unused NPM Dependencies (2 packages)

| Package | Evidence | Action |
|---------|----------|--------|
| `multer` | No imports anywhere in codebase; file uploads use Hono's native `formData()` API | Remove from package.json |
| `@types/multer` | TypeScript types for unused multer package | Remove from package.json |

**Files to modify:** `package.json`

---

## 2. Unused Imports (1 issue)

| File | Unused Import | Reason |
|------|---------------|--------|
| `src/pages/LocationPage.tsx` | `import * as Icons from 'lucide-react'` (line 5) | Icons resolved via `getIcon()` utility, not used directly |

---

## 3. Dead Code / Unused Exports (8 items)

### Unused Component
| File | Item | Evidence |
|------|------|----------|
| `src/components/admin/TelegramChat.tsx` | Entire file | Never imported anywhere in codebase |

### Unused Utility Exports
| File | Export | Evidence |
|------|--------|----------|
| `src/utils/animation.ts` | `getAnimationDuration()` | Never called |
| `src/utils/animation.ts` | `getAnimationDelay()` | Never called |
| `src/utils/animation.ts` | `devMotionProps()` | Never called |

### Unused Type Export
| File | Export | Evidence |
|------|--------|----------|
| `src/hooks/useData.ts` | `UseDataReturn` type | Exported but never imported elsewhere |

### Legacy/Unused API Endpoints
| File | Endpoint | Evidence |
|------|----------|----------|
| `server/index.ts:204-220` | `POST /api/upload-url` | Legacy endpoint, frontend uses `/api/upload` |
| `server/index.ts:223-226` | `POST /api/download-url` | Legacy echo endpoint, never used |
| `server/index.ts:406-429` | `GET/POST /api/content` | Never called from frontend |
| `server/index.ts:513-524` | `POST /api/telegram/setup` | Duplicate of `/api/telegram/status` |

---

## Execution Checklist

- [ ] **Step 1**: Edit `package.json` - remove `multer` and `@types/multer`
- [ ] **Step 2**: Edit `src/pages/LocationPage.tsx` - remove `import * as Icons from 'lucide-react'` (line 5)
- [ ] **Step 3**: Delete `src/components/admin/TelegramChat.tsx`
- [ ] **Step 4**: Edit `src/utils/animation.ts` - remove `getAnimationDuration()`, `getAnimationDelay()`, `devMotionProps()`
- [ ] **Step 5**: Edit `src/hooks/useData.ts` - remove `UseDataReturn` type export
- [ ] **Step 6**: Edit `server/index.ts` - remove 4 legacy API endpoints:
  - Lines 204-220: `/api/upload-url`
  - Lines 223-226: `/api/download-url`
  - Lines 406-429: `/api/content` (GET and POST)
  - Lines 513-524: `/api/telegram/setup`
- [ ] **Step 7**: Run `npm install` to update lock file
- [ ] **Step 8**: Run `npm run build` to verify no build errors
- [ ] **Step 9**: Run `npm run test:all` to verify no test failures
- [ ] **Step 10**: Delete this plan file after completion

---

## Notes

- User approved removal of all unused API endpoints
- All changes are removal of genuinely unused code
- No functional code will be affected
