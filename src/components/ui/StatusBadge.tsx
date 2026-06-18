import { cn } from "@/lib/utils";
import { getStatusLabel } from "@/lib/format";

const statusConfig: Record<string, { dot: string; bg: string }> = {
  draft:     { dot: "#94a3b8", bg: "bg-surface text-muted" },
  issued:    { dot: "#7c3aed", bg: "bg-primary-soft text-primary" },
  sent:      { dot: "#f59e0b", bg: "bg-warning-soft text-warning" },
  paid:      { dot: "#10b981", bg: "bg-success-soft text-success" },
  partial:   { dot: "#f59e0b", bg: "bg-warning-soft text-warning" },
  overdue:   { dot: "#ef4444", bg: "bg-danger-soft text-danger" },
  cancelled: { dot: "#94a3b8", bg: "bg-surface text-muted" },
  approved:  { dot: "#10b981", bg: "bg-success-soft text-success" },
  converted: { dot: "#06b6d4", bg: "bg-info-soft text-info" },
  unpaid:    { dot: "#ef4444", bg: "bg-danger-soft text-danger" },
  active:    { dot: "#10b981", bg: "bg-success-soft text-success" },
  inactive:  { dot: "#94a3b8", bg: "bg-surface text-muted" },
  confirmed: { dot: "#10b981", bg: "bg-success-soft text-success" },
  pending:   { dot: "#f59e0b", bg: "bg-warning-soft text-warning" },
  posted:    { dot: "#7c3aed", bg: "bg-primary-soft text-primary" },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ status, label, dot = true, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { dot: "#94a3b8", bg: "bg-surface text-muted" };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        config.bg,
        className,
      )}
    >
      {dot && <span className="status-dot" style={{ backgroundColor: config.dot }} />}
      {label || getStatusLabel(status)}
    </span>
  );
}
