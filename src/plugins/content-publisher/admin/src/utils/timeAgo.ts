// utils/timeAgo.ts
//
// "3 days ago" scans far faster than a full date when you are looking down a column for the
// thing you just edited. The exact date is still available in a tooltip.

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

export const timeAgo = (value?: string) => {
  if (!value) return '—';

  const elapsed = Date.now() - new Date(value).getTime();
  if (Number.isNaN(elapsed)) return '—';

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  for (const [unit, ms] of UNITS) {
    if (Math.abs(elapsed) >= ms) {
      return formatter.format(-Math.round(elapsed / ms), unit);
    }
  }

  return 'just now';
};
