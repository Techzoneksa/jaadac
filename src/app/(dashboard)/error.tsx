"use client";
import { classifyDbError, type DbErrorType } from "@/lib/supabase/errors";

const CONFIG: Record<DbErrorType, { title: string; desc: string; btn: string; btnHref?: string }> = {
  MISSING_TABLE: {
    title: "لم يتم تهيئة قاعدة البيانات",
    desc: "الجداول غير موجودة بعد. يرجى تطبيق migrations من مجلد supabase/migrations على Supabase Dashboard.",
    btn: "إعادة المحاولة",
  },
  RLS_DENIED: {
    title: "لا توجد صلاحية كافية",
    desc: "حسابك لا يملك صلاحية الوصول إلى هذه البيانات.",
    btn: "إعادة المحاولة",
  },
  AUTH_REQUIRED: {
    title: "يجب تسجيل الدخول",
    desc: "انتهت صلاحية الجلسة أو لم يتم تسجيل الدخول.",
    btn: "تسجيل الدخول",
    btnHref: "/login",
  },
  INVALID_ENV: {
    title: "إعدادات الاتصال غير مكتملة",
    desc: "متغيرات Supabase البيئية غير مضبوطة بشكل صحيح.",
    btn: "إعادة المحاولة",
  },
  NETWORK_ERROR: {
    title: "تعذر الاتصال بقاعدة البيانات",
    desc: "لا يمكن الوصول إلى Supabase حاليًا.",
    btn: "إعادة المحاولة",
  },
  UNKNOWN_DB_ERROR: {
    title: "حدث خطأ في قاعدة البيانات",
    desc: "تعذر تحميل البيانات. قد يكون الاتصال بقاعدة البيانات غير متاح.",
    btn: "إعادة المحاولة",
  },
};

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  const cls = classifyDbError(error);
  const c = CONFIG[cls.type] || CONFIG.UNKNOWN_DB_ERROR;
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-4">
        <span className="text-3xl font-bold text-danger">!</span>
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">{c.title}</h1>
      <p className="text-muted max-w-sm mb-6">{c.desc}</p>
      <div className="flex gap-3">
        {c.btnHref ? (
          <a href={c.btnHref} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
            {c.btn}
          </a>
        ) : (
          <button onClick={() => reset()} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
            {c.btn}
          </button>
        )}
      </div>
    </div>
  );
}
