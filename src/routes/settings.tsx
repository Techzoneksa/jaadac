import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { SettingsService } from "@/lib/services";
import { useAuth } from "@/lib/auth";
import { PermissionGate } from "@/components/PermissionGate";
import { useAudit } from "@/hooks/useAudit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="settings.view" mode="page">
      <SettingsPage />
    </PermissionGate>
  ),
});

function SettingsPage() {
  const { t } = useI18n();
  const { can } = useAuth();
  const audit = useAudit();
  const company = useStore((s) => s.company);
  const tax = useStore((s) => s.tax);
  const numbering = useStore((s) => s.numbering);
  const users = useStore((s) => s.users);

  const [c, setC] = useState(company);
  const [tx, setTx] = useState(tax);
  const [n, setN] = useState(numbering);

  const canEdit = can("settings.manage");
  const canReset = can("demo.reset");
  const canUsers = can("users.manage");

  const saveCompany = () => {
    SettingsService.updateCompany(c);
    audit.log("settings.company_updated", "settings", "تحديث إعدادات الشركة", "Company settings updated");
    toast.success(t("saved"));
  };
  const saveTax = () => {
    SettingsService.updateTax(tx);
    audit.log("settings.tax_updated", "settings", "تحديث إعدادات الضريبة", "Tax settings updated");
    toast.success(t("saved"));
  };
  const saveNumbering = () => {
    SettingsService.updateNumbering(n);
    audit.log("settings.numbering_updated", "settings", "تحديث ترقيم المستندات", "Numbering settings updated");
    toast.success(t("saved"));
  };

  const resetAction = canReset ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm"><RefreshCw className="size-4 me-1" />{t("reset_demo")}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("reset_demo")}</AlertDialogTitle>
          <AlertDialogDescription>{t("reset_demo_confirm")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            audit.log("settings.demo_reset", "settings", "إعادة تعيين البيانات التجريبية", "Demo data reset");
            SettingsService.resetDemo();
            toast.success(t("saved"));
            setTimeout(() => window.location.reload(), 300);
          }}>
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;

  return (
    <AppShell title={t("settings")} action={resetAction}>
      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">{t("company_settings")}</TabsTrigger>
          <TabsTrigger value="tax">{t("tax_settings")}</TabsTrigger>
          <TabsTrigger value="numbering">{t("numbering")}</TabsTrigger>
          <TabsTrigger value="users">{t("users_roles")}</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-5">
          <div className="card-elevated p-6 grid md:grid-cols-2 gap-4 max-w-3xl">
            <div className="space-y-1.5"><Label>{t("company_name")}</Label><Input disabled={!canEdit} value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("vat_number")}</Label><Input disabled={!canEdit} value={c.vat || ""} onChange={(e) => setC({ ...c, vat: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("cr_number")}</Label><Input disabled={!canEdit} value={c.cr || ""} onChange={(e) => setC({ ...c, cr: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("email")}</Label><Input disabled={!canEdit} value={c.email || ""} onChange={(e) => setC({ ...c, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("mobile")}</Label><Input disabled={!canEdit} value={c.mobile || ""} onChange={(e) => setC({ ...c, mobile: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("city")}</Label><Input disabled={!canEdit} value={c.city || ""} onChange={(e) => setC({ ...c, city: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("country")}</Label><Input disabled={!canEdit} value={c.country} onChange={(e) => setC({ ...c, country: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("currency")}</Label><Input disabled={!canEdit} value={c.currency} onChange={(e) => setC({ ...c, currency: e.target.value })} /></div>
            <div className="md:col-span-2 space-y-1.5"><Label>{t("address")}</Label><Input disabled={!canEdit} value={c.address || ""} onChange={(e) => setC({ ...c, address: e.target.value })} /></div>
            {canEdit && <div className="md:col-span-2"><Button onClick={saveCompany}>{t("save")}</Button></div>}
          </div>
        </TabsContent>

        <TabsContent value="tax" className="mt-5">
          <div className="card-elevated p-6 space-y-5 max-w-xl">
            <div className="flex items-center justify-between">
              <Label>{t("enable_vat")}</Label>
              <Switch disabled={!canEdit} checked={tx.enable_vat} onCheckedChange={(v) => setTx({ ...tx, enable_vat: v })} />
            </div>
            <div className="space-y-1.5"><Label>{t("default_vat")} (%)</Label><Input disabled={!canEdit} type="number" value={tx.default_vat} onChange={(e) => setTx({ ...tx, default_vat: +e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("invoice_type")}</Label><Input value={t("simplified_tax")} disabled /></div>
            <div className="flex items-center justify-between">
              <Label>{t("show_qr")}</Label>
              <Switch disabled={!canEdit} checked={tx.show_qr} onCheckedChange={(v) => setTx({ ...tx, show_qr: v })} />
            </div>
            {canEdit && <Button onClick={saveTax}>{t("save")}</Button>}
          </div>
        </TabsContent>

        <TabsContent value="numbering" className="mt-5">
          <div className="card-elevated p-6 grid md:grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-1.5"><Label>{t("quotations")}</Label><Input disabled={!canEdit} value={n.quotation} onChange={(e) => setN({ ...n, quotation: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("invoices")}</Label><Input disabled={!canEdit} value={n.invoice} onChange={(e) => setN({ ...n, invoice: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("receipts")}</Label><Input disabled={!canEdit} value={n.receipt} onChange={(e) => setN({ ...n, receipt: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("payments")}</Label><Input disabled={!canEdit} value={n.payment} onChange={(e) => setN({ ...n, payment: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("journal_entries")}</Label><Input disabled={!canEdit} value={n.journal} onChange={(e) => setN({ ...n, journal: e.target.value })} /></div>
            {canEdit && <div className="md:col-span-2"><Button onClick={saveNumbering}>{t("save")}</Button></div>}
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-5">
          {!canUsers ? (
            <div className="card-elevated p-6 text-sm text-muted-foreground">{t("no_permission_action")}</div>
          ) : (
            <div className="card-elevated overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">{t("name")}</th>
                    <th className="px-4 py-3 text-start font-medium">{t("email")}</th>
                    <th className="px-4 py-3 text-start font-medium">{t("role")}</th>
                    <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">{t(u.role)}</td>
                      <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
