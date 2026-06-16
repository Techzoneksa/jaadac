"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface CompanySettings {
  name_ar: string; name_en: string; vat: string; cr: string;
  phone: string; email: string; city: string; address: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { register, handleSubmit, reset } = useForm<CompanySettings>();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => { reset(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [reset]);

  async function onSubmit(data: CompanySettings) {
    setSaving(true); setError(""); setSuccess("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error); return; }
    setSuccess("تم حفظ الإعدادات");
  }

  if (loading) return <p className="text-center py-8 text-[#64748b]">جار التحميل...</p>;

  return (
    <div>
      <PageHeader title="الإعدادات" description="إعدادات المنشأة والنظام" />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-4">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">بيانات المنشأة</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>اسم المنشأة (عربي)</Label>
                <Input {...register("name_ar")} />
              </div>
              <div className="space-y-1">
                <Label>اسم المنشأة (إنجليزي)</Label>
                <Input {...register("name_en")} />
              </div>
              <div className="space-y-1">
                <Label>الرقم الضريبي</Label>
                <Input {...register("vat")} />
              </div>
              <div className="space-y-1">
                <Label>السجل التجاري</Label>
                <Input {...register("cr")} />
              </div>
              <div className="space-y-1">
                <Label>رقم الجوال</Label>
                <Input {...register("phone")} />
              </div>
              <div className="space-y-1">
                <Label>البريد الإلكتروني</Label>
                <Input type="email" {...register("email")} />
              </div>
              <div className="space-y-1">
                <Label>المدينة</Label>
                <Input {...register("city")} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>العنوان</Label>
                <Textarea {...register("address")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-[#dc2626] mb-4">{error}</p>}
        {success && <p className="text-sm text-green-600 mb-4">{success}</p>}

        <Button type="submit" disabled={saving}>
          {saving ? "جار الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </form>
    </div>
  );
}
