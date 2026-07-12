"use client";

import { useMemo, useState } from "react";
import type { Book } from "@/lib/types";
import StarRating from "@/components/StarRating";
import BookDetailModal, { type EnrichedBook } from "@/components/BookDetailModal";

type SortMode = "title" | "author" | "added" | "genre";

function communityRating(reviews: EnrichedBook["reviews"]): number | null {
  if (!reviews || reviews.length === 0) return null;
  const sum = reviews.reduce((s, r) => s + (r.rating || 0), 0);
  return sum / reviews.length;
}

function librarianRating(reviews: EnrichedBook["reviews"]): number | null {
  const librarianReviews = (reviews || []).filter(
    (r) => r.profile?.is_public_librarian
  );
  if (librarianReviews.length === 0) return null;
  const sum = librarianReviews.reduce((s, r) => s + (r.rating || 0), 0);
  return sum / librarianReviews.length;
}

function letterOf(value: string): string {
  const ch = value.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : "#";
}

function BookThumb({ book }: { book: Book }) {
  return (
    <div
      className="relative flex-shrink-0 rounded-r-sm rounded-l-[2px] shadow-md transition-transform duration-150 group-hover:-translate-y-1"
      style={{ width: 84, height: 126 }}
    >
      {book.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.cover_url}
          alt={book.title}
          className="h-full w-full rounded-r-sm rounded-l-[2px] object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-r-sm rounded-l-[2px] bg-shelf text-center font-serif text-lg text-parchment">
          {book.title.charAt(0).toUpperCase()}
        </div>
      )}
      {/* left spine edge + right page-edge, to sell the "physical book" look */}
      <div className="absolute inset-y-0 left-0 w-1 rounded-l-[2px] bg-black/25" />
      <div className="absolute inset-y-0 right-0 w-[3px] bg-gradient-to-l from-white/70 to-transparent" />
      {book.status === "checked_out" && (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 shadow" />
      )}
    </div>
  );
}

export default function BrowseClient({
  books,
  currentUserId,
  isPublicLibrarian,
}: {
  books: EnrichedBook[];
  currentUserId: string | null;
  isPublicLibrarian: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("title");
  const [genreFilter, setGenreFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const b of books) if (b.book.genre) set.add(b.book.genre);
    return [...set].sort();
  }, [books]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter(({ book, reviews }) => {
      if (
        q &&
        !book.title.toLowerCase().includes(q) &&
        !book.author.toLowerCase().includes(q)
      )
        return false;
      if (genreFilter !== "all" && book.genre !== genreFilter) return false;
      if (ratingFilter > 0) {
        const rating = librarianRating(reviews);
        if (!rating || rating < ratingFilter) return false;
      }
      return true;
    });
  }, [books, query, genreFilter, ratingFilter]);

  const picks = useMemo(() => {
    return [...books]
      .map((e) => ({ e, rating: communityRating(e.reviews) }))
      .filter((x) => x.rating !== null)
      .sort((a, b) => (b.rating as number) - (a.rating as number))
      .slice(0, 5)
      .map((x) => x.e);
  }, [books]);

  const rows = useMemo(() => {
    if (sortMode === "added") {
      const sorted = [...filtered].sort(
        (a, b) =>
          new Date(b.book.created_at).getTime() -
          new Date(a.book.created_at).getTime()
      );
      return sorted.length ? [{ label: "Recently added", items: sorted }] : [];
    }

    if (sortMode === "genre") {
      const map = new Map<string, EnrichedBook[]>();
      for (const e of filtered) {
        const key = e.book.genre || "Uncategorized";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(e);
      }
      for (const list of map.values()) {
        list.sort((a, b) => a.book.title.localeCompare(b.book.title));
      }
      return [...map.entries()]
        .sort((a, b) => {
          if (a[0] === "Uncategorized") return 1;
          if (b[0] === "Uncategorized") return -1;
          return a[0].localeCompare(b[0]);
        })
        .map(([label, items]) => ({ label, items }));
    }

    // title or author: group into a row per starting letter
    const field: "title" | "author" = sortMode === "author" ? "author" : "title";
    const map = new Map<string, EnrichedBook[]>();
    for (const e of filtered) {
      const key = letterOf(e.book[field]);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.book[field].localeCompare(b.book[field]));
    }
    return [...map.entries()]
      .sort((a, b) => {
        if (a[0] === "#") return 1;
        if (b[0] === "#") return -1;
        return a[0].localeCompare(b[0]);
      })
      .map(([label, items]) => ({ label, items }));
  }, [filtered, sortMode]);

  const selected = books.find((e) => e.book.id === selectedId) || null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-brown">Browse the stacks</h1>
          <p className="font-stamp text-[11px] tracking-wide text-brown/50">
            {books.length} volume{books.length !== 1 ? "s" : ""} on the shelves
          </p>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or author..."
          className="rounded-sm border border-brass/40 bg-card px-3 py-1.5 text-sm text-brown focus:border-ink focus:outline-none"
        />
      </div>

      {picks.length > 0 && !query && (
        <section className="mb-10">
          <h2 className="mb-2 font-serif text-lg text-brown">
            Librarian&apos;s recent picks
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {picks.map(({ book, reviews }) => (
              <button
                key={book.id}
                onClick={() => setSelectedId(book.id)}
                className="group flex flex-shrink-0 flex-col items-center gap-1.5"
              >
                <BookThumb book={book} />
                <span className="max-w-[84px] truncate text-xs text-brown/70">
                  {book.title}
                </span>
                <StarRating value={communityRating(reviews) || 0} size="text-xs" />
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-4 border-b-2 border-brass/30 pb-3">
        <div className="flex gap-1">
          {(
            [
              { label: "Title", value: "title" },
              { label: "Author", value: "author" },
              { label: "Recently Added", value: "added" },
              { label: "Genre", value: "genre" },
            ] as { label: string; value: SortMode }[]
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortMode(opt.value)}
              className={`rounded-sm px-3 py-1.5 font-stamp text-xs tracking-widest ${
                sortMode === opt.value
                  ? "bg-ink text-parchment"
                  : "text-brown/70 hover:bg-card"
              }`}
            >
              {opt.label.toUpperCase()}
            </button>
          ))}
        </div>

        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="rounded border border-brown/30 bg-transparent px-2 py-1.5 text-sm text-brown"
        >
          <option value="all">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(Number(e.target.value))}
          className="rounded border border-brown/30 bg-transparent px-2 py-1.5 text-sm text-brown"
        >
          <option value={0}>Any librarian rating</option>
          <option value={4}>4+ stars from the librarians</option>
          <option value={3}>3+ stars from the librarians</option>
        </select>
      </div>

      {rows.length === 0 && (
        <p className="text-brown/60">No books found{query ? ` matching "${query}"` : ""}.</p>
      )}

      <div className="space-y-8">
        {rows.map((row) => (
          <section key={row.label}>
            <h2 className="mb-2 font-serif text-lg text-brown">{row.label}</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {row.items.map(({ book, reviews }) => (
                <button
                  key={book.id}
                  onClick={() => setSelectedId(book.id)}
                  className="group flex flex-shrink-0 flex-col items-center gap-1.5"
                >
                  <BookThumb book={book} />
                  <span className="max-w-[84px] truncate text-xs text-brown/70">
                    {book.title}
                  </span>
                  {communityRating(reviews) !== null && (
                    <StarRating
                      value={communityRating(reviews) || 0}
                      size="text-xs"
                    />
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {selected && (
        <BookDetailModal
          entry={selected}
          currentUserId={currentUserId}
          isPublicLibrarian={isPublicLibrarian}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  );
}
