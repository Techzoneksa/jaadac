import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { ModuleFoundationPage } from "@/components/ModuleFoundationPage";
import { useI18n } from "@/lib/i18n";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/zatca")({
  head: () => ({ meta: [{ title: "ZATCA Integration — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="zatca.view" mode="page">
      <ZatcaPage />
    </PermissionGate>
  ),
});

function ZatcaPage() {
  const { lang } = useI18n();
  return (
    <ModuleFoundationPage
      titleAr="ربط هيئة الزكاة والضريبة"
      titleEn="ZATCA Integration"
      descAr="جاهزية ربط فواتير المرحلة الأولى (QR للفواتير المبسطة) والمرحلة الثانية (الفوترة المتكاملة). لا يوجد ادعاء امتثال رسمي بعد."
      descEn="Readiness for ZATCA Phase 1 (simplified-invoice QR) and Phase 2 (integrated e-invoicing). No official compliance is claimed yet."
      status="foundation"
      availableNow={[
        { ar: "توليد QR للفواتير المبسطة في الواجهة (تجريبي)", en: "Simplified-invoice QR in UI (demo)" },
        { ar: "حقول البائع والمشتري الأساسية", en: "Core seller & buyer fields" },
      ]}
      comingLater={[
        { ar: "ربط رسمي مع بوابة هيئة الزكاة (Phase 2)", en: "Official ZATCA gateway integration (Phase 2)" },
        { ar: "توقيع رقمي بشهادات ZATCA", en: "Digital signing with ZATCA certificates" },
        { ar: "نقل XML للفواتير الإلكترونية", en: "E-invoice XML clearance/reporting" },
      ]}
    >
      <div className="card-elevated p-5">
        <Tabs defaultValue="p1">
          <TabsList>
            <TabsTrigger value="p1">{lang === "ar" ? "المرحلة الأولى" : "Phase 1"}</TabsTrigger>
            <TabsTrigger value="p2">{lang === "ar" ? "المرحلة الثانية" : "Phase 2"}</TabsTrigger>
          </TabsList>
          <TabsContent value="p1" className="pt-4 text-sm space-y-2">
            <p>{lang === "ar"
              ? "جاهزية فواتير الجيل الأول مع QR code للفواتير المبسطة. متوفر في صفحة الفواتير."
              : "Generation-1 readiness with QR for simplified invoices. Available on the invoice page."}</p>
          </TabsContent>
          <TabsContent value="p2" className="pt-4 text-sm space-y-2">
            <p>{lang === "ar"
              ? "تتطلب إعداد امتثال رسمي وشهادات. قريبًا."
              : "Requires formal compliance setup and certificates. Coming soon."}</p>
          </TabsContent>
        </Tabs>
      </div>
    </ModuleFoundationPage>
  );
}
