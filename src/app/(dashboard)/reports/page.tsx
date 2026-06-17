"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3, PieChart, TrendingUp, Users, Store,
  Receipt, ShoppingCart, DollarSign, Landmark, Search, Star,
  Download, ArrowLeft,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";

interface ReportCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  gradient: string;
  href: string;
  popular?: boolean;
}

const categories = [
  { id: "all", label: "الكل" },
  { id: "مالية", label: "التقارير المالية" },
  { id: "مبيعات", label: "تقارير المبيعات" },
  { id: "مشتريات", label: "تقارير المشتريات" },
  { id: "ضرائب", label: "تقارير الضرائب" },
  { id: "عملاء", label: "العملاء والموردين" },
];

const reports: ReportCard[] = [
  {
    title: "ملخص الإيرادات", description: "تحليل شامل للإيرادات والمبيعات خلال الفترة",
    icon: <DollarSign className="h-6 w-6" />, category: "مالية",
    gradient: "linear-gradient(135deg, #7c3aed, #a855f7)", href: "#",
  },
  {
    title: "المبيعات اليومية", description: "تقرير تفصيلي للمبيعات اليومية والفواتير",
    icon: <Receipt className="h-6 w-6" />, category: "مبيعات",
    gradient: "linear-gradient(135deg, #10b981, #34d399)", href: "#",
  },
  {
    title: "تقارير ضريبة VAT", description: "ملخص ضريبة القيمة المضافة والفواتير الضريبية",
    icon: <PieChart className="h-6 w-6" />, category: "ضرائب",
    gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)", href: "#",
  },
  {
    title: "التقارير المالية", description: "الميزانية والأرباح والخسائر والتدفقات النقدية",
    icon: <BarChart3 className="h-6 w-6" />, category: "مالية",
    gradient: "linear-gradient(135deg, #06b6d4, #22d3ee)", href: "#",
  },
  {
    title: "تقارير العملاء", description: "تحليل قاعدة العملاء وأكبر العملاء والمبيعات لكل عميل",
    icon: <Users className="h-6 w-6" />, category: "عملاء",
    gradient: "linear-gradient(135deg, #ec4899, #f472b6)", href: "#",
  },
  {
    title: "تقارير الموردين", description: "تحليل الموردين والمشتريات لكل مورد",
    icon: <Store className="h-6 w-6" />, category: "عملاء",
    gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)", href: "#",
  },
  {
    title: "المشتريات", description: "تقرير المشتريات وأوامر الشراء",
    icon: <ShoppingCart className="h-6 w-6" />, category: "مشتريات",
    gradient: "linear-gradient(135deg, #ef4444, #f87171)", href: "#",
  },
  {
    title: "المقبوضات والمدفوعات", description: "ملخص الحركات النقدية والبنكية",
    icon: <Landmark className="h-6 w-6" />, category: "مالية",
    gradient: "linear-gradient(135deg, #6366f1, #818cf8)", href: "#",
  },
  {
    title: "تقارير الأرباح", description: "الأرباح التقديرية وصافي الربح",
    icon: <TrendingUp className="h-6 w-6" />, category: "مالية",
    gradient: "linear-gradient(135deg, #14b8a6, #2dd4bf)", href: "#",
  },
];

export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["ملخص الإيرادات", "المبيعات اليومية"]));

  const filtered = reports.filter((r) => {
    const matchSearch = !search || r.title.includes(search) || r.description.includes(search);
    const matchCat = activeCategory === "all" || r.category === activeCategory;
    return matchSearch && matchCat;
  });

  const toggleFav = (title: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="مركز التقارير"
        description="التقارير المالية والتشغيلية للمنشأة"
        count={reports.length}
        action={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
        }
      />

      {/* Favorites */}
      {favorites.size > 0 && (
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4" style={{ color: "var(--warning)" }} fill="var(--warning)" />
            <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>التقارير المفضلة</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {reports.filter((r) => favorites.has(r.title)).map((r) => (
              <Link
                key={r.title}
                href={r.href}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: "var(--surface)",
                  color: "var(--fg)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg text-white" style={{ background: r.gradient }}>
                  {r.icon}
                </div>
                {r.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search + Category filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted-light)" }} />
          <input
            type="text"
            placeholder="ابحث في التقارير..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-2xl border px-4 pr-10 text-sm transition-all"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--fg)",
            }}
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-nowrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                backgroundColor: activeCategory === cat.id ? "var(--primary)" : "var(--surface)",
                color: activeCategory === cat.id ? "#ffffff" : "var(--text-muted)",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Report cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <BarChart3 className="h-8 w-8" style={{ color: "var(--text-muted-light)" }} />
          </div>
          <p className="text-base font-semibold" style={{ color: "var(--fg)" }}>لا توجد تقارير</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>حاول تغيير نطاق البحث أو التصنيف</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const isFav = favorites.has(r.title);
            return (
              <div
                key={r.title}
                className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
              >
                <div
                  className="absolute inset-0 opacity-[0.02] pointer-events-none"
                  style={{ background: r.gradient }}
                />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ background: r.gradient }}
                    >
                      {r.icon}
                    </div>
                    <button
                      onClick={() => toggleFav(r.title)}
                      className="p-1.5 rounded-lg transition-colors"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <Star
                        className="h-4 w-4"
                        style={{ color: isFav ? "var(--warning)" : "var(--text-muted-light)" }}
                        fill={isFav ? "var(--warning)" : "transparent"}
                      />
                    </button>
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>{r.title}</h3>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {r.description}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium"
                      style={{ backgroundColor: "var(--surface)", color: "var(--text-muted)" }}
                    >
                      {r.category}
                    </span>
                    <Link
                      href={r.href}
                      className="inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                      style={{ color: "var(--primary)" }}
                    >
                      فتح التقرير <ArrowLeft className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
