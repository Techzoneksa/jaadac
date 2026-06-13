import { cn } from "@/lib/utils";

type StatusVariant = "draft" | "posted" | "paid" | "overdue" | "cancelled" | "active" | "inactive";

const statusStyles: Record<StatusVariant, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  posted: "bg-blue-100 text-blue-700 border-blue-200",
  paid: "bg-green-100 text-green-700 border-green-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200 line-through",
  active: "bg-green-100 text-green-700 border-green-200",
  inactive: "bg-gray-100 text-gray-500 border-gray-200",
};

const statusLabels: Record<StatusVariant, string> = {
  draft: "مسودة",
  posted: "مرحّل",
  paid: "مدفوع",
  overdue: "متأخر",
  cancelled: "ملغي",
  active: "نشط",
  inactive: "غير نشط",
};

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className,
      )}
    >
      {label || statusLabels[status]}
    </span>
  );
}
