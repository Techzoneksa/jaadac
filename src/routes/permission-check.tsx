import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { useAuth, rolePermissions, type Permission } from "@/lib/auth";
import { Check, X, ShieldCheck } from "lucide-react";
import type { UserRole } from "@/lib/store";
import { PermissionGate } from "@/components/PermissionGate";

export const Route = createFileRoute("/permission-check")({
  head: () => ({ meta: [{ title: "Permission Check — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="dashboard.view" mode="page">
      <PermissionCheckPage />
    </PermissionGate>
  ),
});

const roles: UserRole[] = ["owner", "accountant", "sales_employee", "viewer"];

const rows: { ar: string; en: string; check: (perms: Permission[]) => boolean }[] = [
  { ar: "عرض لوحة التحكم", en: "View dashboard", check: (p) => p.includes("dashboard.view") },
  { ar: "إدارة العملاء", en: "Manage customers", check: (p) => p.includes("customers.manage") },
  { ar: "إدارة الموردين", en: "Manage suppliers", check: (p) => p.includes("suppliers.manage") },
  { ar: "إدارة المنتجات والخدمات", en: "Manage items", check: (p) => p.includes("items.manage") },
  { ar: "إدارة عروض الأسعار", en: "Manage quotations", check: (p) => p.includes("quotations.manage") },
  { ar: "اعتماد الفواتير", en: "Issue invoices", check: (p) => p.includes("invoices.issue") },
  { ar: "تسجيل سندات قبض", en: "Record receipts", check: (p) => p.includes("receipts.manage") },
  { ar: "تسجيل سندات صرف", en: "Record payments", check: (p) => p.includes("payments.manage") },
  { ar: "إدارة شجرة الحسابات", en: "Manage chart of accounts", check: (p) => p.includes("accounts.manage") },
  { ar: "ترحيل القيود", en: "Post journals", check: (p) => p.includes("journal.post") },
  { ar: "عرض التقارير", en: "View reports", check: (p) => p.includes("reports.view") },
  { ar: "إدارة الإعدادات", en: "Manage settings", check: (p) => p.includes("settings.manage") },
  { ar: "إدارة المستخدمين", en: "Manage users", check: (p) => p.includes("users.manage") },
  { ar: "إعادة تعيين البيانات التجريبية", en: "Reset demo data", check: (p) => p.includes("demo.reset") },
  { ar: "عرض سجل المراجعة", en: "View audit log", check: (p) => p.includes("audit.view") },
  // Phase 2.2
  { ar: "إدارة نماذج المستندات", en: "Manage document templates", check: (p) => p.includes("templates.manage") },
  { ar: "إدارة الحقول المخصصة", en: "Manage custom fields", check: (p) => p.includes("custom_fields.manage") },
  { ar: "عرض الموظفين", en: "View employees", check: (p) => p.includes("employees.view") },
  { ar: "إدارة الموظفين", en: "Manage employees", check: (p) => p.includes("employees.manage") },
  { ar: "عرض الرواتب", en: "View payroll", check: (p) => p.includes("payroll.view") },
  { ar: "إدارة الرواتب", en: "Manage payroll", check: (p) => p.includes("payroll.manage") },
  { ar: "عرض الفروع", en: "View branches", check: (p) => p.includes("branches.view") },
  { ar: "إدارة الفروع", en: "Manage branches", check: (p) => p.includes("branches.manage") },
  { ar: "عرض التواصل الداخلي", en: "View internal communication", check: (p) => p.includes("communication.view") },
  { ar: "إدارة التواصل الداخلي", en: "Manage internal communication", check: (p) => p.includes("communication.manage") },
  { ar: "التعديل المجمع", en: "Bulk edit", check: (p) => p.includes("bulk_edit.manage") },
  { ar: "استخدام الإجراءات السريعة", en: "Use quick actions", check: (p) => p.includes("quick_actions.use") },
];

function PermissionCheckPage() {
  const { t, lang } = useI18n();
  const { session, tenant, user } = useAuth();

  return (
    <AppShell title={lang === "ar" ? "فحص الصلاحيات" : "Permission Check"}>
      <div className="space-y-5">
        <div className="card-elevated p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4 text-primary" />
            <span className="font-medium">{lang === "ar" ? "المستخدم الحالي:" : "Current user:"}</span>
            <span>{user?.name || "—"}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-medium">{lang === "ar" ? "الدور:" : "Role:"}</span>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{t(session?.role || "viewer")}</span>
          </div>
          {tenant && (
            <div className="text-xs text-muted-foreground">
              {lang === "ar" ? tenant.name_ar : tenant.name_en}
            </div>
          )}
        </div>

        <div className="card-elevated overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start font-medium px-4 py-3">{lang === "ar" ? "القدرة" : "Capability"}</th>
                {roles.map((r) => (
                  <th key={r} className="text-center font-medium px-4 py-3">{t(r)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.en} className="hover:bg-muted/30">
                  <td className="px-4 py-3">{lang === "ar" ? row.ar : row.en}</td>
                  {roles.map((r) => {
                    const allowed = row.check(rolePermissions(r));
                    return (
                      <td key={r} className="px-4 py-3 text-center">
                        {allowed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                            <Check className="size-3" />{lang === "ar" ? "مسموح" : "Allowed"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                            <X className="size-3" />{lang === "ar" ? "ممنوع" : "Denied"}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
