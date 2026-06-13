import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { ModuleFoundationPage } from "@/components/ModuleFoundationPage";

export const Route = createFileRoute("/sales-orders")({
  head: () => ({ meta: [{ title: "Sales Orders — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="sales_orders.view" mode="page">
      <ModuleFoundationPage
        titleAr="أوامر البيع"
        titleEn="Sales Orders"
        descAr="إدارة أوامر البيع وتحويلها إلى فواتير. هذه الواجهة تأسيسية ضمن وحدة المبيعات."
        descEn="Manage sales orders and convert them to invoices. This is a foundation page within the Sales module."
        status="foundation"
        availableNow={[
          { ar: "صفحة قائمة فارغة جاهزة للتعبئة", en: "Empty list page ready to be populated" },
          { ar: "هيكل صلاحيات (عرض/إدارة)", en: "Permission structure (view/manage)" },
          { ar: "تتبع تدفق الحالة كمسودة → مؤكد → مُسلّم", en: "Status flow draft → confirmed → delivered (placeholder)" },
        ]}
        comingLater={[
          { ar: "إنشاء أوامر البيع بكامل التفاصيل", en: "Full sales order creation with line items" },
          { ar: "تحويل أمر البيع إلى فاتورة مبيعات بنقرة", en: "One-click convert to sales invoice" },
          { ar: "ربط بالمخزون والتوصيل", en: "Linkage with inventory and delivery notes" },
        ]}
      />
    </PermissionGate>
  ),
});
