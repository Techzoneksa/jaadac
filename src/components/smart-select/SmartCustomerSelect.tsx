import { useCallback } from "react";
import { useStore, type Customer } from "@/lib/store";
import { CustomerService } from "@/lib/services";
import { CustomerSearchService } from "@/lib/services/smart-search";
import { UsageTrackingService } from "@/lib/usage-tracking";
import { useI18n } from "@/lib/i18n";
import { SmartEntityCombobox, type SmartOption } from "./SmartEntityCombobox";

function toOption(c: Customer, lang: "ar" | "en"): SmartOption<Customer> {
  const name = lang === "ar" ? c.name_ar : c.name_en;
  const altName = lang === "ar" ? c.name_en : c.name_ar;
  const sub = [c.mobile, c.email].filter(Boolean).join(" · ");
  return {
    id: c.id,
    primary: name || altName || "—",
    secondary: sub || altName,
    trailing: c.vat ? <span className="text-muted-foreground font-mono">VAT {c.vat}</span> : undefined,
    data: c,
  };
}

export function SmartCustomerSelect({
  value, onChange, disabled, allowClear,
}: {
  value: string | undefined;
  onChange: (id: string | undefined, customer?: Customer) => void;
  disabled?: boolean;
  allowClear?: boolean;
}) {
  const { t, lang } = useI18n();
  // subscribe so re-renders happen when customers list changes
  useStore((s) => s.customers);

  const fetcher = useCallback((q: string) => {
    const r = CustomerSearchService.searchSmart(q, { limit: q.trim() ? 10 : 6 });
    return { items: r.items.map((c) => toOption(c, lang)), source: r.meta.source };
  }, [lang]);

  const resolveLabel = useCallback((id: string) => {
    const c = CustomerService.getById(id);
    return c ? toOption(c, lang) : undefined;
  }, [lang]);

  const handle = (id: string | undefined, data: Customer | undefined) => {
    if (id) UsageTrackingService.recordSelection("customer", id);
    onChange(id, data);
  };

  return (
    <SmartEntityCombobox<Customer>
      value={value}
      onChange={handle}
      fetcher={fetcher}
      resolveLabel={resolveLabel}
      placeholder={t("smart_search_customer")}
      searchPlaceholder={t("smart_search_customer")}
      emptyText={t("smart_no_results")}
      suggestionsHeader={t("smart_recent_customers")}
      disabled={disabled}
      allowClear={allowClear}
    />
  );
}
