import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const { lang } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("owner@jaad.sa");
  const [password, setPassword] = useState("demo");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      toast.success(lang === "ar" ? "تم تسجيل الدخول" : "Signed in");
      navigate({ to: "/" });
    }
  };

  const backendReady = isSupabaseConfigured();

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="font-semibold text-lg">{lang === "ar" ? "تسجيل الدخول" : "Sign in to your account"}</h2>
      <div className="text-xs rounded-md border bg-muted/40 px-3 py-2 text-muted-foreground">
        {backendReady
          ? (lang === "ar" ? "وضع المصادقة: تجريبي (سيتم التحوّل إلى Supabase لاحقًا)." : "Auth mode: Demo (will switch to Supabase later).")
          : (lang === "ar" ? "الباك اند غير مُهيّأ — يتم استخدام المصادقة التجريبية." : "Backend not configured — using demo auth.")}
      </div>
      <div className="space-y-1.5">
        <Label>{lang === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>{lang === "ar" ? "كلمة المرور" : "Password"}</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
      </Button>
    </form>
  );
}
