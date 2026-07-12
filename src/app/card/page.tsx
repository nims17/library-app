import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";

export default async function LibraryCardPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();

  const { data: loans } = await supabase
    .from("loans")
    .select("*, book:books(id, title, author)")
    .eq("user_id", profile.id)
    .order("checked_out_at", { ascending: false });

  const current = (loans || []).filter((l) => !l.returned_at);
  const history = (loans || []).filter((l) => l.returned_at);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 rounded-xl border-2 border-dashed border-amber-900/40 bg-white p-6">
        <p className="text-xs uppercase tracking-widest text-amber-600">
          Library Card
        </p>
        <p className="mt-1 font-serif text-2xl text-amber-900">
          {profile.display_name}
        </p>
        <p className="mt-1 text-sm text-amber-700">
          Member since{" "}
          {new Date(profile.member_since).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p className="mt-1 text-xs text-amber-500">
          Card No. {profile.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      <h2 className="mb-3 font-serif text-lg text-amber-900">
        Currently checked out
      </h2>
      <div className="mb-8 space-y-2">
        {current.map((l) => (
          <Link
            key={l.id}
            href={`/books/${l.book?.id}`}
            className="block rounded-lg border border-amber-900/15 bg-white p-3 hover:shadow-sm"
          >
            <p className="text-sm font-medium text-amber-900">
              {l.book?.title}
            </p>
            <p className="text-xs text-amber-600">
              Since {new Date(l.checked_out_at).toLocaleDateString()}
            </p>
          </Link>
        ))}
        {current.length === 0 && (
          <p className="text-sm text-amber-600">Nothing checked out right now.</p>
        )}
      </div>

      <h2 className="mb-3 font-serif text-lg text-amber-900">
        Borrowing history
      </h2>
      <div className="space-y-2">
        {history.map((l) => (
          <Link
            key={l.id}
            href={`/books/${l.book?.id}`}
            className="block rounded-lg border border-amber-900/15 bg-white p-3 hover:shadow-sm"
          >
            <p className="text-sm font-medium text-amber-900">
              {l.book?.title}
            </p>
            <p className="text-xs text-amber-600">
              {new Date(l.checked_out_at).toLocaleDateString()} →{" "}
              {new Date(l.returned_at!).toLocaleDateString()}
            </p>
          </Link>
        ))}
        {history.length === 0 && (
          <p className="text-sm text-amber-600">No history yet.</p>
        )}
      </div>
    </main>
  );
}
