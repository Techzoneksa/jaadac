import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { lang } = useI18n();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", company: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await register(form.name, form.email);
    setLoading(false);
    toast.success(lang === "ar" ? "تم إنشاء الحساب التجريبي" : "Demo account created");
    navigate({ to: "/" });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="font-semibold text-lg">{lang === "ar" ? "إنشاء حساب جديد" : "Create your account"}</h2>
      <div className="space-y-1.5">
        <Label>{lang === "ar" ? "الاسم" : "Full Name"}</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="space-y-1.5">
        <Label>{lang === "ar" ? "اسم الشركة" : "Company Name"}</Label>
        <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
      </div>
      <div className="space-y-1.5">
        <Label>{lang === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </div>
      <div className="space-y-1.5">
        <Label>{lang === "ar" ? "كلمة المرور" : "Password"}</Label>
        <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {lang === "ar" ? "إنشاء الحساب" : "Create account"}
      </Button>
    </form>
  );
}
