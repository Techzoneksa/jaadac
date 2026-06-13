import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-info/10 text-info border border-info/20",
  accepted: "bg-success/10 text-success border border-success/20",
  rejected: "bg-destructive/10 text-destructive border border-destructive/20",
  converted: "bg-accent text-accent-foreground",
  official: "bg-info/10 text-info border border-info/20",
  approved: "bg-info/10 text-info border border-info/20",
  paid: "bg-success/10 text-success border border-success/20",
  partially_paid: "bg-warning/15 text-warning-foreground border border-warning/30",
  fully_paid: "bg-success/10 text-success border border-success/20",
  cancelled: "bg-destructive/10 text-destructive",
  active: "bg-success/10 text-success border border-success/20",
  inactive: "bg-muted text-muted-foreground",
  task_new: "bg-info/10 text-info border border-info/20",
  in_progress: "bg-warning/15 text-warning-foreground border border-warning/30",
  completed: "bg-success/10 text-success border border-success/20",
  deferred: "bg-muted text-muted-foreground",
  posted: "bg-success/10 text-success border border-success/20",
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/10 text-info",
  high: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", map[status] || "bg-muted text-muted-foreground")}>
      {t(status)}
    </span>
  );
}
