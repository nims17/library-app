"use client";

import { useState, useTransition } from "react";
import { addLibrarianPost } from "@/app/actions";

export default function AddPostForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    setPosted(false);
    startTransition(async () => {
      try {
        await addLibrarianPost(title.trim(), body.trim());
        setTitle("");
        setBody("");
        setPosted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't post that.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 space-y-2 rounded-sm border border-brass/40 bg-card p-4"
    >
      <p className="font-stamp text-[10px] uppercase tracking-widest text-brown/50">
        Post a note
      </p>
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setPosted(false);
        }}
        placeholder="Title (optional)"
        className="w-full border-0 border-b border-brown/30 bg-transparent px-0 py-1 text-brown focus:border-ink focus:outline-none"
      />
      <textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setPosted(false);
        }}
        required
        rows={3}
        placeholder="What are you reading? What did you think of your last book?"
        className="w-full rounded border border-brown/30 bg-transparent px-2 py-1.5 text-sm text-brown focus:border-ink focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          disabled={isPending}
          className="rounded-sm bg-ink px-4 py-1.5 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
        >
          {isPending ? "POSTING..." : "POST"}
        </button>
        {posted && (
          <span className="text-xs font-medium text-green-800">
            ✓ Posted.
          </span>
        )}
        {error && <span className="text-xs text-ink">{error}</span>}
      </div>
    </form>
  );
}
