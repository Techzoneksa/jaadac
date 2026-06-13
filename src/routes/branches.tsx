import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { PermissionGate } from "@/components/PermissionGate";
import { useStore } from "@/lib/store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, UserX, MessageCircle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/branches")({
  head: () => ({ meta: [{ title: "Branches & Team — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perms={["branches.view", "users.manage"]} mode="page">
      <BranchesPage />
    </PermissionGate>
  ),
});

function BranchesPage() {
  const { t, lang } = useI18n();
  const s = useStore((x) => x);
  const { tenant } = useAuth();
  const placeholder = (msg: string) => toast.info(msg);

  return (
    <AppShell title={t("businesses_branches")}>
      <Tabs defaultValue="branches">
        <TabsList>
          <TabsTrigger value="branches">{t("branches")}</TabsTrigger>
          <TabsTrigger value="organizations">{lang === "ar" ? "الأعمال" : "Organizations"}</TabsTrigger>
          <TabsTrigger value="team">{t("team_roles")}</TabsTrigger>
        </TabsList>

        <TabsContent value="branches" className="mt-5">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => placeholder(lang === "ar" ? "إضافة فرع (ديمو)" : "Add branch (demo)")}>
              <Plus className="size-4 me-1" />{t("create")}
            </Button>
          </div>
          <div className="card-elevated overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "الفرع" : "Branch"}</th>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "المدينة" : "City"}</th>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "العنوان" : "Address"}</th>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "الهاتف" : "Phone"}</th>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "المسؤول" : "Manager"}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {s.branches.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-2">{lang === "ar" ? b.name_ar : b.name_en}</td>
                    <td className="px-4 py-2">{b.city || "—"}</td>
                    <td className="px-4 py-2">{b.address || "—"}</td>
                    <td className="px-4 py-2 font-mono">{b.phone || "—"}</td>
                    <td className="px-4 py-2">{b.manager || "—"}</td>
                    <td className="px-4 py-2"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="organizations" className="mt-5">
          <div className="card-elevated p-4">
            <div className="text-sm font-medium mb-2">{lang === "ar" ? "المؤسسة الحالية" : "Current organization"}</div>
            <div className="text-sm">{tenant ? (lang === "ar" ? tenant.name_ar : tenant.name_en) : "—"}</div>
            <p className="text-xs text-muted-foreground mt-3">
              {lang === "ar" ? "تبديل المؤسسات متاح من قائمة المستخدم." : "Switch organizations from the user menu."}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-5">
          <div className="flex justify-end mb-3 gap-2">
            <Button size="sm" variant="outline" onClick={() => placeholder(lang === "ar" ? "دعوة مستخدم (ديمو)" : "Invite user (demo)")}>
              <UserPlus className="size-4 me-1" />{lang === "ar" ? "دعوة" : "Invite"}
            </Button>
          </div>
          <div className="card-elevated overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "الاسم" : "Name"}</th>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "البريد" : "Email"}</th>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "الدور" : "Role"}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {s.users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{t(u.role)}</td>
                    <td className="px-4 py-2"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-2 text-end">
                      <Button size="sm" variant="ghost" onClick={() => placeholder(lang === "ar" ? "تغيير الدور (ديمو)" : "Change role (demo)")}>
                        {lang === "ar" ? "تغيير الدور" : "Change role"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => placeholder(lang === "ar" ? "تعطيل (ديمو)" : "Deactivate (demo)")}>
                        <UserX className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => placeholder(lang === "ar" ? "تواصل (ديمو)" : "Contact (demo)")}>
                        <MessageCircle className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
