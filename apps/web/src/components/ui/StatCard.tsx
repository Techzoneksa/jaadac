import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#64748b]">{title}</p>
          <p className="mt-1 text-2xl font-bold text-[#0f172a]">{value}</p>
          {trend && (
            <p className={cn("mt-1 text-xs", trend.positive ? "text-[#16a34a]" : "text-[#dc2626]")}>
              {trend.value}
            </p>
          )}
        </div>
        {icon && <div className="text-[#94a3b8]">{icon}</div>}
      </div>
    </div>
  );
}
