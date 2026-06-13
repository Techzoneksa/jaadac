import { Card, CardContent } from "@/components/ui/Card";

export function PlaceholderPage({
  title,
  module,
}: {
  title: string;
  module: string;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <span className="text-sm text-gray-500">JAAD CLOUD</span>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-6xl">🏗️</div>
            <h2 className="text-xl font-semibold text-gray-500">
              {module}
            </h2>
            <p className="text-gray-400 max-w-md">
              هذه الوحدة قيد التطوير. سيتم ترحيلها من نسخة الديمو
              إلى الإنتاج في المراحل القادمة.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
              Production Shell — المرحلة 2.1
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
