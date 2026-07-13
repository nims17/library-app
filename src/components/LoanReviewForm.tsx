"use client";

import { useState, useTransition } from "react";
import StarRating from "@/components/StarRating";
import { submitReview } from "@/app/actions";

export default function LoanReviewForm({
  bookId,
  existingRating,
  existingThoughts,
}: {
  bookId: string;
  existingRating: number | null;
  existingThoughts: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingRating || 5);
  const [thoughts, setThoughts] = useState(existingThoughts || "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-ink underline"
      >
        {existingRating ? "Edit your review" : "Leave a review"}
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-sm border border-brass/30 bg-parchment/60 p-2">
      <StarRating
        value={rating}
        onChange={(v) => {
          setRating(v);
          setSaved(false);
        }}
        size="text-lg"
      />
      <textarea
        value={thoughts}
        onChange={(e) => {
          setThoughts(e.target.value);
          setSaved(false);
        }}
        rows={2}
        placeholder="What did you think?"
        className="mt-1 w-full rounded border border-brown/30 bg-transparent px-2 py-1 text-sm text-brown focus:border-ink focus:outline-none"
      />
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await submitReview(bookId, rating, thoughts);
            setSaved(true);
          })
        }
        className="mt-1 rounded-sm bg-ink px-3 py-1 font-stamp text-[12px] tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
      >
        SAVE REVIEW
      </button>
      {saved && (
        <span className="ml-2 text-xs font-medium text-green-800">
          ✓ Saved
        </span>
      )}
    </div>
  );
}
