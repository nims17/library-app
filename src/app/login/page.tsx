"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
    <main className="flex min-h-screen items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-sm rounded-lg border-2 border-amber-900/20 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-center font-serif text-2xl text-amber-900">
          The Library
        </h1>
        <p className="mb-6 text-center text-sm text-amber-700">
          Sign in with your library card credentials
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-amber-900">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-amber-900">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-700 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-amber-900 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {loading ? "Checking library card..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-amber-700">
          Don&apos;t have a card?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
