"use client";

import { useMemo, useState, useTransition } from "react";
import { removeBook, setFeatured } from "@/app/actions";

const MAX_FEATURED = 3;

type BookRow = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  genre: string | null;
  status: "available" | "checked_out";
  featured_at: string | null;
};

function Cover({ book }: { book: BookRow }) {
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

export default function BookCatalogManager({ books }: { books: BookRow[] }) {
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [featurePendingId, setFeaturePendingId] = useState<string | null>(null);
  const [featureJustChangedId, setFeatureJustChangedId] = useState<string | null>(null);
  const [featureError, setFeatureError] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const b of books) if (b.genre) set.add(b.genre);
    return [...set].sort();
  }, [books]);

  const featuredCount = books.filter((b) => b.featured_at).length;
  const atMax = featuredCount >= MAX_FEATURED;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...books]
      .filter((b) => {
        if (q && !b.title.toLowerCase().includes(q) && !b.author.toLowerCase().includes(q))
          return false;
        if (genreFilter !== "all" && b.genre !== genreFilter) return false;
        if (featuredOnly && !b.featured_at) return false;
        return true;
      })
      .sort((a, b) => {
        // Featured books first (most recently picked first), then title.
        if (!!a.featured_at !== !!b.featured_at) return a.featured_at ? -1 : 1;
        if (a.featured_at && b.featured_at) {
          return new Date(b.featured_at).getTime() - new Date(a.featured_at).getTime();
        }
        return a.title.localeCompare(b.title);
      });
  }, [books, query, genreFilter, featuredOnly]);

  function toggleFeature(book: BookRow) {
    setFeatureError(null);
    setFeatureJustChangedId(null);
    setFeaturePendingId(book.id);
    const next = !book.featured_at;
    startTransition(async () => {
      try {
        await setFeatured(book.id, next);
        setFeatureJustChangedId(book.id);
      } catch (err) {
        setFeatureError(
          err instanceof Error ? err.message : "Couldn't update that book."
        );
      } finally {
        setFeaturePendingId(null);
      }
    });
  }

  function handleDelete(book: BookRow) {
    setDeleteError(null);
    setDeleteMessage(null);
    setDeletePendingId(book.id);
    startTransition(async () => {
      try {
        await removeBook(book.id);
        setDeleteMessage(`✓ "${book.title}" removed from the catalog.`);
        setConfirmDeleteId(null);
      } catch (err) {
        setDeleteError(
          err instanceof Error ? err.message : "Couldn't remove that book."
        );
      } finally {
        setDeletePendingId(null);
      }
    });
  }

  return (
    <div className="rounded-sm border border-brass/40 bg-card">
      {/* Search + filter toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-brass/30 p-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or author..."
          className="min-w-0 flex-1 rounded-sm border border-brass/40 bg-parchment/60 px-2.5 py-1.5 text-sm text-brown focus:border-ink focus:outline-none"
        />
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="rounded-sm border border-brass/40 bg-parchment/60 px-2 py-1.5 text-xs text-brown focus:border-ink focus:outline-none"
        >
          <option value="all">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setFeaturedOnly((v) => !v)}
          className={`rounded-sm px-2.5 py-1.5 font-stamp text-[12px] tracking-widest ${
            featuredOnly
              ? "bg-ink text-parchment"
              : "border border-brass/40 text-brown/60 hover:bg-parchment"
          }`}
        >
          FEATURED ONLY
        </button>
        <span className="ml-auto whitespace-nowrap text-xs text-brown/50">
          {featuredCount}/{MAX_FEATURED} featured on Browse
        </span>
      </div>

      {(featureError || deleteError || deleteMessage) && (
        <div className="space-y-1 border-b border-brass/20 px-3 py-2">
          {featureError && <p className="text-xs text-ink">{featureError}</p>}
          {deleteError && <p className="text-xs text-ink">{deleteError}</p>}
          {deleteMessage && (
            <p className="text-xs font-medium text-green-800">{deleteMessage}</p>
          )}
        </div>
      )}

      {/* Scrollable book list */}
      <div className="max-h-[420px] divide-y divide-brass/20 overflow-y-auto">
        {filtered.map((b) => {
          const isFeatured = !!b.featured_at;
          const featureBusy = isPending && featurePendingId === b.id;
          const deleteBusy = isPending && deletePendingId === b.id;
          return (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Cover book={b} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brown">
                    {b.title}
                  </p>
                  <p className="truncate text-xs text-brown/50">
                    {b.author}
                    {b.status === "checked_out" && (
                      <span className="ml-1.5 text-brown/40">· checked out</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-2">
                {featureJustChangedId === b.id && (
                  <span className="hidden text-xs font-medium text-green-800 sm:inline">
                    {isFeatured ? "✓ Featured" : "✓ Removed"}
                  </span>
                )}

                <button
                  onClick={() => toggleFeature(b)}
                  disabled={featureBusy || (!isFeatured && atMax)}
                  title={
                    !isFeatured && atMax
                      ? `Only ${MAX_FEATURED} books can be featured at once`
                      : undefined
                  }
                  className={
                    isFeatured
                      ? "rounded-sm border border-ink px-2.5 py-1.5 font-stamp text-[12px] tracking-widest text-ink hover:bg-parchment disabled:opacity-50"
                      : "rounded-sm bg-ink px-2.5 py-1.5 font-stamp text-[12px] tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
                  }
                >
                  {featureBusy ? "..." : isFeatured ? "UNFEATURE" : "FEATURE"}
                </button>

                {confirmDeleteId === b.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDelete(b)}
                      disabled={deleteBusy}
                      className="rounded-sm bg-ink px-2.5 py-1.5 font-stamp text-[12px] tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
                    >
                      {deleteBusy ? "..." : "CONFIRM"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={deleteBusy}
                      className="text-xs text-brown/50 underline disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(b.id)}
                    className="rounded-sm border border-brown/30 px-2.5 py-1.5 font-stamp text-[12px] tracking-widest text-brown/70 hover:bg-parchment"
                  >
                    REMOVE
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-brown/50">No books match.</p>
        )}
      </div>
    </div>
  );
}
