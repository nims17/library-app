"use client";

import { useRef, useTransition } from "react";
import { uploadMyAvatar } from "@/app/actions";

// Shown on the library card in place of the initial-letter circle when the
// member hasn't uploaded a photo yet — clicking it opens the file picker
// directly, instead of sending them off to Settings.
export default function AvatarPrompt({
  displayName,
}: {
  displayName: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    startTransition(() => uploadMyAvatar(file));
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={isPending}
      className="flex h-20 w-20 flex-col items-center justify-center gap-0.5 rounded-full border-2 border-dashed border-brass/60 bg-parchment/60 text-brown/60 transition hover:border-ink hover:text-ink disabled:opacity-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1.5M7 9l5-5 5 5M12 4v13"
        />
      </svg>
      <span className="font-stamp text-[8px] tracking-widest">
        {isPending ? "..." : "ADD PHOTO"}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        aria-label={`Add a photo for ${displayName || "your"} library card`}
      />
    </button>
  );
}
