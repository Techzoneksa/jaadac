import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { PermissionGate } from "@/components/PermissionGate";
import { useStore } from "@/lib/store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/employees")({
  head: () => ({ meta: [{ title: "Employees & Payroll — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perms={["employees.view", "payroll.view"]} mode="page">
      <EmployeesPage />
    </PermissionGate>
  ),
});

function EmployeesPage() {
  const { t, lang } = useI18n();
  const s = useStore((x) => x);

  return (
    <AppShell title={t("employees_payroll")}>
      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">{t("employees")}</TabsTrigger>
          <TabsTrigger value="payroll">{t("payroll_runs")}</TabsTrigger>
          <TabsTrigger value="claims">{t("expense_claims")}</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-5">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => toast.info(lang === "ar" ? "إضافة موظف (ديمو)" : "Add employee (demo)")}>
              <Plus className="size-4 me-1" />{t("create")}
            </Button>
          </div>
          <div className="card-elevated overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "الاسم" : "Name"}</th>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "الوظيفة" : "Job Title"}</th>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "القسم" : "Department"}</th>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "الفرع" : "Branch"}</th>
                  <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "الراتب" : "Salary"}</th>
                  <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "بدلات" : "Allowances"}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {s.employees.map((e) => {
                  const br = s.branches.find((b) => b.id === e.branch_id);
                  return (
                    <tr key={e.id}>
                      <td className="px-4 py-2">{e.name}</td>
                      <td className="px-4 py-2">{e.job_title || "—"}</td>
                      <td className="px-4 py-2">{e.department || "—"}</td>
                      <td className="px-4 py-2">{br ? (lang === "ar" ? br.name_ar : br.name_en) : "—"}</td>
                      <td className="px-4 py-2 text-end font-mono">{fmtMoney(e.basic_salary, lang)}</td>
                      <td className="px-4 py-2 text-end font-mono">{fmtMoney(e.allowances, lang)}</td>
                      <td className="px-4 py-2"><StatusBadge status={e.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="mt-5">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => toast.info(lang === "ar" ? "تشغيل راتب (ديمو)" : "New payroll run (demo)")}>
              <Plus className="size-4 me-1" />{t("create")}
            </Button>
          </div>
          <div className="card-elevated overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "الشهر" : "Month"}</th>
                  <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "موظفون" : "Employees"}</th>
                  <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "إجمالي" : "Gross"}</th>
                  <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "خصومات" : "Deductions"}</th>
                  <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "صافي" : "Net"}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {s.payroll_runs.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">{String(p.month).padStart(2, "0")}/{p.year}</td>
                    <td className="px-4 py-2 text-end">{p.employees_count}</td>
                    <td className="px-4 py-2 text-end font-mono">{fmtMoney(p.gross, lang)}</td>
                    <td className="px-4 py-2 text-end font-mono">{fmtMoney(p.deductions, lang)}</td>
                    <td className="px-4 py-2 text-end font-mono">{fmtMoney(p.net, lang)}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground/80">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="claims" className="mt-5">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => toast.info(lang === "ar" ? "مطالبة جديدة (ديمو)" : "New claim (demo)")}>
              <Plus className="size-4 me-1" />{t("create")}
            </Button>
          </div>
          <div className="card-elevated overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "الموظف" : "Employee"}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("date")}</th>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "الفئة" : "Category"}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("amount")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {s.expense_claims.map((c) => {
                  const emp = s.employees.find((e) => e.id === c.employee_id);
                  return (
                    <tr key={c.id}>
                      <td className="px-4 py-2">{emp?.name || "—"}</td>
                      <td className="px-4 py-2">{c.date}</td>
                      <td className="px-4 py-2">{c.category}</td>
                      <td className="px-4 py-2 text-end font-mono">{fmtMoney(c.amount, lang)}</td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground/80">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
