// Shared utility functions - consolidated from duplicates across components

export function formatNumber(v: number | null | undefined): string {
  if (v == null) return 'N/A';
  const a = Math.abs(v);
  if (a >= 1e12) return (v / 1e12).toFixed(2) + 'T';
  if (a >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return String(v);
}

export function formatPrice(v: number | null | undefined, currency: string = '$'): string {
  if (v == null) return '---';
  return `${currency}${v.toFixed(2)}`;
}

export function formatPct(v: number | null | undefined): string {
  if (v == null) return '---';
  const pct = (v * 100).toFixed(2);
  return v >= 0 ? `+${pct}%` : `${pct}%`;
}

export function vibrate(ms: number = 50): void {
  try {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(ms);
    }
  } catch (_) {}
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
