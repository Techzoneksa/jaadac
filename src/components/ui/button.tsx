import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md active:scale-[0.97] hover:-translate-y-0.5",
        secondary:
          "bg-primary-soft text-primary hover:bg-primary-soft/80 border border-primary/10 active:scale-[0.97]",
        outline:
          "border border-border bg-card text-foreground hover:bg-surface active:scale-[0.97]",
        ghost:
          "text-muted hover:text-foreground hover:bg-surface active:scale-[0.97]",
        soft: "bg-surface text-foreground hover:bg-surface-muted border border-border active:scale-[0.97]",
        success:
          "bg-success text-white hover:bg-[#059669] shadow-sm active:scale-[0.97] hover:-translate-y-0.5",
        danger:
          "bg-danger text-white hover:bg-[#dc2626] shadow-sm active:scale-[0.97] hover:-translate-y-0.5",
        "icon-ghost":
          "text-muted hover:text-foreground hover:bg-surface rounded-xl active:scale-[0.95]",
        "icon-soft":
          "bg-surface text-muted hover:text-foreground hover:bg-surface-muted rounded-xl",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-lg",
        md: "h-10 px-4 py-2 text-sm",
        lg: "h-11 px-6 text-base",
        xl: "h-12 px-8 text-base",
        icon: "h-9 w-9 p-0 rounded-xl",
        "icon-sm": "h-8 w-8 p-0 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
