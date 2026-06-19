export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isOverdue(expectedDate: string, status: string): boolean {
  if (status === 'completed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expected = new Date(expectedDate);
  expected.setHours(0, 0, 0, 0);
  return expected < today;
}

export function generateBarcodePrefix(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  return `DC${dateStr}`;
}
