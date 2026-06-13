# Manual Journal Entry Editor

Full-page editor used to create, edit, and post manual journal entries.

## Routes

- `/accounting/journal` — list (existing).
- `/accounting/journal/new` — Create Journal Entry / إنشاء قيد.
- `/accounting/journal/$id` — View Journal Entry / عرض قيد.
- `/accounting/journal/$id/edit` — Edit Journal Entry / تعديل قيد (draft only).

All editor routes render as full pages — not modals.

## Header / actions

Sticky sub-header offers Back, **Save Draft / حفظ كمسودة**, and
**Save and Post / حفظ وترحيل**. Top-bar actions: Attachments (placeholder),
Print / Download (placeholder), More menu (placeholder), Close.

## Journal information panel

`Date*`, `Number`, `Reference`, `Currency*` (default SAR), `Exchange rate`
(default 1), `Description`, `Notes`, `Amounts include tax` toggle.

## Journal lines grid

Spreadsheet-like, horizontally scrollable. Columns:

| # | Description | Account | Currency | Exch. | Debit | Credit | Debit SAR | Credit SAR | Tax | Contact | Project | Branch | Cost Center | Actions |

- Add row, +3 rows, Delete row (minimum 2 lines).
- Smart account selector (code, AR/EN name, purpose, locked badge — posting accounts only).
- A line cannot have both debit and credit > 0.
- A line must have a debit OR credit > 0 and a selected account to count.

## Totals summary

Live `Total Debit`, `Total Credit`, `Difference`. **Balanced / متوازن** badge
when `totalDebit == totalCredit > 0`, otherwise **Not balanced / غير متوازن**
and the Post button is disabled.

## Posting workflow

- `Save Draft` → `JournalService.createManualDraft` or `updateManualDraft`,
  status `draft`.
- `Save and Post` → requires `validation.ok` (balanced + ≥ 2 valid lines).
  Calls `JournalService.postManual` which sets `status: "posted"` and
  `posted_at`, blocks duplicate posting, and writes an audit log.
- Posted journals are locked: every input disabled, banner shown, edit route
  still renders but read-only.

## Permissions

- View: `accounting.view`.
- Create / edit / post: `journal.post` (Owner, Accountant).
- Sales / Viewer roles cannot reach the editor — gates render Access Denied.

## Service architecture

```
UI editor → JournalService.{createManualDraft|updateManualDraft|postManual|
                            validateJournalLines|getPostingAccounts}
         → DataAdapter → LocalStorageDataAdapter → Store
```

Account selector uses `AccountSearchService` from
`src/lib/services/smart-search.ts` via the shared `SmartEntityCombobox`.

## Known limitations

- Attachments are a placeholder.
- Print / Download is a placeholder; no PDF generation in this phase.
- Per-line Project / Branch / Cost Center / Contact / Tax are captured in the
  UI but not yet persisted on `JournalLine`; values are dropped on save until
  the underlying type is extended.
- Multi-currency display computes Debit/Credit SAR client-side only.
