const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

// Axis labels sit in a fixed gutter, so they have to stay short whether the bucket
// holds three orders or thirty thousand.
export function compactCount(value: number): string {
  return compact.format(value);
}

const UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
];

export function relativeTime(iso: string, now: number = Date.now()): string {
  let value = (new Date(iso).getTime() - now) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(value) < size) return relative.format(Math.round(value), unit);
    value /= size;
  }
  return relative.format(Math.round(value), 'week');
}
