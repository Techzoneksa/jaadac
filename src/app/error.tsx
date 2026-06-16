"use client";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Global error:", error);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-2">
        <span className="text-3xl">!</span>
      </div>
      <h1 className="text-2xl font-bold text-foreground">خطأ</h1>
      <p className="text-muted max-w-sm">حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى أو العودة للصفحة الرئيسية.</p>
      <div className="flex gap-3 mt-2">
        <button onClick={() => reset()} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
          إعادة المحاولة
        </button>
        <Link href="/" className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-[#f8fafc] transition-colors">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
