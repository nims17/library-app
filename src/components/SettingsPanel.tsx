"use client";

import { useState } from "react";
import {
  updateMyName,
  updateMyEmail,
  updateMyPassword,
  uploadMyAvatar,
} from "@/app/actions";

export default function SettingsPanel({
  displayName,
  currentEmail,
}: {
  displayName: string | null;
  currentEmail: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [nameValue, setNameValue] = useState(displayName || "");
  const [emailValue, setEmailValue] = useState(currentEmail || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>, successMessage: string) {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
      setMessage(successMessage);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-8 rounded-sm border border-brass/40 px-3 py-1.5 font-stamp text-[10px] tracking-widest text-brown/70 hover:bg-card"
      >
        SETTINGS
      </button>
    );
  }

  return (
    <div className="mb-8 space-y-4 rounded-sm border border-brass/40 bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="font-stamp text-[10px] uppercase tracking-widest text-brown/50">
          Settings
        </p>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-brown/50 underline"
        >
          close
        </button>
      </div>

      {message && <p className="text-xs text-ink">{message}</p>}

      <div>
        <label className="mb-1 block text-xs text-brown/70">Name</label>
        <div className="flex gap-2">
          <input
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            className="flex-1 rounded border border-brown/30 bg-transparent px-2 py-1.5 text-sm text-brown"
          />
          <button
            disabled={busy}
            onClick={() =>
              run(async () => {
                const [first, ...rest] = nameValue.trim().split(" ");
                await updateMyName(first || "", rest.join(" "));
              }, "Name updated.")
            }
            className="rounded-sm bg-ink px-3 py-1.5 font-stamp text-[10px] tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
          >
            SAVE
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-brown/70">Email</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            className="flex-1 rounded border border-brown/30 bg-transparent px-2 py-1.5 text-sm text-brown"
          />
          <button
            disabled={busy}
            onClick={() =>
              run(
                () => updateMyEmail(emailValue.trim()),
                "Check your inbox to confirm the new email."
              )
            }
            className="rounded-sm bg-ink px-3 py-1.5 font-stamp text-[10px] tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
          >
            SAVE
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-brown/70">
          New password
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="flex-1 rounded border border-brown/30 bg-transparent px-2 py-1.5 text-sm text-brown"
          />
          <button
            disabled={busy}
            onClick={() =>
              run(async () => {
                await updateMyPassword(password);
                setPassword("");
              }, "Password updated.")
            }
            className="rounded-sm bg-ink px-3 py-1.5 font-stamp text-[10px] tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
          >
            SAVE
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-brown/70">
          Profile photo
        </label>
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            run(() => uploadMyAvatar(file), "Photo updated.");
          }}
          className="text-sm text-brown"
        />
      </div>
    </div>
  );
}
