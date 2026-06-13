# Phase 2.1.13 — Final Report

**Status:** JAAD CLOUD Phase 2.1.13 Full Page Manual Journal Entry Editor is **Ready**.

## Routes

- `/accounting/journal` — list (re-implemented as `accounting.journal.index.tsx` under the new layout route).
- `/accounting/journal/new` — full-page Create editor.
- `/accounting/journal/$id` — full-page read-only view.
- `/accounting/journal/$id/edit` — full-page Edit editor (drafts only).

## What shipped

- Full-page `JournalEditor` component with sticky sub-header, info panel, totals card, and spreadsheet-like 14-column line grid.
- `SmartAccountSelect` reusing `SmartEntityCombobox` and `AccountSearchService` (search by code, AR/EN name, purpose; locked indicator; posting accounts only).
- `JournalService.{createManualDraft, updateManualDraft, postManual, validateJournalLines, getPostingAccounts}` and a typed `JournalLinesValidation` result powering the balance/validity UI.
- Posted-journal lock: full read-only state, duplicate-post guard, audit log entries for create/update/post.
- View page with status badge, totals footer, edit shortcut for drafts.
- List page rebuilt as a flat layout with View + Edit row actions; old modal removed.

## Constraints respected

- `DATA_MODE = demo`, `BACKEND_WRITES_ENABLED = false` — unchanged.
- All writes go through the existing DataAdapter — no backend RPCs.
- No accounting engine / invoices / receipts / payments / reports edits.
- RTL + LTR preserved; sticky header and tables work both directions.

## Permissions

- `accounting.view` — list & view.
- `journal.post` — new, edit, post.
- Viewer & Sales blocked from editor.

## Known limitations

- Attachments + Print/Download are placeholders.
- Per-line Project / Branch / Cost Center / Contact / Tax are UI-captured but not yet persisted on `JournalLine` (dropped at save) until the type is extended in a later phase.
- Multi-currency Debit/Credit SAR are computed and displayed client-side; only the SAR amount is posted.
