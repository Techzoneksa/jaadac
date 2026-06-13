import * as React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, error, required, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-[#334155]">
        {label}
        {required && <span className="mr-0.5 text-[#dc2626]">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-[#94a3b8]">{hint}</p>
      )}
      {error && (
        <p className="text-sm text-[#dc2626]">{error}</p>
      )}
    </div>
  );
}
