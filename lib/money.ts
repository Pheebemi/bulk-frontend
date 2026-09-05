export function formatNaira(amount: number): string {
  const negative = amount < 0;
  const value = Math.abs(Math.round(amount * 100) / 100);
  const parts = value.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}₦${parts[0]}.${parts[1]}`;
}

// Mirrors apps/campaigns/utils.py:count_segments on the backend — keep
// these in sync. Termii bills 70 chars/segment (not 160) once the message
// contains any of these special characters.
const SPECIAL_CHARS = new Set(';/^{}\\[~]|€\'"'.split(''));

export function countSegments(message: string): number {
  if (message.length === 0) return 1;
  const hasSpecial = [...message].some((ch) => SPECIAL_CHARS.has(ch));
  const pageSize = hasSpecial ? 70 : 160;
  return Math.max(1, Math.ceil(message.length / pageSize));
}
