import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: { value: string; positive: boolean; label?: string };
  gradient?: string;
  className?: string;
  children?: React.ReactNode;
}

export function StatCard({
  title, value, subtitle, icon, iconBg,
  trend, gradient, className, children,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-elevated card-hover",
        className,
      )}
    >
      {gradient && (
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ background: gradient }}
        />
      )}
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl",
                  iconBg || "bg-primary-soft text-primary",
                )}
              >
                {icon}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted">{title}</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
                {value}
              </p>
            </div>
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                trend.positive
                  ? "bg-success-soft text-success"
                  : trend.value.startsWith("-")
                    ? "bg-danger-soft text-danger"
                    : "bg-surface text-muted",
              )}
            >
              {trend.positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : trend.value.startsWith("-") ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-light">{subtitle}</p>
        )}
        {children && <div className="mt-1">{children}</div>}
      </div>
    </div>
  );
}
