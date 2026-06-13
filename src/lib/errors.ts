/**
 * Phase 1.4 — Standardized application error.
 *
 * Always carry a bilingual user-facing message so UI never has to surface a
 * raw technical string.
 */
import type { BilingualMessage } from "./contracts";

export type AppErrorCode =
  | "not_found"
  | "duplicate_number"
  | "permission_denied"
  | "validation_failed"
  | "adapter_unavailable"
  | "not_implemented"
  | "unknown";

export class AppError extends Error {
  code: AppErrorCode;
  message: string;
  ar: string;
  en: string;
  status?: number;
  details?: unknown;

  constructor(code: AppErrorCode, msg: BilingualMessage, status?: number, details?: unknown) {
    super(`${code}: ${msg.en}`);
    this.code = code;
    this.message = `${code}: ${msg.en}`;
    this.ar = msg.ar;
    this.en = msg.en;
    this.status = status;
    this.details = details;
  }

  get bilingual(): BilingualMessage {
    return { ar: this.ar, en: this.en };
  }
}

export const friendlyError = (e: unknown, lang: "ar" | "en" = "ar"): string => {
  if (e instanceof AppError) return lang === "ar" ? e.ar : e.en;
  if (e instanceof Error) return lang === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred";
  return lang === "ar" ? "حدث خطأ" : "Something went wrong";
};

export const ERRORS = {
  notFound: (entity: string) =>
    new AppError("not_found", { ar: `${entity} غير موجود`, en: `${entity} not found` }, 404),
  duplicateNumber: (n: string) =>
    new AppError("duplicate_number", {
      ar: `رقم المستند مستخدم بالفعل: ${n}`,
      en: `Document number already in use: ${n}`,
    }, 409),
  permissionDenied: () =>
    new AppError("permission_denied", {
      ar: "ليس لديك صلاحية لتنفيذ هذا الإجراء",
      en: "You do not have permission to perform this action",
    }, 403),
  notImplemented: () =>
    new AppError("not_implemented", {
      ar: "هذه الميزة غير متاحة في الوضع التجريبي",
      en: "This feature is not available in demo mode",
    }, 501),
};
