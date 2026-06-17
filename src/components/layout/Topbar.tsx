"use client";

import { Search, Bell, Sun, Moon, User, ChevronDown, Keyboard, PanelRightClose } from "lucide-react";
import { useTheme } from "@/lib/ThemeProvider";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();

  const handleCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
  };

  return (
    <header
      className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4 sm:px-6 glass shrink-0"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Mobile menu trigger */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-xl lg:hidden transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface)"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        aria-label="فتح القائمة"
      >
        <PanelRightClose className="h-5 w-5" />
      </button>

      {/* Global Search */}
      <div className="relative flex-1 max-w-sm hidden sm:block">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted-light)" }} />
        <input
          type="text"
          placeholder="بحث سريع..."
          className="h-9 w-full rounded-2xl border text-sm pr-9 pl-3 transition-all duration-200"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--fg)",
          }}
        />
      </div>

      {/* Ctrl+K button */}
      <button
        onClick={handleCommandPalette}
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all duration-200"
        style={{
          color: "var(--text-muted-light)",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
        }}
        title="Ctrl + K"
      >
        <Keyboard className="h-3.5 w-3.5" />
        <span dir="ltr" className="font-medium">Ctrl+K</span>
      </button>

      <div className="flex items-center gap-0.5 mr-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="relative p-2.5 rounded-xl transition-all duration-200"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          aria-label={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
        >
          <div className="transition-transform duration-300" style={{ transform: theme === "dark" ? "rotate(180deg)" : "none" }}>
            {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          </div>
        </button>

        {/* Notifications */}
        <button
          className="relative p-2.5 rounded-xl transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          aria-label="الإشعارات"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span
            className="absolute top-2 right-2 h-2 w-2 rounded-full border-2"
            style={{
              backgroundColor: "var(--danger)",
              borderColor: theme === "dark" ? "var(--sidebar-bg)" : "white",
            }}
          />
        </button>
      </div>

      {/* User menu */}
      <div
        className="flex items-center gap-3 pr-3 mr-1 cursor-pointer rounded-xl px-2.5 py-1.5 transition-all duration-200"
        style={{ borderRight: "1px solid var(--border)" }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface)"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white text-sm font-semibold shadow-sm"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
        >
          <User className="h-4 w-4" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-tight" style={{ color: "var(--fg)" }}>المدير</p>
          <p className="text-xs leading-tight" style={{ color: "var(--text-muted)" }}>مدير النظام</p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 hidden sm:block" style={{ color: "var(--text-muted-light)" }} />
      </div>
    </header>
  );
}
