import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { ModuleFoundationPage } from "@/components/ModuleFoundationPage";
import { useI18n } from "@/lib/i18n";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Inventory — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="inventory.view" mode="page">
      <InventoryPage />
    </PermissionGate>
  ),
});

function InventoryPage() {
  const { lang } = useI18n();
  return (
    <ModuleFoundationPage
      titleAr="إدارة المخزون"
      titleEn="Inventory Management"
      descAr="إطار تأسيسي لإدارة المخزون: المواقع، سندات التسليم والاستلام، وجرد المخزون. لا توجد حركات مخزون فعلية أو احتساب تكلفة في هذه المرحلة."
      descEn="Foundation framework for inventory: locations, delivery & receipt notes, and stock counts. No real stock movements or costing are computed yet."
      status="foundation"
      availableNow={[
        { ar: "صفحة نظرة عامة بتبويبات الأقسام الفرعية", en: "Overview page with sub-area tabs" },
        { ar: "صلاحيات عرض وإدارة المخزون", en: "Inventory view/manage permissions" },
      ]}
      comingLater={[
        { ar: "حركات مخزون كاملة مع التكلفة", en: "Full stock movements with costing" },
        { ar: "تعدد المواقع والمستودعات", en: "Multi-location warehouses" },
        { ar: "تقارير المخزون التفصيلية", en: "Detailed inventory reports" },
      ]}
    >
      <div className="card-elevated p-5">
        <Tabs defaultValue="locations">
          <TabsList>
            <TabsTrigger value="locations">{lang === "ar" ? "المواقع" : "Locations"}</TabsTrigger>
            <TabsTrigger value="notes">{lang === "ar" ? "سندات التسليم والاستلام" : "Delivery & Receipt Notes"}</TabsTrigger>
            <TabsTrigger value="count">{lang === "ar" ? "جرد المخزون" : "Stock Count"}</TabsTrigger>
          </TabsList>
          <TabsContent value="locations" className="pt-4 text-sm text-muted-foreground">
            {lang === "ar" ? "إدارة المواقع والمستودعات — تأسيسي." : "Locations & warehouses — foundation."}
          </TabsContent>
          <TabsContent value="notes" className="pt-4 text-sm text-muted-foreground">
            {lang === "ar" ? "سندات التسليم والاستلام — تأسيسي." : "Delivery & receipt notes — foundation."}
          </TabsContent>
          <TabsContent value="count" className="pt-4 text-sm text-muted-foreground">
            {lang === "ar" ? "جرد المخزون الدوري — تأسيسي." : "Periodic stock count — foundation."}
          </TabsContent>
        </Tabs>
      </div>
    </ModuleFoundationPage>
  );
}
