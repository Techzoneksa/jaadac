import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/**
 * JAAD CLOUD Phase 2.1.9 — Reusable quick-create modal shell.
 * Used for fast creation of simple master-data entities. Heavy accounting
 * documents (quotations, invoices, purchase invoices) still use full pages.
 */
export interface QuickCreateDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  titleAr: string;
  titleEn: string;
  descAr?: string;
  descEn?: string;
  children: ReactNode;
  onSave: () => boolean | Promise<boolean>; // true => close (and reset)
  saving?: boolean;
  saveAndAddAnother?: boolean;
  onSaveAndAddAnotherChange?: (v: boolean) => void;
  showSaveAndAddAnother?: boolean;
  saveLabelAr?: string;
  saveLabelEn?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE: Record<NonNullable<QuickCreateDialogProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function QuickCreateDialog(p: QuickCreateDialogProps) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const title = ar ? p.titleAr : p.titleEn;
  const desc = ar ? p.descAr : p.descEn;

  return (
    <Dialog open={p.open} onOpenChange={p.onOpenChange}>
      <DialogContent className={SIZE[p.size || "md"]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {desc && <DialogDescription>{desc}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3 py-1">{p.children}</div>
        <DialogFooter className="gap-2 sm:gap-2">
          {p.showSaveAndAddAnother && (
            <label className="flex items-center gap-2 me-auto text-xs text-muted-foreground cursor-pointer select-none">
              <Checkbox
                checked={!!p.saveAndAddAnother}
                onCheckedChange={(v) => p.onSaveAndAddAnotherChange?.(!!v)}
              />
              <Label className="text-xs cursor-pointer">
                {ar ? "حفظ وإضافة أخرى" : "Save and add another"}
              </Label>
            </label>
          )}
          <Button variant="outline" onClick={() => p.onOpenChange(false)} disabled={p.saving}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={async () => {
              const ok = await p.onSave();
              if (ok && !p.saveAndAddAnother) p.onOpenChange(false);
            }}
            disabled={p.saving}
          >
            {ar
              ? (p.saveLabelAr || "حفظ")
              : (p.saveLabelEn || "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
