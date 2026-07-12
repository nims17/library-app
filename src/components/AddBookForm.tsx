"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addBook } from "@/app/actions";

type LookupResult = {
  title: string | null;
  author: string | null;
  description: string | null;
  genre: string | null;
  cover_url: string | null;
  page_count: number | null;
};

export default function AddBookForm() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [deweyDecimal, setDeweyDecimal] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [pageCount, setPageCount] = useState("");

  const [lookingUp, setLookingUp] = useState(false);
  const [lookupResults, setLookupResults] = useState<LookupResult[] | null>(
    null
  );
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  async function lookUpOnGoogleBooks() {
    if (!title.trim()) {
      setLookupError("Type a title first.");
      return;
    }
    setLookingUp(true);
    setLookupError(null);
    setLookupResults(null);
    try {
      const params = new URLSearchParams({ title: title.trim() });
      if (author.trim()) params.set("author", author.trim());
      const res = await fetch(`/api/lookup-book?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setLookupError(json.error || "Lookup failed");
        return;
      }
      if (!json.results || json.results.length === 0) {
        setLookupError("No matches found on Google Books.");
        return;
      }
      setLookupResults(json.results);
    } catch {
      setLookupError("Lookup failed — check your connection.");
    } finally {
      setLookingUp(false);
    }
  }

  function applyLookupResult(r: LookupResult) {
    // Only fills fields the admin hasn't already typed something into.
    if (!author.trim() && r.author) setAuthor(r.author);
    if (!description.trim() && r.description) setDescription(r.description);
    if (!genre.trim() && r.genre) setGenre(r.genre);
    if (!coverUrl.trim() && r.cover_url) setCoverUrl(r.cover_url);
    if (!pageCount.trim() && r.page_count) setPageCount(String(r.page_count));
    setLookupResults(null);
  }

  async function handleCoverPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const supabase = createClient();
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage
        .from("book-covers")
        .upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
      setCoverUrl(data.publicUrl);
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : "Photo upload failed"
      );
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    setSaving(true);
    try {
      await addBook({
        title: title.trim(),
        author: author.trim(),
        description: description.trim(),
        cover_url: coverUrl.trim(),
        genre: genre.trim(),
        dewey_decimal: deweyDecimal.trim(),
        page_count: pageCount.trim() ? Number(pageCount.trim()) : null,
      });
      setTitle("");
      setAuthor("");
      setDescription("");
      setGenre("");
      setDeweyDecimal("");
      setCoverUrl("");
      setPageCount("");
      setLookupResults(null);
      setLookupError(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-sm border border-brass/30 bg-card p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
          className="rounded border border-brown/30 bg-transparent px-3 py-2 text-sm text-brown"
        />
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author"
          required
          className="rounded border border-brown/30 bg-transparent px-3 py-2 text-sm text-brown"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={lookUpOnGoogleBooks}
          disabled={lookingUp}
          className="rounded-sm border border-ink px-3 py-1.5 font-stamp text-[10px] tracking-widest text-ink hover:bg-parchment disabled:opacity-50"
        >
          {lookingUp ? "LOOKING UP..." : "LOOK UP ON GOOGLE BOOKS"}
        </button>
        <span className="text-xs text-brown/50">
          Fills in anything you haven&apos;t typed yet.
        </span>
      </div>

      {lookupError && (
        <p className="text-xs text-ink">{lookupError}</p>
      )}

      {lookupResults && (
        <div className="space-y-1 rounded-sm border border-brass/30 bg-parchment/60 p-2">
          {lookupResults.map((r, i) => (
            <button
              type="button"
              key={i}
              onClick={() => applyLookupResult(r)}
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          placeholder="Genre"
          className="rounded border border-brown/30 bg-transparent px-3 py-2 text-sm text-brown"
        />
        <input
          value={deweyDecimal}
          onChange={(e) => setDeweyDecimal(e.target.value)}
          placeholder="Dewey Decimal (e.g. 813.54)"
          className="rounded border border-brown/30 bg-transparent px-3 py-2 text-sm text-brown"
        />
        <input
          value={pageCount}
          onChange={(e) => setPageCount(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="Page count"
          inputMode="numeric"
          className="rounded border border-brown/30 bg-transparent px-3 py-2 text-sm text-brown"
        />
        <input
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="Cover image URL (optional)"
          className="rounded border border-brown/30 bg-transparent px-3 py-2 text-sm text-brown"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-brown/70">
          Or upload a photo of the cover
        </label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCoverPhoto}
          disabled={uploadingCover}
          className="text-sm text-brown"
        />
        {uploadingCover && (
          <p className="mt-1 text-xs text-brown/50">Uploading...</p>
        )}
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="mt-2 h-24 w-16 rounded-sm object-cover shadow"
          />
        )}
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={2}
        className="w-full rounded border border-brown/30 bg-transparent px-3 py-2 text-sm text-brown"
      />

      <button
        type="submit"
        disabled={saving}
        className="rounded-sm bg-ink px-4 py-2 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
      >
        {saving ? "ADDING..." : "ADD TO CATALOG"}
      </button>
    </form>
  );
}
