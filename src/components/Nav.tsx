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
          <Link href="/community" className="hover:text-ink hover:underline">
            Tabor Street Community
          </Link>
          <Link href="/requests" className="hover:text-ink hover:underline">
            Request a book
          </Link>
          {profile.role === "admin" && (
            <Link
              href="/admin"
              className="font-medium text-ink hover:underline"
            >
              Librarian&apos;s Desk
            </Link>
          )}
          <Link
            href="/card"
            className="flex items-center gap-1.5 font-hand text-lg text-brass hover:text-ink"
            title="My library card"
          >
            {profile.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="h-6 w-6 rounded-full border border-brass/50 object-cover"
              />
            )}
            {profile.display_name}
          </Link>
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
