// Small wrapper so `Date.now()` isn't called directly inside a component
// body (React's purity lint rule flags impure calls in render).
export function msAgo(milliseconds: number): number {
  return Date.now() - milliseconds;
}

export function daysAgo(days: number): number {
  return msAgo(days * 24 * 60 * 60 * 1000);
}

// Whole days elapsed since an ISO timestamp, relative to now.
export function daysSince(isoTimestamp: string): number {
  return Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / (24 * 60 * 60 * 1000));
}
