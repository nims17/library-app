"use client";

import { useState, useTransition } from "react";
import { logTip } from "@/app/actions";
import { SUGGESTED_TIP_AMOUNT } from "@/lib/config";

export default function TipForm() {
  const [amount, setAmount] = useState(String(SUGGESTED_TIP_AMOUNT));
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [logged, setLogged] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLogged(false);
    const amt = Number(amount);
    startTransition(async () => {
      try {
        await logTip(amt, note.trim());
        setNote("");
        setLogged(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Couldn't log that tip."
        );
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-5 border-t border-brass/30 pt-4"
    >
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-[12px] uppercase tracking-widest text-brown/50">
            I sent
          </label>
          <input
            type="number"
            step="0.01"
            min="1"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setLogged(false);
            }}
            required
            className="w-24 rounded border border-brown/30 bg-transparent px-2 py-1 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[12px] uppercase tracking-widest text-brown/50">
            Note (optional)
          </label>
          <input
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setLogged(false);
            }}
            placeholder="for the new mysteries!"
            className="w-full rounded border border-brown/30 bg-transparent px-2 py-1 text-sm"
          />
        </div>
        <button
          disabled={isPending}
          className="rounded-sm border border-ink px-3 py-1.5 text-xs text-ink hover:bg-parchment disabled:opacity-50"
        >
          {isPending ? "Logging..." : "Log my tip"}
        </button>
      </div>
      {logged && (
        <p className="mt-2 text-xs font-medium text-green-800">
          ✓ Thanks — logged your tip.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-ink">{error}</p>}
    </form>
  );
}
