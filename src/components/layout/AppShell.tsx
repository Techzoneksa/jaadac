import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Sidebar, SidebarContent } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";

const COLLAPSE_KEY = "jaad.sidebar.collapsed";

export function AppShell({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  });
  const { dir, lang } = useI18n();

  useEffect(() => {
    try { window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0"); } catch { /* noop */ }
  }, [collapsed]);

  const toggle = () => {
    // On mobile, toggle drawer; on md+, toggle collapsed rail.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setMobileOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side={dir === "rtl" ? "right" : "left"}
          className="p-0 w-72 max-w-[85vw] border-0"
        >
          <SheetTitle className="sr-only">{lang === "ar" ? "القائمة" : "Menu"}</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-w-0 flex flex-col" dir={dir}>
        <Topbar title={title} action={action} onMenu={toggle} />
        <main dir={dir} className="flex-1 p-4 sm:p-5 md:p-6 w-full">{children}</main>
      </div>
    </div>
  );
}
