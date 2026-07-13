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
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>, successMessage: string) {
    setBusy(true);
    setMessage(null);
    setIsError(false);
    try {
      await fn();
      setMessage(`✓ ${successMessage}`);
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const gearButton = (
    <button
      onClick={() => setOpen((v) => !v)}
      title="Settings"
      aria-label="Settings"
      className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-ink text-parchment shadow-md transition-transform hover:scale-105 hover:bg-ink-dark"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
      >
        <path d="M19.14 12.94a7.14 7.14 0 0 0 .06-.94 7.14 7.14 0 0 0-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.14.56-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.65 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.14 7.14 0 0 0-.06.94c0 .32.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.49.38 1.04.7 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.59-.24 1.14-.56 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
      </svg>
    </button>
  );

  if (!open) {
    return gearButton;
  }

  return (
    <>
      {gearButton}
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

      {message && (
        <p
          className={`text-xs font-medium ${isError ? "text-ink" : "text-green-800"}`}
        >
          {message}
        </p>
      )}

      <div>
        <label className="mb-1 block text-xs text-brown/70">Name</label>
        <div className="flex gap-2">
          <input
            value={nameValue}
            onChange={(e) => {
              setNameValue(e.target.value);
              setMessage(null);
            }}
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
            onChange={(e) => {
              setEmailValue(e.target.value);
              setMessage(null);
            }}
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
            onChange={(e) => {
              setPassword(e.target.value);
              setMessage(null);
            }}
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
          className="text-sm text-brown/70 file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-ink file:px-3 file:py-1.5 file:font-stamp file:text-[10px] file:tracking-widest file:text-parchment hover:file:bg-ink-dark"
        />
      </div>
      </div>
    </>
  );
}
