import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { PermissionGate } from "@/components/PermissionGate";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/audit-log")({
  head: () => ({ meta: [{ title: "Audit Log — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="audit.view" mode="page">
      <AuditLogPage />
    </PermissionGate>
  ),
});

function AuditLogPage() {
  const { t, lang } = useI18n();
  const { session } = useAuth();
  const all = useStore((s) => s.audit_log);
  const users = useStore((s) => s.users);

  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const list = useMemo(() => {
    return [...all]
      .filter((a) => !session || a.tenant_id === session.tenant_id)
      .filter((a) => actionFilter === "all" || a.action === actionFilter)
      .filter((a) => entityFilter === "all" || a.entity_type === entityFilter)
      .filter((a) => userFilter === "all" || a.user_id === userFilter)
      .filter((a) => !from || a.created_at.slice(0, 10) >= from)
      .filter((a) => !to || a.created_at.slice(0, 10) <= to)
      .filter((a) => {
        if (!q) return true;
        const s = q.toLowerCase();
        return (
          a.action.toLowerCase().includes(s) ||
          a.entity_type.toLowerCase().includes(s) ||
          a.description_ar.toLowerCase().includes(s) ||
          a.description_en.toLowerCase().includes(s)
        );
      })
      .reverse();
  }, [all, session, actionFilter, entityFilter, userFilter, from, to, q]);

  const actions = useMemo(() => Array.from(new Set(all.map((a) => a.action))).sort(), [all]);
  const entities = useMemo(() => Array.from(new Set(all.map((a) => a.entity_type))).sort(), [all]);

  const clearFilters = () => {
    setQ(""); setActionFilter("all"); setEntityFilter("all"); setUserFilter("all"); setFrom(""); setTo("");
  };

  return (
    <AppShell title={t("audit_log")}>
      <div className="card-elevated mb-4 p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
        <Input placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} className="md:col-span-2" />
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger><SelectValue placeholder={t("action_label")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")} — {t("action_label")}</SelectItem>
            {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger><SelectValue placeholder={t("entity")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")} — {t("entity")}</SelectItem>
            {entities.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger><SelectValue placeholder={t("user_label")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")} — {t("user_label")}</SelectItem>
            {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2 md:col-span-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder={t("from_date")} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder={t("to_date")} />
        </div>
        <div className="md:col-span-6 flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>{t("reset_filters")}</Button>
        </div>
      </div>

      <div className="card-elevated">
        {list.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("date")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("user_label")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("action_label")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("entity")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("description")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.map((a) => {
                  const u = users.find((x) => x.id === a.user_id);
                  return (
                    <tr key={a.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{new Date(a.created_at).toLocaleString("en-US")}</td>
                      <td className="px-4 py-3">{u?.name || a.user_id}</td>
                      <td className="px-4 py-3 font-mono text-xs">{a.action}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{a.entity_type}{a.entity_id ? ` · ${a.entity_id}` : ""}</td>
                      <td className="px-4 py-3">{lang === "ar" ? a.description_ar : a.description_en}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
