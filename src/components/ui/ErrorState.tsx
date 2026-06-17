import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "حدث خطأ",
  message = "تعذر تحميل البيانات. حاول مرة أخرى.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center animate-fade-in", className)}>
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft">
        <AlertTriangle className="h-8 w-8 text-danger" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted max-w-sm">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-5 gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
