import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { useStore, newId, type Task } from "@/lib/store";
import { TaskService } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { PermissionGate } from "@/components/PermissionGate";
import { useAuth } from "@/lib/auth";
import { useAudit } from "@/hooks/useAudit";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="tasks.view" mode="page">
      <TasksPage />
    </PermissionGate>
  ),
});

const statuses = ["task_new", "in_progress", "completed", "deferred"] as const;

function TasksPage() {
  const { t } = useI18n();
  const tasks = useStore((s) => s.tasks);
  const [open, setOpen] = useState(false);
  const [pf, setPf] = useState<string>("all");
  const [sf, setSf] = useState<string>("all");

  const { can } = useAuth();
  const canManage = can("tasks.manage");

  const filtered = tasks.filter((t) =>
    (pf === "all" || t.priority === pf) && (sf === "all" || t.status === sf)
  );

  return (
    <AppShell title={t("tasks")} action={canManage ? <Button onClick={() => setOpen(true)}><Plus className="size-4 me-1" />{t("new")}</Button> : null}>
      <div className="flex gap-3 mb-4">
        <Select value={pf} onValueChange={setPf}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t("priority")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("priority")}: {t("all")}</SelectItem>
            {["low", "medium", "high"].map((p) => <SelectItem key={p} value={p}>{t(p)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sf} onValueChange={setSf}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t("status")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("status")}: {t("all")}</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{t(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">{t("list")}</TabsTrigger>
          <TabsTrigger value="board">{t("board")}</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <div className="card-elevated divide-y">
            {filtered.map((task) => (
              <div key={task.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{task.assigned} · {task.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={task.priority} />
                  <StatusBadge status={task.status} />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="board" className="mt-4">
          <div className="grid md:grid-cols-4 gap-4">
            {statuses.map((s) => (
              <div key={s} className="card-elevated p-3 min-h-48">
                <div className="font-medium text-sm mb-3 flex items-center justify-between">
                  {t(s)} <span className="text-xs text-muted-foreground">{filtered.filter((x) => x.status === s).length}</span>
                </div>
                <div className="space-y-2">
                  {filtered.filter((x) => x.status === s).map((task) => (
                    <div key={task.id} className="p-3 rounded-md bg-muted/40 border text-sm">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                        <span>{task.assigned}</span>
                        <StatusBadge status={task.priority} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {canManage && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xl">
            {open && <TaskForm onDone={() => setOpen(false)} />}
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}

function TaskForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const audit = useAudit();
  const [form, setForm] = useState<Task>({
    id: newId(), title: "", assigned: "", date: new Date().toISOString().slice(0, 10),
    priority: "medium", status: "task_new",
  });
  const submit = () => {
    if (!form.title) { toast.error(t("title")); return; }
    TaskService.create(form);
    audit.log("task.created", "task", `إنشاء مهمة: ${form.title}`, `Created task: ${form.title}`, form.id);
    toast.success(t("save")); onDone();
  };
  return (
    <>
      <DialogHeader><DialogTitle>{t("new")} — {t("tasks")}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5"><Label>{t("title")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="col-span-2 space-y-1.5"><Label>{t("description")}</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>{t("assigned")}</Label><Input value={form.assigned} onChange={(e) => setForm({ ...form, assigned: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>{t("date")}</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div className="space-y-1.5">
          <Label>{t("priority")}</Label>
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Task["priority"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["low", "medium", "high"].map((p) => <SelectItem key={p} value={p}>{t(p)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("status")}</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Task["status"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{t(s)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>{t("cancel")}</Button>
        <Button onClick={submit}>{t("save")}</Button>
      </DialogFooter>
    </>
  );
}
