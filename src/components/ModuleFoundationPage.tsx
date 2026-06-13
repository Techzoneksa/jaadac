import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Wrench, Cloud, Hammer } from "lucide-react";

export type ModuleStatus =
  | "active"
  | "foundation"
  | "coming_soon"
  | "planned"
  | "requires_backend";

export function StatusChip({ status }: { status: ModuleStatus }) {
  const { lang } = useI18n();
  const map: Record<ModuleStatus, { ar: string; en: string; cls: string; Icon: typeof CheckCircle2 }> = {
    active:           { ar: "نشط",         en: "Active",           cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",  Icon: CheckCircle2 },
    foundation:       { ar: "تأسيسي",      en: "Foundation",       cls: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",                Icon: Hammer },
    coming_soon:      { ar: "قريبًا",       en: "Coming Soon",      cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",          Icon: Clock },
    planned:          { ar: "مخطط",        en: "Planned",          cls: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",      Icon: Wrench },
    requires_backend: { ar: "يتطلب الباكند", en: "Requires Backend", cls: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",         Icon: Cloud },
  };
  const m = map[status];
  return (
    <Badge variant="outline" className={`gap-1 ${m.cls}`}>
      <m.Icon className="size-3" />
      {lang === "ar" ? m.ar : m.en}
    </Badge>
  );
}

export interface ModuleFoundationPageProps {
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  status: ModuleStatus;
  availableNow?: { ar: string; en: string }[];
  comingLater?: { ar: string; en: string }[];
  children?: ReactNode;
}

export function ModuleFoundationPage(p: ModuleFoundationPageProps) {
  const { lang } = useI18n();
  const title = lang === "ar" ? p.titleAr : p.titleEn;
  const desc = lang === "ar" ? p.descAr : p.descEn;

  return (
    <AppShell title={title} action={<StatusChip status={p.status} />}>
      <div className="space-y-5 max-w-4xl">
        <div className="card-elevated p-5 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">{title}</h2>
            <StatusChip status={p.status} />
          </div>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="card-elevated p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              {lang === "ar" ? "متاح الآن" : "Available now"}
            </h3>
            {p.availableNow?.length ? (
              <ul className="space-y-1.5 text-sm">
                {p.availableNow.map((it, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{lang === "ar" ? it.ar : it.en}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {lang === "ar" ? "لا توجد ميزات نشطة بعد." : "No features active yet."}
              </p>
            )}
          </div>

          <div className="card-elevated p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="size-4 text-amber-600" />
              {lang === "ar" ? "قريبًا" : "Coming later"}
            </h3>
            {p.comingLater?.length ? (
              <ul className="space-y-1.5 text-sm">
                {p.comingLater.map((it, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>{lang === "ar" ? it.ar : it.en}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {p.children}

        <p className="text-xs text-muted-foreground">
          {lang === "ar"
            ? "هذه الصفحة تأسيسية ضمن JAAD CLOUD. لا توجد كتابات فعلية على الباكند الآن."
            : "This is a foundation page in JAAD CLOUD. No real backend writes are performed at this stage."}
        </p>
      </div>
    </AppShell>
  );
}
