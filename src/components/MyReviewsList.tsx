"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import StarRating from "@/components/StarRating";
import { deleteReview } from "@/app/actions";

export type MyReviewRow = {
  id: string;
  bookId: string;
  bookTitle: string;
  rating: number | null;
  thoughts: string | null;
};

export default function MyReviewsList({
  reviews,
}: {
  reviews: MyReviewRow[];
}) {
  const [rows, setRows] = useState(reviews);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function handleDelete(id: string) {
    setPendingId(id);
    startTransition(async () => {
      await deleteReview(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setConfirmId(null);
      setPendingId(null);
    });
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-brown/50">
        You haven&apos;t written any reviews yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.id}
          className="rounded-sm border border-brass/30 bg-card p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={`/books/${r.bookId}`} className="hover:underline">
                <p className="text-sm font-medium text-brown">
                  {r.bookTitle}
                </p>
              </Link>
              {r.rating && (
                <div className="mt-0.5">
                  <StarRating value={r.rating} size="text-xs" />
                </div>
              )}
              {r.thoughts && (
                <p className="mt-1 text-sm text-brown/80">{r.thoughts}</p>
              )}
            </div>

            {confirmId === r.id ? (
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={isPending}
                  className="rounded-sm bg-ink px-2 py-1 font-stamp text-[9px] tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
                >
                  {isPending && pendingId === r.id ? "DELETING..." : "CONFIRM"}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  disabled={isPending}
                  className="text-xs text-brown/50 underline disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmId(r.id)}
                className="flex-shrink-0 text-xs text-ink/70 underline hover:text-ink"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
