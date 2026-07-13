"use client";

import { useState, useTransition } from "react";
import { setFeatured } from "@/app/actions";

const MAX_FEATURED = 3;

type BookOption = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  featured_at: string | null;
};

function Cover({ book }: { book: BookOption }) {
  return (
    <div
      className="relative flex-shrink-0 overflow-hidden rounded-r-sm rounded-l-[2px]"
      style={{ width: 32, height: 48 }}
    >
      {book.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={book.cover_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-shelf font-serif text-xs text-parchment">
          {book.title.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function Row({
  book,
  isFeatured,
  disabled,
  busy,
  justChanged,
  onToggle,
}: {
  book: BookOption;
  isFeatured: boolean;
  disabled: boolean;
  busy: boolean;
  justChanged: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-sm border border-brass/30 bg-card p-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Cover book={book} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-brown">{book.title}</p>
          <p className="truncate text-xs text-brown/50">{book.author}</p>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {justChanged && (
          <span className="text-xs font-medium text-green-800">
            {isFeatured ? "✓ Featured" : "✓ Removed"}
          </span>
        )}
        <button
          onClick={onToggle}
          disabled={busy || disabled}
          className={
            isFeatured
              ? "rounded-sm border border-ink px-3 py-1.5 font-stamp text-[10px] tracking-widest text-ink hover:bg-parchment disabled:opacity-50"
              : "rounded-sm bg-ink px-3 py-1.5 font-stamp text-[10px] tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
          }
        >
          {busy ? "..." : isFeatured ? "REMOVE" : "FEATURE"}
        </button>
      </div>
    </div>
  );
}

export default function FeaturedBooksManager({
  books,
}: {
  books: BookOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [justChangedId, setJustChangedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const featured = [...books]
    .filter((b) => b.featured_at)
    .sort(
      (a, b) =>
        new Date(a.featured_at as string).getTime() -
        new Date(b.featured_at as string).getTime()
    );
  const others = books.filter((b) => !b.featured_at);
  const atMax = featured.length >= MAX_FEATURED;

  function toggle(book: BookOption) {
    setError(null);
    setJustChangedId(null);
    setPendingId(book.id);
    const next = !book.featured_at;
    startTransition(async () => {
      try {
        await setFeatured(book.id, next);
        setJustChangedId(book.id);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Couldn't update that book."
        );
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-brown/50">
        {featured.length}/{MAX_FEATURED} books featured on the Browse page.
      </p>
      {error && <p className="text-xs text-ink">{error}</p>}

      {featured.length > 0 ? (
        <div className="space-y-2">
          {featured.map((b) => (
            <Row
              key={b.id}
              book={b}
              isFeatured
              disabled={false}
              busy={isPending && pendingId === b.id}
              justChanged={justChangedId === b.id}
              onToggle={() => toggle(b)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-brown/50">Nothing featured yet — pick up to three below.</p>
      )}

      <details className="rounded-sm border border-brass/30 bg-card">
        <summary className="cursor-pointer select-none px-3 py-2 font-stamp text-[10px] uppercase tracking-widest text-brown/60">
          Choose from all books
        </summary>
        <div className="space-y-2 p-3 pt-1">
          {others.map((b) => (
            <Row
              key={b.id}
              book={b}
              isFeatured={false}
              disabled={atMax}
              busy={isPending && pendingId === b.id}
              justChanged={justChangedId === b.id}
              onToggle={() => toggle(b)}
            />
          ))}
          {others.length === 0 && (
            <p className="p-1 text-xs text-brown/50">Every book is already featured.</p>
          )}
        </div>
      </details>
    </div>
  );
}
