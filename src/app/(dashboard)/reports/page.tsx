"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { BarChart3, TrendingUp, Users, Receipt, Wallet } from "lucide-react";

const reportCards = [
  { label: "كشف الحساب", icon: Users, href: "#" },
  { label: "دفتر الأستاذ", icon: BarChart3, href: "#" },
  { label: "ميزان المراجعة", icon: TrendingUp, href: "#" },
  { label: "قائمة الدخل", icon: Receipt, href: "#" },
  { label: "الميزانية العمومية", icon: Wallet, href: "#" },
];

export default function ReportsPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ customers: 0, suppliers: 0, items: 0, invoices: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
      fetch("/api/items").then((r) => r.json()),
      fetch("/api/invoices?type=sale").then((r) => r.json()),
    ]).then(([c, s, i, inv]) => {
      setStats({
        customers: Array.isArray(c) ? c.length : 0,
        suppliers: Array.isArray(s) ? s.length : 0,
        items: Array.isArray(i) ? i.length : 0,
        invoices: Array.isArray(inv) ? inv.length : 0,
      });
    }).catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader title="مركز التقارير" description="التقارير المالية والإدارية" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-[#64748b]">العملاء</p>
          <p className="text-2xl font-bold text-[#2563eb]">{stats.customers}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[#64748b]">الموردون</p>
          <p className="text-2xl font-bold text-[#059669]">{stats.suppliers}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[#64748b]">الأصناف</p>
          <p className="text-2xl font-bold text-[#d97706]">{stats.items}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[#64748b]">فواتير المبيعات</p>
          <p className="text-2xl font-bold text-[#dc2626]">{stats.invoices}</p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((r) => (
          <Card
            key={r.label}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(r.href)}
          >
            <div className="flex items-center gap-3">
              <r.icon className="h-5 w-5 text-[#64748b]" />
              <p className="font-medium">{r.label}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
