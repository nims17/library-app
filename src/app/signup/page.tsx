"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LibraryCardFrame from "@/components/LibraryCardFrame";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const signature = `${firstName} ${lastName}`.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const displayName = signature;
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Email confirmation is off — they're logged in immediately.
      router.push("/");
      router.refresh();
    } else {
      // Email confirmation is on — they need to click a link first.
      setCheckEmail(true);
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/library-nook-cozy.jpg"
          alt=""
          className="h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-parchment/70" />
      </div>
        <LibraryCardFrame eyebrow="ALMOST THERE">
          <p className="text-center text-sm text-brown/80">
            We sent a confirmation link to <strong>{email}</strong>. Click it,
            then come back and sign in.
          </p>
          <Link
            href="/login"
            className="mt-6 block text-center text-sm text-ink underline"
          >
            Go to sign in
          </Link>
        </LibraryCardFrame>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/library-nook-cozy.jpg"
          alt=""
          className="h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-parchment/70" />
      </div>
      <LibraryCardFrame eyebrow="NEW BORROWER">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block font-stamp text-[12px] uppercase tracking-widest text-brown/60">
                First name
              </label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border-0 border-b border-brown/30 bg-transparent px-0 py-1.5 text-brown focus:border-ink focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block font-stamp text-[12px] uppercase tracking-widest text-brown/60">
                Last name
              </label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border-0 border-b border-brown/30 bg-transparent px-0 py-1.5 text-brown focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          {/* Live "signing the card" preview */}
          <div className="rounded-sm border border-dashed border-brass/50 bg-parchment/60 px-3 py-2">
            <p className="font-stamp text-[11px] uppercase tracking-widest text-brown/50">
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

          <div>
            <label className="mb-1 block font-stamp text-[12px] uppercase tracking-widest text-brown/60">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-0 border-b border-brown/30 bg-transparent px-0 py-1.5 text-brown focus:border-ink focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block font-stamp text-[12px] uppercase tracking-widest text-brown/60">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-0 border-b border-brown/30 bg-transparent px-0 py-1.5 text-brown focus:border-ink focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-ink">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-ink py-2 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
          >
            {loading ? "MAKING YOUR CARD..." : "CREATE ACCOUNT"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-brown/70">
          Already have a card?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
      </LibraryCardFrame>
    </main>
  );
}
