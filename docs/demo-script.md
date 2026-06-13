# JAAD CLOUD — Demo Script

Use this script when presenting JAAD CLOUD (جاد كلاود) to clients. Two
lengths: a 5-minute quick demo and a 15-minute full walkthrough. Always
open `/demo-flow` in a second tab for the visual sequence.

> Backend status (say in business language only):
> "النظام يعمل حاليًا في وضع العرض التجريبي. قاعدة البيانات السحابية
> جاهزة للتفعيل عند الاعتماد دون الحاجة لإعادة بناء النظام."
> "The system runs in demo mode. The cloud database is ready to activate
> on approval without rebuilding the product."

---

## 5-minute short demo

**Goal:** show that JAAD CLOUD handles the full sales cycle bilingually.

1. **Dashboard** (30s) — "هذه الصورة العامة لأعمالك في لحظة واحدة." /
   "This is your business at a glance."
2. **Create quotation** (90s) — Add 2 lines, show automatic VAT 15% and
   totals, save as Draft.
3. **Convert to invoice & issue** (90s) — One-click conversion, issue,
   final number, edit locks. Mention the journal posts automatically.
4. **Record receipt** (60s) — Customer paid; invoice balance updates.
5. **Reports + Audit** (30s) — Open `/reports-center`, then briefly
   `/audit-log` to show traceability.

Close with: "كل ما رأيته ثنائي اللغة، ومتوافق مع ضريبة القيمة المضافة
السعودية، وجاهز للتفعيل السحابي." / "Everything you saw is bilingual,
Saudi VAT-ready, and cloud-activation-ready."

---

## 15-minute full demo

Follow `/demo-flow` steps 1 → 12 in order.

### Arabic talking points

1. **لوحة التحكم** — مؤشرات فورية للأداء.
2. **العملاء** — قاعدة عملاء سعودية حقيقية وأرصدة لحظية.
3. **المنتجات والخدمات** — كتالوج موحّد مع ضريبة 15%.
4. **عرض السعر** — ترقيم تلقائي، حساب آلي، حفظ كمسودة.
5. **إرسال وقبول** — سير عمل واضح (مسودة → مُرسَل → مقبول).
6. **التحويل لفاتورة** — بنقرة واحدة دون إعادة إدخال.
7. **إصدار الفاتورة** — رقم نهائي، قفل تعديل، قيد آلي.
8. **سند القبض** — تحديث رصيد الفاتورة.
9. **القيد المحاسبي** — قيود متوازنة ومرحَّلة.
10. **التقارير** — مبيعات، ضريبة، مركز تقارير قابل للتوسع.
11. **سجل المراجعة** — من، متى، ماذا — لكل عملية حساسة.
12. **جاهزية النظام** — قاعدة سحابية جاهزة للتفعيل عند الاعتماد.

### English talking points

Same order; emphasize: bilingual, RTL/LTR, Saudi VAT, role-based access,
automatic journal posting, audit trail, cloud-activation-ready.

### Key selling points

- Arabic-first with full English parity.
- Saudi VAT 15% built-in everywhere.
- One-click quote → invoice → receipt with automatic accounting.
- Role-based access (Owner / Accountant / Sales / Viewer).
- Audit log for every sensitive action.
- Cloud-ready architecture; activation is a configuration step, not a
  rewrite.

### What NOT to mention in client demos (yet)

- Supabase / Postgres / RLS internals.
- Phase numbering, migrations, RPCs, env variables.
- Payroll, branches, WhatsApp/email sending, custom templates, bulk
  edit — these are on the roadmap, not in the current demo.
- "Backend writes disabled" framed negatively. Use: "cloud activation
  on approval".

### If the client asks about the backend

> "البنية التحتية السحابية جاهزة على Lovable Cloud وقاعدة بيانات
> آمنة بصلاحيات صف. سنفعّلها على بيئتك بعد الاعتماد، دون أي تغيير
> في الواجهة أو إعادة تدريب للمستخدمين."

> "The cloud infrastructure is ready on Lovable Cloud with a secure
> row-level-protected database. We activate it on your environment on
> approval, with zero UI changes or user retraining."

---

## Demo hygiene

- Hard refresh before the meeting.
- Switch language at least once to show RTL/LTR is instant.
- Run `/demo-checklist` once privately to confirm Ready status.
- Do **not** open `/system-data-mode` unless the client is technical.
- If asked about data persistence in demo, say: "البيانات تجريبية في
  هذا العرض ولا تُكتب على إنتاج" / "Demo data only; no production
  writes."
