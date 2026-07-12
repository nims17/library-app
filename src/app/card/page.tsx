import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import LibraryCardFrame from "@/components/LibraryCardFrame";

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
      <div className="mb-10 flex justify-center">
        <LibraryCardFrame eyebrow="MEMBER'S LIBRARY CARD">
          <p className="font-hand text-3xl text-ink">{profile.display_name}</p>
          <p className="mt-2 font-stamp text-[11px] tracking-wide text-brown/60">
            MEMBER SINCE{" "}
            {new Date(profile.member_since)
              .toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
              .toUpperCase()}
          </p>
          <p className="mt-1 font-stamp text-[10px] tracking-widest text-brown/40">
            CARD NO. {profile.id.slice(0, 8).toUpperCase()}
          </p>
        </LibraryCardFrame>
      </div>

      <h2 className="mb-3 font-serif text-lg text-brown">
        Currently checked out
      </h2>
      <div className="mb-8 space-y-2">
        {current.map((l) => (
          <Link
            key={l.id}
            href={`/books/${l.book?.id}`}
            className="block rounded-sm border border-brass/30 bg-card p-3 hover:shadow-sm"
          >
            <p className="text-sm font-medium text-brown">{l.book?.title}</p>
            <p className="text-xs text-brown/50">
              Since {new Date(l.checked_out_at).toLocaleDateString()}
            </p>
          </Link>
        ))}
        {current.length === 0 && (
          <p className="text-sm text-brown/50">Nothing checked out right now.</p>
        )}
      </div>

      <h2 className="mb-3 font-serif text-lg text-brown">
        Borrowing history
      </h2>
      <div className="space-y-2">
        {history.map((l) => (
          <Link
            key={l.id}
            href={`/books/${l.book?.id}`}
            className="block rounded-sm border border-brass/30 bg-card p-3 hover:shadow-sm"
          >
            <p className="text-sm font-medium text-brown">{l.book?.title}</p>
            <p className="text-xs text-brown/50">
              {new Date(l.checked_out_at).toLocaleDateString()} →{" "}
              {new Date(l.returned_at!).toLocaleDateString()}
            </p>
          </Link>
        ))}
        {history.length === 0 && (
          <p className="text-sm text-brown/50">No history yet.</p>
        )}
      </div>
    </main>
  );
}
