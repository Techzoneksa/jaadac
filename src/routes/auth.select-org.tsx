import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { TenantService } from "@/lib/services";
import { Building2, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/auth/select-org")({
  component: SelectOrgPage,
});

function SelectOrgPage() {
  const { lang } = useI18n();
  const { switchTenant } = useAuth();
  const navigate = useNavigate();
  const tenants = TenantService.list();
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">{lang === "ar" ? "اختر المؤسسة" : "Select your organization"}</h2>
      <p className="text-sm text-muted-foreground">
        {lang === "ar" ? "اختر المؤسسة التي تريد العمل عليها." : "Choose the organization you'd like to work in."}
      </p>
      <div className="space-y-2">
        {tenants.map((t) => (
          <button
            key={t.id}
            onClick={() => { switchTenant(t.id); navigate({ to: "/" }); }}
            className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors text-start"
          >
            <div className="size-10 rounded-md bg-primary/10 flex items-center justify-center">
              <Building2 className="size-5 text-primary" />
            </div>
            <div className="flex-1 leading-tight">
              <div className="font-medium text-sm">{lang === "ar" ? t.name_ar : t.name_en}</div>
              <div className="text-xs text-muted-foreground uppercase">{t.plan}</div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        ))}
      </div>
      <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/" })}>
        {lang === "ar" ? "متابعة" : "Continue"}
      </Button>
    </div>
  );
}
