export const statusLabels: Record<string, string> = {
  draft: "مسودة",
  sent: "مرسلة",
  issued: "مصدرة",
  confirmed: "مؤكد",
  pending: "قيد الانتظار",
  paid: "مدفوعة",
  partial: "مدفوعة جزئيًا",
  unpaid: "غير مدفوعة",
  cancelled: "ملغاة",
  posted: "مرحّلة",
  approved: "معتمدة",
  converted: "محوّلة",
  active: "نشط",
  inactive: "غير نشط",
  overdue: "متأخرة",
};

export const paymentMethodLabels: Record<string, string> = {
  cash: "نقدًا",
  bank: "تحويل بنكي",
  card: "بطاقة",
  transfer: "تحويل",
  other: "أخرى",
};

export const documentTypeLabels: Record<string, string> = {
  invoice: "فاتورة",
  quotation: "عرض سعر",
  receipt: "سند قبض",
  payment: "سند صرف",
  purchase_invoice: "فاتورة مشتريات",
  purchase_order: "أمر شراء",
  credit_note: "إشعار دائن",
  debit_note: "إشعار مدين",
};

export function getStatusLabel(status: string): string {
  return statusLabels[status] || status;
}

export function getPaymentMethodLabel(method: string): string {
  return paymentMethodLabels[method] || method;
}

export function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ر.س";
}

export function formatNumber(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  return num.toLocaleString("en-US");
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return value;
  }
}
