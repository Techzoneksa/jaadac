"use client";

import { useTheme } from "@/lib/ThemeProvider";

export function DashboardCharts() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const lineColor1 = "#7c3aed";
  const lineColor2 = "#a855f7";
  const fillColor1 = "url(#areaGrad1)";

  // Simple sparkline data
  const points1 = [30, 45, 38, 52, 48, 62, 58, 70, 65, 78, 72, 85].map((v, i) => `${i * 10},${100 - v}`);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {/* Area Chart */}
      <div
        className="rounded-2xl border p-5"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>الإيرادات</h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>حركة المبيعات الشهرية</p>
          </div>
          <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ backgroundColor: "var(--success-soft)", color: "var(--success)" }}>
            +15.2%
          </span>
        </div>
        <svg viewBox="0 0 120 100" className="w-full h-28">
          <defs>
            <linearGradient id="areaGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor1} stopOpacity="0.25" />
              <stop offset="100%" stopColor={lineColor1} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[25, 50, 75].map((y) => (
            <line key={y} x1="0" y1={y} x2="120" y2={y} stroke={gridColor} strokeWidth="0.5" />
          ))}
          {/* Area fill */}
          <polygon
            points={`0,100 ${points1.join(" ")} 110,100`}
            fill={fillColor1}
          />
          {/* Line */}
          <polyline
            points={points1.join(" ")}
            fill="none"
            stroke={lineColor1}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dot at end */}
          <circle cx="110" cy={100 - 85} r="2.5" fill={lineColor1} stroke="white" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Bar Chart */}
      <div
        className="rounded-2xl border p-5"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>المبيعات vs المشتريات</h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>مقارنة شهرية</p>
          </div>
        </div>
        <svg viewBox="0 0 120 100" className="w-full h-28">
          {/* Grid lines */}
          {[25, 50, 75].map((y) => (
            <line key={y} x1="0" y1={y} x2="120" y2={y} stroke={gridColor} strokeWidth="0.5" />
          ))}
          {/* Bars - sale */}
          {[35, 45, 38, 50, 42, 55].map((h, i) => (
            <rect
              key={`s${i}`}
              x={i * 18 + 2}
              y={100 - h}
              width="7"
              height={h}
              rx="2"
              fill={lineColor1}
              opacity="0.8"
            />
          ))}
          {/* Bars - purchase */}
          {[25, 35, 28, 40, 32, 45].map((h, i) => (
            <rect
              key={`p${i}`}
              x={i * 18 + 10}
              y={100 - h}
              width="7"
              height={h}
              rx="2"
              fill={lineColor2}
              opacity="0.5"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
