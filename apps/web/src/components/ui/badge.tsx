import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive";
}

const variants: Record<string, string> = {
  default: "bg-[#dbeafe] text-[#1d4ed8] border-transparent",
  secondary: "bg-[#f1f5f9] text-[#475569] border-transparent",
  destructive: "bg-[#fee2e2] text-[#b91c1c] border-transparent",
  outline: "text-[#475569] border-[#e2e8f0]",
};

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
          variants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Badge.displayName = "Badge";

export { Badge };
