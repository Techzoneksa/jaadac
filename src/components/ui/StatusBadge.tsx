import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; dot: string; bg: string }> = {
  draft:     { label: "مسودة",     dot: "#94a3b8", bg: "bg-surface text-muted" },
  issued:    { label: "صادر",       dot: "#7c3aed", bg: "bg-primary-soft text-primary" },
  sent:      { label: "مرسل",       dot: "#f59e0b", bg: "bg-warning-soft text-warning" },
  paid:      { label: "مدفوع",      dot: "#10b981", bg: "bg-success-soft text-success" },
  partial:   { label: "مدفوع جزئي", dot: "#f59e0b", bg: "bg-warning-soft text-warning" },
  overdue:   { label: "متأخر",      dot: "#ef4444", bg: "bg-danger-soft text-danger" },
  cancelled: { label: "ملغي",       dot: "#94a3b8", bg: "bg-surface text-muted" },
  approved:  { label: "معتمد",      dot: "#10b981", bg: "bg-success-soft text-success" },
  converted: { label: "محوّل",      dot: "#06b6d4", bg: "bg-info-soft text-info" },
  unpaid:    { label: "غير مدفوع",  dot: "#ef4444", bg: "bg-danger-soft text-danger" },
  active:    { label: "نشط",        dot: "#10b981", bg: "bg-success-soft text-success" },
  inactive:  { label: "غير نشط",    dot: "#94a3b8", bg: "bg-surface text-muted" },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ status, label, dot = true, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, dot: "#94a3b8", bg: "bg-surface text-muted" };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        config.bg,
        className,
      )}
    >
      {dot && <span className="status-dot" style={{ backgroundColor: config.dot }} />}
      {label || config.label}
    </span>
  );
}

export function getStatusLabel(status: string): string {
  return statusConfig[status]?.label || status;
}
