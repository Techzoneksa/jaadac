import { useState } from "react";
import { QuickCreateDialog } from "./QuickCreateDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useAudit } from "@/hooks/useAudit";
import { BankAccountService, type BankAccount, type BankAccountType } from "@/lib/quick-create/local-entities";
import { toast } from "sonner";

export function QuickCreateBankAccountDialog({
  open, onOpenChange, onCreated,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreated?: (b: BankAccount) => void }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const audit = useAudit();

  const empty = {
    name_ar: "", name_en: "", type: "bank" as BankAccountType,
    bank_name: "", account_number: "", iban: "",
    currency: "SAR", opening_balance: 0,
    status: "active" as const, notes: "",
  };
  const [form, setForm] = useState(empty);
  const [addAnother, setAddAnother] = useState(false);
  const reset = () => setForm(empty);

  const handleSave = () => {
    if (!form.name_ar.trim() && !form.name_en.trim()) {
      toast.error(ar ? "اسم الحساب مطلوب" : "Account name is required");
      return false;
    }
    const created = BankAccountService.create(form);
    audit.log("bank_account.created", "bank_account",
      `إضافة حساب بنكي ${form.name_ar || form.name_en}`,
      `Created bank account ${form.name_en || form.name_ar}`,
      created.id);
    toast.success(ar ? "تم إنشاء الحساب" : "Bank account created");
    onCreated?.(created);
    reset();
    return true;
  };

  return (
    <QuickCreateDialog
      open={open}
      onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}
      titleAr="إضافة حساب بنكي"
      titleEn="Add bank account"
      descAr="تأسيسي — يُحفظ محليًا للعرض التجريبي فقط."
      descEn="Foundation — stored locally for demo only."
      onSave={handleSave}
      showSaveAndAddAnother
      saveAndAddAnother={addAnother}
      onSaveAndAddAnotherChange={setAddAnother}
      size="md"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{ar ? "اسم الحساب (عربي)" : "Account name (AR)"}</Label>
          <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "اسم الحساب (إنجليزي)" : "Account name (EN)"}</Label>
          <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "النوع" : "Type"}</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as BankAccountType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bank">{ar ? "بنك" : "Bank"}</SelectItem>
              <SelectItem value="cash">{ar ? "نقدية" : "Cash"}</SelectItem>
              <SelectItem value="petty_cash">{ar ? "عهدة نقدية" : "Petty cash"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "اسم البنك" : "Bank name"}</Label>
          <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} disabled={form.type !== "bank"} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "رقم الحساب" : "Account number"}</Label>
          <Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} disabled={form.type !== "bank"} />
        </div>
        <div className="space-y-1.5">
          <Label>IBAN</Label>
          <Input value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} disabled={form.type !== "bank"} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "العملة" : "Currency"}</Label>
          <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "الرصيد الافتتاحي" : "Opening balance"}</Label>
          <Input type="number" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: +e.target.value })} />
        </div>
      </div>
    </QuickCreateDialog>
  );
}
