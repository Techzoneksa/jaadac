import { ShieldAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

export function AccessDenied({ title, description }: { title?: string; description?: string }) {
  const { lang } = useI18n();
  const { session } = useAuth();
  const ar = {
    title: "ليس لديك صلاحية",
    desc: "هذه الصفحة أو الإجراء يتطلب صلاحيات أعلى. الرجاء التواصل مع مالك الحساب أو التبديل إلى دور مناسب.",
    role: "الدور الحالي",
    back: "العودة للوحة التحكم",
  };
  const en = {
    title: "Access Denied",
    desc: "This page or action requires higher privileges. Contact the account owner or switch to a suitable role.",
    role: "Current role",
    back: "Back to dashboard",
  };
  const tr = lang === "ar" ? ar : en;
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full card-elevated p-8 text-center">
        <div className="mx-auto size-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <ShieldAlert className="size-7" />
        </div>
        <h1 className="text-xl font-semibold mb-2">{title || tr.title}</h1>
        <p className="text-sm text-muted-foreground mb-4">{description || tr.desc}</p>
        {session && (
          <div className="text-xs text-muted-foreground mb-5">
            {tr.role}: <span className="font-medium text-foreground">{session.role}</span>
          </div>
        )}
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {tr.back}
        </Link>
      </div>
    </div>
  );
}
