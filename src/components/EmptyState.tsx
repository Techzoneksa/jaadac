import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

export function EmptyState({ title, hint, action }: { title?: string; hint?: string; action?: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="size-14 rounded-full bg-accent flex items-center justify-center mb-3">
        <Inbox className="size-7 text-accent-foreground" />
      </div>
      <div className="font-medium">{title || t("empty")}</div>
      <div className="text-sm text-muted-foreground mt-1 max-w-xs">{hint || t("empty_hint")}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
