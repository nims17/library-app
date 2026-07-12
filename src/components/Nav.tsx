import Link from "next/link";
import { getCurrentProfile } from "@/lib/current-user";
import { signOut } from "@/app/actions";

export default async function Nav() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  // Mid-onboarding (no name set yet) — just show sign out, no other links.
  if (!profile.display_name) {
    return (
      <header className="border-b-2 border-brass/40 bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-serif text-lg text-brown">
            Tabor Street Books
          </span>
          <form action={signOut}>
            <button className="rounded border border-brass/50 px-2 py-1 text-sm text-brown hover:bg-parchment">
              Sign out
            </button>
          </form>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b-2 border-brass/40 bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-serif text-lg text-brown">
          Tabor Street Books
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm text-brown/80">
          <Link href="/" className="hover:text-ink hover:underline">
            Browse
          </Link>
          <Link href="/leaderboard" className="hover:text-ink hover:underline">
            Leaderboard
          </Link>
          <Link href="/requests" className="hover:text-ink hover:underline">
            Request a book
          </Link>
          <Link href="/card" className="hover:text-ink hover:underline">
            My library card
          </Link>
          <Link href="/librarians-corner" className="hover:text-ink hover:underline">
            Librarian&apos;s Corner
          </Link>
          {profile.role === "admin" && (
            <Link
              href="/admin"
              className="font-medium text-ink hover:underline"
            >
              Admin desk
            </Link>
          )}
          <span className="font-hand text-lg text-brass">
            {profile.display_name}
          </span>
          <form action={signOut}>
            <button className="rounded border border-brass/50 px-2 py-1 text-brown hover:bg-parchment">
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
