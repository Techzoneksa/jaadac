export interface Customer {
  id: string;
  tenant_id: string;
  name_ar: string;
  name_en: string;
  type: "individual" | "company";
  vat?: string;
  mobile?: string;
  email?: string;
  city?: string;
  address?: string;
  opening_balance: number;
  notes?: string;
  status: "active" | "inactive";
  archived?: boolean;
  created_at?: string;
}

export interface Supplier {
  id: string;
  tenant_id: string;
  name_ar: string;
  name_en: string;
  type: "individual" | "company";
  vat?: string;
  mobile?: string;
  email?: string;
  city?: string;
  address?: string;
  notes?: string;
  status: "active" | "inactive";
  archived?: boolean;
  created_at?: string;
}

export interface Item {
  id: string;
  tenant_id: string;
  name_ar: string;
  name_en: string;
  sku?: string;
  type: "service" | "non_stock" | "stock";
  sales_price: number;
  purchase_price?: number;
  taxable: boolean;
  vat_rate: number;
  qty?: number;
  low_stock?: number;
  archived?: boolean;
  created_at?: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  type: "sale" | "purchase";
  number: string;
  date: string;
  customer_id?: string;
  supplier_id?: string;
  lines: InvoiceLine[];
  subtotal: number;
  vat_total: number;
  total: number;
  status: "draft" | "confirmed" | "cancelled";
  notes?: string;
  created_at?: string;
}

export interface InvoiceLine {
  item_id: string;
  description: string;
  qty: number;
  unit_price: number;
  vat_rate: number;
  total: number;
}

export interface Account {
  id: string;
  tenant_id: string;
  number: string;
  name_ar: string;
  name_en: string;
  type: "assets" | "liabilities" | "equity" | "revenue" | "expenses";
  parent?: string;
  status: "active" | "inactive";
  kind?: "header" | "group" | "posting";
  cash_flow?: string;
  payment_enabled?: boolean;
  purpose?: string;
  locked?: boolean;
  is_system?: boolean;
  expense_claim_category?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  children?: Account[];
}

export interface JournalLine {
  id?: string;
  journal_id?: string;
  account_id: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  tenant_id: string;
  number: string;
  date: string;
  description: string;
  status: "draft" | "posted";
  source?: string;
  source_type?: "sales_invoice" | "receipt_voucher" | "payment_voucher" | "manual";
  source_id?: string;
  journal_lines?: JournalLine[];
  created_at?: string;
}

export interface TaxRate {
  id: string;
  tenant_id: string;
  name_ar: string;
  name_en: string;
  tax_type: "sales" | "purchases" | "reverse_charge" | "out_of_scope";
  rate: number;
  is_active: boolean;
  is_system?: boolean;
  created_at?: string;
}

export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  number: string;
  date: string;
  supplier_id?: string;
  supplier_name?: string;
  subtotal: number;
  vat_total: number;
  total: number;
  status: "draft" | "sent" | "approved" | "converted" | "cancelled";
  notes?: string;
  lines?: PurchaseOrderLine[];
  created_at?: string;
}

export interface PurchaseOrderLine {
  id?: string;
  purchase_order_id?: string;
  item_id: string;
  description: string;
  qty: number;
  unit_price: number;
  vat_rate: number;
  total: number;
}

export interface CreditNote {
  id: string;
  tenant_id: string;
  number: string;
  date: string;
  customer_id?: string;
  customer_name?: string;
  invoice_id?: string;
  subtotal: number;
  vat_total: number;
  total: number;
  status: "draft" | "issued" | "cancelled";
  notes?: string;
  lines?: CreditNoteLine[];
  created_at?: string;
}

export interface CreditNoteLine {
  id?: string;
  credit_note_id?: string;
  item_id: string;
  description: string;
  qty: number;
  unit_price: number;
  vat_rate: number;
  total: number;
}

export interface DebitNote {
  id: string;
  tenant_id: string;
  number: string;
  date: string;
  supplier_id?: string;
  supplier_name?: string;
  invoice_id?: string;
  subtotal: number;
  vat_total: number;
  total: number;
  status: "draft" | "issued" | "cancelled";
  notes?: string;
  lines?: DebitNoteLine[];
  created_at?: string;
}

export interface DebitNoteLine {
  id?: string;
  debit_note_id?: string;
  item_id: string;
  description: string;
  qty: number;
  unit_price: number;
  vat_rate: number;
  total: number;
}

export interface CompanySettings {
  id: string;
  tenant_id: string;
  name_ar: string;
  name_en: string;
  vat: string;
  cr?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  logo_url?: string;
}
