import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export interface SmartOption<T> {
  id: string;
  primary: string;
  secondary?: string;
  trailing?: ReactNode;
  data: T;
}

export interface SmartEntityComboboxProps<T> {
  value: string | undefined;
  onChange: (id: string | undefined, data: T | undefined) => void;
  fetcher: (query: string) => { items: SmartOption<T>[]; source: "frequent" | "recent" | "fallback" };
  resolveLabel: (id: string) => SmartOption<T> | undefined;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  suggestionsHeader: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
}

export function SmartEntityCombobox<T>({
  value, onChange, fetcher, resolveLabel,
  placeholder, searchPlaceholder, emptyText, suggestionsHeader,
  disabled, allowClear = true, className,
}: SmartEntityComboboxProps<T>) {
  const { dir } = useI18n();
  const [open, setOpen] = useState(false);
  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (rawQuery === debouncedQuery) return;
    setLoading(true);
    const id = window.setTimeout(() => {
      setDebouncedQuery(rawQuery);
      setLoading(false);
    }, 220);
    return () => window.clearTimeout(id);
  }, [rawQuery, debouncedQuery]);

  const result = useMemo(() => fetcher(debouncedQuery), [fetcher, debouncedQuery]);
  const items = result.items;
  const isSuggestions = !debouncedQuery.trim();

  useEffect(() => { setActiveIdx(0); }, [debouncedQuery, open]);
  const selected = value ? resolveLabel(value) : undefined;

  const choose = (opt: SmartOption<T>) => {
    onChange(opt.id, opt.data);
    setOpen(false);
    setRawQuery("");
    setDebouncedQuery("");
  };

  const clear = (e: React.MouseEvent) => { e.stopPropagation(); onChange(undefined, undefined); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (items[activeIdx]) choose(items[activeIdx]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setTimeout(() => inputRef.current?.focus(), 20); }}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" disabled={disabled}
          className={`w-full justify-between font-normal ${className ?? ""}`}>
          <span className="truncate text-start flex-1">
            {selected ? (
              <span className="flex flex-col items-start">
                <span className="truncate">{selected.primary}</span>
                {selected.secondary && (
                  <span className="text-xs text-muted-foreground truncate">{selected.secondary}</span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <span className="flex items-center gap-1 ms-2">
            {selected && allowClear && !disabled && (
              <span role="button" tabIndex={-1} onClick={clear}
                className="rounded p-0.5 hover:bg-muted text-muted-foreground">
                <X className="size-3.5" />
              </span>
            )}
            <ChevronsUpDown className="size-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[280px]" align="start" dir={dir}>
        <div className="p-2 border-b flex items-center gap-2">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Input ref={inputRef} value={rawQuery} onChange={(e) => setRawQuery(e.target.value)} onKeyDown={onKey}
            placeholder={searchPlaceholder} className="h-8 border-0 focus-visible:ring-0 px-1 shadow-none" />
          {loading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
        </div>
        {isSuggestions && items.length > 0 && (
          <div className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground bg-muted/30 border-b">
            {suggestionsHeader}
          </div>
        )}
        <div className="max-h-72 overflow-y-auto py-1">
          {items.length === 0 ? (
            <div className="px-3 py-6 text-sm text-center text-muted-foreground">{emptyText}</div>
          ) : items.map((opt, idx) => {
            const isActive = idx === activeIdx;
            const isSelected = value === opt.id;
            return (
              <button key={opt.id} type="button" onMouseEnter={() => setActiveIdx(idx)} onClick={() => choose(opt)}
                className={`w-full text-start px-3 py-2 flex items-center gap-2 text-sm ${isActive ? "bg-accent" : "hover:bg-accent/60"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{opt.primary}</span>
                    {isSuggestions && idx < 3 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">?</Badge>
                    )}
                  </div>
                  {opt.secondary && (
                    <div className="text-xs text-muted-foreground truncate">{opt.secondary}</div>
                  )}
                </div>
                {opt.trailing && <div className="shrink-0 text-xs">{opt.trailing}</div>}
                {isSelected && <Check className="size-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
