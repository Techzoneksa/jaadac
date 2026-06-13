import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PermissionGate } from "@/components/PermissionGate";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useAudit } from "@/hooks/useAudit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Plus, Trash2 } from "lucide-react";
import { BankAccountService, useBankAccounts, type BankAccount } from "@/lib/quick-create/local-entities";
import { QuickCreateBankAccountDialog } from "@/components/quick-create/QuickCreateBankAccountDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/bank-accounts")({
  head: () => ({ meta: [{ title: "Bank Accounts — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="bank_accounts.view" mode="page">
      <BankAccountsPage />
    </PermissionGate>
  ),
});

function BankAccountsPage() {
  const { lang } = useI18n();
  const { can } = useAuth();
  const audit = useAudit();
  const ar = lang === "ar";
  const accounts = useBankAccounts();
  const [open, setOpen] = useState(false);
  const canManage = can("bank_accounts.manage");

  const typeLabel = (t: BankAccount["type"]) =>
    t === "bank" ? (ar ? "بنك" : "Bank")
    : t === "cash" ? (ar ? "نقدية" : "Cash")
    : (ar ? "عهدة نقدية" : "Petty cash");

  const remove = (b: BankAccount) => {
    BankAccountService.remove(b.id);
    audit.log("bank_account.removed", "bank_account",
      `حذف حساب ${b.name_ar || b.name_en}`, `Removed bank account ${b.name_en || b.name_ar}`, b.id);
    toast.success(ar ? "تم الحذف" : "Removed");
  };

  return (
    <AppShell
      title={ar ? "الحسابات البنكية" : "Bank Accounts"}
      action={canManage ? (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4 me-1" />
          {ar ? "حساب بنكي" : "Bank account"}
        </Button>
      ) : null}
    >
      <div className="card-elevated">
        {accounts.length === 0 ? (
          <EmptyState
            title={ar ? "لا توجد حسابات بنكية بعد" : "No bank accounts yet"}
            hint={ar
              ? "أضف الحسابات البنكية والنقدية الأساسية لتتبع الأرصدة وربطها بسندات القبض والصرف لاحقًا."
              : "Add your primary bank and cash accounts to track balances and link them to receipts and payments later."}
            action={canManage ? (
              <Button onClick={() => setOpen(true)}>
                <Plus className="size-4 me-1" />
                {ar ? "إضافة حساب بنكي" : "Add bank account"}
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-start font-medium px-4 py-3">{ar ? "الاسم" : "Name"}</th>
                  <th className="text-start font-medium px-4 py-3">{ar ? "النوع" : "Type"}</th>
                  <th className="text-start font-medium px-4 py-3">{ar ? "البنك" : "Bank"}</th>
                  <th className="text-start font-medium px-4 py-3">{ar ? "العملة" : "Currency"}</th>
                  <th className="text-end font-medium px-4 py-3">{ar ? "الرصيد (تجريبي)" : "Balance (demo)"}</th>
                  <th className="text-start font-medium px-4 py-3">{ar ? "الحالة" : "Status"}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {accounts.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{ar ? (b.name_ar || b.name_en) : (b.name_en || b.name_ar)}</td>
                    <td className="px-4 py-3">{typeLabel(b.type)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.bank_name || "—"}</td>
                    <td className="px-4 py-3">{b.currency}</td>
                    <td className="px-4 py-3 text-end font-mono">{fmtMoney(b.opening_balance, lang)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={b.status === "active" ? "default" : "secondary"}>
                        {b.status === "active" ? (ar ? "نشط" : "Active") : (ar ? "غير نشط" : "Inactive")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-end">
                      {canManage && (
                        <Button size="sm" variant="ghost" onClick={() => remove(b)} title={ar ? "حذف" : "Remove"}>
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        {ar
          ? "هذه الوحدة تأسيسية — تخزين محلي للعرض التجريبي فقط. لا توجد كتابات فعلية على الباكند ولا تكاملات بنكية حية."
          : "Foundation module — local-only storage for demo. No backend writes and no live bank feeds."}
      </p>

      <QuickCreateBankAccountDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}
