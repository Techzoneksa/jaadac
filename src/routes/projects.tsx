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
import { ProjectService, useProjects, type Project } from "@/lib/quick-create/local-entities";
import { QuickCreateProjectDialog } from "@/components/quick-create/QuickCreateProjectDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Projects — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="projects.view" mode="page">
      <ProjectsPage />
    </PermissionGate>
  ),
});

function ProjectsPage() {
  const { lang } = useI18n();
  const { can } = useAuth();
  const audit = useAudit();
  const ar = lang === "ar";
  const projects = useProjects();
  const [open, setOpen] = useState(false);
  const canManage = can("projects.manage");

  const statusLabel = (s: Project["status"]) =>
    s === "active" ? (ar ? "نشط" : "Active")
    : s === "on_hold" ? (ar ? "متوقف" : "On hold")
    : (ar ? "مكتمل" : "Completed");

  const remove = (p: Project) => {
    ProjectService.remove(p.id);
    audit.log("project.removed", "project", `حذف مشروع ${p.code}`, `Removed project ${p.code}`, p.id);
    toast.success(ar ? "تم الحذف" : "Removed");
  };

  return (
    <AppShell
      title={ar ? "المشاريع" : "Projects"}
      action={canManage ? (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4 me-1" />
          {ar ? "مشروع" : "Project"}
        </Button>
      ) : null}
    >
      <div className="card-elevated">
        {projects.length === 0 ? (
          <EmptyState
            title={ar ? "لا توجد مشاريع بعد" : "No projects yet"}
            hint={ar
              ? "أنشئ مشاريع لتجميع الإيرادات والمصاريف والمستندات حسب المشروع — مفيد لتتبع الربحية لاحقًا."
              : "Create projects to group revenue, expenses, and documents by project — useful for profitability tracking later."}
            action={canManage ? (
              <Button onClick={() => setOpen(true)}>
                <Plus className="size-4 me-1" />
                {ar ? "إضافة مشروع" : "Add project"}
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-start font-medium px-4 py-3">{ar ? "الكود" : "Code"}</th>
                  <th className="text-start font-medium px-4 py-3">{ar ? "الاسم" : "Name"}</th>
                  <th className="text-start font-medium px-4 py-3">{ar ? "المدير" : "Manager"}</th>
                  <th className="text-end font-medium px-4 py-3">{ar ? "الميزانية" : "Budget"}</th>
                  <th className="text-start font-medium px-4 py-3">{ar ? "الحالة" : "Status"}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                    <td className="px-4 py-3 font-medium">{ar ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.manager || "—"}</td>
                    <td className="px-4 py-3 text-end font-mono">{p.budget ? fmtMoney(p.budget, lang) : "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === "active" ? "default" : "secondary"}>{statusLabel(p.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-end">
                      {canManage && (
                        <Button size="sm" variant="ghost" onClick={() => remove(p)}>
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
          ? "هذه الوحدة تأسيسية — تخزين محلي للعرض التجريبي فقط، لا ربط محاسبي كامل بعد."
          : "Foundation module — local-only storage for demo. Full accounting linkage will come later."}
      </p>

      <QuickCreateProjectDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}
