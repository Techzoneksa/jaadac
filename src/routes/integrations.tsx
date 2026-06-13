import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { ModuleFoundationPage } from "@/components/ModuleFoundationPage";
import { useI18n } from "@/lib/i18n";
import { ShoppingBag, Store, Utensils } from "lucide-react";

export const Route = createFileRoute("/integrations")({
  head: () => ({ meta: [{ title: "Integrations — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="integrations.view" mode="page">
      <IntegrationsPage />
    </PermissionGate>
  ),
});

function IntegrationsPage() {
  const { lang } = useI18n();
  const providers = [
    { key: "zid",     ar: "زد",    en: "Zid",     Icon: ShoppingBag, desc_ar: "منصة متاجر إلكترونية سعودية", desc_en: "Saudi e-commerce platform" },
    { key: "salla",   ar: "سلة",   en: "Salla",   Icon: Store,       desc_ar: "منصة متاجر إلكترونية سعودية", desc_en: "Saudi e-commerce platform" },
    { key: "foodics", ar: "فودكس", en: "Foodics", Icon: Utensils,    desc_ar: "نظام نقاط بيع للمطاعم",      desc_en: "Restaurant point-of-sale" },
  ];
  return (
    <ModuleFoundationPage
      titleAr="الربط مع تطبيقات أخرى"
      titleEn="Integrations"
      descAr="ربط JAAD CLOUD مع تطبيقات خارجية. تأسيسي — لا يتم تخزين أي مفاتيح أو تنفيذ أي اتصال فعلي حاليًا."
      descEn="Connect JAAD CLOUD with external apps. Foundation only — no credentials are stored and no real calls are made."
      status="planned"
      availableNow={[
        { ar: "بطاقات تعريفية لمزودي التكاملات", en: "Provider info cards" },
      ]}
      comingLater={[
        { ar: "OAuth وربط آمن مع كل مزود", en: "Secure OAuth flow per provider" },
        { ar: "مزامنة الطلبات والعملاء والمنتجات", en: "Sync orders, customers, products" },
        { ar: "ترحيل تلقائي للحركات إلى المحاسبة", en: "Auto-posting to accounting" },
      ]}
    >
      <div className="grid gap-3 md:grid-cols-3">
        {providers.map(p => (
          <div key={p.key} className="card-elevated p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-md bg-muted flex items-center justify-center">
                <p.Icon className="size-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">{lang === "ar" ? p.ar : p.en}</div>
                <div className="text-xs text-muted-foreground">{lang === "ar" ? p.desc_ar : p.desc_en}</div>
              </div>
            </div>
            <div className="text-xs px-2 py-1 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 inline-block">
              {lang === "ar" ? "مخطط · غير مربوط" : "Planned · not connected"}
            </div>
          </div>
        ))}
      </div>
    </ModuleFoundationPage>
  );
}
