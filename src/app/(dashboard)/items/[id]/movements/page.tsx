"use client";

import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ItemMovementsPage() {
  const router = useRouter();
  const params = useParams();

  return (
    <div>
      <PageHeader title="حركات الصنف" description={`رقم الصنف: ${params.id}`}
        action={<Button variant="outline" onClick={() => router.back()}>رجوع</Button>} />
      <Card>
        <CardContent className="p-6 text-center py-12">
          <p className="text-lg text-[#64748b]">حركات الصنف قيد التطوير</p>
        </CardContent>
      </Card>
    </div>
  );
}
