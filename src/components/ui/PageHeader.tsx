import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  count?: number;
  className?: string;
}

export function PageHeader({ title, description, action, count, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4 mb-6", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {count !== undefined && (
            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full bg-primary-soft text-primary text-xs font-semibold px-2">
              {count}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}
