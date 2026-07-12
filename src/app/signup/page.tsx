"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const displayName = `${firstName} ${lastName}`.trim();
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
      <main className="flex min-h-screen items-center justify-center bg-amber-50 px-4">
        <div className="w-full max-w-sm rounded-lg border-2 border-amber-900/20 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 font-serif text-2xl text-amber-900">
            Almost there
          </h1>
          <p className="text-sm text-amber-700">
            We sent a confirmation link to <strong>{email}</strong>. Click it,
            then come back and sign in.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm text-amber-800 underline"
          >
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-sm rounded-lg border-2 border-amber-900/20 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-center font-serif text-2xl text-amber-900">
          Get your library card
        </h1>
        <p className="mb-6 text-center text-sm text-amber-700">
          You were invited to join the library — set up your account below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-amber-900">
                First name
              </label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-700 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-amber-900">
                Last name
              </label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-700 focus:outline-none"
              />
            </div>
          </div>
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
            <label className="mb-1 block text-sm text-amber-900">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
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
            {loading ? "Making your card..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-amber-700">
          Already have a card?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
