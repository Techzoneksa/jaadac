import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore, newId, type JournalEntry, type JournalLine } from "@/lib/store";
import { JournalService, NumberingService } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SmartAccountSelect } from "@/components/smart-select/SmartAccountSelect";
import { useAudit } from "@/hooks/useAudit";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Save, Send, Paperclip,
  Printer, CheckCircle2, AlertTriangle, MoreHorizontal, X,
} from "lucide-react";

export type EditorMode = "new" | "edit";

const EMPTY_LINE = (): EditorLine => ({
  uid: newId(),
  account_id: "",
  description: "",
  currency: "SAR",
  exchange_rate: 1,
  debit: 0,
  credit: 0,
  tax_rate: 0,
  contact: "",
  project: "",
  branch: "",
  cost_center: "",
});

interface EditorLine extends JournalLine {
  uid: string;
  currency: string;
  exchange_rate: number;
  tax_rate: number;
  contact: string;
  project: string;
  branch: string;
  cost_center: string;
}

interface EditorState {
  id: string;
  number: string;
  date: string;
  reference: string;
  description: string;
  notes: string;
  currency: string;
  exchange_rate: number;
  tax_inclusive: boolean;
  lines: EditorLine[];
}

function toEditorLine(l: JournalLine): EditorLine {
  return { ...EMPTY_LINE(), ...l, uid: newId() };
}

export function JournalEditor({ mode, initial }: { mode: EditorMode; initial?: JournalEntry }) {
  const { lang, dir } = useI18n();
  const audit = useAudit();
  const navigate = useNavigate();
  const journal = useStore((s) => s.journal);
  const accountsState = useStore((s) => s.accounts);

  const [state, setState] = useState<EditorState>(() => {
    if (initial) {
      return {
        id: initial.id,
        number: initial.number,
        date: initial.date,
        reference: initial.source || "",
        description: initial.description,
        notes: "",
        currency: "SAR",
        exchange_rate: 1,
        tax_inclusive: false,
        lines: initial.lines.length >= 2
          ? initial.lines.map(toEditorLine)
          : [...initial.lines.map(toEditorLine), EMPTY_LINE()].slice(0, Math.max(2, initial.lines.length)),
      };
    }
    return {
      id: newId(),
      number: NumberingService.next("journal"),
      date: new Date().toISOString().slice(0, 10),
      reference: "",
      description: "",
      notes: "",
      currency: "SAR",
      exchange_rate: 1,
      tax_inclusive: false,
      lines: [EMPTY_LINE(), EMPTY_LINE()],
    };
  });

  const isLocked = initial?.status === "posted";

  const validation = useMemo(
    () => JournalService.validateJournalLines(state.lines),
    [state.lines],
  );
  const difference = validation.totalDebit - validation.totalCredit;

  const update = (uid: string, patch: Partial<EditorLine>) =>
    setState((s) => ({ ...s, lines: s.lines.map((l) => l.uid === uid ? { ...l, ...patch } : l) }));

  const addLine = () => setState((s) => ({ ...s, lines: [...s.lines, EMPTY_LINE()] }));
  const addThreeLines = () => setState((s) => ({ ...s, lines: [...s.lines, EMPTY_LINE(), EMPTY_LINE(), EMPTY_LINE()] }));
  const removeLine = (uid: string) =>
    setState((s) => ({ ...s, lines: s.lines.length > 2 ? s.lines.filter((l) => l.uid !== uid) : s.lines }));

  const buildEntry = (status: "draft" | "posted"): JournalEntry => ({
    id: state.id,
    number: state.number,
    date: state.date,
    description: state.description || (lang === "ar" ? "قيد يدوي" : "Manual journal"),
    status,
    source: state.reference || undefined,
    source_type: "manual",
    lines: state.lines
      .filter((l) => l.account_id && ((+l.debit || 0) > 0 || (+l.credit || 0) > 0))
      .map((l) => ({
        account_id: l.account_id,
        debit: +l.debit || 0,
        credit: +l.credit || 0,
        description: l.description || undefined,
      })),
  });

  const saveDraft = () => {
    if (!state.date) { toast.error(lang === "ar" ? "التاريخ مطلوب" : "Date is required"); return; }
    const entry = buildEntry("draft");
    if (mode === "edit" && initial) {
      JournalService.updateManualDraft(initial.id, entry);
      audit.log("journal.updated", "journal_entry", `تعديل قيد ${entry.number}`, `Updated journal ${entry.number}`, entry.id);
    } else {
      JournalService.createManualDraft(entry);
      audit.log("journal.created", "journal_entry", `إنشاء قيد ${entry.number}`, `Created journal ${entry.number}`, entry.id);
    }
    toast.success(lang === "ar" ? "تم حفظ المسودة" : "Draft saved");
    navigate({ to: "/accounting/journal" });
  };

  const postEntry = () => {
    if (!validation.ok) {
      toast.error(lang === "ar" ? "القيد غير متوازن أو غير صالح" : "Journal is not balanced or invalid");
      return;
    }
    const entry = buildEntry("posted");
    JournalService.postManual(entry);
    audit.log("journal.posted", "journal_entry", `ترحيل قيد ${entry.number}`, `Posted journal ${entry.number}`, entry.id);
    toast.success(lang === "ar" ? "تم ترحيل القيد" : "Journal posted");
    navigate({ to: "/accounting/journal" });
  };

  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const title = mode === "edit"
    ? (lang === "ar" ? "تعديل قيد" : "Edit Journal Entry")
    : (lang === "ar" ? "إنشاء قيد" : "Create Journal Entry");

  return (
    <AppShell
      title={title}
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled title={lang === "ar" ? "سيتم تفعيل رفع المرفقات في مرحلة لاحقة." : "Attachment upload will be enabled in a later phase."}>
            <Paperclip className="size-4 me-1" />{lang === "ar" ? "مرفقات" : "Attachments"}
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Printer className="size-4 me-1" />{lang === "ar" ? "طباعة / تنزيل" : "Print / Download"}
          </Button>
          <Button variant="outline" size="sm" disabled>
            <MoreHorizontal className="size-4" />
          </Button>
          <Link to="/accounting/journal">
            <Button variant="ghost" size="sm"><X className="size-4 me-1" />{lang === "ar" ? "إغلاق" : "Close"}</Button>
          </Link>
        </div>
      }
    >
      {/* Sticky sub-header */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-5 md:-mx-6 px-4 sm:px-5 md:px-6 py-3 bg-background/95 backdrop-blur border-b mb-4 flex items-center justify-between gap-3">
        <Link to="/accounting/journal" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <BackIcon className="size-4" />
          {lang === "ar" ? "العودة لقائمة القيود" : "Back to journals"}
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveDraft} disabled={isLocked}>
            <Save className="size-4 me-1" />{lang === "ar" ? "حفظ كمسودة" : "Save Draft"}
          </Button>
          <Button size="sm" onClick={postEntry} disabled={isLocked || !validation.ok}>
            <Send className="size-4 me-1" />{lang === "ar" ? "حفظ وترحيل" : "Save and Post"}
          </Button>
        </div>
      </div>

      {isLocked && (
        <div className="mb-4 card-elevated p-3 flex items-center gap-2 bg-muted/40 border-muted-foreground/20">
          <CheckCircle2 className="size-4 text-success" />
          <span className="text-sm">{lang === "ar" ? "هذا القيد مُرحّل ومقفل للتعديل." : "This journal entry is posted and locked."}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Journal info */}
        <div className="lg:col-span-2 card-elevated p-4 space-y-3">
          <h2 className="text-sm font-semibold">{lang === "ar" ? "معلومات القيد" : "Journal information"}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={lang === "ar" ? "رقم القيد" : "Number"}>
              <Input value={state.number} onChange={(e) => setState({ ...state, number: e.target.value })} disabled={isLocked} className="font-mono" />
            </Field>
            <Field label={lang === "ar" ? "التاريخ" : "Date"} required>
              <Input type="date" value={state.date} onChange={(e) => setState({ ...state, date: e.target.value })} disabled={isLocked} />
            </Field>
            <Field label={lang === "ar" ? "المرجع" : "Reference"}>
              <Input value={state.reference} onChange={(e) => setState({ ...state, reference: e.target.value })} disabled={isLocked} placeholder={lang === "ar" ? "رقم مرجعي اختياري" : "Optional reference"} />
            </Field>
            <Field label={lang === "ar" ? "العملة" : "Currency"} required>
              <Input value={state.currency} onChange={(e) => setState({ ...state, currency: e.target.value.toUpperCase() })} disabled={isLocked} className="font-mono" />
            </Field>
            <Field label={lang === "ar" ? "سعر الصرف" : "Exchange rate"}>
              <Input type="number" step="0.0001" value={state.exchange_rate} onChange={(e) => setState({ ...state, exchange_rate: +e.target.value || 1 })} disabled={isLocked} />
            </Field>
            <Field label={lang === "ar" ? "الوصف" : "Description"}>
              <Input value={state.description} onChange={(e) => setState({ ...state, description: e.target.value })} disabled={isLocked} placeholder={lang === "ar" ? "وصف موجز للقيد" : "Brief description"} />
            </Field>
          </div>
          <Field label={lang === "ar" ? "ملاحظات" : "Notes"}>
            <Textarea rows={2} value={state.notes} onChange={(e) => setState({ ...state, notes: e.target.value })} disabled={isLocked} />
          </Field>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={state.tax_inclusive} onChange={(e) => setState({ ...state, tax_inclusive: e.target.checked })} disabled={isLocked} />
            {lang === "ar" ? "المبالغ شاملة الضريبة" : "Amounts include tax"}
          </label>
        </div>

        {/* Totals summary */}
        <TotalsCard
          totalDebit={validation.totalDebit}
          totalCredit={validation.totalCredit}
          difference={difference}
          balanced={validation.balanced}
          meaningfulLines={validation.meaningfulLines}
        />
      </div>

      {/* Journal lines grid */}
      <div className="card-elevated overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold">{lang === "ar" ? "بنود القيد" : "Journal lines"}</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={addLine} disabled={isLocked}>
              <Plus className="size-4 me-1" />{lang === "ar" ? "إضافة سطر" : "Add row"}
            </Button>
            <Button size="sm" variant="ghost" onClick={addThreeLines} disabled={isLocked}>
              {lang === "ar" ? "+ 3 أسطر" : "+ 3 rows"}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1400px]">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <Th>#</Th>
                <Th wide>{lang === "ar" ? "الوصف" : "Description"}</Th>
                <Th wide>{lang === "ar" ? "الحساب" : "Account"}</Th>
                <Th>{lang === "ar" ? "العملة" : "Currency"}</Th>
                <Th>{lang === "ar" ? "سعر الصرف" : "Exch."}</Th>
                <Th end>{lang === "ar" ? "مدين" : "Debit"}</Th>
                <Th end>{lang === "ar" ? "دائن" : "Credit"}</Th>
                <Th end>{lang === "ar" ? "مدين SAR" : "Debit SAR"}</Th>
                <Th end>{lang === "ar" ? "دائن SAR" : "Credit SAR"}</Th>
                <Th>{lang === "ar" ? "الضريبة" : "Tax"}</Th>
                <Th>{lang === "ar" ? "جهة الاتصال" : "Contact"}</Th>
                <Th>{lang === "ar" ? "المشروع" : "Project"}</Th>
                <Th>{lang === "ar" ? "الفرع" : "Branch"}</Th>
                <Th>{lang === "ar" ? "مركز التكلفة" : "Cost Center"}</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y">
              {state.lines.map((l, i) => {
                const lineV = validation.lines[i];
                const rate = +l.exchange_rate || 1;
                return (
                  <tr key={l.uid} className={lineV && !lineV.ok ? "bg-destructive/5" : ""}>
                    <td className="px-2 py-2 text-center text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-2 py-2 min-w-[180px]">
                      <Input value={l.description} onChange={(e) => update(l.uid, { description: e.target.value })} disabled={isLocked} placeholder={lang === "ar" ? "وصف السطر" : "Line description"} />
                    </td>
                    <td className="px-2 py-2 min-w-[260px]">
                      <SmartAccountSelect value={l.account_id || undefined} onChange={(id) => update(l.uid, { account_id: id || "" })} disabled={isLocked} />
                      {lineV && !lineV.ok && lineV.error && (
                        <div className="text-[10px] text-destructive mt-1">{lang === "ar" ? lineV.error.ar : lineV.error.en}</div>
                      )}
                    </td>
                    <td className="px-2 py-2 w-20">
                      <Input value={l.currency} onChange={(e) => update(l.uid, { currency: e.target.value.toUpperCase() })} disabled={isLocked} className="font-mono" />
                    </td>
                    <td className="px-2 py-2 w-20">
                      <Input type="number" step="0.0001" value={l.exchange_rate} onChange={(e) => update(l.uid, { exchange_rate: +e.target.value || 1 })} disabled={isLocked} className="text-end" />
                    </td>
                    <td className="px-2 py-2 w-32">
                      <Input type="number" step="0.01" value={l.debit || ""} onChange={(e) => update(l.uid, { debit: +e.target.value || 0, credit: +e.target.value ? 0 : l.credit })} disabled={isLocked} className="text-end font-mono" placeholder="0.00" />
                    </td>
                    <td className="px-2 py-2 w-32">
                      <Input type="number" step="0.01" value={l.credit || ""} onChange={(e) => update(l.uid, { credit: +e.target.value || 0, debit: +e.target.value ? 0 : l.debit })} disabled={isLocked} className="text-end font-mono" placeholder="0.00" />
                    </td>
                    <td className="px-2 py-2 text-end font-mono text-muted-foreground">{l.debit ? fmtMoney(l.debit * rate, lang) : "—"}</td>
                    <td className="px-2 py-2 text-end font-mono text-muted-foreground">{l.credit ? fmtMoney(l.credit * rate, lang) : "—"}</td>
                    <td className="px-2 py-2 w-20">
                      <Input type="number" step="0.01" value={l.tax_rate || ""} onChange={(e) => update(l.uid, { tax_rate: +e.target.value || 0 })} disabled={isLocked} className="text-end" placeholder="0" />
                    </td>
                    <td className="px-2 py-2 min-w-[120px]"><Input value={l.contact} onChange={(e) => update(l.uid, { contact: e.target.value })} disabled={isLocked} /></td>
                    <td className="px-2 py-2 min-w-[120px]"><Input value={l.project} onChange={(e) => update(l.uid, { project: e.target.value })} disabled={isLocked} /></td>
                    <td className="px-2 py-2 min-w-[120px]"><Input value={l.branch} onChange={(e) => update(l.uid, { branch: e.target.value })} disabled={isLocked} /></td>
                    <td className="px-2 py-2 min-w-[120px]"><Input value={l.cost_center} onChange={(e) => update(l.uid, { cost_center: e.target.value })} disabled={isLocked} /></td>
                    <td className="px-2 py-2">
                      <Button size="icon" variant="ghost" onClick={() => removeLine(l.uid)} disabled={isLocked || state.lines.length <= 2} title={lang === "ar" ? "حذف" : "Delete"}>
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-muted/30 font-semibold">
              <tr>
                <td colSpan={5} className="px-3 py-2 text-end">{lang === "ar" ? "الإجمالي" : "Total"}</td>
                <td className="px-2 py-2 text-end font-mono">{fmtMoney(validation.totalDebit, lang)}</td>
                <td className="px-2 py-2 text-end font-mono">{fmtMoney(validation.totalCredit, lang)}</td>
                <td colSpan={8} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* mute unused warning */}
      <div className="hidden">{accountsState.length}{journal.length}</div>
    </AppShell>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}{required && <span className="text-destructive ms-1">*</span>}</Label>
      {children}
    </div>
  );
}

function Th({ children, end, wide }: { children?: React.ReactNode; end?: boolean; wide?: boolean }) {
  return <th className={`px-2 py-2.5 font-medium ${end ? "text-end" : "text-start"} ${wide ? "min-w-[180px]" : ""}`}>{children}</th>;
}

function TotalsCard({ totalDebit, totalCredit, difference, balanced, meaningfulLines }: {
  totalDebit: number; totalCredit: number; difference: number; balanced: boolean; meaningfulLines: number;
}) {
  const { lang } = useI18n();
  return (
    <div className="card-elevated p-4 space-y-3">
      <h2 className="text-sm font-semibold">{lang === "ar" ? "ملخص الإجماليات" : "Totals summary"}</h2>
      <Row label={lang === "ar" ? "إجمالي المدين" : "Total Debit"} value={fmtMoney(totalDebit, lang)} />
      <Row label={lang === "ar" ? "إجمالي الدائن" : "Total Credit"} value={fmtMoney(totalCredit, lang)} />
      <Row label={lang === "ar" ? "الفرق" : "Difference"} value={fmtMoney(difference, lang)} muted={Math.abs(difference) < 0.01} />
      <div className={`rounded-md p-3 text-sm flex items-center gap-2 ${balanced ? "bg-success/10 text-success" : "bg-amber-500/10 text-amber-600"}`}>
        {balanced ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
        <span className="font-medium">
          {balanced
            ? (lang === "ar" ? "متوازن" : "Balanced")
            : (lang === "ar" ? "غير متوازن — لا يمكن الترحيل" : "Not balanced — cannot post")}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {lang === "ar" ? `بنود فعّالة: ${meaningfulLines}` : `Active lines: ${meaningfulLines}`}
      </p>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-semibold ${muted ? "text-muted-foreground" : ""}`}>{value}</span>
    </div>
  );
}
