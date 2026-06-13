/**
 * Convenience hook for emitting audit events bound to the current session.
 * Falls back to the demo owner/tenant if no session yet (during initial render).
 */
import { useAuth } from "@/lib/auth";
import { AuditService } from "@/lib/services";
import { DEMO_TENANT_ID } from "@/lib/store";

export function useAudit() {
  const { session } = useAuth();
  const tenant_id = session?.tenant_id || DEMO_TENANT_ID;
  const user_id = session?.user_id || "u1";

  return {
    log(
      action: string,
      entity_type: string,
      ar: string,
      en: string,
      entity_id?: string,
    ) {
      AuditService.log({ tenant_id, user_id, action, entity_type, entity_id, description_ar: ar, description_en: en });
    },
  };
}
