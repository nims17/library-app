// Rough reading-time estimate from a page count. Assumes ~300 words per
// page and a ~250 words-per-minute reading pace — close enough for a
// friendly "about how long will this take me" hint, not a precise figure.
export function estimateReadingTime(pageCount: number | null): string | null {
  if (!pageCount || pageCount <= 0) return null;

  const minutes = Math.round((pageCount * 300) / 250);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `~${remainingMinutes} min read`;
  if (remainingMinutes === 0) return `~${hours} hr read`;
  return `~${hours} hr ${remainingMinutes} min read`;
}
