import Link from "next/link";
import { getCurrentProfile } from "@/lib/current-user";
import { signOut } from "@/app/actions";

export default async function Nav() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  // Mid-onboarding (no name set yet) — just show sign out, no other links.
  if (!profile.display_name) {
    return (
      <header className="border-b-2 border-amber-900/20 bg-amber-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-serif text-lg text-amber-900">The Library</span>
          <form action={signOut}>
            <button className="rounded border border-amber-900/30 px-2 py-1 text-sm hover:bg-amber-100">
              Sign out
            </button>
          </form>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b-2 border-amber-900/20 bg-amber-50">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-serif text-lg text-amber-900">
          The Library
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm text-amber-800">
          <Link href="/" className="hover:underline">
            Browse
          </Link>
          <Link href="/leaderboard" className="hover:underline">
            Leaderboard
          </Link>
          <Link href="/requests" className="hover:underline">
            Request a book
          </Link>
          <Link href="/card" className="hover:underline">
            My library card
          </Link>
          {profile.role === "admin" && (
            <Link href="/admin" className="font-medium hover:underline">
              Admin desk
            </Link>
          )}
          <span className="text-amber-600">{profile.display_name}</span>
          <form action={signOut}>
            <button className="rounded border border-amber-900/30 px-2 py-1 hover:bg-amber-100">
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
