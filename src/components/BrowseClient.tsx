"use client";

import { useMemo, useState } from "react";
import type { Book } from "@/lib/types";
import StarRating from "@/components/StarRating";
import BookDetailModal, { type EnrichedBook } from "@/components/BookDetailModal";
import LibrarianBanner from "@/components/LibrarianBanner";

type SortMode = "title" | "author" | "added" | "genre";

// People-free "environment" shots only — this sits behind the featured book
// so it should read as a room, not a portrait. The first is a cozy shelf
// interior (Bell's Books, Palo Alto — Unsplash License, free to use).
const HERO_BACKDROPS = [
  "https://images.unsplash.com/photo-1747913647304-9f298ff28ff4?fm=jpg&q=75&w=2400&auto=format&fit=crop",
  "/images/library-nook-window.jpg",
  "/images/library-nook-cozy.jpg",
];

type Librarian = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  currentlyReading: string | null;
};

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

function BookThumb({ book, large }: { book: Book; large?: boolean }) {
  const width = large ? 150 : 84;
  const height = large ? 225 : 126;
  return (
    <div
      className="relative flex-shrink-0 rounded-r-sm rounded-l-[2px] shadow-md transition-transform duration-150 ease-out group-hover:-translate-y-1 group-hover:scale-[1.08] group-hover:shadow-2xl"
      style={{ width, height }}
    >
      {book.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.cover_url}
          alt={book.title}
          className="h-full w-full rounded-r-sm rounded-l-[2px] object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-r-sm rounded-l-[2px] bg-shelf text-center font-serif text-parchment"
          style={{ fontSize: large ? 28 : 18 }}
        >
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
  librarians,
}: {
  books: EnrichedBook[];
  currentUserId: string | null;
  isPublicLibrarian: boolean;
  librarians: Librarian[];
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

  // Curated by a librarian on the admin desk (up to 3), rather than
  // computed from ratings — order reflects the order they were picked in.
  const picks = useMemo(() => {
    return [...books]
      .filter((e) => e.book.featured_at)
      .sort(
        (a, b) =>
          new Date(a.book.featured_at as string).getTime() -
          new Date(b.book.featured_at as string).getTime()
      );
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

  // Only show a hero when a librarian has actually featured something —
  // no fallback to an arbitrary book, so "no recommendation" reads as
  // no recommendation rather than a fake pick.
  const heroEntry = picks[0] || null;
  const heroBackdrop =
    HERO_BACKDROPS[
      heroEntry
        ? heroEntry.book.id.charCodeAt(0) % HERO_BACKDROPS.length
        : 0
    ];
  const heroRating = heroEntry ? communityRating(heroEntry.reviews) : null;

  return (
    <>
      {heroEntry && !query && (
        <section className="relative mb-10 h-[440px] w-full overflow-hidden sm:h-[500px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroBackdrop}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-shelf-dark via-shelf-dark/60 to-black/20" />
          <div className="relative mx-auto flex h-full max-w-5xl items-end gap-6 px-4 pb-10 sm:px-4">
            <button
              onClick={() => setSelectedId(heroEntry.book.id)}
              className="group flex-shrink-0 transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-105"
            >
              <BookThumb book={heroEntry.book} large />
            </button>
            <div className="min-w-0 pb-2 text-parchment">
              <p className="mb-2 font-stamp text-[12px] tracking-[0.2em] text-brass">
                LIBRARIAN&apos;S PICK
              </p>
              <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
                {heroEntry.book.title}
              </h2>
              <p className="mt-1 text-parchment/70">{heroEntry.book.author}</p>
              {heroRating !== null && (
                <div className="mt-2">
                  <StarRating value={heroRating} size="text-sm" />
                </div>
              )}
              {heroEntry.book.description && (
                <p className="mt-3 hidden max-w-md text-sm leading-relaxed text-parchment/80 sm:block">
                  {heroEntry.book.description.length > 160
                    ? `${heroEntry.book.description.slice(0, 160)}...`
                    : heroEntry.book.description}
                </p>
              )}
              <div className="mt-4">
                <button
                  onClick={() => setSelectedId(heroEntry.book.id)}
                  className="rounded-sm bg-ink px-4 py-2 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark"
                >
                  VIEW DETAILS
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8">
      <LibrarianBanner librarians={librarians} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-brown">Browse the stacks</h1>
          <p className="font-stamp text-[13px] tracking-wide text-brown/50">
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
            Librarian&apos;s picks
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
    </>
  );
}
