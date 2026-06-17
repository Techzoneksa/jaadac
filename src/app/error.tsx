"use client";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Global error:", error);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center" style={{ backgroundColor: "var(--bg)" }}>
      <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-2" style={{ backgroundColor: "var(--danger-soft)" }}>
        <span className="text-3xl font-bold" style={{ color: "var(--danger)" }}>!</span>
      </div>
      <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>خطأ</h1>
      <p className="max-w-sm" style={{ color: "var(--text-muted)" }}>حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى أو العودة للصفحة الرئيسية.</p>
      <div className="flex gap-3 mt-2">
        <button onClick={() => reset()} className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
          إعادة المحاولة
        </button>
        <Link href="/" className="rounded-xl border px-5 py-2.5 text-sm font-medium transition-all duration-200"
          style={{ color: "var(--fg)", borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
