"use client";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Dashboard error:", error);
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-4">
        <span className="text-3xl font-bold text-danger">!</span>
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">حدث خطأ في تحميل لوحة التحكم</h1>
      <p className="text-muted max-w-sm mb-6">تعذر تحميل البيانات. قد يكون الاتصال بقاعدة البيانات غير متاح.</p>
      <div className="flex gap-3">
        <button onClick={() => reset()} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
          إعادة المحاولة
        </button>
        <a href="/login" className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-[#f8fafc] transition-colors">
          تسجيل الدخول
        </a>
      </div>
    </div>
  );
}
