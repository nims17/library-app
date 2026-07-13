"use client";

import { useState } from "react";
import { submitNewBookRequest } from "@/app/actions";

type LookupResult = {
  title: string | null;
  author: string | null;
  cover_url: string | null;
  info_link: string | null;
};

export default function RequestBookForm() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState<LookupResult | null>(null);
  const [results, setResults] = useState<LookupResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function search() {
    if (!title.trim()) return;
    setSearching(true);
    setError(null);
    setResults(null);
    try {
      const params = new URLSearchParams({ title: title.trim() });
      if (author.trim()) params.set("author", author.trim());
      const res = await fetch(`/api/lookup-book?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Search failed");
        return;
      }
      setResults(json.results || []);
    } catch {
      setError("Search failed — check your connection.");
    } finally {
      setSearching(false);
    }
  }

  function confirm(r: LookupResult) {
    setConfirmed(r);
    if (r.author) setAuthor(r.author);
    if (r.title) setTitle(r.title);
    setResults(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitNewBookRequest(
        title.trim(),
        author.trim(),
        note.trim(),
        confirmed?.info_link || undefined
      );
      setTitle("");
      setAuthor("");
      setNote("");
      setConfirmed(null);
      setResults(null);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 space-y-3 rounded-sm border border-brass/40 bg-card p-4"
    >
      <div>
        <label className="mb-1 block font-stamp text-[10px] uppercase tracking-widest text-brown/60">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setConfirmed(null);
            setDone(false);
          }}
          required
          className="w-full border-0 border-b border-brown/30 bg-transparent px-0 py-1.5 text-brown focus:border-ink focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block font-stamp text-[10px] uppercase tracking-widest text-brown/60">
          Author (if known)
        </label>
        <input
          value={author}
          onChange={(e) => {
            setAuthor(e.target.value);
            setConfirmed(null);
            setDone(false);
          }}
          className="w-full border-0 border-b border-brown/30 bg-transparent px-0 py-1.5 text-brown focus:border-ink focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={search}
          disabled={searching || !title.trim()}
          className="rounded-sm border border-ink px-3 py-1.5 font-stamp text-[10px] tracking-widest text-ink hover:bg-parchment disabled:opacity-50"
        >
          {searching ? "SEARCHING..." : "CONFIRM IT'S A REAL BOOK"}
        </button>
        {confirmed && (
          <span className="text-xs text-green-800">
            ✓ Confirmed on Google Books
          </span>
        )}
      </div>

      {results && (
        <div className="space-y-1 rounded-sm border border-brass/30 bg-parchment/60 p-2">
          {results.length === 0 && (
            <p className="p-1 text-xs text-brown/60">
              No matches found — you can still submit, the librarians will
              take a look.
            </p>
          )}
          {results.map((r, i) => (
            <button
              type="button"
              key={i}
              onClick={() => confirm(r)}
              className="flex w-full items-center gap-2 rounded-sm p-1.5 text-left text-sm hover:bg-card"
            >
              {r.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.cover_url}
                  alt=""
                  className="h-10 w-7 flex-shrink-0 object-cover"
                />
              )}
              <span>
                <span className="font-medium text-brown">{r.title}</span>
                <span className="text-brown/60"> — {r.author}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <div>
        <label className="mb-1 block font-stamp text-[10px] uppercase tracking-widest text-brown/60">
          Why you want it (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full rounded border border-brown/30 bg-transparent px-2 py-1.5 text-sm text-brown focus:border-ink focus:outline-none"
        />
      </div>

      {error && <p className="text-xs text-ink">{error}</p>}
      {done && (
        <p className="text-xs text-green-800">
          Request sent — Vivek and Lasya have been emailed.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-sm bg-ink px-4 py-2 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
      >
        {submitting ? "SENDING..." : "SUBMIT REQUEST"}
      </button>
    </form>
  );
}
