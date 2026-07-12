"use client";

// Reusable 1-5 star rating. Pass `value` + `onChange` for an interactive
// input (used in review forms), or just `value` for a read-only display
// (used on book cards, filters, and leaderboards).
export default function StarRating({
  value,
  onChange,
  size = "text-base",
}: {
  value: number;
  onChange?: (rating: number) => void;
  size?: string;
}) {
  const stars = [1, 2, 3, 4, 5];
  const rounded = Math.round(value);

  return (
    <span className={`inline-flex gap-0.5 ${size}`}>
      {stars.map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={n <= rounded ? "text-ink" : "text-brown/25"}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            ★
          </button>
        ) : (
          <span key={n} className={n <= rounded ? "text-ink" : "text-brown/25"}>
            ★
          </span>
        )
      )}
    </span>
  );
}
