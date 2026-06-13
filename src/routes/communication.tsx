import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { PermissionGate } from "@/components/PermissionGate";
import { useStore } from "@/lib/store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/communication")({
  head: () => ({ meta: [{ title: "Internal Communication — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="communication.view" mode="page">
      <CommunicationPage />
    </PermissionGate>
  ),
});

function CommunicationPage() {
  const { t, lang } = useI18n();
  const s = useStore((x) => x);

  return (
    <AppShell title={t("internal_communication")}>
      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="announcements">{t("announcements")}</TabsTrigger>
          <TabsTrigger value="notes">{t("internal_notes")}</TabsTrigger>
          <TabsTrigger value="templates">{lang === "ar" ? "قوالب الرسائل" : "Message Templates"}</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="mt-5">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => toast.info(lang === "ar" ? "إعلان جديد (ديمو)" : "New announcement (demo)")}>
              <Plus className="size-4 me-1" />{t("create")}
            </Button>
          </div>
          <div className="space-y-3">
            {s.announcements.length === 0 && (
              <div className="card-elevated p-6 text-center text-sm text-muted-foreground">{t("empty")}</div>
            )}
            {s.announcements.map((a) => (
              <div key={a.id} className="card-elevated p-4">
                <div className="font-semibold">{lang === "ar" ? a.title_ar : a.title_en}</div>
                <div className="text-sm mt-1">{lang === "ar" ? a.body_ar : a.body_en}</div>
                <div className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-5">
          <div className="card-elevated p-6 text-center text-sm text-muted-foreground">
            {lang === "ar"
              ? "الملاحظات الداخلية ستظهر هنا. أساس فقط في هذه المرحلة."
              : "Internal notes will appear here. Foundation only."}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {s.message_templates.map((m) => (
              <div key={m.id} className="card-elevated p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {m.channel === "email" ? <Mail className="size-4" /> : <MessageSquare className="size-4" />}
                  <span>{m.channel.toUpperCase()}</span>
                  <span>·</span>
                  <span>{t(m.doc_type === "quotation" ? "quotations" : m.doc_type === "invoice" ? "invoices" : m.doc_type === "receipt" ? "receipts" : "payments")}</span>
                </div>
                {m.subject_ar && (
                  <div className="text-sm font-medium">{lang === "ar" ? m.subject_ar : m.subject_en}</div>
                )}
                <div className="text-sm whitespace-pre-wrap">{lang === "ar" ? m.body_ar : m.body_en}</div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
