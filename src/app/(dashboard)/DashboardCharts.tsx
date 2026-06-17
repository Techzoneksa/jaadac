"use client";

import { useTheme } from "@/lib/ThemeProvider";

export function DashboardCharts() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const lineColor1 = "#7c3aed";
  const lineColor1Mid = "rgba(124,58,237,0.4)";
  const barSale = "#7c3aed";
  const barPurchase = "#a855f7";

  const points1 = [30, 45, 38, 52, 48, 62, 58, 70, 65, 78, 72, 88].map((v, i) => `${i * 10},${100 - v}`);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {/* Area Chart */}
      <div
        className="rounded-2xl border p-5 transition-all duration-200 hover:shadow-elevated"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>تحليل الإيرادات</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>حركة المبيعات الشهرية</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1" style={{ backgroundColor: "var(--success-soft)", color: "var(--success)" }}>
            <span className="status-dot" style={{ backgroundColor: "var(--success)" }} />
            +18.5%
          </span>
        </div>
        <svg viewBox="0 0 120 100" className="w-full h-28" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradU1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor1} stopOpacity="0.25" />
              <stop offset="100%" stopColor={lineColor1} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {[25, 50, 75].map((y) => (
            <line key={y} x1="0" y1={y} x2="120" y2={y} stroke={gridColor} strokeWidth="0.5" />
          ))}
          <polygon points={`0,100 ${points1.join(" ")} 110,100`} fill="url(#areaGradU1)" />
          <polyline points={points1.join(" ")} fill="none" stroke={lineColor1} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="110" cy={100 - 88} r="2.5" fill={lineColor1} stroke={isDark ? "var(--card)" : "white"} strokeWidth="1.5" />
          <circle cx="110" cy={100 - 88} r="5" fill={lineColor1Mid} />
        </svg>
      </div>

      {/* Bar Chart */}
      <div
        className="rounded-2xl border p-5 transition-all duration-200 hover:shadow-elevated"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>المبيعات vs المشتريات</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>مقارنة شهرية</p>
          </div>
          <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1"><span className="status-dot" style={{ backgroundColor: barSale }} />المبيعات</span>
            <span className="flex items-center gap-1"><span className="status-dot" style={{ backgroundColor: barPurchase }} />المشتريات</span>
          </div>
        </div>
        <svg viewBox="0 0 120 100" className="w-full h-28" preserveAspectRatio="none">
          {[25, 50, 75].map((y) => (
            <line key={y} x1="0" y1={y} x2="120" y2={y} stroke={gridColor} strokeWidth="0.5" />
          ))}
          {[35, 48, 42, 55, 50, 62].map((h, i) => (
            <rect key={`s${i}`} x={i * 18 + 2} y={100 - h} width="7" height={h} rx="2" fill={barSale} opacity="0.8" />
          ))}
          {[25, 38, 30, 42, 36, 48].map((h, i) => (
            <rect key={`p${i}`} x={i * 18 + 10} y={100 - h} width="7" height={h} rx="2" fill={barPurchase} opacity="0.5" />
          ))}
        </svg>
      </div>
    </div>
  );
}
