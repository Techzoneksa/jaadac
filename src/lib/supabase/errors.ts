export type DbErrorType =
  | "MISSING_TABLE"
  | "RLS_DENIED"
  | "AUTH_REQUIRED"
  | "INVALID_ENV"
  | "NETWORK_ERROR"
  | "UNKNOWN_DB_ERROR";

export interface DbError {
  type: DbErrorType;
  message: string;
  detail?: string;
}

const TABLE_NOT_FOUND = /relation ".*" does not exist|could not find the table|schema cache|does not exist/i;
const PERMISSION_DENIED = /permission denied|policy|violates row-level security/i;
const AUTH_FAILED = /auth|unauthorized|not authenticated|jwt/i;
const NETWORK_ERR = /fetch|network|connect|timeout|econnrefused|econnreset|enotfound/i;

export function classifyDbError(err: unknown): DbError {
  const msg = err instanceof Error ? err.message : String(err || "Unknown error");

  if (TABLE_NOT_FOUND.test(msg)) {
    const match = msg.match(/relation "(.*?)"|'(.*?)'/);
    return {
      type: "MISSING_TABLE",
      message: "لم يتم تهيئة قاعدة البيانات بعد. يرجى تطبيق migrations.",
      detail: match ? `الجدول المطلوب: ${match[1] || match[2]}` : undefined,
    };
  }

  if (PERMISSION_DENIED.test(msg)) {
    return {
      type: "RLS_DENIED",
      message: "لا توجد صلاحية للوصول إلى هذه البيانات.",
      detail: msg.length < 200 ? msg : undefined,
    };
  }

  if (AUTH_FAILED.test(msg)) {
    return {
      type: "AUTH_REQUIRED",
      message: "يجب تسجيل الدخول أولاً.",
      detail: undefined,
    };
  }

  if (NETWORK_ERR.test(msg)) {
    return {
      type: "NETWORK_ERROR",
      message: "تعذر الاتصال بقاعدة البيانات حاليًا.",
      detail: undefined,
    };
  }

  const isEnv = msg.includes("Supabase") || msg.includes("supabase") || msg.includes("env");
  if (isEnv) {
    return {
      type: "INVALID_ENV",
      message: "إعدادات الاتصال بقاعدة البيانات غير مكتملة.",
      detail: undefined,
    };
  }

  return {
    type: "UNKNOWN_DB_ERROR",
    message: "حدث خطأ غير متوقع في قاعدة البيانات.",
    detail: msg.length < 200 ? msg : undefined,
  };
}
