import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

const variants: Record<string, string> = {
  default: "bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-sm",
  secondary: "bg-[#f1f5f9] text-[#334155] hover:bg-[#e2e8f0]",
  outline: "border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#334155]",
  ghost: "hover:bg-[#f1f5f9] text-[#475569]",
  destructive: "bg-[#dc2626] text-white hover:bg-[#b91c1c] shadow-sm",
};

const sizes: Record<string, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 py-2 text-sm",
  lg: "h-11 px-8 text-base",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
