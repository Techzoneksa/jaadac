"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, Pencil, Printer, FileDown, FileSpreadsheet, Trash2, XCircle,
  Copy, ArrowLeftRight, FileText, MoreHorizontal, Download, Plus,
  Ban,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";

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

export function RecordActionsMenu({
  actions,
  onDelete,
  deleteConfirmTitle = "تأكيد الحذف",
  deleteConfirmMessage = "هل أنت متأكد من حذف هذا العنصر؟",
  compact = false,
}: RecordActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<(() => void) | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const handleAction = (action: ActionItem) => {
    if (action.disabled) {
      return;
    }
    action.onClick();
  };

  const confirmDelete = async () => {
    if (!onDelete) return;
    setDeleteError("");
    try {
      const ok = await onDelete();
      if (ok) {
        setConfirmOpen(false);
        router.refresh();
      } else {
        setDeleteError("فشلت عملية الحذف");
      }
    } catch {
      setDeleteError("حدث خطأ أثناء الحذف");
    }
  };

  const deleteAction = actions.find((a) => a.icon && a.label === "حذف" || a.label === "إلغاء");
  const otherActions = actions.filter((a) => a !== deleteAction);

  if (compact) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            {actions.map((action, i) => (
              <div key={i}>
                {action.variant === "danger" || action.label === "حذف" || action.label === "إلغاء" ? (
                  <>
                    {i > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      disabled={action.disabled}
                      onClick={() => {
                        if (action.disabled) return;
                        if (onDelete) {
                          setPendingDelete(() => action.onClick);
                          setConfirmOpen(true);
                        } else {
                          action.onClick();
                        }
                      }}
                      title={action.disabled ? action.disabledReason : ""}
                    >
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    disabled={action.disabled}
                    onClick={() => handleAction(action)}
                    title={action.disabled ? action.disabledReason : ""}
                  >
                    {action.icon}
                    {action.label}
                  </DropdownMenuItem>
                )}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <ConfirmDialog
          open={confirmOpen}
          onClose={() => { setConfirmOpen(false); setDeleteError(""); }}
          onConfirm={confirmDelete}
          title={deleteConfirmTitle}
          message={deleteConfirmMessage}
          variant="danger"
          confirmLabel="حذف"
          cancelLabel="إلغاء"
        />
      </>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {actions.slice(0, 3).map((action, i) => (
        <button
          key={i}
          onClick={() => handleAction(action)}
          disabled={action.disabled}
          title={action.disabled ? action.disabledReason : action.label}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-30"
          style={{ color: action.variant === "danger" ? "var(--danger)" : "var(--text-muted)" }}
          onMouseEnter={(e) => { if (!action.disabled) e.currentTarget.style.backgroundColor = "var(--surface)"; }}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          {action.icon}
        </button>
      ))}
      {actions.length > 3 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            {actions.slice(3).map((action, i) => (
              <div key={i}>
                {(action.variant === "danger" || action.label === "حذف") && i > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  className={action.variant === "danger" ? "text-red-600 focus:text-red-600 focus:bg-red-50" : ""}
                  disabled={action.disabled}
                  onClick={() => handleAction(action)}
                  title={action.disabled ? action.disabledReason : ""}
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteError(""); }}
        onConfirm={confirmDelete}
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

export function printLinkAction(href: string, router: ReturnType<typeof useRouter>): ActionItem {
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
