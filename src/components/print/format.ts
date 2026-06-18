export function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ر.س";
}
