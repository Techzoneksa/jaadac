"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, ChevronDown } from "lucide-react";

interface SearchResult {
  id: string;
  name: string;
  subtitle?: string;
  badge?: string;
}

interface Props {
  value: string;
  onChange: (value: string, label: string) => void;
  placeholder?: string;
  searchEndpoint: string;
  recentEndpoint?: string;
  minSearchLength?: number;
  createLabel?: string;
  onCreate?: () => void;
  disabled?: boolean;
  error?: string;
  emptyMessage?: string;
  initialLabel?: string;
}

export function SmartSearchSelect({
  value,
  onChange,
  placeholder = "بحث...",
  searchEndpoint,
  recentEndpoint,
  minSearchLength = 3,
  createLabel,
  onCreate,
  disabled,
  error,
  emptyMessage = "لا توجد نتائج",
  initialLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(initialLabel || "");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && !selectedLabel) {
      setSelectedLabel(initialLabel || "");
    }
  }, [value, initialLabel, selectedLabel]);

  useEffect(() => {
    if (!open) return;
    const endpoint = query.length >= minSearchLength
      ? `${searchEndpoint}?q=${encodeURIComponent(query)}`
      : recentEndpoint || `${searchEndpoint}?limit=10`;
    setLoading(true);
    fetch(endpoint)
      .then(async (r) => {
        if (!r.ok) { setResults([]); return; }
        const json = await r.json();
        const arr = Array.isArray(json) ? json : [];
        setResults(arr.map(normalizeResult));
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [query, open, searchEndpoint, recentEndpoint, minSearchLength]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const select = useCallback((item: SearchResult) => {
    setSelectedLabel(item.name);
    setQuery("");
    setOpen(false);
    onChange(item.id, item.name);
  }, [onChange]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") { setOpen(true); e.preventDefault(); }
      return;
    }
    if (e.key === "ArrowDown") { setHighlightIndex((i) => Math.min(i + 1, results.length - 1)); e.preventDefault(); }
    if (e.key === "ArrowUp") { setHighlightIndex((i) => Math.max(i - 1, -1)); e.preventDefault(); }
    if (e.key === "Enter" && highlightIndex >= 0 && results[highlightIndex]) {
      select(results[highlightIndex]); e.preventDefault();
    }
    if (e.key === "Escape") { setOpen(false); setHighlightIndex(-1); e.preventDefault(); }
  }

  const showResults = open && (query.length === 0 || query.length >= minSearchLength);

  return (
    <div ref={containerRef} className="relative" style={{ zIndex: 1000 }}>
      <div className="relative" onClick={() => { setOpen(true); inputRef.current?.focus(); }}>
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlightIndex(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedLabel || placeholder}
          disabled={disabled}
          className="cursor-pointer"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </div>
      </div>
      {error && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{error}</p>}
      {showResults && (
        <div className="absolute w-full mt-1 rounded-xl border shadow-lg overflow-hidden"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", maxHeight: 280, zIndex: 1001 }}>
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--text-muted)" }} /></div>
          ) : results.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{query.length >= minSearchLength ? emptyMessage : "..."}</p>
              {createLabel && onCreate && (
                <button onClick={() => { setOpen(false); onCreate(); }} className="mt-2 inline-flex items-center gap-1 text-sm font-medium transition-colors" style={{ color: "var(--primary)" }}>
                  <Plus className="h-3.5 w-3.5" /> {createLabel}
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
                {results.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => select(item)}
                    onMouseEnter={() => setHighlightIndex(i)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-right transition-colors"
                    style={{
                      backgroundColor: highlightIndex === i ? "var(--surface)" : "transparent",
                      borderBottom: i < results.length - 1 ? "1px solid var(--border)" : "none",
                    }}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>{item.name}</p>
                      {item.subtitle && <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{item.subtitle}</p>}
                    </div>
                    {item.badge && (
                      <span className="shrink-0 mr-2 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: "var(--primary-soft)", color: "var(--primary)" }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {createLabel && onCreate && (
                <button onClick={() => { setOpen(false); onCreate(); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-t transition-colors" style={{ borderColor: "var(--border)", color: "var(--primary)" }}>
                  <Plus className="h-4 w-4" /> {createLabel}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function normalizeResult(item: Record<string, unknown>): SearchResult {
  const name = String(item.name_ar || item.name || item.name_en || "");
  const phone = String(item.mobile || item.phone || "");
  const vatVal = String(item.vat_number || item.vat || "");
  const subtitleParts = [phone, vatVal].filter(Boolean);
  return {
    id: String(item.id),
    name,
    subtitle: subtitleParts.length > 0 ? subtitleParts.join(" · ") : "",
    badge: item.type ? String(item.type === "service" ? "خدمة" : item.type === "stock" ? "منتج" : "") : "",
  };
}
