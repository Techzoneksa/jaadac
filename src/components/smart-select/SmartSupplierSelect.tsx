import { useCallback } from "react";
import { useStore, type Supplier } from "@/lib/store";
import { SupplierService } from "@/lib/services";
import { SupplierSearchService } from "@/lib/services/smart-search";
import { UsageTrackingService } from "@/lib/usage-tracking";
import { useI18n } from "@/lib/i18n";
import { SmartEntityCombobox, type SmartOption } from "./SmartEntityCombobox";

function toOption(s: Supplier, lang: "ar" | "en"): SmartOption<Supplier> {
  const name = lang === "ar" ? s.name_ar : s.name_en;
  const altName = lang === "ar" ? s.name_en : s.name_ar;
  const sub = [s.mobile, s.email].filter(Boolean).join(" · ");
  return {
    id: s.id,
    primary: name || altName || "—",
    secondary: sub || altName,
    trailing: s.vat ? <span className="text-muted-foreground font-mono">VAT {s.vat}</span> : undefined,
    data: s,
  };
}

export function SmartSupplierSelect({
  value, onChange, disabled, allowClear,
}: {
  value: string | undefined;
  onChange: (id: string | undefined, supplier?: Supplier) => void;
  disabled?: boolean;
  allowClear?: boolean;
}) {
  const { t, lang } = useI18n();
  useStore((s) => s.suppliers);

  const fetcher = useCallback((q: string) => {
    const r = SupplierSearchService.searchSmart(q, { limit: q.trim() ? 10 : 6 });
    return { items: r.items.map((s) => toOption(s, lang)), source: r.meta.source };
  }, [lang]);

  const resolveLabel = useCallback((id: string) => {
    const s = SupplierService.getById(id);
    return s ? toOption(s, lang) : undefined;
  }, [lang]);

  const handle = (id: string | undefined, data: Supplier | undefined) => {
    if (id) UsageTrackingService.recordSelection("supplier", id);
    onChange(id, data);
  };

  return (
    <SmartEntityCombobox<Supplier>
      value={value}
      onChange={handle}
      fetcher={fetcher}
      resolveLabel={resolveLabel}
      placeholder={t("smart_search_supplier")}
      searchPlaceholder={t("smart_search_supplier")}
      emptyText={t("smart_no_results")}
      suggestionsHeader={t("smart_recent_suppliers")}
      disabled={disabled}
      allowClear={allowClear}
    />
  );
}
