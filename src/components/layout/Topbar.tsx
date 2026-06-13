import { Search, Bell, LogOut, ChevronDown, Building2, ShieldCheck, Menu, Command } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";
import type { UserRole } from "@/lib/store";
import { CommandPalette } from "@/components/CommandPalette";
import { QuickCreateMenu } from "@/components/quick-create/QuickCreateMenu";

export function Topbar({ title, action, onMenu }: { title?: string; action?: React.ReactNode; onMenu?: () => void }) {
  const { t, lang } = useI18n();
  const { user, tenant, session, logout, switchRole, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [openUser, setOpenUser] = useState(false);

  return (
    <header className="h-16 border-b bg-card flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 sticky top-0 z-30">
      {onMenu && (
        <button
          type="button"
          onClick={onMenu}
          aria-label={lang === "ar" ? "فتح القائمة" : "Open menu"}
          className="size-9 rounded-md hover:bg-muted flex items-center justify-center shrink-0"
        >
          <Menu className="size-5" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold truncate">{title || t("dashboard")}</h1>
        {tenant && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Building2 className="size-3" />
            <span className="truncate">{lang === "ar" ? tenant.name_ar : tenant.name_en}</span>
          </div>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-2 max-w-xs flex-1">
        <div className="relative w-full">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            className="ps-9"
            readOnly
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
          />
          <kbd className="hidden xl:inline-flex absolute top-1/2 -translate-y-1/2 end-2 text-[10px] px-1.5 py-0.5 rounded border bg-muted text-muted-foreground">
            <Command className="size-3 me-1" />K
          </kbd>
        </div>
      </div>
      <CommandPalette />

      <div className="flex items-center gap-2">
        {action}
        <QuickCreateMenu />

        {isDemoMode && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-warning/15 text-warning border border-warning/30">
            <ShieldCheck className="size-3" />
            {lang === "ar" ? "وضع تجريبي" : "Demo Mode"}
          </span>
        )}

        <button className="size-9 rounded-md hover:bg-muted flex items-center justify-center">
          <Bell className="size-4" />
        </button>

        <DropdownMenu open={openUser} onOpenChange={setOpenUser}>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted">
              <div className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                {(user?.name || "?").slice(0, 1)}
              </div>
              <div className="hidden md:block text-start leading-tight">
                <div className="text-xs font-medium truncate max-w-[120px]">{user?.name}</div>
                <div className="text-[10px] text-muted-foreground">{t(session?.role || "viewer")}</div>
              </div>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs">
              <div className="font-medium">{user?.name}</div>
              <div className="text-muted-foreground font-normal">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isDemoMode && (
              <>
                <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">
                  {lang === "ar" ? "تبديل الدور (تجريبي)" : "Switch Role (demo)"}
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={session?.role}
                  onValueChange={(v) => switchRole(v as UserRole)}
                >
                  {(["owner", "accountant", "sales_employee", "viewer"] as UserRole[]).map((r) => (
                    <DropdownMenuRadioItem key={r} value={r} className="text-xs">{t(r)}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => navigate({ to: "/audit-log" as never })} className="text-xs">
              {t("audit_log")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/permission-check" as never })} className="text-xs">
              {t("permission_check")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/demo-checklist" as never })} className="text-xs">
              {t("demo_checklist")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/demo-flow" as never })} className="text-xs">
              {lang === "ar" ? "تدفق العرض التجريبي" : "Demo Flow"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/system-data-mode" as never })} className="text-xs">
              {lang === "ar" ? "وضع البيانات للنظام" : "System Data Mode"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/data-integrity" as never })} className="text-xs">
              {lang === "ar" ? "سلامة البيانات" : "Data Integrity"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/auth/select-org" as never })} className="text-xs">
              {lang === "ar" ? "تبديل المؤسسة" : "Switch organization"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { logout(); navigate({ to: "/auth/login" as never }); }} className="text-xs text-destructive focus:text-destructive">
              <LogOut className="size-3.5 me-2" />
              {lang === "ar" ? "تسجيل الخروج" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
