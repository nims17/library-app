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
          <h1 className="font-serif text-2xl text-amber-900">{book.title}</h1>
          <p className="text-amber-700">{book.author}</p>

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-amber-800">
            {book.genre && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5">
                {book.genre}
              </span>
            )}
            {book.dewey_decimal && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5">
                Dewey {book.dewey_decimal}
              </span>
            )}
            {avgRating && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5">
                ★ {avgRating} ({reviews!.length})
              </span>
            )}
          </div>

          {book.description && (
            <p className="mt-4 text-sm leading-relaxed text-amber-900">
              {book.description}
            </p>
          )}

          <div className="mt-6 rounded-lg border border-amber-900/15 bg-white p-4">
            {book.status === "available" ? (
              <>
                <p className="mb-2 text-sm font-medium text-green-800">
                  Available on the shelf
                </p>
                {myPendingRequest ? (
                  <p className="text-sm text-amber-700">
                    Your checkout request is waiting on the librarian.
                  </p>
                ) : (
                  <form action={requestCheckoutAction}>
                    <button className="rounded bg-amber-900 px-4 py-2 text-sm text-white hover:bg-amber-800">
                      Request to check out
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <p className="mb-2 text-sm font-medium text-amber-900">
                  Checked out
                  {activeLoan?.profile?.display_name
                    ? ` by ${activeLoan.profile.display_name}`
                    : ""}
                  {activeLoan?.checked_out_at
                    ? ` since ${new Date(
                        activeLoan.checked_out_at
                      ).toLocaleDateString()}`
                    : ""}
                </p>

                {myPosition ? (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-amber-700">
                      You&apos;re #{myPosition} on the wait list
                    </p>
                    <form action={leaveWaitlistAction}>
                      <button className="text-xs text-amber-600 underline">
                        Leave wait list
                      </button>
                    </form>
                  </div>
                ) : (
                  <form action={joinWaitlistAction}>
                    <button className="rounded border border-amber-900 px-4 py-2 text-sm text-amber-900 hover:bg-amber-100">
                      Write your name on the wait list
                    </button>
                  </form>
                )}

                {waitlist && waitlist.length > 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    {waitlist.length} friend{waitlist.length > 1 ? "s" : ""}{" "}
                    waiting
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 font-serif text-lg text-amber-900">
          What friends thought
        </h2>

        <form
          action={submitReviewAction}
          className="mb-6 rounded-lg border border-amber-900/15 bg-white p-4"
        >
          <p className="mb-2 text-sm font-medium text-amber-900">
            {myReview ? "Update your review" : "Leave a review"}
          </p>
          <div className="flex items-center gap-3">
            <select
              name="rating"
              defaultValue={myReview?.rating ?? 5}
              className="rounded border border-amber-900/30 px-2 py-1 text-sm"
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
            className="mt-2 w-full rounded border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-700 focus:outline-none"
          />
          <button className="mt-2 rounded bg-amber-900 px-4 py-1.5 text-sm text-white hover:bg-amber-800">
            Save review
          </button>
        </form>

        <div className="space-y-3">
          {(reviews || [])
            .filter((r) => r.id !== myReview?.id)
            .map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-amber-900/15 bg-white p-3"
              >
                <p className="text-sm font-medium text-amber-900">
                  {r.profile?.display_name}{" "}
                  <span className="font-normal text-amber-600">
                    {"★".repeat(r.rating || 0)}
                  </span>
                </p>
                {r.thoughts && (
                  <p className="mt-1 text-sm text-amber-800">{r.thoughts}</p>
                )}
              </div>
            ))}
          {(!reviews || reviews.length === 0) && (
            <p className="text-sm text-amber-600">No reviews yet — be the first.</p>
          )}
        </div>
      </section>
    </main>
  );
}
