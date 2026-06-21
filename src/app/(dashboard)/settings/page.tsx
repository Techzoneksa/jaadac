"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building2, Save, Loader2, CheckCircle2, AlertCircle, Upload, Trash2, ImageIcon, CreditCard, Settings2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface CompanySettings {
  name_ar: string; name_en: string; vat: string; cr: string; unified_no: string;
  phone: string; email: string; city: string; country: string;
  street: string; building_no: string; additional_no: string;
  district: string; postal_code: string; address: string;
  branch_name: string; logo_url?: string;
  show_logo?: boolean; show_stamp?: boolean; show_bank?: boolean;
  show_amount_text?: boolean; show_customer_address?: boolean;
  show_customer_cr?: boolean; invoice_template?: string;
  bank_footer_enabled?: boolean;
  primary_bank_name?: string; primary_bank_account_name?: string;
  primary_bank_account_number?: string; primary_bank_iban?: string;
  primary_bank_swift?: string; primary_bank_currency?: string;
  secondary_bank_name?: string; secondary_bank_account_name?: string;
  secondary_bank_account_number?: string; secondary_bank_iban?: string;
  secondary_bank_swift?: string; secondary_bank_currency?: string;
  invoice_footer_note_ar?: string; invoice_footer_note_en?: string;
}

const DEFAULTS: CompanySettings = {
  name_ar: "", name_en: "", vat: "", cr: "", unified_no: "",
  phone: "", email: "", city: "", country: "المملكة العربية السعودية",
  street: "", building_no: "", additional_no: "",
  district: "", postal_code: "", address: "",
  branch_name: "", logo_url: "",
  show_logo: true, show_stamp: true, show_bank: true,
  show_amount_text: true, show_customer_address: true,
  show_customer_cr: true, invoice_template: "standard",
  bank_footer_enabled: false,
  primary_bank_name: "", primary_bank_account_name: "",
  primary_bank_account_number: "", primary_bank_iban: "",
  primary_bank_swift: "", primary_bank_currency: "SAR",
  secondary_bank_name: "", secondary_bank_account_name: "",
  secondary_bank_account_number: "", secondary_bank_iban: "",
  secondary_bank_swift: "", secondary_bank_currency: "SAR",
  invoice_footer_note_ar: "", invoice_footer_note_en: "",
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset } = useForm<CompanySettings>({ defaultValues: DEFAULTS });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (res.ok && data && !data.error) {
        setLogoUrl(data.logo_url || "");
        reset({ ...DEFAULTS, ...data });
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  async function onSubmit(data: CompanySettings) {
    setSaving(true); setError(""); setSuccess("");
    data.logo_url = logoUrl || undefined;
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "فشل حفظ الإعدادات"); return; }
      setSuccess("تم حفظ الإعدادات بنجاح");
    } catch {
      setError("تعذر الاتصال بالخادم. تأكد من اتصالك ثم حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="الإعدادات" description="إعدادات المنشأة والنظام" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>بيانات المنشأة</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>المعلومات الأساسية للمنشأة</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>اسم المنشأة (عربي)</Label>
                <Input {...register("name_ar")} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>اسم المنشأة (إنجليزي)</Label>
                <Input {...register("name_en")} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>الرقم الضريبي (VAT)</Label>
                <Input {...register("vat")} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>السجل التجاري (CR)</Label>
                <Input {...register("cr")} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>الرقم الموحد</Label>
                <Input {...register("unified_no")} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>اسم الفرع</Label>
                <Input {...register("branch_name")} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>رقم الجوال</Label>
                <Input {...register("phone")} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>البريد الإلكتروني</Label>
                <Input type="email" {...register("email")} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>الدولة</Label>
                <Input {...register("country")} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>المدينة</Label>
                <Input {...register("city")} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>العنوان الوطني</Label>
                <Textarea {...register("address")} className="rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              <Settings2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>العنوان الوطني</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>البيانات التفصيلية للعنوان الوطني</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>الشارع</Label>
                <Input {...register("street")} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>رقم المبنى</Label>
                <Input {...register("building_no")} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>الرقم الإضافي</Label>
                <Input {...register("additional_no")} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>الحي / المنطقة</Label>
                <Input {...register("district")} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>الرمز البريدي</Label>
                <Input {...register("postal_code")} className="h-10 rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              <ImageIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>شعار المنشأة</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>يظهر في الفواتير والتقارير</p>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-6">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed overflow-hidden"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <Upload className="h-8 w-8" style={{ color: "var(--text-muted)" }} />
                )}
              </div>
              <div className="space-y-2">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingLogo(true);
                    try {
                      const fd = new FormData();
                      fd.append("file", file);
                      const res = await fetch("/api/settings/logo", { method: "POST", body: fd });
                      const json = await res.json();
                      if (res.ok && json.url) {
                        setLogoUrl(json.url);
                        setSuccess("تم رفع الشعار بنجاح. احفظ الإعدادات لتأكيد التغيير.");
                      } else {
                        setError(json.error || "فشل رفع الشعار");
                      }
                    } catch {
                      setError("فشل رفع الشعار");
                    } finally {
                      setUploadingLogo(false);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }
                  }} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo}>
                  {uploadingLogo ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Upload className="h-4 w-4 ml-1" />}
                  {uploadingLogo ? "جاري الرفع..." : "اختيار شعار"}
                </Button>
                {logoUrl && (
                  <Button type="button" variant="outline" size="sm" style={{ color: "var(--danger)" }}
                    onClick={async () => {
                      try {
                        await fetch("/api/settings/logo", { method: "DELETE" });
                        setLogoUrl("");
                      } catch { setError("فشل حذف الشعار"); }
                    }}>
                    <Trash2 className="h-4 w-4 ml-1" /> حذف الشعار
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              <Settings2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>إعدادات الفاتورة</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>تحكم في ظهور عناصر الفاتورة</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl p-4" style={{ backgroundColor: "var(--surface)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>إظهار الشعار</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>شعار المنشأة في الفاتورة</p>
                </div>
                <Switch {...register("show_logo")} />
              </div>
              <div className="flex items-center justify-between rounded-xl p-4" style={{ backgroundColor: "var(--surface)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>إظهار الختم</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>ختم المنشأة على الفاتورة</p>
                </div>
                <Switch {...register("show_stamp")} />
              </div>
              <div className="flex items-center justify-between rounded-xl p-4" style={{ backgroundColor: "var(--surface)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>إظهار بيانات البنك</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>معلومات الحساب البنكي في الفوتر</p>
                </div>
                <Switch {...register("show_bank")} />
              </div>
              <div className="flex items-center justify-between rounded-xl p-4" style={{ backgroundColor: "var(--surface)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>إظهار المبلغ كتابة</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>المبلغ بالعربي في الفاتورة</p>
                </div>
                <Switch {...register("show_amount_text")} />
              </div>
              <div className="flex items-center justify-between rounded-xl p-4" style={{ backgroundColor: "var(--surface)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>إظهار عنوان العميل</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>العنوان الوطني في الفاتورة</p>
                </div>
                <Switch {...register("show_customer_address")} />
              </div>
              <div className="flex items-center justify-between rounded-xl p-4" style={{ backgroundColor: "var(--surface)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>إظهار سجل العميل</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>السجل التجاري للعميل</p>
                </div>
                <Switch {...register("show_customer_cr")} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>بيانات البنك - الفوتر</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>تظهر في أسفل الفاتورة الضريبية</p>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl p-4" style={{ backgroundColor: "var(--surface)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>تفعيل فوتر البنك</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>إظهار بيانات البنك في أسفل الفاتورة</p>
                </div>
                <Switch {...register("bank_footer_enabled")} />
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>الحساب البنكي الأول</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>اسم البنك</Label>
                    <Input {...register("primary_bank_name")} className="h-10 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>اسم صاحب الحساب</Label>
                    <Input {...register("primary_bank_account_name")} className="h-10 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>رقم الحساب</Label>
                    <Input {...register("primary_bank_account_number")} className="h-10 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>IBAN</Label>
                    <Input {...register("primary_bank_iban")} className="h-10 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>SWIFT</Label>
                    <Input {...register("primary_bank_swift")} className="h-10 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>العملة</Label>
                    <Input {...register("primary_bank_currency")} className="h-10 rounded-xl" placeholder="SAR" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>الحساب البنكي الثاني</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>اسم البنك</Label>
                    <Input {...register("secondary_bank_name")} className="h-10 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>اسم صاحب الحساب</Label>
                    <Input {...register("secondary_bank_account_name")} className="h-10 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>رقم الحساب</Label>
                    <Input {...register("secondary_bank_account_number")} className="h-10 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>IBAN</Label>
                    <Input {...register("secondary_bank_iban")} className="h-10 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>SWIFT</Label>
                    <Input {...register("secondary_bank_swift")} className="h-10 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>العملة</Label>
                    <Input {...register("secondary_bank_currency")} className="h-10 rounded-xl" placeholder="SAR" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>ملاحظات الفوتر</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>ملاحظة الفوتر (عربي)</Label>
                    <Textarea {...register("invoice_footer_note_ar")} className="rounded-xl" placeholder="البضاعة لا ترد ولا تستبدل إلا حسب الشروط الموضحة في الفاتورة" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: "var(--fg)" }}>ملاحظة الفوتر (إنجليزي)</Label>
                    <Textarea {...register("invoice_footer_note_en")} className="rounded-xl" placeholder="Goods are not returnable or exchangeable except as per terms stated in invoice" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--danger-soft)", color: "var(--danger)" }}>
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--success-soft)", color: "var(--success)" }}>
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="h-11 px-6 rounded-2xl">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جار الحفظ...</> : <><Save className="h-4 w-4 ml-2" />حفظ الإعدادات</>}
          </Button>
        </div>
      </form>
    </div>
  );
}