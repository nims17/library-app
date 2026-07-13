import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import BrowseClient from "@/components/BrowseClient";

export default async function HomePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [
    { data: books },
    { data: reviews },
    { data: activeLoans },
    { data: waitlist },
    { data: myPendingRequests },
    { data: librarianProfiles },
  ] = await Promise.all([
    supabase.from("books").select("*").order("title"),
    supabase
      .from("reviews")
      .select("*, profile:profiles(display_name, avatar_url, is_public_librarian)"),
    supabase
      .from("loans")
      .select("*, profile:profiles(display_name)")
      .is("returned_at", null),
    supabase
      .from("waitlist")
      .select("*, profile:profiles(display_name)")
      .order("requested_at", { ascending: true }),
    profile
      ? supabase
          .from("checkout_requests")
          .select("book_id")
          .eq("requested_by", profile.id)
          .eq("status", "pending")
      : Promise.resolve({ data: [] }),
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, currently_reading_book_id")
      .eq("is_public_librarian", true),
  ]);

  const reviewsByBook = new Map<string, typeof reviews>();
  for (const r of reviews || []) {
    if (!reviewsByBook.has(r.book_id)) reviewsByBook.set(r.book_id, []);
    reviewsByBook.get(r.book_id)!.push(r);
  }

  const loanByBook = new Map((activeLoans || []).map((l) => [l.book_id, l]));

  const waitlistByBook = new Map<string, typeof waitlist>();
  for (const w of waitlist || []) {
    if (!waitlistByBook.has(w.book_id)) waitlistByBook.set(w.book_id, []);
    waitlistByBook.get(w.book_id)!.push(w);
  }

  const pendingRequestBookIds = new Set(
    (myPendingRequests || []).map((r) => r.book_id)
  );

  const bookById = new Map((books || []).map((b) => [b.id, b]));
  const librarians = (librarianProfiles || []).map((p) => ({
    id: p.id,
    displayName: p.display_name,
    avatarUrl: p.avatar_url,
    currentlyReading: p.currently_reading_book_id
      ? bookById.get(p.currently_reading_book_id)?.title || null
      : null,
  }));

  const enriched = (books || []).map((book) => {
    const bookWaitlist = waitlistByBook.get(book.id) || [];
    const myWaitlistEntry = bookWaitlist.find(
      (w) => w.user_id === profile?.id
    );
    return {
      book,
      reviews: reviewsByBook.get(book.id) || [],
      activeLoan: loanByBook.get(book.id) || null,
      waitlist: bookWaitlist,
      myWaitlistPosition: myWaitlistEntry
        ? bookWaitlist.findIndex((w) => w.id === myWaitlistEntry.id) + 1
        : null,
      myPendingRequest: pendingRequestBookIds.has(book.id),
    };
  });

  return (
    <BrowseClient
      books={enriched}
      currentUserId={profile?.id || null}
      isPublicLibrarian={profile?.is_public_librarian || false}
      librarians={librarians}
    />
  );
}
