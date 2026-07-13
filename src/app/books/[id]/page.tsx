import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import BookCover from "@/components/BookCover";
import {
  requestCheckout,
  joinWaitlist,
  leaveWaitlist,
  submitReview,
} from "@/app/actions";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .single();

  if (!book) notFound();

  const { data: activeLoan } = await supabase
    .from("loans")
    .select("*, profile:profiles(display_name)")
    .eq("book_id", id)
    .is("returned_at", null)
    .maybeSingle();

  const { data: waitlist } = await supabase
    .from("waitlist")
    .select("*, profile:profiles(display_name)")
    .eq("book_id", id)
    .order("requested_at", { ascending: true });

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, profile:profiles(display_name)")
    .eq("book_id", id)
    .order("created_at", { ascending: false });

  const { data: myPendingRequest } = await supabase
    .from("checkout_requests")
    .select("*")
    .eq("book_id", id)
    .eq("requested_by", profile?.id || "")
    .eq("status", "pending")
    .maybeSingle();

  const myWaitlistEntry = (waitlist || []).find(
    (w) => w.user_id === profile?.id
  );
  const myPosition = myWaitlistEntry
    ? (waitlist || []).findIndex((w) => w.id === myWaitlistEntry.id) + 1
    : null;

  const myReview = (reviews || []).find((r) => r.user_id === profile?.id);

  const avgRating =
    reviews && reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        ).toFixed(1)
      : null;

  async function requestCheckoutAction() {
    "use server";
    await requestCheckout(id);
  }

  async function joinWaitlistAction() {
    "use server";
    await joinWaitlist(id);
  }

  async function leaveWaitlistAction() {
    "use server";
    if (myWaitlistEntry) await leaveWaitlist(myWaitlistEntry.id, id);
  }

  async function submitReviewAction(formData: FormData) {
    "use server";
    const rating = Number(formData.get("rating"));
    const thoughts = String(formData.get("thoughts") || "");
    await submitReview(id, rating, thoughts);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="mx-auto sm:mx-0">
          <BookCover title={book.title} coverUrl={book.cover_url} />
        </div>

        <div className="flex-1">
          <h1 className="font-serif text-2xl text-brown">{book.title}</h1>
          <p className="text-brown/70">{book.author}</p>

          <div className="mt-2 flex flex-wrap gap-2 font-stamp text-[12px] tracking-wide text-brown/70">
            {book.genre && (
              <span className="rounded-full border border-brass/40 bg-card px-2 py-0.5">
                {book.genre.toUpperCase()}
              </span>
            )}
            {book.dewey_decimal && (
              <span className="rounded-full border border-brass/40 bg-card px-2 py-0.5">
                DEWEY {book.dewey_decimal}
              </span>
            )}
            {avgRating && (
              <span className="rounded-full border border-brass/40 bg-card px-2 py-0.5">
                ★ {avgRating} ({reviews!.length})
              </span>
            )}
          </div>

          {book.description && (
            <p className="mt-4 text-sm leading-relaxed text-brown/90">
              {book.description}
            </p>
          )}

          <div className="mt-6 rounded-sm border border-brass/30 bg-card p-4">
            {book.status === "available" ? (
              <>
                <p className="mb-2 text-sm font-medium text-green-800">
                  Available on the shelf
                </p>
                {myPendingRequest ? (
                  <p className="text-sm text-brown/70">
                    Your checkout request is waiting on the librarian.
                  </p>
                ) : (
                  <form action={requestCheckoutAction}>
                    <button className="rounded-sm bg-ink px-4 py-2 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark">
                      REQUEST TO CHECK OUT
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  {/* Ink-stamp "checked out" mark */}
                  <div className="-rotate-6 rounded-sm border-[3px] border-ink/80 px-3 py-1.5 text-center opacity-90 mix-blend-multiply">
                    <p className="font-stamp text-sm tracking-[0.15em] text-ink">
                      CHECKED OUT
                    </p>
                  </div>
                  <div className="text-sm text-brown/80">
                    {activeLoan?.profile?.display_name && (
                      <p>by {activeLoan.profile.display_name}</p>
                    )}
                    {activeLoan?.checked_out_at && (
                      <p className="text-xs text-brown/50">
                        since{" "}
                        {new Date(
                          activeLoan.checked_out_at
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {myPosition ? (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-brown/70">
                      You&apos;re #{myPosition} on the wait list
                    </p>
                    <form action={leaveWaitlistAction}>
                      <button className="text-xs text-ink underline">
                        Leave wait list
                      </button>
                    </form>
                  </div>
                ) : (
                  <form action={joinWaitlistAction}>
                    <button className="rounded-sm border border-ink px-4 py-2 font-stamp text-xs tracking-widest text-ink hover:bg-parchment">
                      WRITE YOUR NAME ON THE WAIT LIST
                    </button>
                  </form>
                )}

                {waitlist && waitlist.length > 0 && (
                  <div className="mt-4 rounded-sm border border-brass/30 bg-parchment/70 p-3">
                    <p className="mb-2 font-stamp text-[11px] uppercase tracking-widest text-brown/50">
                      Wait list sign-up sheet
                    </p>
                    <div className="space-y-1.5">
                      {waitlist.map((w, i) => (
                        <div
                          key={w.id}
                          className="flex items-baseline gap-2 border-b border-brown/20 pb-1"
                        >
                          <span className="font-stamp text-[12px] text-brown/40">
                            {i + 1}.
                          </span>
                          <span className="font-hand text-xl text-ink">
                            {w.profile?.display_name || "a friend"}
                          </span>
                          {w.user_id === profile?.id && (
                            <span className="ml-auto font-stamp text-[11px] text-brown/40">
                              (you)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 font-serif text-lg text-brown">
          What friends thought
        </h2>

        <form
          action={submitReviewAction}
          className="mb-6 rounded-sm border border-brass/30 bg-card p-4"
        >
          <p className="mb-2 text-sm font-medium text-brown">
            {myReview ? "Update your review" : "Leave a review"}
          </p>
          <div className="flex items-center gap-3">
            <select
              name="rating"
              defaultValue={myReview?.rating ?? 5}
              className="rounded border border-brown/30 bg-transparent px-2 py-1 text-sm text-brown"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)} ({n})
                </option>
              ))}
            </select>
          </div>
          <textarea
            name="thoughts"
            defaultValue={myReview?.thoughts ?? ""}
            placeholder="What did you think?"
            rows={2}
            className="mt-2 w-full rounded border border-brown/30 bg-transparent px-3 py-2 text-sm text-brown focus:border-ink focus:outline-none"
          />
          <button className="mt-2 rounded-sm bg-ink px-4 py-1.5 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark">
            SAVE REVIEW
          </button>
        </form>

        <div className="space-y-3">
          {(reviews || [])
            .filter((r) => r.id !== myReview?.id)
            .map((r) => (
              <div
                key={r.id}
                className="rounded-sm border border-brass/30 bg-card p-3"
              >
                <p className="text-sm font-medium text-brown">
                  {r.profile?.display_name}{" "}
                  <span className="font-normal text-brown/50">
                    {"★".repeat(r.rating || 0)}
                  </span>
                </p>
                {r.thoughts && (
                  <p className="mt-1 text-sm text-brown/80">{r.thoughts}</p>
                )}
              </div>
            ))}
          {(!reviews || reviews.length === 0) && (
            <p className="text-sm text-brown/50">No reviews yet — be the first.</p>
          )}
        </div>
      </section>
    </main>
  );
}
