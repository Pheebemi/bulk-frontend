export function formatNaira(amount: number): string {
  const negative = amount < 0;
  const value = Math.abs(Math.round(amount * 100) / 100);
  const parts = value.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}₦${parts[0]}.${parts[1]}`;
}

export function countSegments(message: string): number {
  const len = message.length;
  if (len === 0) return 1;
  return len <= 160 ? 1 : Math.ceil(len / 153);
}
