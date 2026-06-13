/**
 * JAAD CLOUD — Tenant Bootstrap service (Phase 1.7).
 *
 * Prepared, INACTIVE in demo mode. After real Supabase signup later, this
 * service can be invoked to create:
 *   - tenant row
 *   - profile row
 *   - user_tenants membership
 *   - user_roles (owner)
 *   - default company / tax / numbering settings
 *   - default chart of accounts
 *   - initial audit log entry
 *
 * Strategy: prefer the SQL RPC `bootstrap_tenant_for_user(...)` (added in
 * migration 004) which performs the whole bootstrap atomically. This module
 * exposes a typed wrapper.
 */
import { getSupabaseClient, isSupabaseConfigured } from "./client";
import { getCurrentUserId } from "./session";
import { DATA_MODE } from "@/lib/adapters";

export interface BootstrapInput {
  tenant_name_ar: string;
  tenant_name_en: string;
  default_currency?: string; // SAR
  vat_rate?: number;         // 0.15
  locale?: "ar" | "en";
}

export interface BootstrapResult {
  ok: boolean;
  tenant_id?: string;
  message: { ar: string; en: string };
  reason?: "demo_mode" | "not_configured" | "no_user" | "error";
}

export function bootstrapReadiness() {
  return {
    backendConfigured: isSupabaseConfigured(),
    demoModeActive: DATA_MODE === "demo",
    rpcExpected: "bootstrap_tenant_for_user",
    canRunNow: isSupabaseConfigured() && DATA_MODE !== "demo",
    message: DATA_MODE === "demo"
      ? {
          ar: "خدمة تجهيز المؤسسة جاهزة لكنها غير نشطة في الوضع التجريبي.",
          en: "Tenant bootstrap service is prepared but inactive in demo mode.",
        }
      : isSupabaseConfigured()
        ? { ar: "جاهز للتشغيل.", en: "Ready to run." }
        : { ar: "الباك اند غير مُهيّأ.", en: "Backend not configured." },
  };
}

export async function bootstrapTenantForCurrentUser(input: BootstrapInput): Promise<BootstrapResult> {
  if (DATA_MODE === "demo") {
    return {
      ok: false,
      reason: "demo_mode",
      message: {
        ar: "لا يتم تنفيذ تجهيز المؤسسة في الوضع التجريبي.",
        en: "Tenant bootstrap does not run in demo mode.",
      },
    };
  }
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      reason: "not_configured",
      message: { ar: "الباك اند غير مُهيّأ.", en: "Backend not configured." },
    };
  }
  const client: any = await getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      reason: "error",
      message: { ar: "تعذّر تحميل عميل Supabase.", en: "Supabase client unavailable." },
    };
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      ok: false,
      reason: "no_user",
      message: { ar: "لا يوجد مستخدم مسجّل دخوله.", en: "No authenticated user." },
    };
  }
  try {
    const { data, error } = await client.rpc("bootstrap_tenant_for_user", {
      p_user_id: userId,
      p_name_ar: input.tenant_name_ar,
      p_name_en: input.tenant_name_en,
      p_currency: input.default_currency ?? "SAR",
      p_vat_rate: input.vat_rate ?? 0.15,
      p_locale: input.locale ?? "ar",
    });
    if (error) throw error;
    return {
      ok: true,
      tenant_id: data?.tenant_id ?? data,
      message: { ar: "تم تجهيز المؤسسة بنجاح.", en: "Tenant bootstrapped successfully." },
    };
  } catch (e: any) {
    return {
      ok: false,
      reason: "error",
      message: {
        ar: `فشل تجهيز المؤسسة: ${e?.message ?? "خطأ غير معروف"}`,
        en: `Tenant bootstrap failed: ${e?.message ?? "Unknown error"}`,
      },
    };
  }
}
