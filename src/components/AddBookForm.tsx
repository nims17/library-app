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
  const [identifying, setIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function lookUpOnGoogleBooks(titleOverride?: string, authorOverride?: string) {
    const searchTitle = (titleOverride ?? title).trim();
    const searchAuthor = (authorOverride ?? author).trim();
    if (!searchTitle) {
      setLookupError("Type a title first.");
      return;
    }
    setLookingUp(true);
    setLookupError(null);
    setLookupResults(null);
    try {
      const params = new URLSearchParams({ title: searchTitle });
      if (searchAuthor) params.set("author", searchAuthor);
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
    // The verified Google Books record is authoritative: title, author,
    // cover art, description, genre, and page count are all overwritten
    // with what Google Books returns — even if something was already
    // typed, or a cover photo was already uploaded. The admin can still
    // hand-edit any field afterward if it needs a tweak.
    if (r.title) setTitle(r.title);
    if (r.author) setAuthor(r.author);
    if (r.description) setDescription(r.description);
    if (r.genre) setGenre(r.genre);
    if (r.cover_url) setCoverUrl(r.cover_url);
    if (r.page_count) setPageCount(String(r.page_count));
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

    // Best-effort: try to read the title/author straight off the cover
    // photo so the admin doesn't have to type it in. If this fails for any
    // reason, it just leaves the fields as they were — nothing breaks.
    setIdentifying(true);
    setIdentifyError(null);
    try {
      const body = new FormData();
      body.append("photo", file);
      const res = await fetch("/api/identify-book", {
        method: "POST",
        body,
      });
      const json = await res.json();
      if (!res.ok) {
        setIdentifyError(json.error || "Couldn't identify that book.");
      } else if (json.title) {
        setTitle(json.title);
        if (json.author) setAuthor(json.author);
        setAdded(null);
        setDuplicateNotice(null);
        setSubmitError(null);
        await lookUpOnGoogleBooks(json.title, json.author || "");
      } else {
        setIdentifyError(
          json.error ||
            "Couldn't make out the title from that photo — type it in manually."
        );
      }
    } catch {
      setIdentifyError(
        "Couldn't identify the book from that photo — check your connection."
      );
    } finally {
      setIdentifying(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    setSaving(true);
    setAdded(null);
    setDuplicateNotice(null);
    setSubmitError(null);
    try {
      const addedTitle = title.trim();
      await addBook({
        title: addedTitle,
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
      setAdded(addedTitle);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn't add that book.";
      if (message.toLowerCase().includes("already in the catalog")) {
        setDuplicateNotice(message);
      } else {
        setSubmitError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-sm border border-brass/30 bg-card p-4"
    >
      {added && (
        <p className="rounded-sm bg-green-50 px-2 py-1.5 text-xs font-medium text-green-800">
          ✓ &quot;{added}&quot; added to the catalog.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setAdded(null);
            setDuplicateNotice(null);
            setSubmitError(null);
          }}
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
          onClick={() => lookUpOnGoogleBooks()}
          disabled={lookingUp}
          className="rounded-sm border border-ink px-3 py-1.5 font-stamp text-[10px] tracking-widest text-ink hover:bg-parchment disabled:opacity-50"
        >
          {lookingUp ? "LOOKING UP..." : "LOOK UP ON GOOGLE BOOKS"}
        </button>
        <span className="text-xs text-brown/50">
          Applying a match replaces the title, author, cover image,
          description, genre, and page count with Google&apos;s verified
          info — even if you&apos;d already typed or uploaded something.
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
          Take or upload a photo of the cover — we&apos;ll try to identify the
          book automatically (if it can&apos;t, just type the title in by
          hand). If you look it up on Google Books afterward, that cover
          image is used instead.
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleCoverPhoto}
          disabled={uploadingCover || identifying}
          className="text-sm text-brown/70 file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-ink file:px-3 file:py-1.5 file:font-stamp file:text-[10px] file:tracking-widest file:text-parchment hover:file:bg-ink-dark"
        />
        {uploadingCover && (
          <p className="mt-1 text-xs text-brown/50">Uploading...</p>
        )}
        {identifying && (
          <p className="mt-1 text-xs text-brown/50">
            Identifying the book from the photo...
          </p>
        )}
        {identifyError && (
          <p className="mt-1 text-xs text-ink">{identifyError}</p>
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

      {duplicateNotice && (
        <p className="rounded-sm border border-brass/40 bg-parchment/70 px-2 py-1.5 text-xs text-brown">
          📚 {duplicateNotice}
        </p>
      )}
      {submitError && (
        <p className="text-xs text-ink">{submitError}</p>
      )}

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
