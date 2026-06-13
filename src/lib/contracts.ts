/**
 * Phase 1.4 — Backend-ready TypeScript contracts.
 *
 * These types describe the shape every service/adapter call must follow
 * so the data layer can be swapped from LocalStorage to a real backend
 * without changing UI or service callers.
 */

export interface BilingualMessage { ar: string; en: string }

export interface ValidationError {
  field?: string;
  code: string;
  message: BilingualMessage;
}

export interface ApiErrorShape {
  code: string;                 // e.g. "not_found", "duplicate_number", "permission_denied"
  message: BilingualMessage;
  status?: number;              // optional HTTP-style hint
  details?: unknown;
}

export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: ApiErrorShape;
  validation?: ValidationError[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListQueryParams {
  tenantId?: string;
  search?: string;
  status?: string;
  from?: string;          // ISO date
  to?: string;            // ISO date
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;          // 1-based
  pageSize?: number;
  filters?: Record<string, string | number | boolean | undefined>;
}

export const DEFAULT_PAGE_SIZE = 25;

export function okResult<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}
export function errResult<T = never>(error: ApiErrorShape): ServiceResult<T> {
  return { ok: false, error };
}
