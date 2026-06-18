import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "ملف مطلوب" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const fileName = `logo_${user.id.replace(/-/g, "")}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const adminSupabase = createAdminClient();
    const bucketName = "company-logos";

    const { data: existing } = await adminSupabase.storage.getBucket(bucketName);
    if (!existing) {
      await adminSupabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
      });
    }

    const { error: uploadError } = await adminSupabase.storage
      .from(bucketName)
      .upload(fileName, buffer, { contentType: file.type, upsert: true });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: urlData } = adminSupabase.storage.from(bucketName).getPublicUrl(fileName);
    const publicUrl = urlData?.publicUrl || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${fileName}`;

    return NextResponse.json({ url: publicUrl });
  } catch (e) {
    console.error("Logo upload error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "فشل رفع الشعار" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: settings } = await supabase.from("company_settings")
      .select("logo_url").eq("tenant_id", user.id).maybeSingle();
    if (settings?.logo_url) {
      const path = settings.logo_url.split("/").pop();
      if (path) {
        const adminSupabase = createAdminClient();
        await adminSupabase.storage.from("company-logos").remove([path]);
      }
      await supabase.from("company_settings")
        .update({ logo_url: null }).eq("tenant_id", user.id);
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Logo delete error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "فشل حذف الشعار" }, { status: 500 });
  }
}
