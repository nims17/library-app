"use client";

import { useState, useTransition } from "react";
import type { Book, Review, Loan, WaitlistEntry } from "@/lib/types";
import StarRating from "@/components/StarRating";
import { estimateReadingTime } from "@/lib/reading-time";
import {
  requestCheckout,
  joinWaitlist,
  leaveWaitlist,
  submitReview,
} from "@/app/actions";

type ReviewWithProfile = Review & {
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    is_public_librarian: boolean;
  } | null;
};

export type EnrichedBook = {
  book: Book;
  reviews: ReviewWithProfile[];
  activeLoan: (Loan & { profile: { display_name: string | null } | null }) | null;
  waitlist: (WaitlistEntry & { profile: { display_name: string | null } | null })[];
  myWaitlistPosition: number | null;
  myPendingRequest: boolean;
};

function avg(reviews: ReviewWithProfile[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
}

export default function BookDetailModal({
  entry,
  currentUserId,
  isPublicLibrarian,
  onClose,
}: {
  entry: EnrichedBook;
  currentUserId: string | null;
  isPublicLibrarian: boolean;
  onClose: () => void;
}) {
  const { book, reviews, activeLoan, waitlist, myWaitlistPosition, myPendingRequest } =
    entry;
  const [isPending, startTransition] = useTransition();

  const myReview = reviews.find((r) => r.user_id === currentUserId);
  const [rating, setRating] = useState(myReview?.rating ?? 5);
  const [thoughts, setThoughts] = useState(myReview?.thoughts ?? "");

  const librarianReviews = reviews.filter((r) => r.profile?.is_public_librarian);
  const memberReviews = reviews.filter((r) => !r.profile?.is_public_librarian);
  const communityAvg = avg(reviews);
  const librarianAvg = avg(librarianReviews);
  const readingTime = estimateReadingTime(book.page_count);
  const myWaitlistEntry = waitlist.find((w) => w.user_id === currentUserId);

  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [reviewSaved, setReviewSaved] = useState(false);

  function doRequestCheckout() {
    startTransition(async () => {
      await requestCheckout(book.id);
      setCheckoutMessage("Request sent — the librarian has been notified.");
    });
  }
  function doJoinWaitlist() {
    startTransition(async () => {
      await joinWaitlist(book.id);
      setCheckoutMessage("You're on the wait list.");
    });
  }
  function doLeaveWaitlist() {
    if (!myWaitlistEntry) return;
    startTransition(async () => {
      await leaveWaitlist(myWaitlistEntry.id, book.id);
      setCheckoutMessage("You've left the wait list.");
    });
  }
  function doSubmitReview() {
    startTransition(async () => {
      await submitReview(book.id, rating, thoughts);
      setReviewSaved(true);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-lg border border-brass/40 bg-parchment shadow-2xl sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex justify-end bg-parchment/95 p-2">
          <button
            onClick={onClose}
            className="rounded-full border border-brass/40 px-2.5 py-0.5 text-sm text-brown hover:bg-card"
          >
            ✕
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="flex gap-5">
            <div className="relative flex-shrink-0" style={{ width: 110, height: 165 }}>
              {book.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="h-full w-full rounded-r-sm rounded-l-[3px] object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-r-sm rounded-l-[3px] bg-shelf font-serif text-3xl text-parchment shadow-lg">
                  {book.title.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-y-0 left-0 w-1.5 rounded-l-[3px] bg-black/25" />
              <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-white/70 to-transparent" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-xl text-brown">{book.title}</h2>
              <p className="text-brown/70">{book.author}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {communityAvg !== null && (
                  <span className="flex items-center gap-1 text-xs text-brown/70">
                    <StarRating value={communityAvg} size="text-sm" />({reviews.length})
                  </span>
                )}
                {librarianAvg !== null && (
                  <span className="rounded-full border border-brass/40 bg-card px-2 py-0.5 font-stamp text-[9px] tracking-widest text-brown/70">
                    LIBRARIAN {librarianAvg.toFixed(1)}★
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5 font-stamp text-[9px] tracking-wide text-brown/60">
                {book.genre && (
                  <span className="rounded-full border border-brass/40 px-2 py-0.5">
                    {book.genre.toUpperCase()}
                  </span>
                )}
                {book.page_count && (
                  <span className="rounded-full border border-brass/40 px-2 py-0.5">
                    {book.page_count} PAGES
                  </span>
                )}
                {readingTime && (
                  <span className="rounded-full border border-brass/40 px-2 py-0.5">
                    {readingTime.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {book.description && (
            <p className="mt-4 text-sm leading-relaxed text-brown/90">
              {book.description}
            </p>
          )}

          <div className="mt-5 rounded-sm border border-brass/30 bg-card p-4">
            {checkoutMessage && (
              <p className="mb-2 rounded-sm bg-green-50 px-2 py-1 text-xs font-medium text-green-800">
                ✓ {checkoutMessage}
              </p>
            )}
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
                  <button
                    onClick={doRequestCheckout}
                    disabled={isPending}
                    className="rounded-sm bg-ink px-4 py-2 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
                  >
                    REQUEST TO CHECK OUT
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <div className="-rotate-6 rounded-sm border-[3px] border-ink/80 px-3 py-1.5 text-center opacity-90 mix-blend-multiply">
                    <p className="font-stamp text-sm tracking-[0.15em] text-ink">
                      CHECKED OUT
                    </p>
                  </div>
                  {activeLoan?.profile?.display_name && (
                    <p className="text-sm text-brown/80">
                      by {activeLoan.profile.display_name}
                    </p>
                  )}
                </div>
                {myWaitlistPosition ? (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-brown/70">
                      You&apos;re #{myWaitlistPosition} on the wait list
                    </p>
                    <button
                      onClick={doLeaveWaitlist}
                      disabled={isPending}
                      className="text-xs text-ink underline disabled:opacity-50"
                    >
                      Leave wait list
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={doJoinWaitlist}
                    disabled={isPending}
                    className="rounded-sm border border-ink px-4 py-2 font-stamp text-xs tracking-widest text-ink hover:bg-parchment disabled:opacity-50"
                  >
                    WRITE YOUR NAME ON THE WAIT LIST
                  </button>
                )}

                {waitlist.length > 0 && (
                  <div className="mt-3 rounded-sm border border-brass/30 bg-parchment/70 p-3">
                    <p className="mb-2 font-stamp text-[9px] uppercase tracking-widest text-brown/50">
                      Wait list sign-up sheet
                    </p>
                    <div className="space-y-1.5">
                      {waitlist.map((w, i) => (
                        <div
                          key={w.id}
                          className="flex items-baseline gap-2 border-b border-brown/20 pb-1"
                        >
                          <span className="font-stamp text-[10px] text-brown/40">
                            {i + 1}.
                          </span>
                          <span className="font-hand text-xl text-ink">
                            {w.profile?.display_name || "a friend"}
                          </span>
                          {w.user_id === currentUserId && (
                            <span className="ml-auto font-stamp text-[9px] text-brown/40">
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

          <section className="mt-6">
            <h3 className="mb-2 font-serif text-lg text-brown">
              What friends thought
            </h3>

            {currentUserId && (
              <div className="mb-4 rounded-sm border border-brass/30 bg-card p-3">
                <p className="mb-1.5 text-xs font-medium text-brown">
                  {isPublicLibrarian
                    ? myReview
                      ? "Update your librarian review"
                      : "Leave a librarian review"
                    : myReview
                      ? "Update your review"
                      : "Leave a review"}
                </p>
                <StarRating
                  value={rating}
                  onChange={(n) => {
                    setRating(n);
                    setReviewSaved(false);
                  }}
                  size="text-xl"
                />
                <textarea
                  value={thoughts}
                  onChange={(e) => {
                    setThoughts(e.target.value);
                    setReviewSaved(false);
                  }}
                  placeholder="What did you think?"
                  rows={2}
                  className="mt-2 w-full rounded border border-brown/30 bg-transparent px-3 py-2 text-sm text-brown focus:border-ink focus:outline-none"
                />
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={doSubmitReview}
                    disabled={isPending}
                    className="rounded-sm bg-ink px-4 py-1.5 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark disabled:opacity-50"
                  >
                    {isPending ? "SAVING..." : "SAVE REVIEW"}
                  </button>
                  {reviewSaved && (
                    <span className="text-xs font-medium text-green-800">
                      ✓ Review saved
                    </span>
                  )}
                </div>
              </div>
            )}

            {librarianReviews.length > 0 && (
              <div className="mb-3 space-y-2">
                <p className="font-stamp text-[10px] uppercase tracking-widest text-brown/50">
                  From the librarians
                </p>
                {librarianReviews.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-sm border border-brass/40 bg-card p-3"
                  >
                    <p className="text-sm font-medium text-brown">
                      {r.profile?.display_name}{" "}
                      <StarRating value={r.rating || 0} size="text-xs" />
                    </p>
                    {r.thoughts && (
                      <p className="mt-1 text-sm text-brown/80">{r.thoughts}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {memberReviews.length > 0 && (
                <p className="font-stamp text-[10px] uppercase tracking-widest text-brown/50">
                  From friends
                </p>
              )}
              {memberReviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-sm border border-brass/30 bg-card p-3"
                >
                  <p className="text-sm font-medium text-brown">
                    {r.profile?.display_name}{" "}
                    <StarRating value={r.rating || 0} size="text-xs" />
                  </p>
                  {r.thoughts && (
                    <p className="mt-1 text-sm text-brown/80">{r.thoughts}</p>
                  )}
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-sm text-brown/50">No reviews yet — be the first.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
