import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          id={id}
          className={cn(
            "h-4 w-4 rounded border-[#e2e8f0] text-[#2563eb] focus:ring-[#2563eb]",
            className,
          )}
          ref={ref}
          {...props}
        />
        {label && <span className="text-sm text-[#334155]">{label}</span>}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
