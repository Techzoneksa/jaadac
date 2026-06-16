"use client";

import { Search, Bell, Sun, User, ChevronDown } from "lucide-react";
import { useState } from "react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-white/95 backdrop-blur-sm px-4 sm:px-6 shadow-sm">
      <div className="relative flex-1 max-w-md hidden sm:block">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-light" />
        <input
          type="text"
          placeholder="بحث..."
          className="h-9 w-full rounded-lg border border-border bg-[#f8fafc] pr-9 pl-3 text-sm text-foreground placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          className="relative p-2 rounded-lg text-muted hover:bg-[#f1f5f9] hover:text-foreground transition-colors"
          title="الإشعارات"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger border-2 border-white" />
        </button>
        <button
          className="p-2 rounded-lg text-muted hover:bg-[#f1f5f9] hover:text-foreground transition-colors"
          title="الوضع"
        >
          <Sun className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-3 pr-3 border-r border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white text-sm font-medium shadow-sm">
          <User className="h-4 w-4" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-foreground leading-tight">المدير</p>
          <p className="text-xs text-muted-light leading-tight">مدير النظام</p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted hidden sm:block" />
      </div>
    </header>
  );
}
