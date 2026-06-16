import type { ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/**
 * Phase 2.1.5 — Shared document editor shell.
 * Wraps a quotation / sales-invoice / purchase-invoice editor in a full page
 * with a clean header (title + back + action buttons) and a body that
 * arranges the document cards in a responsive grid.
 */
export function DocumentEditorLayout({
  title,
  backTo,
  actions,
  children,
}: {
  title: string;
  backTo: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { dir } = useI18n();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const { t } = useI18n();

  const action = (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={backTo}>
          <BackIcon className="size-4 me-1" />
          {t("back")}
        </Link>
      </Button>
      {actions}
    </div>
  );

  return (
    <AppShell title={title} action={action}>
      <div className="space-y-5 max-w-6xl mx-auto pb-10">{children}</div>
    </AppShell>
  );
}

export function DocumentSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card-elevated p-5 ${className ?? ""}`}>
      {title && (
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}
