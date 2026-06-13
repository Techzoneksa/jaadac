import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { ModuleFoundationPage } from "@/components/ModuleFoundationPage";

export const Route = createFileRoute("/purchase-orders")({
  head: () => ({ meta: [{ title: "Purchase Orders — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="purchase_orders.view" mode="page">
      <ModuleFoundationPage
        titleAr="أوامر الشراء"
        titleEn="Purchase Orders"
        descAr="إدارة أوامر الشراء للموردين قبل استلام الفواتير. مسار الحالة: مسودة → معتمد → مستلم → مفوتر."
        descEn="Manage supplier purchase orders before invoice receipt. Status flow: draft → approved → received → billed."
        status="foundation"
        availableNow={[
          { ar: "هيكل الحالات الأربع", en: "Four-status workflow scaffold" },
          { ar: "صلاحيات عرض وإدارة", en: "View and manage permissions" },
        ]}
        comingLater={[
          { ar: "إنشاء أمر شراء كامل البنود", en: "Full purchase order line-item creation" },
          { ar: "تحويل تلقائي إلى فاتورة مشتريات", en: "Auto-convert to purchase invoice" },
          { ar: "ربط بإدارة المخزون والاستلامات", en: "Inventory & goods receipt linkage" },
        ]}
      />
    </PermissionGate>
  ),
});
