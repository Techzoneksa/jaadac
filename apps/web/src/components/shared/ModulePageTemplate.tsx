import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";

interface ModulePageTemplateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  status?: "placeholder" | "foundation" | "in-progress" | "ready";
  children?: React.ReactNode;
}

const statusConfig = {
  placeholder: { label: "قيد التطوير", color: "bg-amber-100 text-amber-700 border-amber-200" },
  foundation: { label: "أساسي", color: "bg-blue-100 text-blue-700 border-blue-200" },
  "in-progress": { label: "قيد الترحيل", color: "bg-purple-100 text-purple-700 border-purple-200" },
  ready: { label: "مكتمل", color: "bg-green-100 text-green-700 border-green-200" },
};

export function ModulePageTemplate({
  title,
  description,
  action,
  status = "placeholder",
  children,
}: ModulePageTemplateProps) {
  const cfg = statusConfig[status];

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        action={
          <div className="flex items-center gap-3">
            {status && (
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
                {cfg.label}
              </span>
            )}
            {action}
          </div>
        }
      />

      {children ? (
        children
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <span className="text-4xl">🏗️</span>
              <h3 className="text-lg font-semibold text-[#64748b]">{title}</h3>
              <p className="text-sm text-[#94a3b8] max-w-md">
                سيتم ترحيل هذه الوحدة من نسخة الديمو إلى الإنتاج في المراحل القادمة.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#2563eb]" />
                <span className="text-xs text-[#94a3b8]">Production Shell</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
