"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LibraryCardFrame from "@/components/LibraryCardFrame";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/library-nook-window.jpg"
          alt=""
          className="h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-parchment/70" />
      </div>
      <LibraryCardFrame eyebrow="RETURNING BORROWER">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block font-stamp text-[10px] uppercase tracking-widest text-brown/60">
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
            <label className="mb-1 block font-stamp text-[10px] uppercase tracking-widest text-brown/60">
              Password
            </label>
            <input
              type="password"
              required
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
            {loading ? "CHECKING CARD..." : "SIGN IN"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-brown/70">
          Don&apos;t have a card?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
      </LibraryCardFrame>
    </main>
  );
}
