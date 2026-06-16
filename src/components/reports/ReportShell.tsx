import type { ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, ChevronRight, Download, Printer, FileText } from "lucide-react";

interface ReportShellProps {
  titleAr: string;
  titleEn: string;
  descAr?: string;
  descEn?: string;
  filters?: ReactNode;
  children: ReactNode;
}

export function ReportShell({ titleAr, titleEn, descAr, descEn, filters, children }: ReportShellProps) {
  const { lang, dir } = useI18n();
  const ArrowBack = dir === "rtl" ? ChevronRight : ChevronLeft;
  const title = lang === "ar" ? titleAr : titleEn;
  const desc = lang === "ar" ? descAr : descEn;

  return (
    <AppShell
      title={title}
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled title={lang === "ar" ? "التصدير قريبًا" : "Export coming soon"}>
            <Download className="size-4 me-1" />{lang === "ar" ? "تصدير" : "Export"}
          </Button>
          <Button variant="outline" size="sm" disabled title={lang === "ar" ? "الطباعة قريبًا" : "Print coming soon"}>
            <Printer className="size-4 me-1" />{lang === "ar" ? "طباعة" : "Print"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/reports" className="hover:text-foreground inline-flex items-center gap-1">
            <ArrowBack className="size-4" />
            <FileText className="size-3.5" />
            {lang === "ar" ? "التقارير" : "Reports"}
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground font-medium">{title}</span>
        </nav>

        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {desc ? <p className="text-sm text-muted-foreground">{desc}</p> : null}
        </header>

        {/* Filters */}
        {filters ? (
          <div className="card-elevated p-3 flex flex-wrap items-end gap-3">
            {filters}
          </div>
        ) : null}

        {/* Content */}
        <div>{children}</div>
      </div>
    </AppShell>
  );
}

export function EmptyState({ message, onClear }: { message?: string; onClear?: () => void }) {
  const { lang } = useI18n();
  return (
    <div className="card-elevated p-10 text-center">
      <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <FileText className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">
        {message ?? (lang === "ar" ? "لا توجد نتائج لهذا التقرير ضمن الفلاتر الحالية." : "No results for this report with the current filters.")}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {lang === "ar" ? "جرّب تغيير الفترة أو إزالة بعض الفلاتر." : "Try changing the period or removing filters."}
      </p>
      {onClear ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>
          {lang === "ar" ? "مسح الفلاتر" : "Clear filters"}
        </Button>
      ) : null}
    </div>
  );
}

export function DateRangeFilter({
  from, to, onChange,
}: { from: string; to: string; onChange: (range: { from: string; to: string }) => void }) {
  const { lang } = useI18n();
  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">{lang === "ar" ? "من تاريخ" : "From"}</label>
        <input
          type="date" value={from}
          onChange={(e) => onChange({ from: e.target.value, to })}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">{lang === "ar" ? "إلى تاريخ" : "To"}</label>
        <input
          type="date" value={to}
          onChange={(e) => onChange({ from, to: e.target.value })}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        />
      </div>
    </>
  );
}
