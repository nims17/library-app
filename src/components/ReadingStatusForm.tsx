"use client";

import { useState, useTransition } from "react";
import { updateReadingStatus } from "@/app/actions";

type BookOption = { id: string; title: string };

export default function ReadingStatusForm({
  currentBookId,
  books,
}: {
  currentBookId: string | null;
  books: BookOption[];
}) {
  const [value, setValue] = useState(currentBookId || "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateReadingStatus(value || null, null);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save that.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-2 border-t border-brass/20 pt-3"
    >
      <label className="mb-1 block text-[10px] uppercase tracking-widest text-brown/50">
        Currently reading
      </label>
      <select
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        className="w-full rounded border border-brown/30 bg-transparent px-2 py-1 text-sm"
      >
        <option value="">— none —</option>
        {books.map((b) => (
          <option key={b.id} value={b.id}>
            {b.title}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-3">
        <button
          disabled={isPending}
          className="rounded-sm bg-ink px-3 py-1 font-stamp text-[10px] tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
        >
          {isPending ? "SAVING..." : "SAVE"}
        </button>
        {saved && (
          <span className="text-xs font-medium text-green-800">✓ Saved</span>
        )}
        {error && <span className="text-xs text-ink">{error}</span>}
      </div>
    </form>
  );
}
