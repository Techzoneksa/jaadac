import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

export const dict: Dict = {
  app_name: { ar: "جاد كلاود", en: "JAAD CLOUD" },
  app_tagline: { ar: "نظام المحاسبة السحابي", en: "Cloud Accounting" },

  // Nav
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  customers: { ar: "العملاء", en: "Customers" },
  suppliers: { ar: "الموردين", en: "Suppliers" },
  items: { ar: "المنتجات والخدمات", en: "Products & Services" },
  quotations: { ar: "عروض الأسعار", en: "Quotations" },
  invoices: { ar: "فواتير المبيعات", en: "Sales Invoices" },
  receipts: { ar: "سندات القبض", en: "Receipt Vouchers" },
  payments: { ar: "سندات الصرف", en: "Payment Vouchers" },
  accounting: { ar: "المحاسبة", en: "Accounting" },
  chart_of_accounts: { ar: "شجرة الحسابات", en: "Chart of Accounts" },
  taxes: { ar: "الضرائب", en: "Taxes" },
  // ===== Phase 2.1.10: Chart of Accounts =====
  coa_account_code: { ar: "رقم الحساب", en: "Account Code" },
  coa_account_name: { ar: "اسم الحساب", en: "Account Name" },
  coa_account_type: { ar: "نوع الحساب", en: "Account Type" },
  coa_account_class: { ar: "تصنيف الحساب", en: "Account Class" },
  coa_cash_flow: { ar: "نوع التدفق النقدي", en: "Cash Flow Type" },
  coa_payment_enabled: { ar: "تفعيل عمليات الدفع", en: "Payment Enabled" },
  coa_purpose: { ar: "الاستخدام الوظيفي", en: "Purpose Mapping" },
  coa_status: { ar: "الحالة", en: "Status" },
  coa_currency: { ar: "العملة", en: "Currency" },
  coa_parent: { ar: "الحساب الأب", en: "Parent Account" },
  coa_notes: { ar: "ملاحظات", en: "Notes" },
  coa_add_account: { ar: "إضافة حساب", en: "Add Account" },
  coa_edit_account: { ar: "تعديل الحساب", en: "Edit Account" },
  coa_expand_all: { ar: "توسيع الكل", en: "Expand All" },
  coa_collapse_all: { ar: "طي الكل", en: "Collapse All" },
  coa_search_placeholder: { ar: "ابحث بالاسم أو الرقم أو الوظيفة...", en: "Search by name, code, or purpose..." },
  coa_filter_class: { ar: "التصنيف", en: "Class" },
  coa_filter_all_classes: { ar: "كل التصنيفات", en: "All Classes" },
  coa_posting_only: { ar: "حسابات الترحيل فقط", en: "Posting only" },
  coa_locked: { ar: "محمي (نظام)", en: "System locked" },
  coa_custom: { ar: "مخصص", en: "Custom" },
  coa_kind_header: { ar: "تصنيف رئيسي", en: "Class header" },
  coa_kind_group: { ar: "حساب رئيسي", en: "Group" },
  coa_kind_posting: { ar: "حساب ترحيل", en: "Posting" },
  coa_cf_operating: { ar: "تشغيلي", en: "Operating" },
  coa_cf_investing: { ar: "استثماري", en: "Investing" },
  coa_cf_financing: { ar: "تمويلي", en: "Financing" },
  coa_cf_cash: { ar: "نقد", en: "Cash" },
  coa_cf_none: { ar: "—", en: "—" },
  coa_purpose_cash: { ar: "النقد", en: "Cash" },
  coa_purpose_bank: { ar: "البنك", en: "Bank" },
  coa_purpose_accounts_receivable: { ar: "العملاء", en: "Receivable" },
  coa_purpose_suppliers: { ar: "الموردون", en: "Suppliers" },
  coa_purpose_inventory: { ar: "المخزون", en: "Inventory" },
  coa_purpose_fixed_assets: { ar: "أصول ثابتة", en: "Fixed Assets" },
  coa_purpose_accumulated_depreciation: { ar: "إهلاك متراكم", en: "Accum. Dep." },
  coa_purpose_vat_input: { ar: "ضريبة مدخلات", en: "VAT Input" },
  coa_purpose_vat_payable: { ar: "ضريبة مستحقة", en: "VAT Payable" },
  coa_purpose_revenue: { ar: "إيرادات", en: "Revenue" },
  coa_purpose_expense: { ar: "مصروف", en: "Expense" },
  coa_purpose_cost_of_sales: { ar: "تكلفة المبيعات", en: "Cost of Sales" },
  coa_purpose_payroll_payable: { ar: "رواتب مستحقة", en: "Payroll Payable" },
  coa_purpose_retained_earnings: { ar: "أرباح محتجزة", en: "Retained Earnings" },
  coa_purpose_owner_equity: { ar: "حقوق الملاك", en: "Owner Equity" },
  coa_purpose_opening_balance_equity: { ar: "رصيد افتتاحي", en: "Opening Balance" },
  coa_count_total: { ar: "إجمالي الحسابات", en: "Total accounts" },
  coa_count_posting: { ar: "حسابات الترحيل", en: "Posting accounts" },
  coa_count_locked: { ar: "محمية بالنظام", en: "System-locked" },
  coa_count_custom: { ar: "حسابات مخصصة", en: "Custom" },
  coa_error_locked: { ar: "لا يمكن حذف حساب نظام", en: "System account cannot be deleted" },
  coa_error_duplicate_code: { ar: "رقم الحساب مستخدم بالفعل", en: "Account code already exists" },
  coa_error_required: { ar: "الرقم والاسم مطلوبان", en: "Code and name are required" },
  coa_no_results: { ar: "لا توجد نتائج للبحث", en: "No accounts match your search" },
  coa_active: { ar: "نشط", en: "Active" },
  coa_inactive: { ar: "موقوف", en: "Inactive" },
  coa_yes: { ar: "نعم", en: "Yes" },
  coa_no: { ar: "كلا", en: "No" },
  journal_entries: { ar: "القيود اليومية", en: "Journal Entries" },
  tasks: { ar: "المهام", en: "Tasks" },
  reports: { ar: "التقارير", en: "Reports" },
  settings: { ar: "الإعدادات", en: "Settings" },

  // Common
  search: { ar: "بحث", en: "Search" },
  create: { ar: "إضافة", en: "Create" },
  new: { ar: "جديد", en: "New" },
  edit: { ar: "تعديل", en: "Edit" },
  view: { ar: "عرض", en: "View" },
  delete: { ar: "حذف", en: "Delete" },
  archive: { ar: "أرشفة", en: "Archive" },
  save: { ar: "حفظ", en: "Save" },
  saved: { ar: "تم الحفظ", en: "Saved" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  print: { ar: "طباعة", en: "Print" },
  download_pdf: { ar: "تحميل PDF", en: "Download PDF" },
  send: { ar: "إرسال", en: "Send" },
  send_to_customer: { ar: "إرسال للعميل", en: "Send to customer" },
  send_to_supplier: { ar: "إرسال للمورد", en: "Send to supplier" },
  issue: { ar: "اعتماد", en: "Issue" },
  convert_to_invoice: { ar: "تحويل إلى فاتورة", en: "Convert to Invoice" },
  total: { ar: "الإجمالي", en: "Total" },
  status: { ar: "الحالة", en: "Status" },
  date: { ar: "التاريخ", en: "Date" },
  amount: { ar: "المبلغ", en: "Amount" },
  amount_in_words: { ar: "المبلغ كتابةً", en: "Amount in words" },
  actions: { ar: "إجراءات", en: "Actions" },
  filter: { ar: "تصفية", en: "Filter" },
  all: { ar: "الكل", en: "All" },
  empty: { ar: "لا توجد بيانات بعد", en: "No data yet" },
  empty_hint: { ar: "ابدأ بإضافة سجل جديد لعرضه هنا.", en: "Add a new record to see it here." },
  export: { ar: "تصدير", en: "Export" },
  notes: { ar: "ملاحظات", en: "Notes" },
  terms: { ar: "الشروط والأحكام", en: "Terms & Conditions" },
  description: { ar: "الوصف", en: "Description" },
  quantity: { ar: "الكمية", en: "Quantity" },
  unit_price: { ar: "السعر", en: "Unit Price" },
  discount: { ar: "الخصم", en: "Discount" },
  vat: { ar: "ضريبة القيمة المضافة", en: "VAT" },
  subtotal: { ar: "الإجمالي قبل الضريبة", en: "Subtotal" },
  vat_amount: { ar: "قيمة الضريبة", en: "VAT Amount" },
  grand_total: { ar: "الإجمالي شامل الضريبة", en: "Total incl. VAT" },
  paid: { ar: "المدفوع", en: "Paid" },
  remaining: { ar: "المتبقي", en: "Remaining" },
  due_date: { ar: "تاريخ الاستحقاق", en: "Due Date" },
  expiry_date: { ar: "تاريخ الانتهاء", en: "Expiry Date" },
  customer: { ar: "العميل", en: "Customer" },
  supplier: { ar: "المورد", en: "Supplier" },
  number: { ar: "الرقم", en: "Number" },
  add_line: { ar: "إضافة بند", en: "Add Line" },

  // Statuses
  draft: { ar: "مسودة", en: "Draft" },
  sent: { ar: "مرسل", en: "Sent" },
  accepted: { ar: "مقبول", en: "Accepted" },
  rejected: { ar: "مرفوض", en: "Rejected" },
  converted: { ar: "محوّل لفاتورة", en: "Converted" },
  official: { ar: "معتمدة", en: "Issued" },
  unpaid: { ar: "غير مدفوعة", en: "Unpaid" },
  partially_paid: { ar: "مدفوعة جزئيًا", en: "Partially Paid" },
  fully_paid: { ar: "مدفوعة بالكامل", en: "Paid" },
  cancelled: { ar: "ملغاة", en: "Cancelled" },
  active: { ar: "نشط", en: "Active" },
  inactive: { ar: "غير نشط", en: "Inactive" },
  ready: { ar: "جاهز", en: "Ready" },

  // Dashboard
  total_sales: { ar: "إجمالي المبيعات", en: "Total Sales" },
  unpaid_invoices: { ar: "الفواتير غير المدفوعة", en: "Unpaid Invoices" },
  quotations_sent: { ar: "عروض الأسعار المرسلة", en: "Quotations Sent" },
  recent_activity: { ar: "النشاط الأخير", en: "Recent Activity" },
  latest_invoices: { ar: "أحدث الفواتير", en: "Latest Invoices" },
  latest_quotations: { ar: "أحدث العروض", en: "Latest Quotations" },
  alerts: { ar: "تنبيهات", en: "Alerts" },

  // Customer/Supplier
  name: { ar: "الاسم", en: "Name" },
  type: { ar: "النوع", en: "Type" },
  individual: { ar: "فرد", en: "Individual" },
  company: { ar: "شركة", en: "Company" },
  vat_number: { ar: "الرقم الضريبي", en: "VAT Number" },
  mobile: { ar: "الجوال", en: "Mobile" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  city: { ar: "المدينة", en: "City" },
  address: { ar: "العنوان", en: "Address" },
  opening_balance: { ar: "الرصيد الافتتاحي", en: "Opening Balance" },
  current_balance: { ar: "الرصيد الحالي", en: "Current Balance" },
  profile: { ar: "الملف", en: "Profile" },

  // Items
  service: { ar: "خدمة", en: "Service" },
  non_stock: { ar: "منتج غير مخزني", en: "Non-stock Product" },
  stock: { ar: "منتج مخزني", en: "Stock Product" },
  sku: { ar: "رمز", en: "SKU" },
  sales_price: { ar: "سعر البيع", en: "Sales Price" },
  purchase_price: { ar: "سعر الشراء", en: "Purchase Price" },
  taxable: { ar: "خاضع للضريبة", en: "Taxable" },
  non_taxable: { ar: "غير خاضع", en: "Non-taxable" },
  current_qty: { ar: "الكمية الحالية", en: "Current Qty" },
  low_stock: { ar: "تنبيه نفاد المخزون", en: "Low Stock Alert" },

  // Vouchers
  payment_method: { ar: "طريقة الدفع", en: "Payment Method" },
  cash: { ar: "نقدًا", en: "Cash" },
  bank_transfer: { ar: "حوالة بنكية", en: "Bank Transfer" },
  card: { ar: "بطاقة", en: "Card" },
  other: { ar: "أخرى", en: "Other" },
  related_invoice: { ar: "الفاتورة المرتبطة", en: "Related Invoice" },
  bank_ref: { ar: "مرجع البنك", en: "Bank Reference" },
  category: { ar: "التصنيف المحاسبي", en: "Accounting Category" },
  payee: { ar: "المستلم", en: "Payee" },
  attachment: { ar: "مرفق", en: "Attachment" },
  receipt_voucher: { ar: "سند قبض", en: "Receipt Voucher" },
  payment_voucher: { ar: "سند صرف", en: "Payment Voucher" },
  received_from: { ar: "استلمنا من السيد", en: "Received from" },
  paid_to: { ar: "صرفنا للسيد", en: "Paid to" },
  the_amount_of: { ar: "مبلغًا وقدره", en: "The amount of" },
  for: { ar: "وذلك عن", en: "For" },

  // Accounting
  account_no: { ar: "رقم الحساب", en: "Account #" },
  account_name: { ar: "اسم الحساب", en: "Account Name" },
  account_type: { ar: "نوع الحساب", en: "Account Type" },
  parent_account: { ar: "الحساب الأب", en: "Parent" },
  assets: { ar: "الأصول", en: "Assets" },
  liabilities: { ar: "الالتزامات", en: "Liabilities" },
  equity: { ar: "حقوق الملكية", en: "Equity" },
  revenue: { ar: "الإيرادات", en: "Revenue" },
  expenses: { ar: "المصروفات", en: "Expenses" },
  debit: { ar: "مدين", en: "Debit" },
  credit: { ar: "دائن", en: "Credit" },
  posted: { ar: "مرحّل", en: "Posted" },

  // Tasks
  title: { ar: "العنوان", en: "Title" },
  assigned: { ar: "المسؤول", en: "Assigned" },
  priority: { ar: "الأولوية", en: "Priority" },
  low: { ar: "منخفض", en: "Low" },
  medium: { ar: "متوسط", en: "Medium" },
  high: { ar: "عالٍ", en: "High" },
  task_new: { ar: "جديد", en: "New" },
  in_progress: { ar: "قيد التنفيذ", en: "In Progress" },
  completed: { ar: "مكتمل", en: "Completed" },
  deferred: { ar: "مؤجل", en: "Deferred" },
  list: { ar: "قائمة", en: "List" },
  board: { ar: "لوحة", en: "Board" },

  // Settings
  company_settings: { ar: "إعدادات الشركة", en: "Company Settings" },
  tax_settings: { ar: "إعدادات الضريبة", en: "Tax Settings" },
  numbering: { ar: "ترقيم المستندات", en: "Numbering" },
  users_roles: { ar: "المستخدمون والصلاحيات", en: "Users & Roles" },
  company_name: { ar: "اسم الشركة", en: "Company Name" },
  logo: { ar: "الشعار", en: "Logo" },
  cr_number: { ar: "السجل التجاري", en: "Commercial Registration" },
  country: { ar: "الدولة", en: "Country" },
  currency: { ar: "العملة", en: "Currency" },
  enable_vat: { ar: "تفعيل الضريبة", en: "Enable VAT" },
  default_vat: { ar: "النسبة الافتراضية", en: "Default VAT Rate" },
  invoice_type: { ar: "نوع الفاتورة", en: "Invoice Type" },
  simplified_tax: { ar: "فاتورة ضريبية مبسطة", en: "Simplified Tax Invoice" },
  show_qr: { ar: "عرض رمز QR", en: "Show QR Code" },
  role: { ar: "الدور", en: "Role" },
  owner: { ar: "المالك", en: "Owner" },
  accountant: { ar: "محاسب", en: "Accountant" },
  sales_employee: { ar: "موظف مبيعات", en: "Sales Employee" },
  viewer: { ar: "مشاهد", en: "Viewer" },
  reset_demo: { ar: "إعادة تعيين البيانات التجريبية", en: "Reset Demo Data" },

  // Reports
  report_sales: { ar: "تقرير المبيعات", en: "Sales Report" },
  report_unpaid: { ar: "الفواتير غير المدفوعة", en: "Unpaid Invoices" },
  report_receipts: { ar: "تقرير سندات القبض", en: "Receipts Report" },
  report_payments: { ar: "تقرير سندات الصرف", en: "Payments Report" },
  report_items: { ar: "تقرير المنتجات والخدمات", en: "Items Report" },
  report_balances: { ar: "أرصدة العملاء", en: "Customer Balances" },

  // Validation
  err_customer_required: { ar: "يرجى اختيار العميل", en: "Customer is required" },
  err_supplier_required: { ar: "يرجى اختيار المورد", en: "Supplier is required" },
  err_amount_positive: { ar: "المبلغ يجب أن يكون أكبر من صفر", en: "Amount must be greater than zero" },
  err_lines_required: { ar: "يرجى إضافة بند واحد على الأقل", en: "Please add at least one line item" },
  err_balanced: { ar: "إجمالي المدين يجب أن يساوي إجمالي الدائن", en: "Debit and credit totals must be equal" },
  err_locked: { ar: "لا يمكن تعديل الفاتورة بعد اعتمادها", en: "Invoice cannot be edited after issuing" },
  err_locked_je: { ar: "لا يمكن تعديل قيد مُرحّل", en: "Posted journal entry is locked" },

  // Demo checklist
  demo_checklist: { ar: "قائمة الجاهزية للعرض", en: "Demo Readiness Checklist" },
  demo_checklist_desc: { ar: "حالة الجاهزية لجميع وحدات الإصدار الأول والمرحلة 1.2", en: "Readiness status for V1 and Phase 1.2" },
  print_layouts: { ar: "قوالب الطباعة", en: "Print Layouts" },
  demo_data: { ar: "البيانات التجريبية", en: "Demo Data" },
  bilingual: { ar: "العربية / الإنجليزية", en: "Arabic / English" },
  rtl_ltr: { ar: "RTL / LTR", en: "RTL / LTR" },

  // Phase 1.2
  audit_log: { ar: "سجل المراجعة", en: "Audit Log" },
  demo_mode: { ar: "وضع تجريبي", en: "Demo Mode" },
  reset_demo_confirm: { ar: "سيتم استعادة البيانات التجريبية الأصلية وحذف جميع التعديلات. متابعة؟", en: "This will restore original demo data and erase all changes. Continue?" },
  confirm: { ar: "تأكيد", en: "Confirm" },
  organization: { ar: "المؤسسة", en: "Organization" },

  // Phase 1.3
  permission_check: { ar: "فحص الصلاحيات", en: "Permission Check" },
  access_denied: { ar: "ليس لديك صلاحية", en: "Access Denied" },
  no_permission_action: { ar: "ليس لديك صلاحية لتنفيذ هذا الإجراء", en: "You do not have permission to perform this action" },
  allowed: { ar: "مسموح", en: "Allowed" },
  denied: { ar: "ممنوع", en: "Denied" },
  user_label: { ar: "المستخدم", en: "User" },
  entity: { ar: "الكيان", en: "Entity" },
  action_label: { ar: "الإجراء", en: "Action" },
  from_date: { ar: "من تاريخ", en: "From date" },
  to_date: { ar: "إلى تاريخ", en: "To date" },
  reset_filters: { ar: "مسح التصفية", en: "Reset filters" },

  // Phase 2.2 — Advanced foundations
  document_templates: { ar: "نماذج المستندات", en: "Document Templates" },
  custom_fields: { ar: "الحقول المخصصة", en: "Custom Fields" },
  reports_center: { ar: "مركز التقارير والتحليلات", en: "Reports & Analytics Center" },
  employees: { ar: "الموظفون", en: "Employees" },
  payroll: { ar: "الرواتب", en: "Payroll" },
  payroll_runs: { ar: "تشغيل الرواتب", en: "Payroll Runs" },
  expense_claims: { ar: "مطالبات المصروفات", en: "Expense Claims" },
  employees_payroll: { ar: "الموظفون والرواتب", en: "Employees & Payroll" },
  branches: { ar: "الفروع", en: "Branches" },
  businesses_branches: { ar: "الأعمال والفروع", en: "Businesses & Branches" },
  team_roles: { ar: "الفريق والصلاحيات", en: "Team & Roles" },
  internal_communication: { ar: "التواصل الداخلي", en: "Internal Communication" },
  announcements: { ar: "الإعلانات", en: "Announcements" },
  internal_notes: { ar: "ملاحظات داخلية", en: "Internal Notes" },
  send_email: { ar: "إرسال بريد", en: "Send Email" },
  send_whatsapp: { ar: "إرسال واتساب", en: "Send WhatsApp" },
  copy_public_link: { ar: "نسخ رابط عام", en: "Copy public link" },
  sending_not_connected: { ar: "الإرسال غير مفعّل بعد", en: "Sending is not connected yet" },
  quick_actions: { ar: "إجراءات سريعة", en: "Quick Actions" },
  global_search: { ar: "البحث الفوري", en: "Instant Search" },
  bulk_edit: { ar: "التعديل المجمع", en: "Bulk Edit" },
  template: { ar: "القالب", en: "Template" },
  default_template: { ar: "افتراضي", en: "Default" },
  duplicate: { ar: "تكرار", en: "Duplicate" },
  preview: { ar: "معاينة", en: "Preview" },
  coming_soon: { ar: "قريبًا", en: "Coming Soon" },
  available: { ar: "متاح", en: "Available" },
  open: { ar: "فتح", en: "Open" },
  report_category: { ar: "الفئة", en: "Category" },
  advanced: { ar: "ميزات متقدمة", en: "Advanced" },

  // Phase 2.1.5 — Document pages & purchase invoices
  sales_invoices: { ar: "فواتير المبيعات", en: "Sales Invoices" },
  purchase_invoices: { ar: "فواتير المشتريات", en: "Purchase Invoices" },
  new_quotation: { ar: "عرض سعر جديد", en: "New Quotation" },
  edit_quotation: { ar: "تعديل عرض سعر", en: "Edit Quotation" },
  new_sales_invoice: { ar: "فاتورة مبيعات جديدة", en: "New Sales Invoice" },
  edit_sales_invoice: { ar: "تعديل فاتورة مبيعات", en: "Edit Sales Invoice" },
  new_purchase_invoice: { ar: "فاتورة مشتريات جديدة", en: "New Purchase Invoice" },
  edit_purchase_invoice: { ar: "تعديل فاتورة مشتريات", en: "Edit Purchase Invoice" },
  save_draft: { ar: "حفظ كمسودة", en: "Save Draft" },
  back: { ar: "رجوع", en: "Back" },
  approve: { ar: "اعتماد", en: "Approve" },
  approved: { ar: "معتمدة", en: "Approved" },
  record_payment: { ar: "تسجيل دفعة", en: "Record Payment" },
  supplier_invoice_ref: { ar: "مرجع فاتورة المورد", en: "Supplier Invoice Ref." },
  unit_cost: { ar: "تكلفة الوحدة", en: "Unit Cost" },
  document_info: { ar: "بيانات المستند", en: "Document Information" },
  party_info: { ar: "بيانات الطرف", en: "Party Information" },
  dates: { ar: "التواريخ", en: "Dates" },
  line_items: { ar: "البنود", en: "Line Items" },
  totals_summary: { ar: "ملخص الإجمالي", en: "Totals Summary" },
  notes_terms: { ar: "ملاحظات وشروط", en: "Notes & Terms" },
  attachments_placeholder: { ar: "مرفقات (قريبًا)", en: "Attachments (coming soon)" },
  not_found: { ar: "غير موجود", en: "Not Found" },
  err_supplier_required_p: { ar: "يرجى اختيار المورد", en: "Supplier is required" },

  // Smart selectors (Phase 2.1.8)
  smart_search_customer: { ar: "ابحث عن عميل", en: "Search customer" },
  smart_recent_customers: { ar: "آخر العملاء استخدامًا", en: "Recently used customers" },
  smart_search_supplier: { ar: "ابحث عن مورد", en: "Search supplier" },
  smart_recent_suppliers: { ar: "آخر الموردين استخدامًا", en: "Recently used suppliers" },
  smart_search_item: { ar: "ابحث عن خدمة أو منتج", en: "Search product or service" },
  smart_recent_items: { ar: "آخر الخدمات والمنتجات استخدامًا", en: "Recently used products and services" },
  smart_search_invoice: { ar: "ابحث عن فاتورة", en: "Search invoice" },
  smart_recent_invoices: { ar: "الفواتير الأخيرة", en: "Recent invoices" },
  smart_unpaid_invoices: { ar: "الفواتير غير المدفوعة", en: "Unpaid invoices" },
  smart_no_results: { ar: "لا توجد نتائج", en: "No results" },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof dict | string) => string;
  dir: "rtl" | "ltr";
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("jaad_lang")) as Lang | null;
    if (stored === "ar" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    if (typeof window !== "undefined") localStorage.setItem("jaad_lang", lang);
  }, [lang]);

  const t = (key: string) => {
    const entry = (dict as Record<string, { ar: string; en: string }>)[key];
    if (!entry) return key;
    return entry[lang];
  };

  return (
    <I18nCtx.Provider value={{ lang, setLang: setLangState, t, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function fmtMoney(n: number, _lang: Lang = "ar") {
  void _lang;
  const v = (n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${v} ر.س`;
}

/** Format any number with Latin numerals and thousands separator. */
export function fmtNum(n: number, opts?: Intl.NumberFormatOptions) {
  return (n || 0).toLocaleString("en-US", opts);
}
