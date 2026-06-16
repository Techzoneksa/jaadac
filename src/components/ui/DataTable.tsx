"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading,
  emptyTitle = "لا توجد بيانات",
  emptyDescription,
  searchPlaceholder = "بحث...",
  onSearch,
  onRowClick,
  pageSize = 20,
  className,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = data.slice(page * pageSize, (page + 1) * pageSize);

  if (isLoading) {
    return (
      <div className={cn("rounded-lg border border-[#e2e8f0] bg-white", className)}>
        <div className="p-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#2563eb]" />
          <p className="mt-2 text-sm text-[#64748b]">جار التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {onSearch && (
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value);
              setPage(0);
            }}
            className="h-10 w-full max-w-sm rounded-md border border-[#e2e8f0] bg-white pr-9 pl-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
          />
        </div>
      )}

      <div className="rounded-lg border border-[#e2e8f0] bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn("px-4 py-3 text-right font-medium text-[#475569]", col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-[#e2e8f0] transition-colors",
                    onRowClick && "cursor-pointer hover:bg-[#f8fafc]"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-[#334155]", col.className)}>
                      {col.render ? col.render(row) : (row as any)[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <p className="text-[#64748b] font-medium">{emptyTitle}</p>
                  {emptyDescription && (
                    <p className="mt-1 text-sm text-[#94a3b8]">{emptyDescription}</p>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#64748b]">
            الصفحة {page + 1} من {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e2e8f0] text-[#475569] disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e2e8f0] text-[#475569] disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
