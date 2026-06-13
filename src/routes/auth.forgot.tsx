import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/forgot")({
  component: ForgotPage,
});

function ForgotPage() {
  const { lang } = useI18n();
  const [email, setEmail] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        toast.success(lang === "ar" ? "تم إرسال رابط إعادة التعيين (تجريبي)" : "Reset link sent (demo)");
      }}
      className="space-y-4"
    >
      <h2 className="font-semibold text-lg">{lang === "ar" ? "نسيت كلمة المرور" : "Reset your password"}</h2>
      <p className="text-sm text-muted-foreground">
        {lang === "ar" ? "أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين." : "Enter your email to receive a reset link."}
      </p>
      <div className="space-y-1.5">
        <Label>{lang === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full">
        {lang === "ar" ? "إرسال الرابط" : "Send reset link"}
      </Button>
    </form>
  );
}
