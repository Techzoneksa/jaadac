export interface Customer {
  id: string;
  tenant_id: string;
  name_ar: string;
  name_en: string;
  type: "individual" | "company";
  vat?: string;
  cr?: string;
  unified_no?: string;
  mobile?: string;
  phone?: string;
  email?: string;
  city?: string;
  country?: string;
  district?: string;
  street?: string;
  building_no?: string;
  additional_no?: string;
  postal_code?: string;
  address?: string;
  national_short_address?: string;
  project_name?: string;
  contact_person?: string;
  customer_number?: string;
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
  // New inventory/service fields
  category_id?: string;
  service_category_id?: string;
  barcode?: string;
  unit?: string;
  cost?: number;
  track_inventory?: boolean;
  reorder_level?: number;
  current_stock?: number;
  is_active?: boolean;
  status?: string;
  updated_at?: string;
}

export interface InventoryBranch {
  id: string;
  tenant_id: string;
  name: string;
  code?: string;
  address?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryCategory {
  id: string;
  tenant_id: string;
  name: string;
  parent_id?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceCategory {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryMovement {
  id: string;
  tenant_id: string;
  item_id?: string;
  branch_id?: string;
  movement_type: "opening" | "purchase" | "sale" | "adjustment" | "transfer_in" | "transfer_out" | "manufacturing_in" | "manufacturing_out";
  qty: number;
  unit_cost?: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_at?: string;
}

export interface InventoryCount {
  id: string;
  tenant_id: string;
  branch_id?: string;
  number: string;
  date: string;
  status: "draft" | "counted" | "posted" | "cancelled";
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryCountLine {
  id?: string;
  count_id?: string;
  item_id: string;
  system_qty?: number;
  counted_qty?: number;
  difference_qty?: number;
  notes?: string;
}

export interface ManufacturingCard {
  id: string;
  tenant_id: string;
  product_id?: string;
  number: string;
  name: string;
  status: "draft" | "active" | "cancelled";
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ManufacturingCardLine {
  id?: string;
  manufacturing_card_id?: string;
  component_item_id: string;
  qty: number;
  cost?: number;
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
  unified_no?: string;
  phone?: string;
  email?: string;
  city?: string;
  country?: string;
  street?: string;
  building_no?: string;
  additional_no?: string;
  district?: string;
  postal_code?: string;
  national_short_address?: string;
  branch_name?: string;
  address?: string;
  logo_url?: string;
  show_logo?: boolean;
  show_stamp?: boolean;
  show_bank?: boolean;
  show_amount_text?: boolean;
  show_customer_address?: boolean;
  show_customer_cr?: boolean;
  invoice_template?: string;
  bank_footer_enabled?: boolean;
  primary_bank_name?: string;
  primary_bank_account_name?: string;
  primary_bank_account_number?: string;
  primary_bank_iban?: string;
  primary_bank_swift?: string;
  primary_bank_currency?: string;
  secondary_bank_name?: string;
  secondary_bank_account_name?: string;
  secondary_bank_account_number?: string;
  secondary_bank_iban?: string;
  secondary_bank_swift?: string;
  secondary_bank_currency?: string;
  invoice_footer_note_ar?: string;
  invoice_footer_note_en?: string;
}
