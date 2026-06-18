"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, Pencil, Printer, FileDown, FileSpreadsheet, Trash2,
  MoreHorizontal, Ban,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
  variant?: "default" | "danger";
}

export interface RecordActionsProps {
  actions: ActionItem[];
  onDelete?: () => Promise<boolean>;
  deleteConfirmTitle?: string;
  deleteConfirmMessage?: string;
  compact?: boolean;
}

const PRIMARY_LABELS = new Set([
  "عرض", "تحرير", "طباعة",
  "تنزيل PDF", "تنزيل CSV", "تصدير Excel",
]);

function isPrimary(a: ActionItem) {
  return PRIMARY_LABELS.has(a.label);
}

function IconBtn({ action, noTooltip }: { action: ActionItem; noTooltip?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      disabled={action.disabled}
      onClick={() => { if (!action.disabled) action.onClick(); }}
      title={noTooltip ? "" : (action.disabled ? (action.disabledReason || action.label) : action.label)}
      aria-label={action.label}
      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        color: action.variant === "danger" && !action.disabled ? "var(--danger)" : "var(--text-muted)",
        backgroundColor: hover && !action.disabled ? "var(--surface)" : "transparent",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {action.icon}
    </button>
  );
}

export function RecordActionsMenu({
  actions,
  onDelete,
  deleteConfirmTitle = "تأكيد الحذف",
  deleteConfirmMessage = "هل أنت متأكد من حذف هذا العنصر؟",
  compact = false,
}: RecordActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const primary = actions.filter(isPrimary);
  const secondary = actions.filter((a) => !isPrimary(a));

  const visiblePrimary = compact ? primary.slice(0, 2) : primary;
  const overflowPrimary = primary.slice(visiblePrimary.length);
  const hasDropdown = overflowPrimary.length > 0 || secondary.length > 0;

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      const ok = await onDelete();
      if (ok) {
        setConfirmOpen(false);
        router.refresh();
      }
    } catch {
      // silent
    }
  };

  const renderDropdownItems = (items: ActionItem[], showSeparatorBeforeDanger: boolean) =>
    items.map((action, i) => {
      const isDanger = action.variant === "danger" || action.label === "حذف" || action.label === "إلغاء";
      const showSep = showSeparatorBeforeDanger && isDanger && i > 0;
      return (
        <div key={i}>
          {showSep && <DropdownMenuSeparator />}
          <DropdownMenuItem
            className={isDanger ? "text-red-600 focus:text-red-600 focus:bg-red-50" : ""}
            disabled={action.disabled}
            onClick={() => {
              if (action.disabled) return;
              if (isDanger && onDelete) {
                setConfirmOpen(true);
              } else {
                action.onClick();
              }
            }}
            title={action.disabled ? (action.disabledReason || "") : ""}
          >
            <span className="inline-flex items-center gap-2">{action.icon}{action.label}</span>
          </DropdownMenuItem>
        </div>
      );
    });

  return (
    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      {visiblePrimary.map((action, i) => (
        <IconBtn key={i} action={action} />
      ))}

      {hasDropdown && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface)]"
            style={{ color: "var(--text-muted)" }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            {overflowPrimary.length > 0 && renderDropdownItems(overflowPrimary, false)}
            {overflowPrimary.length > 0 && secondary.length > 0 && <DropdownMenuSeparator />}
            {secondary.length > 0 && renderDropdownItems(secondary, true)}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title={deleteConfirmTitle}
        message={deleteConfirmMessage}
        variant="danger"
        confirmLabel="حذف"
        cancelLabel="إلغاء"
      />
    </div>
  );
}

export function viewAction(id: string, router: ReturnType<typeof useRouter>): ActionItem {
  return {
    label: "عرض",
    icon: <Eye className="h-4 w-4" />,
    onClick: () => router.push(`?id=${id}`),
  };
}

export function viewLinkAction(href: string, router: ReturnType<typeof useRouter>): ActionItem {
  return {
    label: "عرض",
    icon: <Eye className="h-4 w-4" />,
    onClick: () => router.push(href),
  };
}

export function editLinkAction(href: string, router: ReturnType<typeof useRouter>): ActionItem {
  return {
    label: "تحرير",
    icon: <Pencil className="h-4 w-4" />,
    onClick: () => router.push(href),
  };
}

export function printLinkAction(href: string, _router?: ReturnType<typeof useRouter>): ActionItem {
  return {
    label: "طباعة",
    icon: <Printer className="h-4 w-4" />,
    onClick: () => window.open(href, "_blank"),
  };
}

export function downloadCsvAction<T>(
  rows: T[],
  filename: string,
  headers: string[],
  mapFn: (row: T) => string[],
): ActionItem {
  return {
    label: "تنزيل CSV",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    onClick: () => {
      const csvContent = [
        headers.join(","),
        ...rows.map((r) =>
          mapFn(r)
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
        ),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  };
}

export function pdfLinkAction(href: string): ActionItem {
  return {
    label: "تنزيل PDF",
    icon: <FileDown className="h-4 w-4" />,
    onClick: () => window.open(href, "_blank"),
  };
}

export function excelPlaceholderAction(): ActionItem {
  return {
    label: "تصدير Excel",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    onClick: () => alert("تصدير Excel سيتم تفعيله قريبًا"),
    disabled: true,
    disabledReason: "تصدير Excel سيتم تفعيله قريبًا",
  };
}

export function cancelAction(disabledReason?: string): ActionItem {
  return {
    label: "إلغاء",
    icon: <Ban className="h-4 w-4" />,
    onClick: () => {},
    disabled: true,
    disabledReason: disabledReason || "سيتم تفعيله قريبًا",
  };
}

export function disabledAction(label: string, icon: React.ReactNode, reason?: string): ActionItem {
  return {
    label,
    icon,
    onClick: () => {},
    disabled: true,
    disabledReason: reason || "سيتم تفعيله قريبًا",
  };
}

export function futureAction(label: string, icon: React.ReactNode): ActionItem {
  return {
    label,
    icon,
    onClick: () => {},
    disabled: true,
    disabledReason: "سيتم تفعيله قريبًا",
  };
}

export function toastAction(label: string, icon: React.ReactNode, message: string): ActionItem {
  return {
    label,
    icon,
    onClick: () => alert(message),
  };
}

export function confirmDeleteAction(
  id: string,
  apiEndpoint: string,
  router: ReturnType<typeof useRouter>,
): { action: ActionItem; onDelete: () => Promise<boolean> } {
  return {
    action: {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => {},
      variant: "danger",
    },
    onDelete: async () => {
      try {
        const res = await fetch(`${apiEndpoint}?id=${id}`, { method: "DELETE" });
        if (!res.ok) return false;
        router.refresh();
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function exportCsv<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  headers: string[],
  mapFn: (row: T) => string[],
) {
  const csvContent = [
    headers.join(","),
    ...rows.map((r) =>
      mapFn(r)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPdfViaPrint(printHref: string) {
  window.open(printHref, "_blank");
}
