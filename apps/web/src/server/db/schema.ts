import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  numeric,
  date,
  boolean,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "accountant",
  "auditor",
  "sales",
  "purchasing",
  "warehouse",
  "viewer",
]);

export const accountTypeEnum = pgEnum("account_type", [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
  "contra_asset",
  "contra_liability",
  "contra_equity",
  "contra_revenue",
  "contra_expense",
]);

export const accountPurposeEnum = pgEnum("account_purpose", ["main", "sub"]);

export const journalStatusEnum = pgEnum("journal_status", [
  "draft",
  "posted",
  "voided",
  "reversed",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "confirmed",
  "posted",
  "voided",
]);

export const quotationStatusEnum = pgEnum("quotation_status", [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "converted",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "partial",
  "completed",
  "refunded",
  "cancelled",
]);

export const taxTypeEnum = pgEnum("tax_type", [
  "standard",
  "zero_rated",
  "exempt",
  "reverse_charge",
  "out_of_scope",
]);

export const itemTypeEnum = pgEnum("item_type", [
  "service",
  "product",
  "expense_item",
  "discount",
  "fee",
]);

export const invoiceTypeEnum = pgEnum("invoice_type", [
  "standard",
  "proforma",
  "final",
  "credit",
  "debit",
]);

export const taxRateTypeEnum = pgEnum("tax_rate_type", [
  "sales",
  "purchase",
  "reverse_charge",
  "out_of_scope",
]);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "expired",
  "cancelled",
]);

// ─── Helper: common columns ──────────────────────────────────────────────────

const baseColumns = {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

const auditableColumns = {
  ...baseColumns,
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
};

const tenantColumns = {
  ...auditableColumns,
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
};

// ─── 1. Tenancy / Auth ──────────────────────────────────────────────────────

export const tenants = pgTable("tenants", {
  ...auditableColumns,
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  taxNumber: text("tax_number"),
  commercialRegister: text("commercial_register"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  isActive: boolean("is_active").notNull().default(true),
});

export const users = pgTable("users", {
  ...baseColumns,
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  image: text("image"),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
});

export const memberships = pgTable(
  "memberships",
  {
    ...auditableColumns,
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    role: userRoleEnum("role").notNull().default("viewer"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [uniqueIndex("idx_memberships_user_tenant").on(table.userId, table.tenantId)],
);

export const invitations = pgTable(
  "invitations",
  {
    ...auditableColumns,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    email: text("email").notNull(),
    role: userRoleEnum("role").notNull().default("viewer"),
    token: text("token").notNull().unique(),
    status: invitationStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (table) => [index("idx_invitations_tenant").on(table.tenantId)],
);

// ─── 2. Core Master Data ────────────────────────────────────────────────────

export const branches = pgTable(
  "branches",
  {
    ...tenantColumns,
    code: text("code").notNull(),
    name: text("name").notNull(),
    address: text("address"),
    phone: text("phone"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("idx_branches_code_tenant").on(table.code, table.tenantId),
    index("idx_branches_tenant").on(table.tenantId),
  ],
);

export const customers = pgTable(
  "customers",
  {
    ...tenantColumns,
    code: text("code").notNull(),
    name: text("name").notNull(),
    taxNumber: text("tax_number"),
    commercialRegister: text("commercial_register"),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    creditLimit: numeric("credit_limit", { precision: 18, scale: 2 }).default("0"),
    paymentTerms: integer("payment_terms"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("idx_customers_code_tenant").on(table.code, table.tenantId),
    index("idx_customers_email_tenant").on(table.email, table.tenantId),
    index("idx_customers_tenant").on(table.tenantId),
  ],
);

export const suppliers = pgTable(
  "suppliers",
  {
    ...tenantColumns,
    code: text("code").notNull(),
    name: text("name").notNull(),
    taxNumber: text("tax_number"),
    commercialRegister: text("commercial_register"),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("idx_suppliers_code_tenant").on(table.code, table.tenantId),
    index("idx_suppliers_email_tenant").on(table.email, table.tenantId),
    index("idx_suppliers_tenant").on(table.tenantId),
  ],
);

export const items = pgTable(
  "items",
  {
    ...tenantColumns,
    code: text("code").notNull(),
    name: text("name").notNull(),
    type: itemTypeEnum("type").notNull().default("service"),
    description: text("description"),
    unit: text("unit"),
    sellingPrice: numeric("selling_price", { precision: 18, scale: 2 }).default("0"),
    costPrice: numeric("cost_price", { precision: 18, scale: 2 }).default("0"),
    taxRateId: uuid("tax_rate_id"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("idx_items_code_tenant").on(table.code, table.tenantId),
    index("idx_items_tenant").on(table.tenantId),
  ],
);

export const projects = pgTable(
  "projects",
  {
    ...tenantColumns,
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("idx_projects_code_tenant").on(table.code, table.tenantId),
    index("idx_projects_tenant").on(table.tenantId),
  ],
);

export const costCenters = pgTable(
  "cost_centers",
  {
    ...tenantColumns,
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("idx_cost_centers_code_tenant").on(table.code, table.tenantId),
    index("idx_cost_centers_tenant").on(table.tenantId),
  ],
);

export const bankAccounts = pgTable(
  "bank_accounts",
  {
    ...tenantColumns,
    accountName: text("account_name").notNull(),
    accountNumber: text("account_number").notNull(),
    bankName: text("bank_name").notNull(),
    iban: text("iban"),
    currency: text("currency").notNull().default("SAR"),
    chartAccountId: uuid("chart_account_id"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("idx_bank_accounts_number_tenant").on(table.accountNumber, table.tenantId),
    index("idx_bank_accounts_tenant").on(table.tenantId),
  ],
);

// ─── 3. Accounting ──────────────────────────────────────────────────────────

export const accountPurposes = pgTable(
  "account_purposes",
  {
    ...tenantColumns,
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("idx_account_purposes_code_tenant").on(table.code, table.tenantId),
    index("idx_account_purposes_tenant").on(table.tenantId),
  ],
);

export const chartAccounts = pgTable(
  "chart_accounts",
  {
    ...tenantColumns,
    code: text("code").notNull(),
    name: text("name").notNull(),
    nameEn: text("name_en"),
    type: accountTypeEnum("type").notNull(),
    purpose: accountPurposeEnum("purpose").notNull().default("sub"),
    parentId: uuid("parent_id"),
    accountPurposeId: uuid("account_purpose_id"),
    isActive: boolean("is_active").notNull().default(true),
    isSystem: boolean("is_system").notNull().default(false),
    isLocked: boolean("is_locked").notNull().default(false),
    openingBalance: numeric("opening_balance", { precision: 18, scale: 2 }).default("0"),
    openingBalanceDate: date("opening_balance_date"),
    currency: text("currency").notNull().default("SAR"),
  },
  (table) => [
    uniqueIndex("idx_chart_accounts_code_tenant").on(table.code, table.tenantId),
    index("idx_chart_accounts_parent").on(table.parentId),
    index("idx_chart_accounts_type_tenant").on(table.type, table.tenantId),
    index("idx_chart_accounts_tenant").on(table.tenantId),
  ],
);

export const taxRates = pgTable(
  "tax_rates",
  {
    ...tenantColumns,
    name: text("name").notNull(),
    rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
    type: taxRateTypeEnum("type").notNull().default("sales"),
    isActive: boolean("is_active").notNull().default(true),
    isSystem: boolean("is_system").notNull().default(false),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
  },
  (table) => [
    uniqueIndex("idx_tax_rates_name_tenant").on(table.name, table.tenantId),
    index("idx_tax_rates_tenant").on(table.tenantId),
  ],
);

export const journalEntries = pgTable(
  "journal_entries",
  {
    ...tenantColumns,
    entryNumber: text("entry_number").notNull(),
    entryDate: date("entry_date").notNull(),
    status: journalStatusEnum("status").notNull().default("draft"),
    description: text("description"),
    sourceType: text("source_type"),
    sourceId: uuid("source_id"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidReason: text("void_reason"),
    reversedById: uuid("reversed_by_id"),
    reversedAt: timestamp("reversed_at", { withTimezone: true }),
    reversalOfId: uuid("reversal_of_id"),
    totalDebit: numeric("total_debit", { precision: 18, scale: 2 }).notNull().default("0"),
    totalCredit: numeric("total_credit", { precision: 18, scale: 2 }).notNull().default("0"),
  },
  (table) => [
    uniqueIndex("idx_journal_entries_number_tenant").on(table.entryNumber, table.tenantId),
    index("idx_journal_entries_source").on(table.sourceType, table.sourceId),
    index("idx_journal_entries_date_tenant").on(table.entryDate, table.tenantId),
    index("idx_journal_entries_status_tenant").on(table.status, table.tenantId),
    index("idx_journal_entries_tenant").on(table.tenantId),
  ],
);

export const journalEntryLines = pgTable(
  "journal_entry_lines",
  {
    ...tenantColumns,
    journalEntryId: uuid("journal_entry_id")
      .notNull()
      .references(() => journalEntries.id),
    accountId: uuid("account_id")
      .notNull()
      .references(() => chartAccounts.id),
    debit: numeric("debit", { precision: 18, scale: 2 }).notNull().default("0"),
    credit: numeric("credit", { precision: 18, scale: 2 }).notNull().default("0"),
    description: text("description"),
    costCenterId: uuid("cost_center_id"),
    projectId: uuid("project_id"),
    branchId: uuid("branch_id"),
    lineOrder: integer("line_order").notNull().default(0),
  },
  (table) => [
    index("idx_jel_journal_entry").on(table.journalEntryId),
    index("idx_jel_account").on(table.accountId),
    index("idx_jel_tenant").on(table.tenantId),
  ],
);

// ─── 4. Sales ───────────────────────────────────────────────────────────────

export const quotations = pgTable(
  "quotations",
  {
    ...tenantColumns,
    quotationNumber: text("quotation_number").notNull(),
    quotationDate: date("quotation_date").notNull(),
    expiryDate: date("expiry_date"),
    status: quotationStatusEnum("status").notNull().default("draft"),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    branchId: uuid("branch_id"),
    projectId: uuid("project_id"),
    currency: text("currency").notNull().default("SAR"),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 6 }).default("1"),
    subtotal: numeric("subtotal", { precision: 18, scale: 2 }).notNull().default("0"),
    discountAmount: numeric("discount_amount", { precision: 18, scale: 2 }).default("0"),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    terms: text("terms"),
    convertedToInvoiceId: uuid("converted_to_invoice_id"),
  },
  (table) => [
    uniqueIndex("idx_quotations_number_tenant").on(table.quotationNumber, table.tenantId),
    index("idx_quotations_customer").on(table.customerId),
    index("idx_quotations_status_tenant").on(table.status, table.tenantId),
    index("idx_quotations_tenant").on(table.tenantId),
  ],
);

export const quotationLines = pgTable(
  "quotation_lines",
  {
    ...tenantColumns,
    quotationId: uuid("quotation_id")
      .notNull()
      .references(() => quotations.id),
    lineOrder: integer("line_order").notNull().default(0),
    itemId: uuid("item_id"),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull().default("1"),
    unitPrice: numeric("unit_price", { precision: 18, scale: 6 }).notNull().default("0"),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
    discountAmount: numeric("discount_amount", { precision: 18, scale: 2 }).default("0"),
    taxRateId: uuid("tax_rate_id"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
  },
  (table) => [
    index("idx_quotation_lines_quotation").on(table.quotationId),
    index("idx_quotation_lines_tenant").on(table.tenantId),
  ],
);

export const salesInvoices = pgTable(
  "sales_invoices",
  {
    ...tenantColumns,
    invoiceNumber: text("invoice_number").notNull(),
    invoiceDate: date("invoice_date").notNull(),
    dueDate: date("due_date"),
    status: documentStatusEnum("status").notNull().default("draft"),
    type: invoiceTypeEnum("type").notNull().default("standard"),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    branchId: uuid("branch_id"),
    projectId: uuid("project_id"),
    quotationId: uuid("quotation_id"),
    journalEntryId: uuid("journal_entry_id"),
    currency: text("currency").notNull().default("SAR"),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 6 }).default("1"),
    subtotal: numeric("subtotal", { precision: 18, scale: 2 }).notNull().default("0"),
    discountAmount: numeric("discount_amount", { precision: 18, scale: 2 }).default("0"),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
    paidAmount: numeric("paid_amount", { precision: 18, scale: 2 }).default("0"),
    balanceDue: numeric("balance_due", { precision: 18, scale: 2 }).default("0"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    notes: text("notes"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidReason: text("void_reason"),
  },
  (table) => [
    uniqueIndex("idx_sales_invoices_number_tenant").on(table.invoiceNumber, table.tenantId),
    index("idx_sales_invoices_customer").on(table.customerId),
    index("idx_sales_invoices_status_tenant").on(table.status, table.tenantId),
    index("idx_sales_invoices_date_tenant").on(table.invoiceDate, table.tenantId),
    index("idx_sales_invoices_tenant").on(table.tenantId),
  ],
);

export const salesInvoiceLines = pgTable(
  "sales_invoice_lines",
  {
    ...tenantColumns,
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => salesInvoices.id),
    lineOrder: integer("line_order").notNull().default(0),
    itemId: uuid("item_id"),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull().default("1"),
    unitPrice: numeric("unit_price", { precision: 18, scale: 6 }).notNull().default("0"),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
    discountAmount: numeric("discount_amount", { precision: 18, scale: 2 }).default("0"),
    taxRateId: uuid("tax_rate_id"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
    accountId: uuid("account_id"),
    costCenterId: uuid("cost_center_id"),
    projectId: uuid("project_id"),
  },
  (table) => [
    index("idx_sales_invoice_lines_invoice").on(table.invoiceId),
    index("idx_sales_invoice_lines_tenant").on(table.tenantId),
  ],
);

export const creditNotes = pgTable(
  "credit_notes",
  {
    ...tenantColumns,
    creditNoteNumber: text("credit_note_number").notNull(),
    creditNoteDate: date("credit_note_date").notNull(),
    status: documentStatusEnum("status").notNull().default("draft"),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => salesInvoices.id),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    branchId: uuid("branch_id"),
    journalEntryId: uuid("journal_entry_id"),
    reason: text("reason").notNull(),
    subtotal: numeric("subtotal", { precision: 18, scale: 2 }).notNull().default("0"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("idx_credit_notes_number_tenant").on(table.creditNoteNumber, table.tenantId),
    index("idx_credit_notes_invoice").on(table.invoiceId),
    index("idx_credit_notes_tenant").on(table.tenantId),
  ],
);

export const creditNoteLines = pgTable(
  "credit_note_lines",
  {
    ...tenantColumns,
    creditNoteId: uuid("credit_note_id")
      .notNull()
      .references(() => creditNotes.id),
    invoiceLineId: uuid("invoice_line_id"),
    lineOrder: integer("line_order").notNull().default(0),
    itemId: uuid("item_id"),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull().default("1"),
    unitPrice: numeric("unit_price", { precision: 18, scale: 6 }).notNull().default("0"),
    taxRateId: uuid("tax_rate_id"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
  },
  (table) => [
    index("idx_credit_note_lines_note").on(table.creditNoteId),
    index("idx_credit_note_lines_tenant").on(table.tenantId),
  ],
);

// ─── 5. Purchases ───────────────────────────────────────────────────────────

export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    ...tenantColumns,
    orderNumber: text("order_number").notNull(),
    orderDate: date("order_date").notNull(),
    expectedDate: date("expected_date"),
    status: documentStatusEnum("status").notNull().default("draft"),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    branchId: uuid("branch_id"),
    projectId: uuid("project_id"),
    currency: text("currency").notNull().default("SAR"),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 6 }).default("1"),
    subtotal: numeric("subtotal", { precision: 18, scale: 2 }).notNull().default("0"),
    discountAmount: numeric("discount_amount", { precision: 18, scale: 2 }).default("0"),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("idx_po_number_tenant").on(table.orderNumber, table.tenantId),
    index("idx_po_supplier").on(table.supplierId),
    index("idx_po_status_tenant").on(table.status, table.tenantId),
    index("idx_po_tenant").on(table.tenantId),
  ],
);

export const purchaseOrderLines = pgTable(
  "purchase_order_lines",
  {
    ...tenantColumns,
    orderId: uuid("order_id")
      .notNull()
      .references(() => purchaseOrders.id),
    lineOrder: integer("line_order").notNull().default(0),
    itemId: uuid("item_id"),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull().default("1"),
    unitPrice: numeric("unit_price", { precision: 18, scale: 6 }).notNull().default("0"),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
    discountAmount: numeric("discount_amount", { precision: 18, scale: 2 }).default("0"),
    taxRateId: uuid("tax_rate_id"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
  },
  (table) => [
    index("idx_po_lines_order").on(table.orderId),
    index("idx_po_lines_tenant").on(table.tenantId),
  ],
);

export const purchaseInvoices = pgTable(
  "purchase_invoices",
  {
    ...tenantColumns,
    invoiceNumber: text("invoice_number").notNull(),
    invoiceDate: date("invoice_date").notNull(),
    dueDate: date("due_date"),
    status: documentStatusEnum("status").notNull().default("draft"),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    purchaseOrderId: uuid("purchase_order_id"),
    branchId: uuid("branch_id"),
    projectId: uuid("project_id"),
    journalEntryId: uuid("journal_entry_id"),
    currency: text("currency").notNull().default("SAR"),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 6 }).default("1"),
    subtotal: numeric("subtotal", { precision: 18, scale: 2 }).notNull().default("0"),
    discountAmount: numeric("discount_amount", { precision: 18, scale: 2 }).default("0"),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
    paidAmount: numeric("paid_amount", { precision: 18, scale: 2 }).default("0"),
    balanceDue: numeric("balance_due", { precision: 18, scale: 2 }).default("0"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    notes: text("notes"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidReason: text("void_reason"),
  },
  (table) => [
    uniqueIndex("idx_purchase_invoices_number_tenant").on(table.invoiceNumber, table.tenantId),
    index("idx_purchase_invoices_supplier").on(table.supplierId),
    index("idx_purchase_invoices_status_tenant").on(table.status, table.tenantId),
    index("idx_purchase_invoices_date_tenant").on(table.invoiceDate, table.tenantId),
    index("idx_purchase_invoices_tenant").on(table.tenantId),
  ],
);

export const purchaseInvoiceLines = pgTable(
  "purchase_invoice_lines",
  {
    ...tenantColumns,
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => purchaseInvoices.id),
    lineOrder: integer("line_order").notNull().default(0),
    itemId: uuid("item_id"),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull().default("1"),
    unitPrice: numeric("unit_price", { precision: 18, scale: 6 }).notNull().default("0"),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
    discountAmount: numeric("discount_amount", { precision: 18, scale: 2 }).default("0"),
    taxRateId: uuid("tax_rate_id"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
    accountId: uuid("account_id"),
    costCenterId: uuid("cost_center_id"),
    projectId: uuid("project_id"),
  },
  (table) => [
    index("idx_purchase_invoice_lines_invoice").on(table.invoiceId),
    index("idx_purchase_invoice_lines_tenant").on(table.tenantId),
  ],
);

export const debitNotes = pgTable(
  "debit_notes",
  {
    ...tenantColumns,
    debitNoteNumber: text("debit_note_number").notNull(),
    debitNoteDate: date("debit_note_date").notNull(),
    status: documentStatusEnum("status").notNull().default("draft"),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => purchaseInvoices.id),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    branchId: uuid("branch_id"),
    journalEntryId: uuid("journal_entry_id"),
    reason: text("reason").notNull(),
    subtotal: numeric("subtotal", { precision: 18, scale: 2 }).notNull().default("0"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("idx_debit_notes_number_tenant").on(table.debitNoteNumber, table.tenantId),
    index("idx_debit_notes_invoice").on(table.invoiceId),
    index("idx_debit_notes_tenant").on(table.tenantId),
  ],
);

export const debitNoteLines = pgTable(
  "debit_note_lines",
  {
    ...tenantColumns,
    debitNoteId: uuid("debit_note_id")
      .notNull()
      .references(() => debitNotes.id),
    invoiceLineId: uuid("invoice_line_id"),
    lineOrder: integer("line_order").notNull().default(0),
    itemId: uuid("item_id"),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull().default("1"),
    unitPrice: numeric("unit_price", { precision: 18, scale: 6 }).notNull().default("0"),
    taxRateId: uuid("tax_rate_id"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
  },
  (table) => [
    index("idx_debit_note_lines_note").on(table.debitNoteId),
    index("idx_debit_note_lines_tenant").on(table.tenantId),
  ],
);

// ─── 6. Cash / AP / AR ──────────────────────────────────────────────────────

export const receipts = pgTable(
  "receipts",
  {
    ...tenantColumns,
    receiptNumber: text("receipt_number").notNull(),
    receiptDate: date("receipt_date").notNull(),
    status: documentStatusEnum("status").notNull().default("draft"),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    branchId: uuid("branch_id"),
    bankAccountId: uuid("bank_account_id"),
    journalEntryId: uuid("journal_entry_id"),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
    unallocatedAmount: numeric("unallocated_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    currency: text("currency").notNull().default("SAR"),
    notes: text("notes"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("idx_receipts_number_tenant").on(table.receiptNumber, table.tenantId),
    index("idx_receipts_customer").on(table.customerId),
    index("idx_receipts_tenant").on(table.tenantId),
  ],
);

export const receiptAllocations = pgTable(
  "receipt_allocations",
  {
    ...tenantColumns,
    receiptId: uuid("receipt_id")
      .notNull()
      .references(() => receipts.id),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => salesInvoices.id),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  },
  (table) => [
    index("idx_receipt_allocations_receipt").on(table.receiptId),
    index("idx_receipt_allocations_invoice").on(table.invoiceId),
    index("idx_receipt_allocations_tenant").on(table.tenantId),
  ],
);

export const payments = pgTable(
  "payments",
  {
    ...tenantColumns,
    paymentNumber: text("payment_number").notNull(),
    paymentDate: date("payment_date").notNull(),
    status: documentStatusEnum("status").notNull().default("draft"),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    branchId: uuid("branch_id"),
    bankAccountId: uuid("bank_account_id"),
    journalEntryId: uuid("journal_entry_id"),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
    unallocatedAmount: numeric("unallocated_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    currency: text("currency").notNull().default("SAR"),
    notes: text("notes"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("idx_payments_number_tenant").on(table.paymentNumber, table.tenantId),
    index("idx_payments_supplier").on(table.supplierId),
    index("idx_payments_tenant").on(table.tenantId),
  ],
);

export const paymentAllocations = pgTable(
  "payment_allocations",
  {
    ...tenantColumns,
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => purchaseInvoices.id),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  },
  (table) => [
    index("idx_payment_allocations_payment").on(table.paymentId),
    index("idx_payment_allocations_invoice").on(table.invoiceId),
    index("idx_payment_allocations_tenant").on(table.tenantId),
  ],
);

// ─── 7. System ──────────────────────────────────────────────────────────────

export const numberSequences = pgTable(
  "number_sequences",
  {
    ...tenantColumns,
    documentType: text("document_type").notNull(),
    year: integer("year").notNull(),
    prefix: text("prefix").notNull().default(""),
    nextNumber: integer("next_number").notNull().default(1),
    padding: integer("padding").notNull().default(5),
  },
  (table) => [
    uniqueIndex("idx_number_sequences_tenant_type_year").on(
      table.tenantId,
      table.documentType,
      table.year,
    ),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    ...baseColumns,
    tenantId: uuid("tenant_id").references(() => tenants.id),
    userId: uuid("user_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    oldValues: text("old_values"),
    newValues: text("new_values"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("idx_audit_logs_tenant_entity").on(table.tenantId, table.entityType, table.entityId),
    index("idx_audit_logs_user").on(table.userId),
    index("idx_audit_logs_created").on(table.createdAt),
  ],
);

export const attachments = pgTable(
  "attachments",
  {
    ...baseColumns,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    url: text("url").notNull(),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
  },
  (table) => [
    index("idx_attachments_entity").on(table.tenantId, table.entityType, table.entityId),
    index("idx_attachments_tenant").on(table.tenantId),
  ],
);

export const settings = pgTable(
  "settings",
  {
    ...baseColumns,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    key: text("key").notNull(),
    value: text("value").notNull(),
    description: text("description"),
  },
  (table) => [
    uniqueIndex("idx_settings_key_tenant").on(table.tenantId, table.key),
    index("idx_settings_tenant").on(table.tenantId),
  ],
);

// ─── 8. Foundation (Phase 2+) ───────────────────────────────────────────────

export const employees = pgTable(
  "employees",
  {
    ...tenantColumns,
    code: text("code").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    position: text("position"),
    department: text("department"),
    salary: numeric("salary", { precision: 18, scale: 2 }),
    hiringDate: date("hiring_date"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("idx_employees_code_tenant").on(table.code, table.tenantId),
    index("idx_employees_tenant").on(table.tenantId),
  ],
);

export const fixedAssets = pgTable(
  "fixed_assets",
  {
    ...tenantColumns,
    code: text("code").notNull(),
    name: text("name").notNull(),
    assetType: text("asset_type"),
    purchaseDate: date("purchase_date"),
    purchaseCost: numeric("purchase_cost", { precision: 18, scale: 2 }),
    usefulLife: integer("useful_life"),
    salvageValue: numeric("salvage_value", { precision: 18, scale: 2 }),
    depreciationMethod: text("depreciation_method").default("straight_line"),
    accumulatedDepreciation: numeric("accumulated_depreciation", { precision: 18, scale: 2 }).default("0"),
    bookValue: numeric("book_value", { precision: 18, scale: 2 }),
    chartAccountId: uuid("chart_account_id"),
    status: text("status").notNull().default("active"),
  },
  (table) => [
    uniqueIndex("idx_fixed_assets_code_tenant").on(table.code, table.tenantId),
    index("idx_fixed_assets_tenant").on(table.tenantId),
  ],
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    ...tenantColumns,
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id),
    movementType: text("movement_type").notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull(),
    unitCost: numeric("unit_cost", { precision: 18, scale: 6 }),
    totalCost: numeric("total_cost", { precision: 18, scale: 2 }),
    referenceType: text("reference_type"),
    referenceId: uuid("reference_id"),
    branchId: uuid("branch_id"),
    notes: text("notes"),
  },
  (table) => [
    index("idx_inventory_movements_item").on(table.itemId),
    index("idx_inventory_movements_reference").on(table.referenceType, table.referenceId),
    index("idx_inventory_movements_tenant").on(table.tenantId),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

// Tenancy
export const tenantsRelations = relations(tenants, ({ many }) => ({
  memberships: many(memberships),
  invitations: many(invitations),
  branches: many(branches),
  customers: many(customers),
  suppliers: many(suppliers),
  items: many(items),
  chartAccounts: many(chartAccounts),
  journalEntries: many(journalEntries),
  settings: many(settings),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  tenant: one(tenants, { fields: [memberships.tenantId], references: [tenants.id] }),
}));

// Accounting
export const chartAccountsRelations = relations(chartAccounts, ({ one, many }) => ({
  parent: one(chartAccounts, { fields: [chartAccounts.parentId], references: [chartAccounts.id] }),
  children: many(chartAccounts),
  journalLines: many(journalEntryLines),
}));

export const journalEntriesRelations = relations(journalEntries, ({ many }) => ({
  lines: many(journalEntryLines),
}));

export const journalEntryLinesRelations = relations(journalEntryLines, ({ one }) => ({
  journalEntry: one(journalEntries, { fields: [journalEntryLines.journalEntryId], references: [journalEntries.id] }),
  account: one(chartAccounts, { fields: [journalEntryLines.accountId], references: [chartAccounts.id] }),
}));

// Sales
export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  customer: one(customers, { fields: [quotations.customerId], references: [customers.id] }),
  lines: many(quotationLines),
}));

export const quotationLinesRelations = relations(quotationLines, ({ one }) => ({
  quotation: one(quotations, { fields: [quotationLines.quotationId], references: [quotations.id] }),
}));

export const salesInvoicesRelations = relations(salesInvoices, ({ one, many }) => ({
  customer: one(customers, { fields: [salesInvoices.customerId], references: [customers.id] }),
  lines: many(salesInvoiceLines),
  receipts: many(receiptAllocations),
}));

export const salesInvoiceLinesRelations = relations(salesInvoiceLines, ({ one }) => ({
  invoice: one(salesInvoices, { fields: [salesInvoiceLines.invoiceId], references: [salesInvoices.id] }),
}));

export const creditNotesRelations = relations(creditNotes, ({ one, many }) => ({
  invoice: one(salesInvoices, { fields: [creditNotes.invoiceId], references: [salesInvoices.id] }),
  customer: one(customers, { fields: [creditNotes.customerId], references: [customers.id] }),
  lines: many(creditNoteLines),
}));

export const creditNoteLinesRelations = relations(creditNoteLines, ({ one }) => ({
  creditNote: one(creditNotes, { fields: [creditNoteLines.creditNoteId], references: [creditNotes.id] }),
}));

// Purchases
export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
  lines: many(purchaseOrderLines),
}));

export const purchaseOrderLinesRelations = relations(purchaseOrderLines, ({ one }) => ({
  order: one(purchaseOrders, { fields: [purchaseOrderLines.orderId], references: [purchaseOrders.id] }),
}));

export const purchaseInvoicesRelations = relations(purchaseInvoices, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [purchaseInvoices.supplierId], references: [suppliers.id] }),
  lines: many(purchaseInvoiceLines),
  payments: many(paymentAllocations),
}));

export const purchaseInvoiceLinesRelations = relations(purchaseInvoiceLines, ({ one }) => ({
  invoice: one(purchaseInvoices, { fields: [purchaseInvoiceLines.invoiceId], references: [purchaseInvoices.id] }),
}));

export const debitNotesRelations = relations(debitNotes, ({ one, many }) => ({
  invoice: one(purchaseInvoices, { fields: [debitNotes.invoiceId], references: [purchaseInvoices.id] }),
  supplier: one(suppliers, { fields: [debitNotes.supplierId], references: [suppliers.id] }),
  lines: many(debitNoteLines),
}));

// Cash
export const receiptsRelations = relations(receipts, ({ one, many }) => ({
  customer: one(customers, { fields: [receipts.customerId], references: [customers.id] }),
  allocations: many(receiptAllocations),
}));

export const receiptAllocationsRelations = relations(receiptAllocations, ({ one }) => ({
  receipt: one(receipts, { fields: [receiptAllocations.receiptId], references: [receipts.id] }),
  invoice: one(salesInvoices, { fields: [receiptAllocations.invoiceId], references: [salesInvoices.id] }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [payments.supplierId], references: [suppliers.id] }),
  allocations: many(paymentAllocations),
}));

export const paymentAllocationsRelations = relations(paymentAllocations, ({ one }) => ({
  payment: one(payments, { fields: [paymentAllocations.paymentId], references: [payments.id] }),
  invoice: one(purchaseInvoices, { fields: [paymentAllocations.invoiceId], references: [purchaseInvoices.id] }),
}));
