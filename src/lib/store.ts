import { useSyncExternalStore } from "react";

// ============ Types ============
export type ID = string;
export const DEMO_TENANT_ID = "t_demo";

export interface Tenant {
  id: ID;
  name_ar: string;
  name_en: string;
  plan: "demo" | "starter" | "pro";
  created_at: string;
}

export interface Customer {
  id: ID; tenant_id?: ID; name_ar: string; name_en: string; type: "individual" | "company";
  vat?: string; mobile?: string; email?: string; city?: string; address?: string;
  opening_balance: number; notes?: string; status: "active" | "inactive"; archived?: boolean;
}
export interface Supplier {
  id: ID; tenant_id?: ID; name_ar: string; name_en: string; type: "individual" | "company";
  vat?: string; mobile?: string; email?: string; city?: string; address?: string;
  notes?: string; status: "active" | "inactive"; archived?: boolean;
}
export interface Item {
  id: ID; tenant_id?: ID; name_ar: string; name_en: string; sku?: string;
  type: "service" | "non_stock" | "stock";
  sales_price: number; purchase_price?: number;
  taxable: boolean; vat_rate: number;
  qty?: number; low_stock?: number;
  description?: string; status: "active" | "inactive";
}
export interface Line {
  id: ID; item_id?: ID; description: string; qty: number; unit_price: number; vat_rate: number;
}
export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "converted";
export interface Quotation {
  id: ID; tenant_id?: ID; number: string; customer_id: ID; date: string; expiry: string;
  lines: Line[]; discount: number; notes?: string; terms?: string;
  status: QuotationStatus; converted_invoice_id?: ID;
}
export type InvoiceStatus = "draft" | "sent" | "official" | "partially_paid" | "fully_paid" | "cancelled";
export interface Invoice {
  id: ID; tenant_id?: ID; number: string; customer_id: ID; date: string; due: string;
  lines: Line[]; discount: number; notes?: string; terms?: string;
  status: InvoiceStatus; paid: number;
}
export interface Receipt {
  id: ID; tenant_id?: ID; number: string; customer_id: ID; invoice_id?: ID; date: string;
  method: "cash" | "bank_transfer" | "card" | "other"; amount: number; bank_ref?: string; notes?: string;
}
export interface Payment {
  id: ID; tenant_id?: ID; number: string; supplier_id?: ID; payee?: string; date: string;
  category: string; method: "cash" | "bank_transfer" | "card" | "other";
  amount: number; vat_amount?: number; notes?: string;
}
export type AccountClass = "assets" | "liabilities" | "equity" | "revenue" | "expenses";
export type AccountKind = "header" | "group" | "posting";
export type CashFlowType = "operating" | "investing" | "financing" | "cash" | "none";
export type AccountPurpose =
  | "cash" | "bank" | "accounts_receivable" | "suppliers" | "inventory"
  | "fixed_assets" | "accumulated_depreciation" | "vat_input" | "vat_payable"
  | "revenue" | "expense" | "cost_of_sales" | "payroll_payable"
  | "retained_earnings" | "owner_equity" | "opening_balance_equity";

export interface Account {
  id: ID; tenant_id?: ID; number: string; name_ar: string; name_en: string;
  type: AccountClass;
  parent?: ID; status: "active" | "inactive";
  /** UI kind: header = top class row, group = parent w/ children, posting = leaf. */
  kind?: AccountKind;
  cash_flow?: CashFlowType;
  payment_enabled?: boolean;
  purpose?: AccountPurpose;
  currency?: string;
  /** System-locked: cannot be deleted; critical edits restricted. */
  locked?: boolean;
  notes?: string;
}
export interface JournalLine { account_id: ID; debit: number; credit: number; description?: string; }
export type JournalSource = "sales_invoice" | "receipt_voucher" | "payment_voucher" | "manual";
export interface JournalEntry {
  id: ID; tenant_id?: ID; number: string; date: string; description: string;
  lines: JournalLine[]; status: "draft" | "posted"; source?: string;
  source_type?: JournalSource; source_id?: ID;
  created_at?: string; posted_at?: string;
}
export interface Task {
  id: ID; tenant_id?: ID; title: string; description?: string; assigned: string; date: string;
  priority: "low" | "medium" | "high";
  status: "task_new" | "in_progress" | "completed" | "deferred";
  customer_id?: ID; invoice_id?: ID; quotation_id?: ID;
}
export interface CompanySettings {
  name: string; logo?: string; vat?: string; cr?: string;
  email?: string; mobile?: string; address?: string; city?: string;
  country: string; currency: string;
}
export interface TaxSettings {
  enable_vat: boolean; default_vat: number; invoice_type: string; show_qr: boolean;
}
export interface Numbering {
  quotation: string; invoice: string; receipt: string; payment: string; journal: string;
}
export type UserRole = "owner" | "accountant" | "sales_employee" | "viewer";
export interface User { id: ID; tenant_id?: ID; name: string; email: string; role: UserRole; status: "active" | "inactive"; }

export interface AuditLog {
  id: ID; tenant_id: ID; user_id: ID;
  action: string; entity_type: string; entity_id?: ID;
  description_ar: string; description_en: string;
  created_at: string;
}

// Phase 2.1.5 — Purchase invoices (demo-only foundation)
export type PurchaseInvoiceStatus = "draft" | "approved" | "partially_paid" | "paid" | "cancelled";
export interface PurchaseInvoiceLine {
  id: ID; item_id?: ID; description: string;
  qty: number; unit_cost: number; vat_rate: number;
}
export interface PurchaseInvoice {
  id: ID; tenant_id?: ID; number: string;
  supplier_id: ID; supplier_ref?: string;
  date: string; due: string;
  lines: PurchaseInvoiceLine[];
  notes?: string;
  status: PurchaseInvoiceStatus;
  paid: number;
}

// ============ Phase 2.2 — Advanced foundations ============
export type DocumentKind = "quotation" | "invoice" | "receipt" | "payment";

export interface DocumentTemplate {
  id: ID; tenant_id?: ID;
  name_ar: string; name_en: string;
  doc_type: DocumentKind;
  is_default?: boolean;
  archived?: boolean;
  show_logo: boolean; show_stamp: boolean; show_signature: boolean;
  show_vat_number: boolean; show_qr: boolean; show_payment_details: boolean;
  show_item_description: boolean; show_discount_column: boolean; show_tax_column: boolean;
  header_layout: "centered" | "left" | "right" | "split";
  footer_notes_ar?: string; footer_notes_en?: string;
  terms_ar?: string; terms_en?: string;
  text_color: string; accent_color: string; table_header_color: string;
  font_size: "sm" | "md" | "lg";
  watermark?: string;
  language: "ar" | "en" | "bilingual";
  column_labels?: Record<string, { ar: string; en: string }>;
}

export type CustomFieldType = "text" | "number" | "date" | "dropdown" | "checkbox";
export type CustomFieldScope =
  | "quotation" | "invoice" | "receipt" | "payment"
  | "quotation_line" | "invoice_line";

export interface CustomField {
  id: ID; tenant_id?: ID;
  label_ar: string; label_en: string;
  field_key: string;
  type: CustomFieldType;
  applies_to: CustomFieldScope;
  required: boolean;
  printable: boolean;
  options?: string[];
  status: "active" | "inactive";
}

export interface Branch {
  id: ID; tenant_id?: ID;
  name_ar: string; name_en: string;
  city?: string; address?: string; phone?: string; manager?: string;
  status: "active" | "inactive";
}

export interface Employee {
  id: ID; tenant_id?: ID;
  name: string; email?: string; mobile?: string;
  job_title?: string; department?: string; branch_id?: ID;
  basic_salary: number; allowances: number;
  status: "active" | "inactive";
}

export type PayrollStatus = "draft" | "approved" | "paid";
export interface PayrollRun {
  id: ID; tenant_id?: ID;
  month: number; year: number;
  employees_count: number;
  gross: number; deductions: number; net: number;
  status: PayrollStatus;
}

export type ExpenseClaimStatus = "submitted" | "approved" | "rejected" | "paid";
export interface ExpenseClaim {
  id: ID; tenant_id?: ID;
  employee_id: ID;
  date: string; category: string; amount: number;
  description?: string;
  attachment_placeholder?: string;
  status: ExpenseClaimStatus;
}

export interface Announcement {
  id: ID; tenant_id?: ID;
  title_ar: string; title_en: string;
  body_ar: string; body_en: string;
  created_by?: ID; created_at: string;
}

export type NoteLinkType = "customer" | "invoice" | "quotation" | "task";
export interface InternalNote {
  id: ID; tenant_id?: ID;
  link_type: NoteLinkType; link_id: ID;
  body: string; author?: ID; created_at: string;
}

export interface MessageTemplate {
  id: ID; tenant_id?: ID;
  channel: "email" | "whatsapp";
  doc_type: DocumentKind;
  subject_ar?: string; subject_en?: string;
  body_ar: string; body_en: string;
}

export interface State {
  tenants: Tenant[];
  customers: Customer[]; suppliers: Supplier[]; items: Item[];
  quotations: Quotation[]; invoices: Invoice[];
  receipts: Receipt[]; payments: Payment[];
  accounts: Account[]; journal: JournalEntry[]; tasks: Task[];
  users: User[];
  audit_log: AuditLog[];
  company: CompanySettings; tax: TaxSettings; numbering: Numbering;
  // Phase 2.2
  document_templates: DocumentTemplate[];
  custom_fields: CustomField[];
  branches: Branch[];
  employees: Employee[];
  payroll_runs: PayrollRun[];
  expense_claims: ExpenseClaim[];
  announcements: Announcement[];
  internal_notes: InternalNote[];
  message_templates: MessageTemplate[];
  // Phase 2.1.5
  purchase_invoices: PurchaseInvoice[];
  // Phase 2.1.14 — Taxes
  tax_rates: TaxRate[];
}

// Phase 2.1.14 — Tax rates
export type TaxType = "sales" | "purchases" | "reverse_charge" | "out_of_scope";
export type TaxUsage = "sales" | "purchases" | "both";
export interface TaxRate {
  id: ID; tenant_id?: ID;
  name_ar: string; name_en: string;
  tax_type: TaxType;
  rate: number; // 0..100
  description_ar?: string; description_en?: string;
  used_in: TaxUsage;
  is_system?: boolean;
  is_active: boolean;
  notes?: string;
  created_at?: string; updated_at?: string;
}

// ============ Demo data ============
const uid = () => Math.random().toString(36).slice(2, 10);

const tenants: Tenant[] = [
  { id: DEMO_TENANT_ID, name_ar: "شركة جاد التجريبية", name_en: "JAAD Demo Company", plan: "demo", created_at: "2026-01-01" },
];

const customers: Customer[] = [
  { id: "c1", tenant_id: DEMO_TENANT_ID, name_ar: "شركة الواحة للتجارة", name_en: "Al Waha Trading Co.", type: "company", vat: "300012345600003", mobile: "0501234567", email: "info@alwaha.sa", city: "الرياض", address: "حي العليا", opening_balance: 0, status: "active" },
  { id: "c2", tenant_id: DEMO_TENANT_ID, name_ar: "مؤسسة النخبة", name_en: "Elite Establishment", type: "company", vat: "300011223300003", mobile: "0532222222", email: "sales@elite.sa", city: "جدة", address: "حي الروضة", opening_balance: 1500, status: "active" },
  { id: "c3", tenant_id: DEMO_TENANT_ID, name_ar: "أحمد سالم", name_en: "Ahmed Salem", type: "individual", mobile: "0555555555", email: "ahmed@mail.com", city: "الدمام", address: "حي الشاطئ", opening_balance: 0, status: "active" },
  { id: "c4", tenant_id: DEMO_TENANT_ID, name_ar: "شركة الأفق الذهبي", name_en: "Golden Horizon Co.", type: "company", vat: "300099887700003", mobile: "0544444444", email: "ar@golden.sa", city: "مكة", address: "العزيزية", opening_balance: 0, status: "active" },
  { id: "c5", tenant_id: DEMO_TENANT_ID, name_ar: "نورة العتيبي", name_en: "Noura Al-Otaibi", type: "individual", mobile: "0566666666", email: "noura@mail.com", city: "الرياض", address: "حي النرجس", opening_balance: 0, status: "active" },
];

const suppliers: Supplier[] = [
  { id: "s1", tenant_id: DEMO_TENANT_ID, name_ar: "مؤسسة الإمداد", name_en: "Supply Establishment", type: "company", vat: "300055667700003", mobile: "0511111111", email: "info@supply.sa", city: "الرياض", address: "المنطقة الصناعية", status: "active" },
  { id: "s2", tenant_id: DEMO_TENANT_ID, name_ar: "شركة المعدات الحديثة", name_en: "Modern Equipment Co.", type: "company", vat: "300044556600003", mobile: "0522222222", email: "info@modern.sa", city: "جدة", address: "حي الصناعية", status: "active" },
  { id: "s3", tenant_id: DEMO_TENANT_ID, name_ar: "خالد المطيري", name_en: "Khalid Al-Mutairi", type: "individual", mobile: "0533333333", city: "الرياض", status: "active" },
  { id: "s4", tenant_id: DEMO_TENANT_ID, name_ar: "مؤسسة القرطاسية", name_en: "Stationery Est.", type: "company", mobile: "0544444444", city: "الدمام", status: "active" },
  { id: "s5", tenant_id: DEMO_TENANT_ID, name_ar: "شركة الخدمات اللوجستية", name_en: "Logistics Co.", type: "company", vat: "300033445500003", mobile: "0555555555", city: "الرياض", status: "active" },
];

const items: Item[] = [
  { id: "i1", tenant_id: DEMO_TENANT_ID, name_ar: "استشارة محاسبية", name_en: "Accounting Consultation", type: "service", sales_price: 500, taxable: true, vat_rate: 15, status: "active" },
  { id: "i2", tenant_id: DEMO_TENANT_ID, name_ar: "إعداد الميزانية", name_en: "Budget Preparation", type: "service", sales_price: 1200, taxable: true, vat_rate: 15, status: "active" },
  { id: "i3", tenant_id: DEMO_TENANT_ID, name_ar: "تصميم موقع إلكتروني", name_en: "Website Design", type: "service", sales_price: 3500, taxable: true, vat_rate: 15, status: "active" },
  { id: "i4", tenant_id: DEMO_TENANT_ID, name_ar: "اشتراك سنوي - برنامج محاسبة", name_en: "Annual Subscription - Accounting", type: "non_stock", sales_price: 1800, purchase_price: 900, taxable: true, vat_rate: 15, status: "active" },
  { id: "i5", tenant_id: DEMO_TENANT_ID, name_ar: "ترخيص برمجي", name_en: "Software License", type: "non_stock", sales_price: 750, purchase_price: 300, taxable: true, vat_rate: 15, status: "active" },
  { id: "i6", tenant_id: DEMO_TENANT_ID, name_ar: "حاسب محمول HP", name_en: "HP Laptop", type: "stock", sku: "HP-001", sales_price: 4200, purchase_price: 3300, taxable: true, vat_rate: 15, qty: 12, low_stock: 3, status: "active" },
  { id: "i7", tenant_id: DEMO_TENANT_ID, name_ar: "طابعة ليزر", name_en: "Laser Printer", type: "stock", sku: "PR-002", sales_price: 1100, purchase_price: 800, taxable: true, vat_rate: 15, qty: 5, low_stock: 2, status: "active" },
  { id: "i8", tenant_id: DEMO_TENANT_ID, name_ar: "كرسي مكتبي", name_en: "Office Chair", type: "stock", sku: "CH-003", sales_price: 650, purchase_price: 380, taxable: true, vat_rate: 15, qty: 20, low_stock: 5, status: "active" },
  { id: "i9", tenant_id: DEMO_TENANT_ID, name_ar: "شاشة 27 بوصة", name_en: "27\" Monitor", type: "stock", sku: "MN-004", sales_price: 1450, purchase_price: 1050, taxable: true, vat_rate: 15, qty: 2, low_stock: 3, status: "active" },
  { id: "i10", tenant_id: DEMO_TENANT_ID, name_ar: "خدمة تدريب", name_en: "Training Service", type: "service", sales_price: 2000, taxable: true, vat_rate: 15, status: "active" },
];

// ---------- Chart of Accounts (hierarchical, Saudi-friendly) ----------
// Existing journal entries reference: a1020 (bank), a1030 (AR), a2020 (VAT),
// a4010 (service rev), a5020 (rent). Those IDs are preserved.
const accounts: Account[] = [
  // ===== Assets =====
  { id: "a1000", tenant_id: DEMO_TENANT_ID, number: "1", name_ar: "الأصول", name_en: "Assets", type: "assets", status: "active", kind: "header", locked: true, cash_flow: "none" },

  { id: "a1100", tenant_id: DEMO_TENANT_ID, number: "11", name_ar: "الأصول المتداولة", name_en: "Current Assets", type: "assets", parent: "a1000", status: "active", kind: "group", locked: true, cash_flow: "operating" },

  { id: "a1110", tenant_id: DEMO_TENANT_ID, number: "111", name_ar: "النقد وما يعادله", name_en: "Cash and Cash Equivalents", type: "assets", parent: "a1100", status: "active", kind: "group", locked: true, cash_flow: "cash" },
  { id: "a1010", tenant_id: DEMO_TENANT_ID, number: "1111", name_ar: "الخزينة", name_en: "Cash on Hand", type: "assets", parent: "a1110", status: "active", kind: "posting", locked: true, cash_flow: "cash", payment_enabled: true, purpose: "cash", currency: "SAR" },
  { id: "a1011", tenant_id: DEMO_TENANT_ID, number: "1112", name_ar: "المصروفات النثرية", name_en: "Petty Cash", type: "assets", parent: "a1110", status: "active", kind: "posting", cash_flow: "cash", payment_enabled: true, purpose: "cash", currency: "SAR" },
  { id: "a1020", tenant_id: DEMO_TENANT_ID, number: "1113", name_ar: "الحساب البنكي", name_en: "Bank Account", type: "assets", parent: "a1110", status: "active", kind: "posting", locked: true, cash_flow: "cash", payment_enabled: true, purpose: "bank", currency: "SAR" },

  { id: "a1030", tenant_id: DEMO_TENANT_ID, number: "112", name_ar: "العملاء (ذمم مدينة)", name_en: "Accounts Receivable", type: "assets", parent: "a1100", status: "active", kind: "posting", locked: true, cash_flow: "operating", purpose: "accounts_receivable", currency: "SAR" },
  { id: "a1031", tenant_id: DEMO_TENANT_ID, number: "113", name_ar: "سلف الموظفين", name_en: "Employee Advances", type: "assets", parent: "a1100", status: "active", kind: "posting", cash_flow: "operating", purpose: "expense", currency: "SAR" },
  { id: "a1032", tenant_id: DEMO_TENANT_ID, number: "114", name_ar: "مصروفات مدفوعة مقدماً", name_en: "Prepaid Expenses", type: "assets", parent: "a1100", status: "active", kind: "posting", cash_flow: "operating", purpose: "expense", currency: "SAR" },

  { id: "a1150", tenant_id: DEMO_TENANT_ID, number: "115", name_ar: "المخزون", name_en: "Inventory", type: "assets", parent: "a1100", status: "active", kind: "group", locked: true, cash_flow: "operating" },
  { id: "a1040", tenant_id: DEMO_TENANT_ID, number: "1151", name_ar: "المستودع الرئيسي", name_en: "Main Warehouse", type: "assets", parent: "a1150", status: "active", kind: "posting", locked: true, cash_flow: "operating", purpose: "inventory", currency: "SAR" },

  { id: "a1200", tenant_id: DEMO_TENANT_ID, number: "12", name_ar: "الأصول غير المتداولة", name_en: "Non-current Assets", type: "assets", parent: "a1000", status: "active", kind: "group", locked: true, cash_flow: "investing" },
  { id: "a1210", tenant_id: DEMO_TENANT_ID, number: "121", name_ar: "الأصول الثابتة", name_en: "Fixed Assets", type: "assets", parent: "a1200", status: "active", kind: "group", locked: true, cash_flow: "investing" },
  { id: "a1050", tenant_id: DEMO_TENANT_ID, number: "1211", name_ar: "أثاث ومعدات", name_en: "Equipment & Furniture", type: "assets", parent: "a1210", status: "active", kind: "posting", cash_flow: "investing", payment_enabled: true, purpose: "fixed_assets", currency: "SAR" },
  { id: "a1051", tenant_id: DEMO_TENANT_ID, number: "1212", name_ar: "مجمع الإهلاك التراكمي", name_en: "Accumulated Depreciation", type: "assets", parent: "a1210", status: "active", kind: "posting", locked: true, cash_flow: "none", purpose: "accumulated_depreciation", currency: "SAR" },

  // ===== Liabilities =====
  { id: "a2000", tenant_id: DEMO_TENANT_ID, number: "2", name_ar: "الالتزامات", name_en: "Liabilities", type: "liabilities", status: "active", kind: "header", locked: true, cash_flow: "none" },
  { id: "a2100", tenant_id: DEMO_TENANT_ID, number: "21", name_ar: "الالتزامات المتداولة", name_en: "Current Liabilities", type: "liabilities", parent: "a2000", status: "active", kind: "group", locked: true, cash_flow: "operating" },
  { id: "a2010", tenant_id: DEMO_TENANT_ID, number: "211", name_ar: "الموردون (ذمم دائنة)", name_en: "Accounts Payable", type: "liabilities", parent: "a2100", status: "active", kind: "posting", locked: true, cash_flow: "operating", purpose: "suppliers", currency: "SAR" },
  { id: "a2020", tenant_id: DEMO_TENANT_ID, number: "2110", name_ar: "ضريبة القيمة المضافة المستحقة", name_en: "VAT Payable", type: "liabilities", parent: "a2100", status: "active", kind: "posting", locked: true, cash_flow: "operating", purpose: "vat_payable", currency: "SAR" },
  { id: "a2021", tenant_id: DEMO_TENANT_ID, number: "2111", name_ar: "ضريبة القيمة المضافة - مدخلات", name_en: "VAT Input", type: "liabilities", parent: "a2100", status: "active", kind: "posting", locked: true, cash_flow: "operating", purpose: "vat_input", currency: "SAR" },
  { id: "a2030", tenant_id: DEMO_TENANT_ID, number: "212", name_ar: "رواتب مستحقة غير مدفوعة", name_en: "Salaries Payable", type: "liabilities", parent: "a2100", status: "active", kind: "posting", cash_flow: "operating", purpose: "payroll_payable", currency: "SAR" },
  { id: "a2200", tenant_id: DEMO_TENANT_ID, number: "22", name_ar: "الالتزامات غير المتداولة", name_en: "Non-current Liabilities", type: "liabilities", parent: "a2000", status: "active", kind: "group", cash_flow: "financing" },

  // ===== Equity =====
  { id: "a3000", tenant_id: DEMO_TENANT_ID, number: "3", name_ar: "حقوق الملكية", name_en: "Equity", type: "equity", status: "active", kind: "header", locked: true, cash_flow: "none" },
  { id: "a3005", tenant_id: DEMO_TENANT_ID, number: "31", name_ar: "رصيد افتتاحي", name_en: "Opening Balance Equity", type: "equity", parent: "a3000", status: "active", kind: "posting", locked: true, cash_flow: "financing", purpose: "opening_balance_equity", currency: "SAR" },
  { id: "a3010", tenant_id: DEMO_TENANT_ID, number: "32", name_ar: "رأس المال", name_en: "Owner Equity", type: "equity", parent: "a3000", status: "active", kind: "posting", locked: true, cash_flow: "financing", purpose: "owner_equity", currency: "SAR" },
  { id: "a3015", tenant_id: DEMO_TENANT_ID, number: "33", name_ar: "مسحوبات الملاك", name_en: "Drawings", type: "equity", parent: "a3000", status: "active", kind: "posting", cash_flow: "financing", currency: "SAR" },
  { id: "a3020", tenant_id: DEMO_TENANT_ID, number: "34", name_ar: "الأرباح المحتجزة", name_en: "Retained Earnings", type: "equity", parent: "a3000", status: "active", kind: "posting", locked: true, cash_flow: "financing", purpose: "retained_earnings", currency: "SAR" },

  // ===== Revenue =====
  { id: "a4000", tenant_id: DEMO_TENANT_ID, number: "4", name_ar: "الإيرادات", name_en: "Revenue", type: "revenue", status: "active", kind: "header", locked: true, cash_flow: "none" },
  { id: "a4100", tenant_id: DEMO_TENANT_ID, number: "41", name_ar: "إيرادات المبيعات", name_en: "Sales Revenue", type: "revenue", parent: "a4000", status: "active", kind: "group", locked: true, cash_flow: "operating" },
  { id: "a4010", tenant_id: DEMO_TENANT_ID, number: "411", name_ar: "إيرادات الخدمات", name_en: "Service Revenue", type: "revenue", parent: "a4100", status: "active", kind: "posting", locked: true, cash_flow: "operating", purpose: "revenue", currency: "SAR" },
  { id: "a4020", tenant_id: DEMO_TENANT_ID, number: "412", name_ar: "إيرادات المنتجات", name_en: "Product Sales Revenue", type: "revenue", parent: "a4100", status: "active", kind: "posting", locked: true, cash_flow: "operating", purpose: "revenue", currency: "SAR" },
  { id: "a4200", tenant_id: DEMO_TENANT_ID, number: "42", name_ar: "إيرادات أخرى", name_en: "Other Revenue", type: "revenue", parent: "a4000", status: "active", kind: "posting", cash_flow: "operating", purpose: "revenue", currency: "SAR" },

  // ===== Expenses =====
  { id: "a5000", tenant_id: DEMO_TENANT_ID, number: "5", name_ar: "المصروفات", name_en: "Expenses", type: "expenses", status: "active", kind: "header", locked: true, cash_flow: "none" },
  { id: "a5100", tenant_id: DEMO_TENANT_ID, number: "51", name_ar: "تكلفة المبيعات", name_en: "Cost of Sales", type: "expenses", parent: "a5000", status: "active", kind: "posting", locked: true, cash_flow: "operating", purpose: "cost_of_sales", currency: "SAR" },
  { id: "a5040", tenant_id: DEMO_TENANT_ID, number: "511", name_ar: "المشتريات", name_en: "Purchases", type: "expenses", parent: "a5100", status: "active", kind: "posting", cash_flow: "operating", payment_enabled: true, purpose: "cost_of_sales", currency: "SAR" },
  { id: "a5200", tenant_id: DEMO_TENANT_ID, number: "52", name_ar: "مصاريف تشغيلية", name_en: "Operating Expenses", type: "expenses", parent: "a5000", status: "active", kind: "group", locked: true, cash_flow: "operating" },
  { id: "a5030", tenant_id: DEMO_TENANT_ID, number: "521", name_ar: "الرواتب", name_en: "Salaries", type: "expenses", parent: "a5200", status: "active", kind: "posting", cash_flow: "operating", payment_enabled: true, purpose: "expense", currency: "SAR" },
  { id: "a5020", tenant_id: DEMO_TENANT_ID, number: "522", name_ar: "الإيجار", name_en: "Rent", type: "expenses", parent: "a5200", status: "active", kind: "posting", cash_flow: "operating", payment_enabled: true, purpose: "expense", currency: "SAR" },
  { id: "a5021", tenant_id: DEMO_TENANT_ID, number: "523", name_ar: "المرافق", name_en: "Utilities", type: "expenses", parent: "a5200", status: "active", kind: "posting", cash_flow: "operating", payment_enabled: true, purpose: "expense", currency: "SAR" },
  { id: "a5022", tenant_id: DEMO_TENANT_ID, number: "524", name_ar: "التسويق", name_en: "Marketing", type: "expenses", parent: "a5200", status: "active", kind: "posting", cash_flow: "operating", payment_enabled: true, purpose: "expense", currency: "SAR" },
  { id: "a5023", tenant_id: DEMO_TENANT_ID, number: "525", name_ar: "رسوم بنكية", name_en: "Bank Charges", type: "expenses", parent: "a5200", status: "active", kind: "posting", cash_flow: "operating", purpose: "expense", currency: "SAR" },
  { id: "a5050", tenant_id: DEMO_TENANT_ID, number: "526", name_ar: "المصاريف الإدارية", name_en: "Administrative Expenses", type: "expenses", parent: "a5200", status: "active", kind: "posting", cash_flow: "operating", payment_enabled: true, purpose: "expense", currency: "SAR" },
  { id: "a5210", tenant_id: DEMO_TENANT_ID, number: "527", name_ar: "مصروف الإهلاك", name_en: "Depreciation Expense", type: "expenses", parent: "a5200", status: "active", kind: "posting", locked: true, cash_flow: "none", purpose: "expense", currency: "SAR" },
  { id: "a5300", tenant_id: DEMO_TENANT_ID, number: "53", name_ar: "مصاريف أخرى", name_en: "Other Expenses", type: "expenses", parent: "a5000", status: "active", kind: "posting", cash_flow: "operating", purpose: "expense", currency: "SAR" },
];

const quotations: Quotation[] = [
  { id: "q1", tenant_id: DEMO_TENANT_ID, number: "QT-0001", customer_id: "c1", date: "2026-05-20", expiry: "2026-06-20", discount: 0, status: "sent",
    lines: [{ id: uid(), item_id: "i3", description: "تصميم موقع إلكتروني", qty: 1, unit_price: 3500, vat_rate: 15 }] },
  { id: "q2", tenant_id: DEMO_TENANT_ID, number: "QT-0002", customer_id: "c2", date: "2026-05-22", expiry: "2026-06-22", discount: 100, status: "accepted",
    lines: [{ id: uid(), item_id: "i1", description: "استشارة محاسبية", qty: 4, unit_price: 500, vat_rate: 15 }] },
  { id: "q3", tenant_id: DEMO_TENANT_ID, number: "QT-0003", customer_id: "c3", date: "2026-05-25", expiry: "2026-06-25", discount: 0, status: "draft",
    lines: [{ id: uid(), item_id: "i6", description: "حاسب محمول HP", qty: 2, unit_price: 4200, vat_rate: 15 }] },
  { id: "q4", tenant_id: DEMO_TENANT_ID, number: "QT-0004", customer_id: "c4", date: "2026-05-28", expiry: "2026-06-28", discount: 0, status: "rejected",
    lines: [{ id: uid(), item_id: "i7", description: "طابعة ليزر", qty: 3, unit_price: 1100, vat_rate: 15 }] },
  { id: "q5", tenant_id: DEMO_TENANT_ID, number: "QT-0005", customer_id: "c5", date: "2026-06-01", expiry: "2026-07-01", discount: 50, status: "converted",
    lines: [{ id: uid(), item_id: "i10", description: "خدمة تدريب", qty: 1, unit_price: 2000, vat_rate: 15 }] },
];

const invoices: Invoice[] = [
  { id: "in1", tenant_id: DEMO_TENANT_ID, number: "INV-0001", customer_id: "c1", date: "2026-05-10", due: "2026-06-10", discount: 0, status: "fully_paid", paid: 4025,
    lines: [{ id: uid(), item_id: "i3", description: "تصميم موقع إلكتروني", qty: 1, unit_price: 3500, vat_rate: 15 }] },
  { id: "in2", tenant_id: DEMO_TENANT_ID, number: "INV-0002", customer_id: "c2", date: "2026-05-15", due: "2026-06-15", discount: 100, status: "partially_paid", paid: 1000,
    lines: [{ id: uid(), item_id: "i1", description: "استشارة محاسبية", qty: 4, unit_price: 500, vat_rate: 15 }] },
  { id: "in3", tenant_id: DEMO_TENANT_ID, number: "INV-0003", customer_id: "c3", date: "2026-05-18", due: "2026-06-18", discount: 0, status: "official", paid: 0,
    lines: [{ id: uid(), item_id: "i6", description: "حاسب محمول HP", qty: 1, unit_price: 4200, vat_rate: 15 }] },
  { id: "in4", tenant_id: DEMO_TENANT_ID, number: "INV-0004", customer_id: "c4", date: "2026-05-22", due: "2026-06-22", discount: 0, status: "draft", paid: 0,
    lines: [{ id: uid(), item_id: "i8", description: "كرسي مكتبي", qty: 5, unit_price: 650, vat_rate: 15 }] },
  { id: "in5", tenant_id: DEMO_TENANT_ID, number: "INV-0005", customer_id: "c5", date: "2026-06-02", due: "2026-07-02", discount: 50, status: "official", paid: 0,
    lines: [{ id: uid(), item_id: "i10", description: "خدمة تدريب", qty: 1, unit_price: 2000, vat_rate: 15 }] },
];

const receipts: Receipt[] = [
  { id: "r1", tenant_id: DEMO_TENANT_ID, number: "RV-0001", customer_id: "c1", invoice_id: "in1", date: "2026-05-12", method: "bank_transfer", amount: 4025, bank_ref: "TRX-9981" },
  { id: "r2", tenant_id: DEMO_TENANT_ID, number: "RV-0002", customer_id: "c2", invoice_id: "in2", date: "2026-05-20", method: "cash", amount: 1000 },
  { id: "r3", tenant_id: DEMO_TENANT_ID, number: "RV-0003", customer_id: "c3", date: "2026-05-25", method: "card", amount: 500 },
  { id: "r4", tenant_id: DEMO_TENANT_ID, number: "RV-0004", customer_id: "c5", date: "2026-06-03", method: "bank_transfer", amount: 1000, bank_ref: "TRX-1102" },
  { id: "r5", tenant_id: DEMO_TENANT_ID, number: "RV-0005", customer_id: "c4", date: "2026-06-05", method: "cash", amount: 2300 },
];

const payments: Payment[] = [
  { id: "p1", tenant_id: DEMO_TENANT_ID, number: "PV-0001", supplier_id: "s1", date: "2026-05-10", category: "المشتريات", method: "bank_transfer", amount: 5500, vat_amount: 717.39 },
  { id: "p2", tenant_id: DEMO_TENANT_ID, number: "PV-0002", supplier_id: "s2", date: "2026-05-15", category: "المعدات", method: "bank_transfer", amount: 12000, vat_amount: 1565.22 },
  { id: "p3", tenant_id: DEMO_TENANT_ID, number: "PV-0003", payee: "مكتب الإيجار", date: "2026-05-01", category: "الإيجار", method: "bank_transfer", amount: 8000 },
  { id: "p4", tenant_id: DEMO_TENANT_ID, number: "PV-0004", supplier_id: "s4", date: "2026-05-20", category: "المصاريف الإدارية", method: "cash", amount: 320, vat_amount: 41.74 },
  { id: "p5", tenant_id: DEMO_TENANT_ID, number: "PV-0005", supplier_id: "s5", date: "2026-06-01", category: "الخدمات اللوجستية", method: "bank_transfer", amount: 1800, vat_amount: 234.78 },
];

const journal: JournalEntry[] = [
  { id: "j1", tenant_id: DEMO_TENANT_ID, number: "JE-0001", date: "2026-05-10", description: "اعتماد فاتورة مبيعات INV-0001", status: "posted", source: "INV-0001", source_type: "sales_invoice", source_id: "in1",
    lines: [
      { account_id: "a1030", debit: 4025, credit: 0, description: "العميل" },
      { account_id: "a4010", debit: 0, credit: 3500, description: "إيرادات" },
      { account_id: "a2020", debit: 0, credit: 525, description: "VAT" },
    ] },
  { id: "j2", tenant_id: DEMO_TENANT_ID, number: "JE-0002", date: "2026-05-12", description: "سند قبض RV-0001", status: "posted", source: "RV-0001", source_type: "receipt_voucher", source_id: "r1",
    lines: [
      { account_id: "a1020", debit: 4025, credit: 0 },
      { account_id: "a1030", debit: 0, credit: 4025 },
    ] },
  { id: "j3", tenant_id: DEMO_TENANT_ID, number: "JE-0003", date: "2026-05-01", description: "صرف إيجار", status: "posted", source: "PV-0003", source_type: "payment_voucher", source_id: "p3",
    lines: [
      { account_id: "a5020", debit: 8000, credit: 0 },
      { account_id: "a1020", debit: 0, credit: 8000 },
    ] },
];

const tasks: Task[] = [
  { id: "t1", tenant_id: DEMO_TENANT_ID, title: "متابعة الفاتورة INV-0003", description: "اتصال بالعميل لمتابعة السداد", assigned: "محمد", date: "2026-06-12", priority: "high", status: "task_new", customer_id: "c3", invoice_id: "in3" },
  { id: "t2", tenant_id: DEMO_TENANT_ID, title: "إعداد عرض سعر جديد", assigned: "سارة", date: "2026-06-13", priority: "medium", status: "in_progress", customer_id: "c4" },
  { id: "t3", tenant_id: DEMO_TENANT_ID, title: "تسوية حسابات المورد s2", assigned: "أحمد", date: "2026-06-15", priority: "medium", status: "task_new" },
  { id: "t4", tenant_id: DEMO_TENANT_ID, title: "مراجعة قيود مايو", assigned: "أحمد", date: "2026-06-05", priority: "high", status: "completed" },
  { id: "t5", tenant_id: DEMO_TENANT_ID, title: "تحديث بيانات العميل", assigned: "نوف", date: "2026-06-14", priority: "low", status: "task_new", customer_id: "c1" },
  { id: "t6", tenant_id: DEMO_TENANT_ID, title: "إرسال QT-0003", assigned: "سارة", date: "2026-06-12", priority: "high", status: "in_progress", quotation_id: "q3" },
  { id: "t7", tenant_id: DEMO_TENANT_ID, title: "أرشفة المستندات", assigned: "نوف", date: "2026-06-20", priority: "low", status: "deferred" },
  { id: "t8", tenant_id: DEMO_TENANT_ID, title: "تجهيز تقرير المبيعات الشهري", assigned: "محمد", date: "2026-06-30", priority: "medium", status: "task_new" },
];

const users: User[] = [
  { id: "u1", tenant_id: DEMO_TENANT_ID, name: "عبدالله الجاد", email: "owner@jaad.sa", role: "owner", status: "active" },
  { id: "u2", tenant_id: DEMO_TENANT_ID, name: "أحمد المحاسب", email: "ahmad@jaad.sa", role: "accountant", status: "active" },
  { id: "u3", tenant_id: DEMO_TENANT_ID, name: "سارة المبيعات", email: "sara@jaad.sa", role: "sales_employee", status: "active" },
  { id: "u4", tenant_id: DEMO_TENANT_ID, name: "نوف", email: "nouf@jaad.sa", role: "viewer", status: "active" },
];

const initial: State = {
  tenants,
  customers, suppliers, items, quotations, invoices, receipts, payments,
  accounts, journal, tasks, users,
  audit_log: [],
  company: {
    name: "شركة جاد للمحاسبة",
    vat: "300012345600003",
    cr: "1010123456",
    email: "info@jaad.sa",
    mobile: "0112345678",
    address: "طريق الملك فهد",
    city: "الرياض",
    country: "المملكة العربية السعودية",
    currency: "SAR",
  },
  tax: { enable_vat: true, default_vat: 15, invoice_type: "simplified_tax", show_qr: true },
  numbering: { quotation: "QT", invoice: "INV", receipt: "RV", payment: "PV", journal: "JE" },
  // Phase 2.2 — seed minimal demo records
  document_templates: [
    { id: "tpl_q1", tenant_id: DEMO_TENANT_ID, name_ar: "قالب عرض السعر الافتراضي", name_en: "Default Quotation Template", doc_type: "quotation", is_default: true,
      show_logo: true, show_stamp: false, show_signature: true, show_vat_number: true, show_qr: false, show_payment_details: true,
      show_item_description: true, show_discount_column: true, show_tax_column: true,
      header_layout: "split", text_color: "#22242A", accent_color: "#385BC6", table_header_color: "#003049", font_size: "md", language: "bilingual" },
    { id: "tpl_i1", tenant_id: DEMO_TENANT_ID, name_ar: "قالب الفاتورة الافتراضي", name_en: "Default Invoice Template", doc_type: "invoice", is_default: true,
      show_logo: true, show_stamp: true, show_signature: true, show_vat_number: true, show_qr: true, show_payment_details: true,
      show_item_description: true, show_discount_column: true, show_tax_column: true,
      header_layout: "split", text_color: "#22242A", accent_color: "#385BC6", table_header_color: "#003049", font_size: "md", language: "bilingual" },
    { id: "tpl_r1", tenant_id: DEMO_TENANT_ID, name_ar: "قالب سند القبض الافتراضي", name_en: "Default Receipt Voucher Template", doc_type: "receipt", is_default: true,
      show_logo: true, show_stamp: true, show_signature: true, show_vat_number: false, show_qr: false, show_payment_details: true,
      show_item_description: false, show_discount_column: false, show_tax_column: false,
      header_layout: "centered", text_color: "#22242A", accent_color: "#385BC6", table_header_color: "#003049", font_size: "md", language: "bilingual" },
    { id: "tpl_p1", tenant_id: DEMO_TENANT_ID, name_ar: "قالب سند الصرف الافتراضي", name_en: "Default Payment Voucher Template", doc_type: "payment", is_default: true,
      show_logo: true, show_stamp: true, show_signature: true, show_vat_number: false, show_qr: false, show_payment_details: true,
      show_item_description: false, show_discount_column: false, show_tax_column: false,
      header_layout: "centered", text_color: "#22242A", accent_color: "#385BC6", table_header_color: "#003049", font_size: "md", language: "bilingual" },
  ],
  custom_fields: [
    { id: "cf1", tenant_id: DEMO_TENANT_ID, label_ar: "رقم أمر الشراء", label_en: "PO Number", field_key: "po_number", type: "text", applies_to: "invoice", required: false, printable: true, status: "active" },
    { id: "cf2", tenant_id: DEMO_TENANT_ID, label_ar: "مشروع", label_en: "Project", field_key: "project", type: "dropdown", applies_to: "quotation", required: false, printable: true, options: ["A", "B", "C"], status: "active" },
  ],
  branches: [
    { id: "br1", tenant_id: DEMO_TENANT_ID, name_ar: "الفرع الرئيسي - الرياض", name_en: "Main Branch - Riyadh", city: "الرياض", address: "طريق الملك فهد", phone: "0112345678", manager: "عبدالله الجاد", status: "active" },
    { id: "br2", tenant_id: DEMO_TENANT_ID, name_ar: "فرع جدة", name_en: "Jeddah Branch", city: "جدة", phone: "0122345678", manager: "سارة المبيعات", status: "active" },
  ],
  employees: [
    { id: "e1", tenant_id: DEMO_TENANT_ID, name: "عبدالله الجاد", email: "owner@jaad.sa", mobile: "0501111111", job_title: "المدير العام", department: "الإدارة", branch_id: "br1", basic_salary: 25000, allowances: 5000, status: "active" },
    { id: "e2", tenant_id: DEMO_TENANT_ID, name: "أحمد المحاسب", email: "ahmad@jaad.sa", mobile: "0502222222", job_title: "محاسب أول", department: "المحاسبة", branch_id: "br1", basic_salary: 12000, allowances: 2000, status: "active" },
    { id: "e3", tenant_id: DEMO_TENANT_ID, name: "سارة المبيعات", email: "sara@jaad.sa", mobile: "0503333333", job_title: "مديرة مبيعات", department: "المبيعات", branch_id: "br2", basic_salary: 10000, allowances: 2500, status: "active" },
    { id: "e4", tenant_id: DEMO_TENANT_ID, name: "نوف", email: "nouf@jaad.sa", mobile: "0504444444", job_title: "موظفة عرض", department: "الإدارة", branch_id: "br1", basic_salary: 7000, allowances: 1000, status: "active" },
  ],
  payroll_runs: [
    { id: "pr1", tenant_id: DEMO_TENANT_ID, month: 4, year: 2026, employees_count: 4, gross: 64500, deductions: 3200, net: 61300, status: "paid" },
    { id: "pr2", tenant_id: DEMO_TENANT_ID, month: 5, year: 2026, employees_count: 4, gross: 64500, deductions: 3200, net: 61300, status: "approved" },
    { id: "pr3", tenant_id: DEMO_TENANT_ID, month: 6, year: 2026, employees_count: 4, gross: 64500, deductions: 3200, net: 61300, status: "draft" },
  ],
  expense_claims: [
    { id: "ec1", tenant_id: DEMO_TENANT_ID, employee_id: "e3", date: "2026-06-02", category: "سفر عمل", amount: 850, description: "مواصلات لاجتماع عميل", status: "approved" },
    { id: "ec2", tenant_id: DEMO_TENANT_ID, employee_id: "e2", date: "2026-06-05", category: "قرطاسية", amount: 220, status: "submitted" },
  ],
  announcements: [
    { id: "ann1", tenant_id: DEMO_TENANT_ID, title_ar: "إعلان داخلي", title_en: "Internal Announcement", body_ar: "اجتماع شهري يوم الخميس.", body_en: "Monthly meeting on Thursday.", created_by: "u1", created_at: "2026-06-01T09:00:00Z" },
  ],
  internal_notes: [],
  message_templates: [
    { id: "mt_q_email", tenant_id: DEMO_TENANT_ID, channel: "email", doc_type: "quotation",
      subject_ar: "عرض سعر من {{company}}", subject_en: "Quotation from {{company}}",
      body_ar: "مرحبًا {{customer}}، تجدون عرض السعر مرفقًا.", body_en: "Hello {{customer}}, please find the quotation attached." },
    { id: "mt_i_email", tenant_id: DEMO_TENANT_ID, channel: "email", doc_type: "invoice",
      subject_ar: "فاتورة من {{company}}", subject_en: "Invoice from {{company}}",
      body_ar: "مرحبًا {{customer}}، تجدون الفاتورة مرفقة.", body_en: "Hello {{customer}}, please find the invoice attached." },
    { id: "mt_q_wa", tenant_id: DEMO_TENANT_ID, channel: "whatsapp", doc_type: "quotation",
      body_ar: "السلام عليكم {{customer}}، عرض السعر متاح عبر الرابط.", body_en: "Hello {{customer}}, your quotation is available via link." },
    { id: "mt_i_wa", tenant_id: DEMO_TENANT_ID, channel: "whatsapp", doc_type: "invoice",
      body_ar: "السلام عليكم {{customer}}، الفاتورة متاحة عبر الرابط.", body_en: "Hello {{customer}}, your invoice is available via link." },
  ],
  // Phase 2.1.5 — Purchase invoices demo seed
  purchase_invoices: [
    { id: "pi1", tenant_id: DEMO_TENANT_ID, number: "PINV-0001", supplier_id: "s1", supplier_ref: "INV/2026/118",
      date: "2026-05-12", due: "2026-06-12", status: "approved", paid: 0,
      lines: [{ id: uid(), item_id: "i6", description: "حاسب محمول HP", qty: 3, unit_cost: 3300, vat_rate: 15 }] },
    { id: "pi2", tenant_id: DEMO_TENANT_ID, number: "PINV-0002", supplier_id: "s2", supplier_ref: "BILL-7741",
      date: "2026-05-20", due: "2026-06-20", status: "paid", paid: 2530,
      lines: [{ id: uid(), item_id: "i7", description: "طابعة ليزر", qty: 2, unit_cost: 1100, vat_rate: 15 }] },
    { id: "pi3", tenant_id: DEMO_TENANT_ID, number: "PINV-0003", supplier_id: "s4",
      date: "2026-06-02", due: "2026-07-02", status: "draft", paid: 0,
      lines: [{ id: uid(), description: "قرطاسية مكتبية", qty: 1, unit_cost: 850, vat_rate: 15 }] },
  ],
  // Phase 2.1.14 — Default Saudi VAT demo tax rates
  tax_rates: [
    { id: "tax_vat_sales_15", tenant_id: DEMO_TENANT_ID, name_ar: "ضريبة القيمة المضافة على المبيعات", name_en: "VAT on Sales", tax_type: "sales", rate: 15, description_ar: "ضريبة القيمة المضافة القياسية للمبيعات المحلية الخاضعة للضريبة", description_en: "Standard VAT for local taxable sales", used_in: "sales", is_system: true, is_active: true },
    { id: "tax_sales_zero", tenant_id: DEMO_TENANT_ID, name_ar: "صادرات بنسبة صفر", name_en: "Zero-rated Exports", tax_type: "sales", rate: 0, description_ar: "صادرات تخضع لمعدل صفر", description_en: "Zero-rated exports", used_in: "sales", is_system: true, is_active: true },
    { id: "tax_sales_exempt", tenant_id: DEMO_TENANT_ID, name_ar: "مبيعات معفاة", name_en: "Exempt Sales", tax_type: "sales", rate: 0, description_ar: "مبيعات معفاة من الضريبة", description_en: "VAT-exempt sales", used_in: "sales", is_system: true, is_active: true },
    { id: "tax_out_of_scope", tenant_id: DEMO_TENANT_ID, name_ar: "غير خاضع للضريبة", name_en: "Out of Scope", tax_type: "out_of_scope", rate: 0, description_ar: "عمليات خارج نطاق الضريبة", description_en: "Transactions outside VAT scope", used_in: "both", is_system: true, is_active: true },
    { id: "tax_vat_purchases_15", tenant_id: DEMO_TENANT_ID, name_ar: "ضريبة القيمة المضافة على المشتريات", name_en: "VAT on Purchases", tax_type: "purchases", rate: 15, description_ar: "ضريبة القيمة المضافة على المشتريات (قابلة للخصم)", description_en: "Recoverable input VAT on purchases", used_in: "purchases", is_system: true, is_active: true },
    { id: "tax_purchases_zero", tenant_id: DEMO_TENANT_ID, name_ar: "مشتريات بنسبة صفر", name_en: "Zero-rated Purchases", tax_type: "purchases", rate: 0, description_ar: "مشتريات بمعدل صفر", description_en: "Zero-rated purchases", used_in: "purchases", is_system: true, is_active: true },
    { id: "tax_purchases_exempt", tenant_id: DEMO_TENANT_ID, name_ar: "مشتريات معفاة", name_en: "Exempt Purchases", tax_type: "purchases", rate: 0, description_ar: "مشتريات معفاة من الضريبة", description_en: "VAT-exempt purchases", used_in: "purchases", is_system: true, is_active: true },
    { id: "tax_reverse_charge", tenant_id: DEMO_TENANT_ID, name_ar: "احتساب عكسي", name_en: "Reverse Charge", tax_type: "reverse_charge", rate: 15, description_ar: "ضريبة احتساب عكسي على الاستيراد والخدمات الأجنبية", description_en: "Reverse charge on imports and foreign services", used_in: "purchases", is_system: true, is_active: true },
  ],
};

// ============ Store ============
const STORAGE_KEY = "jaad_state_v2";
let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      // Merge defaults so older saves get new fields safely
      return {
        ...initial,
        ...parsed,
        tenants: parsed.tenants?.length ? parsed.tenants : initial.tenants,
        audit_log: parsed.audit_log ?? [],
        // Phase 2.2 — seed new entities if missing
        document_templates: parsed.document_templates ?? initial.document_templates,
        custom_fields: parsed.custom_fields ?? initial.custom_fields,
        branches: parsed.branches ?? initial.branches,
        employees: parsed.employees ?? initial.employees,
        payroll_runs: parsed.payroll_runs ?? initial.payroll_runs,
        expense_claims: parsed.expense_claims ?? initial.expense_claims,
        announcements: parsed.announcements ?? initial.announcements,
        internal_notes: parsed.internal_notes ?? [],
        message_templates: parsed.message_templates ?? initial.message_templates,
        purchase_invoices: parsed.purchase_invoices ?? initial.purchase_invoices,
        tax_rates: parsed.tax_rates ?? initial.tax_rates,
      } as State;
    }
  } catch {}
  return initial;
}

function persist() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function setState(updater: (s: State) => State) {
  state = updater(state);
  persist();
  listeners.forEach((l) => l());
}

export const store = {
  getState: () => state,
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  set: setState,
  reset: () => { state = JSON.parse(JSON.stringify(initial)); persist(); listeners.forEach((l) => l()); },
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(initial),
  );
}

// ============ Helpers ============
export function newId() { return uid(); }

export function nextNumber(prefix: string, list: { number: string }[]) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${escaped}-(\\d+)$`);
  const nums = list
    .map((x) => {
      const m = x.number?.match(re);
      if (m) return parseInt(m[1], 10);
      return parseInt((x.number || "").replace(/\D/g, ""), 10) || 0;
    })
    .filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

export function lineTotals(line: Line, discountShare = 0) {
  const sub = line.qty * line.unit_price;
  const after = Math.max(0, sub - discountShare);
  const vat = (after * line.vat_rate) / 100;
  return { sub, vat, total: after + vat };
}

export function docTotals(lines: Line[], discount = 0) {
  const sub = lines.reduce((s, l) => s + l.qty * l.unit_price, 0);
  const afterDiscount = Math.max(0, sub - discount);
  const vat = lines.reduce((s, l) => {
    const share = sub > 0 ? (l.qty * l.unit_price / sub) * discount : 0;
    const lineAfter = Math.max(0, l.qty * l.unit_price - share);
    return s + (lineAfter * l.vat_rate) / 100;
  }, 0);
  return { sub, discount, afterDiscount, vat, total: afterDiscount + vat };
}

// Phase 2.1.5 — totals helper for purchase invoices (no document-level discount)
export function purchaseDocTotals(lines: PurchaseInvoiceLine[]) {
  const sub = lines.reduce((s, l) => s + l.qty * l.unit_cost, 0);
  const vat = lines.reduce((s, l) => s + (l.qty * l.unit_cost * l.vat_rate) / 100, 0);
  return { sub, vat, total: sub + vat };
}
