export function normalizeTicketCode(value: string): string {
  return value.trim().toUpperCase();
}

export function formatCurrency(amount: number, currency: string): string {
  return `${new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)} ${currency}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Sin registro";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(value));
}
