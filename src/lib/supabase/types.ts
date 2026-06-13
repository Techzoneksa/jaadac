/**
 * JAAD CLOUD — Maintained Supabase row types (Phase 1.9).
 *
 * Hand-maintained placeholders mirroring the migrations under
 * `supabase/migrations/`. When the project is linked to a real Supabase
 * instance, the generated `Database` type can replace these — but the
 * row-level shapes below are intentionally aligned so the
 * FutureBackendDataAdapter can be typed today.
 *
 * Read-only safety: these types describe rows AS RETURNED by SELECT. They
 * intentionally do not redeclare write/insert shapes — Phase 1.9 backend
 * mode is read-only.
 */
export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export type UUID = string;
export type ISODate = string;
export type AppRole = "owner" | "accountant" | "sales" | "viewer";

export interface TenantRow {
  id: UUID;
  name_ar: string;
  name_en: string | null;
  vat_number: string | null;
  commercial_registration: string | null;
  country: string | null;
  currency: string | null;
  default_lang: string | null;
  created_at: ISODate;
  archived_at: ISODate | null;
}

export interface ProfileRow {
  id: UUID;
  email: string | null;
  full_name: string | null;
  active_tenant_id: UUID | null;
  created_at: ISODate;
  updated_at: ISODate | null;
}

export interface UserTenantRow {
  user_id: UUID;
  tenant_id: UUID;
  created_at: ISODate;
}

export interface UserRoleRow {
  id: UUID;
  user_id: UUID;
  tenant_id: UUID;
  role: AppRole;
  created_at: ISODate;
}

export interface CustomerRow {
  id: UUID;
  tenant_id: UUID;
  code: string | null;
  name_ar: string;
  name_en: string | null;
  phone: string | null;
  email: string | null;
  vat_number: string | null;
  address: string | null;
  opening_balance: number;
  notes: string | null;
  archived_at: ISODate | null;
  created_at: ISODate;
  updated_at: ISODate | null;
  created_by: UUID | null;
}

export type SupplierRow = CustomerRow;

export interface ItemRow {
  id: UUID;
  tenant_id: UUID;
  code: string | null;
  name_ar: string;
  name_en: string | null;
  unit: string | null;
  price: number;
  cost: number | null;
  tax_rate: number | null;
  type: string | null;
  archived_at: ISODate | null;
  created_at: ISODate;
  updated_at: ISODate | null;
}

export interface QuotationRow {
  id: UUID;
  tenant_id: UUID;
  number: string;
  customer_id: UUID;
  date: ISODate;
  expires_at: ISODate | null;
  status: string;
  subtotal: number;
  tax_total: number;
  total: number;
  notes: string | null;
  created_at: ISODate;
  updated_at: ISODate | null;
}

export interface QuotationLineRow {
  id: UUID;
  quotation_id: UUID;
  item_id: UUID | null;
  description: string | null;
  qty: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
}

export interface InvoiceRow {
  id: UUID;
  tenant_id: UUID;
  number: string;
  customer_id: UUID;
  date: ISODate;
  due_date: ISODate | null;
  status: string;
  subtotal: number;
  tax_total: number;
  total: number;
  paid_total: number;
  notes: string | null;
  posted_at: ISODate | null;
  created_at: ISODate;
  updated_at: ISODate | null;
}

export type InvoiceLineRow = QuotationLineRow & { invoice_id: UUID };

export interface ReceiptRow {
  id: UUID;
  tenant_id: UUID;
  number: string;
  customer_id: UUID | null;
  invoice_id: UUID | null;
  date: ISODate;
  amount: number;
  method: string | null;
  notes: string | null;
  created_at: ISODate;
}

export interface PaymentRow {
  id: UUID;
  tenant_id: UUID;
  number: string;
  supplier_id: UUID | null;
  date: ISODate;
  amount: number;
  method: string | null;
  notes: string | null;
  created_at: ISODate;
}

export interface ChartAccountRow {
  id: UUID;
  tenant_id: UUID;
  code: string;
  name_ar: string;
  name_en: string | null;
  type: string;
  parent_id: UUID | null;
  is_active: boolean;
  created_at: ISODate;
}

export interface JournalEntryRow {
  id: UUID;
  tenant_id: UUID;
  number: string;
  date: ISODate;
  description: string | null;
  source: string | null;
  posted_at: ISODate | null;
  created_at: ISODate;
}

export interface JournalEntryLineRow {
  id: UUID;
  journal_entry_id: UUID;
  account_id: UUID;
  debit: number;
  credit: number;
  description: string | null;
}

export interface TaskRow {
  id: UUID;
  tenant_id: UUID;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  assignee_id: UUID | null;
  due_date: ISODate | null;
  created_at: ISODate;
  updated_at: ISODate | null;
}

export interface SettingsCompanyRow {
  tenant_id: UUID;
  name_ar: string | null;
  name_en: string | null;
  vat_number: string | null;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface SettingsTaxRow {
  tenant_id: UUID;
  default_rate: number;
  inclusive: boolean;
}

export interface SettingsNumberingRow {
  tenant_id: UUID;
  invoice_prefix: string | null;
  invoice_padding: number | null;
  quotation_prefix: string | null;
  quotation_padding: number | null;
  receipt_prefix: string | null;
  receipt_padding: number | null;
  payment_prefix: string | null;
  payment_padding: number | null;
}

export interface AuditLogRow {
  id: UUID;
  tenant_id: UUID;
  user_id: UUID | null;
  action: string;
  entity: string | null;
  entity_id: UUID | null;
  message_ar: string | null;
  message_en: string | null;
  meta: Json | null;
  created_at: ISODate;
}

/** Aggregated tables map — drop-in replacement for generated Database type. */
export interface Database {
  public: {
    Tables: {
      tenants: { Row: TenantRow; Insert: Partial<TenantRow>; Update: Partial<TenantRow> };
      profiles: { Row: ProfileRow; Insert: Partial<ProfileRow>; Update: Partial<ProfileRow> };
      user_tenants: { Row: UserTenantRow; Insert: Partial<UserTenantRow>; Update: Partial<UserTenantRow> };
      user_roles: { Row: UserRoleRow; Insert: Partial<UserRoleRow>; Update: Partial<UserRoleRow> };
      customers: { Row: CustomerRow; Insert: Partial<CustomerRow>; Update: Partial<CustomerRow> };
      suppliers: { Row: SupplierRow; Insert: Partial<SupplierRow>; Update: Partial<SupplierRow> };
      items: { Row: ItemRow; Insert: Partial<ItemRow>; Update: Partial<ItemRow> };
      quotations: { Row: QuotationRow; Insert: Partial<QuotationRow>; Update: Partial<QuotationRow> };
      quotation_lines: { Row: QuotationLineRow; Insert: Partial<QuotationLineRow>; Update: Partial<QuotationLineRow> };
      invoices: { Row: InvoiceRow; Insert: Partial<InvoiceRow>; Update: Partial<InvoiceRow> };
      invoice_lines: { Row: InvoiceLineRow; Insert: Partial<InvoiceLineRow>; Update: Partial<InvoiceLineRow> };
      receipts: { Row: ReceiptRow; Insert: Partial<ReceiptRow>; Update: Partial<ReceiptRow> };
      payments: { Row: PaymentRow; Insert: Partial<PaymentRow>; Update: Partial<PaymentRow> };
      chart_accounts: { Row: ChartAccountRow; Insert: Partial<ChartAccountRow>; Update: Partial<ChartAccountRow> };
      journal_entries: { Row: JournalEntryRow; Insert: Partial<JournalEntryRow>; Update: Partial<JournalEntryRow> };
      journal_entry_lines: { Row: JournalEntryLineRow; Insert: Partial<JournalEntryLineRow>; Update: Partial<JournalEntryLineRow> };
      tasks: { Row: TaskRow; Insert: Partial<TaskRow>; Update: Partial<TaskRow> };
      settings_company: { Row: SettingsCompanyRow; Insert: Partial<SettingsCompanyRow>; Update: Partial<SettingsCompanyRow> };
      settings_tax: { Row: SettingsTaxRow; Insert: Partial<SettingsTaxRow>; Update: Partial<SettingsTaxRow> };
      settings_numbering: { Row: SettingsNumberingRow; Insert: Partial<SettingsNumberingRow>; Update: Partial<SettingsNumberingRow> };
      audit_logs: { Row: AuditLogRow; Insert: Partial<AuditLogRow>; Update: Partial<AuditLogRow> };
    };
    Enums: { app_role: AppRole };
  };
}
