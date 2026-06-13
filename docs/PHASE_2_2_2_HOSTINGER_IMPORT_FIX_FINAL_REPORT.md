# Phase 2.2.2 — Hostinger Linux Case-Sensitive Import Fix

**Date:** 2026-06-13  
**Branch:** `nextjs-migration`  
**Commit:** `4e8687a` → `17693d7`

---

## Root Cause

Git tracked 3 files with lowercase names while all imports and the barrel index used PascalCase:

| Git tracked (Linux checkout) | Actual file on disk | Import in `index.ts` | Import in consumer files |
|------------------------------|---------------------|----------------------|--------------------------|
| `badge.tsx` | `Badge.tsx` | `./Badge` | `@/components/ui/Badge` |
| `button.tsx` | `Button.tsx` | `./Button` | `@/components/ui/Button` |
| `card.tsx` | `Card.tsx` | `./Card` | `@/components/ui/Card` |

On Windows (case-insensitive FS), this worked fine. On Linux (Hostinger), Git checked out `badge.tsx` but Next.js resolved `./Badge` → `Badge.tsx` → **Module not found**.

## Fix

Used `git mv` with intermediate filenames to force Git to track the correct PascalCase:

```bash
git mv badge.tsx badge_TEMP.tsx
git mv badge_TEMP.tsx Badge.tsx
```

Same for `button.tsx` → `Button.tsx` and `card.tsx` → `Card.tsx`.

No code changes were needed — all imports and barrel exports already used PascalCase.

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/components/ui/Badge.tsx` | Renamed from `badge.tsx` (git case fix) |
| `apps/web/src/components/ui/Button.tsx` | Renamed from `button.tsx` (git case fix) |
| `apps/web/src/components/ui/Card.tsx` | Renamed from `card.tsx` (git case fix) |

Zero content changes. Zero import changes.

## Verification

| Check | Result |
|-------|--------|
| `git ls-files` matches imports | ✅ All 22 UI files PascalCase |
| `apps/web` build | ✅ PASS (18 routes) |
| `apps/web` lint | ✅ No warnings or errors |
| Root `npm run build` | ✅ Builds + copies `.next` to root |
| Root `.next/BUILD_ID` | ✅ |
| Old demo unchanged | ✅ |

## Convention

All UI component files use **PascalCase** filenames:
- `Badge.tsx`, `Button.tsx`, `Card.tsx`, `DataTable.tsx`, `StatCard.tsx`, etc.
- Barrel `index.ts` exports matching PascalCase paths
- All consumer imports use `@/components/ui/ComponentName`

## Next Step

Redeploy to Hostinger from branch `nextjs-migration`. The case-sensitive import should now resolve correctly.
