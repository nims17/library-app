"use client";

import { useState, useTransition } from "react";
import { manualCheckout } from "@/app/actions";

type BookOption = { id: string; title: string; cover_url: string | null };
type BorrowerOption = { id: string; display_name: string | null; role: string };

export default function ManualCheckoutForm({
  availableBooks,
  borrowers,
}: {
  availableBooks: BookOption[];
  borrowers: BorrowerOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState<{
    title: string;
    coverUrl: string | null;
    name: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setConfirmed(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const bookId = String(formData.get("book_id") || "");
    const userId = String(formData.get("user_id") || "");
    if (!bookId || !userId) return;

    const book = availableBooks.find((b) => b.id === bookId);
    const borrower = borrowers.find((b) => b.id === userId);

    startTransition(async () => {
      try {
        await manualCheckout(bookId, userId);
        setConfirmed({
          title: book?.title || "The book",
          coverUrl: book?.cover_url || null,
          name: borrower?.display_name || "them",
        });
        form.reset();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Couldn't log that checkout."
        );
      }
    });
  }

  if (availableBooks.length === 0) {
    return (
      <p className="text-sm text-brown/50">
        Nothing on the shelf to check out right now.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {confirmed && (
        <div className="flex items-center gap-3 rounded-sm border border-green-800/30 bg-green-50 p-3">
          <div
            className="relative flex-shrink-0 overflow-hidden rounded-r-sm rounded-l-[2px]"
            style={{ width: 32, height: 48 }}
          >
            {confirmed.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={confirmed.coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-shelf font-serif text-xs text-parchment">
                {confirmed.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-green-800">
            ✓ Logged — &quot;{confirmed.title}&quot; checked out to{" "}
            {confirmed.name}.
          </p>
        </div>
      )}
      {error && <p className="text-sm text-ink">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-3 rounded-sm border border-brass/30 bg-card p-4"
      >
        <div>
          <label className="mb-1 block text-xs text-brown/70">Book</label>
          <select
            name="book_id"
            required
            className="rounded border border-brown/30 bg-transparent px-2 py-1.5 text-sm text-brown"
          >
            {availableBooks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-brown/70">
            Borrowed by
          </label>
          <select
            name="user_id"
            required
            className="rounded border border-brown/30 bg-transparent px-2 py-1.5 text-sm text-brown"
          >
            {borrowers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
                {m.role === "admin" ? " (librarian)" : ""}
              </option>
            ))}
          </select>
        </div>
        <button
          disabled={isPending}
          className="rounded-sm bg-ink px-4 py-1.5 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
        >
          {isPending ? "LOGGING..." : "LOG CHECKOUT"}
        </button>
      </form>
    </div>
  );
}
