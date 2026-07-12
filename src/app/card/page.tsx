import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import LibraryCardFrame from "@/components/LibraryCardFrame";
import SettingsPanel from "@/components/SettingsPanel";
import AvatarPrompt from "@/components/AvatarPrompt";
import LoanReviewForm from "@/components/LoanReviewForm";
import StarRating from "@/components/StarRating";
import { daysSince } from "@/lib/time";

export default async function LibraryCardPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();

  const [{ data: loans }, { data: myReviews }, { data: allReviews }, { data: allLoans }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("loans")
        .select("*, book:books(id, title, author)")
        .eq("user_id", profile.id)
        .order("checked_out_at", { ascending: false }),
      supabase.from("reviews").select("*").eq("user_id", profile.id),
      supabase.from("reviews").select("user_id, book_id"),
      supabase.from("loans").select("user_id, book_id"),
      supabase.from("profiles").select("id, display_name"),
    ]);

  const current = (loans || []).filter((l) => !l.returned_at);
  const history = (loans || []).filter((l) => l.returned_at);
  const recalled = current.filter((l) => l.recall_requested_at);
  const reviewByBook = new Map((myReviews || []).map((r) => [r.book_id, r]));

  // ---------- Leaderboard rank ----------
  const loanSet = new Set(
    (allLoans || []).map((l) => `${l.user_id}:${l.book_id}`)
  );
  const nameById = new Map((profiles || []).map((p) => [p.id, p.display_name]));
  const countByUser = new Map<string, number>();
  for (const r of allReviews || []) {
    if (!loanSet.has(`${r.user_id}:${r.book_id}`)) continue;
    countByUser.set(r.user_id, (countByUser.get(r.user_id) || 0) + 1);
  }
  const ranked = [...countByUser.entries()]
    .map(([userId, count]) => ({ userId, name: nameById.get(userId), count }))
    .sort((a, b) => b.count - a.count);
  const myRank = ranked.findIndex((r) => r.userId === profile.id) + 1;

  return (
    <main className="relative mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex justify-center">
        <LibraryCardFrame eyebrow="MEMBER'S LIBRARY CARD">
          <div className="mb-3 flex justify-center">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="h-20 w-20 rounded-full border-2 border-brass/50 object-cover"
              />
            ) : (
              <AvatarPrompt displayName={profile.display_name} />
            )}
          </div>
          <p className="text-center font-hand text-3xl text-ink">
            {profile.display_name}
          </p>
          <p className="mt-2 text-center font-stamp text-[11px] tracking-wide text-brown/60">
            MEMBER SINCE{" "}
            {new Date(profile.member_since)
              .toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
              .toUpperCase()}
          </p>
          <p className="mt-1 text-center font-stamp text-[10px] tracking-widest text-brown/40">
            CARD NO. {profile.id.slice(0, 8).toUpperCase()}
          </p>
          {myRank > 0 && (
            <p className="mt-2 text-center font-stamp text-[10px] tracking-widest text-brown/50">
              #{myRank} ON THE READERS LEADERBOARD
            </p>
          )}
        </LibraryCardFrame>
      </div>

      <SettingsPanel
        displayName={profile.display_name}
        currentEmail={profile.email}
      />

      {recalled.length > 0 && (
        <div className="mb-8 rounded-sm border-2 border-ink/60 bg-parchment/70 p-4">
          <p className="font-stamp text-[10px] uppercase tracking-widest text-ink">
            The librarians could use these back
          </p>
          <div className="mt-2 space-y-1">
            {recalled.map((l) => (
              <p key={l.id} className="text-sm text-brown">
                {l.book?.title}
              </p>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-3 font-serif text-lg text-brown">
        Currently checked out
      </h2>
      <div className="mb-8 space-y-2">
        {current.map((l) => (
          <div
            key={l.id}
            className="rounded-sm border border-brass/30 bg-card p-3"
          >
            <Link href={`/books/${l.book?.id}`} className="hover:underline">
              <p className="text-sm font-medium text-brown">{l.book?.title}</p>
            </Link>
            <p className="text-xs text-brown/50">
              Checked out for {daysSince(l.checked_out_at)} day
              {daysSince(l.checked_out_at) !== 1 ? "s" : ""}
              {l.recall_requested_at ? " · the librarians asked for it back" : ""}
            </p>
          </div>
        ))}
        {current.length === 0 && (
          <p className="text-sm text-brown/50">Nothing checked out right now.</p>
        )}
      </div>

      <h2 className="mb-3 font-serif text-lg text-brown">
        Borrowing history
      </h2>
      <div className="space-y-2">
        {history.map((l) => {
          const myReview = l.book ? reviewByBook.get(l.book.id) : undefined;
          return (
            <div
              key={l.id}
              className="rounded-sm border border-brass/30 bg-card p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Link href={`/books/${l.book?.id}`} className="hover:underline">
                  <p className="text-sm font-medium text-brown">
                    {l.book?.title}
                  </p>
                </Link>
                {myReview?.rating && (
                  <StarRating value={myReview.rating} size="text-xs" />
                )}
              </div>
              <p className="text-xs text-brown/50">
                {new Date(l.checked_out_at).toLocaleDateString()} →{" "}
                {new Date(l.returned_at!).toLocaleDateString()}
              </p>
              {l.book && (
                <LoanReviewForm
                  bookId={l.book.id}
                  existingRating={myReview?.rating ?? null}
                  existingThoughts={myReview?.thoughts ?? null}
                />
              )}
            </div>
          );
        })}
        {history.length === 0 && (
          <p className="text-sm text-brown/50">No history yet.</p>
        )}
      </div>
    </main>
  );
}
