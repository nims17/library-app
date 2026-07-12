"use client";

import { useState } from "react";

export default function NameSignatureForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const signature = `${firstName} ${lastName}`.trim();

  return (
    <form action={action} encType="multipart/form-data" className="space-y-4">
      <div>
        <label className="mb-1 block font-stamp text-[10px] uppercase tracking-widest text-brown/60">
          Photo (optional)
        </label>
        <input
          type="file"
          name="avatar"
          accept="image/*"
          className="w-full text-sm text-brown/70 file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-ink file:px-3 file:py-1.5 file:font-stamp file:text-[10px] file:tracking-widest file:text-parchment hover:file:bg-ink-dark"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block font-stamp text-[10px] uppercase tracking-widest text-brown/60">
            First name
          </label>
          <input
            name="first_name"
            required
            autoFocus
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full border-0 border-b border-brown/30 bg-transparent px-0 py-1.5 text-brown focus:border-ink focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block font-stamp text-[10px] uppercase tracking-widest text-brown/60">
            Last name
          </label>
          <input
            name="last_name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full border-0 border-b border-brown/30 bg-transparent px-0 py-1.5 text-brown focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-sm border border-dashed border-brass/50 bg-parchment/60 px-3 py-2">
        <p className="font-stamp text-[9px] uppercase tracking-widest text-brown/50">
          Signature
        </p>
        <p className="min-h-[2.25rem] font-hand text-3xl leading-tight text-ink">
          {signature || (
            <span className="text-base text-brown/30">
              your name will appear here
            </span>
          )}
        </p>
      </div>

      <button
        type="submit"
        className="w-full rounded-sm bg-ink py-2 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark"
      >
        GET MY LIBRARY CARD
      </button>
    </form>
  );
}
