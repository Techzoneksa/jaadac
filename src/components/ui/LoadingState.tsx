import { cn } from "@/lib/utils";

interface LoadingStateProps {
  text?: string;
  className?: string;
  skeleton?: boolean;
  count?: number;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="h-10 w-10 rounded-xl bg-surface-muted animate-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-3/5 rounded bg-surface-muted animate-shimmer" />
        <div className="h-2.5 w-2/5 rounded bg-surface-muted animate-shimmer" />
      </div>
      <div className="h-3 w-16 rounded bg-surface-muted animate-shimmer" />
    </div>
  );
}

export function LoadingState({ text = "جار التحميل...", className, skeleton, count = 4 }: LoadingStateProps) {
  if (skeleton) {
    return (
      <div className={cn("space-y-1", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center animate-fade-in", className)}>
      <div className="relative flex h-10 w-10 items-center justify-center">
        <div className="absolute h-10 w-10 animate-spin rounded-full border-[3px] border-surface-muted border-t-primary" />
        <div className="h-3 w-3 rounded-full bg-primary/40" />
      </div>
      {text && <p className="mt-4 text-sm text-muted">{text}</p>}
    </div>
  );
}
