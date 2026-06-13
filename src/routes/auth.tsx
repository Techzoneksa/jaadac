import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — JAAD CLOUD" }] }),
  component: AuthLayout,
});

function AuthLayout() {
  const { t, lang, setLang, dir } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs = [
    { to: "/auth/login", key: "login" as const, label: { ar: "تسجيل الدخول", en: "Login" } },
    { to: "/auth/register", key: "register" as const, label: { ar: "إنشاء حساب", en: "Register" } },
    { to: "/auth/forgot", key: "forgot" as const, label: { ar: "نسيت كلمة المرور", en: "Forgot Password" } },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-background" dir={dir}>
      <div className="h-16 border-b flex items-center px-6 gap-3">
        <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
          <Building2 className="size-5 text-primary-foreground" />
        </div>
        <div className="leading-tight flex-1">
          <div className="font-semibold text-sm">{t("app_name")}</div>
          <div className="text-[11px] text-muted-foreground">{t("app_tagline")}</div>
        </div>
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="text-xs px-3 py-1.5 rounded-md hover:bg-muted"
        >
          {lang === "ar" ? "English" : "العربية"}
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex gap-1 mb-4 border-b">
            {tabs.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to as never}
                className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${
                  pathname === tab.to
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang === "ar" ? tab.label.ar : tab.label.en}
              </Link>
            ))}
          </div>
          <div className="card-elevated p-6">
            <Outlet />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            {lang === "ar" ? "وضع تجريبي - أي بيانات تعمل" : "Demo mode — any credentials work"}
          </p>
        </div>
      </div>
    </div>
  );
}
