import { useEffect, useState } from "react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { useI18n } from "@/lib/i18n";
import { useAuth, type Permission } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { useNavigate } from "@tanstack/react-router";

type Action = { id: string; ar: string; en: string; to: string; perm: Permission };

const ACTIONS: Action[] = [
  { id: "new-customer", ar: "إضافة عميل", en: "Create customer", to: "/customers", perm: "customers.manage" },
  { id: "new-quotation", ar: "إنشاء عرض سعر", en: "Create quotation", to: "/quotations", perm: "quotations.manage" },
  { id: "new-invoice", ar: "إنشاء فاتورة", en: "Create invoice", to: "/invoices", perm: "invoices.create" },
  { id: "new-receipt", ar: "تسجيل سند قبض", en: "Create receipt", to: "/receipts", perm: "receipts.manage" },
  { id: "new-payment", ar: "تسجيل سند صرف", en: "Create payment", to: "/payments", perm: "payments.manage" },
  { id: "new-task", ar: "مهمة جديدة", en: "Create task", to: "/tasks", perm: "tasks.manage" },
  { id: "open-reports", ar: "فتح التقارير", en: "Open reports", to: "/reports", perm: "reports.view" },
  { id: "open-settings", ar: "فتح الإعدادات", en: "Open settings", to: "/settings", perm: "settings.view" },
];

export function CommandPalette() {
  const { lang } = useI18n();
  const { can } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const s = useStore((x) => x);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => { setOpen(false); navigate({ to: to as never }); };

  const actions = ACTIONS.filter((a) => can(a.perm));

  const results: { group: string; items: { label: string; to: string; perm: Permission }[] }[] = [];
  const push = (group: string, perm: Permission, items: { label: string; to: string }[]) => {
    if (!can(perm) || items.length === 0) return;
    results.push({ group, items: items.slice(0, 5).map((i) => ({ ...i, perm })) });
  };
  push(lang === "ar" ? "العملاء" : "Customers", "customers.view",
    s.customers.map((c) => ({ label: lang === "ar" ? c.name_ar : c.name_en, to: "/customers" })));
  push(lang === "ar" ? "الموردين" : "Suppliers", "suppliers.view",
    s.suppliers.map((c) => ({ label: lang === "ar" ? c.name_ar : c.name_en, to: "/suppliers" })));
  push(lang === "ar" ? "المنتجات" : "Items", "items.view",
    s.items.map((c) => ({ label: lang === "ar" ? c.name_ar : c.name_en, to: "/items" })));
  push(lang === "ar" ? "عروض الأسعار" : "Quotations", "quotations.view",
    s.quotations.map((c) => ({ label: c.number, to: "/quotations" })));
  push(lang === "ar" ? "الفواتير" : "Invoices", "invoices.view",
    s.invoices.map((c) => ({ label: c.number, to: "/invoices" })));
  push(lang === "ar" ? "سندات القبض" : "Receipts", "receipts.view",
    s.receipts.map((c) => ({ label: c.number, to: "/receipts" })));
  push(lang === "ar" ? "سندات الصرف" : "Payments", "payments.view",
    s.payments.map((c) => ({ label: c.number, to: "/payments" })));
  push(lang === "ar" ? "المهام" : "Tasks", "tasks.view",
    s.tasks.map((c) => ({ label: c.title, to: "/tasks" })));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={lang === "ar" ? "ابحث أو نفّذ إجراء..." : "Search or run a command..."} />
      <CommandList>
        <CommandEmpty>{lang === "ar" ? "لا توجد نتائج" : "No results"}</CommandEmpty>
        {actions.length > 0 && (
          <CommandGroup heading={lang === "ar" ? "إجراءات سريعة" : "Quick actions"}>
            {actions.map((a) => (
              <CommandItem key={a.id} onSelect={() => go(a.to)}>
                {lang === "ar" ? a.ar : a.en}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.map((g) => (
          <div key={g.group}>
            <CommandSeparator />
            <CommandGroup heading={g.group}>
              {g.items.map((it, idx) => (
                <CommandItem key={idx} onSelect={() => go(it.to)}>
                  {it.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
