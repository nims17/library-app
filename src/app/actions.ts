"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";
import { LIBRARIAN_EMAILS, SITE_URL } from "@/lib/config";

// Looks the title/author up against Google Books server-side and, if a
// confident match is found (same title once case/whitespace is ignored),
// returns the verified title/author so callers can store the properly
// capitalized version — even if the admin/member typed it in lowercase and
// never used the UI's "look up" button themselves.
async function verifyBookViaGoogleBooks(
  title: string,
  author: string
): Promise<{ title: string; author: string | null } | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey || !title.trim()) return null;

  let q = `intitle:${title.trim()}`;
  if (author.trim()) q += `+inauthor:${author.trim()}`;

  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", q);
  url.searchParams.set("maxResults", "3");
  url.searchParams.set("fields", "items(volumeInfo(title,authors))");
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = await res.json();
    const items = (json.items || []) as Array<{
      volumeInfo?: { title?: string; authors?: string[] };
    }>;
    const normalizedInput = title.trim().toLowerCase();
    const match = items.find(
      (item) =>
        item.volumeInfo?.title?.trim().toLowerCase() === normalizedInput
    );
    if (!match?.volumeInfo?.title) return null;
    return {
      title: match.volumeInfo.title,
      author: match.volumeInfo.authors?.join(", ") || null,
    };
  } catch {
    return null;
  }
}

// ---------- Auth ----------

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function completeOnboarding(
  firstName: string,
  lastName: string,
  avatar: File | null
) {
  const supabase = await createClient();
  const displayName = `${firstName} ${lastName}`.trim();
  if (!displayName) throw new Error("Name can't be empty");

  // A profile photo is required when signing up — enforced here as well
  // as with the `required` attribute on the file input, so it can't be
  // skipped even if someone bypasses the client-side form.
  if (!avatar || avatar.size === 0) {
    throw new Error("A profile photo is required to get your library card.");
  }

  // Goes through a narrow database function rather than updating the
  // profiles row directly — it can only ever set *your own* display
  // name, never role or anyone else's row.
  const { error } = await supabase.rpc("update_my_display_name", {
    new_display_name: displayName,
  });
  if (error) throw new Error(error.message);

  await uploadMyAvatar(avatar);

  revalidatePath("/", "layout");
  redirect("/");
}

// ---------- Settings ----------

export async function updateMyName(firstName: string, lastName: string) {
  const supabase = await createClient();
  const displayName = `${firstName} ${lastName}`.trim();
  if (!displayName) throw new Error("Name can't be empty");

  const { error } = await supabase.rpc("update_my_display_name", {
    new_display_name: displayName,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  revalidatePath("/card");
}

export async function updateMyEmail(newEmail: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw new Error(error.message);
  revalidatePath("/card");
}

export async function updateMyPassword(newPassword: string) {
  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

// Shared by onboarding and the settings menu — uploads to a path scoped to
// the caller's own user id (required by the storage RLS policy) and then
// records the public URL on the profile via a narrow RPC.
export async function uploadMyAvatar(avatar: File) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const ext = avatar.name.split(".").pop() || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, avatar, { upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: rpcError } = await supabase.rpc("update_my_avatar", {
    new_avatar_url: data.publicUrl,
  });
  if (rpcError) throw new Error(rpcError.message);

  revalidatePath("/", "layout");
}

// ---------- Member actions ----------

export async function requestCheckout(bookId: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not logged in");

  const { error } = await supabase
    .from("checkout_requests")
    .insert({ book_id: bookId, requested_by: profile.id });
  if (error) throw new Error(error.message);

  revalidatePath(`/books/${bookId}`);
}

export async function joinWaitlist(bookId: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not logged in");

  const { error } = await supabase
    .from("waitlist")
    .insert({ book_id: bookId, user_id: profile.id });
  if (error) throw new Error(error.message);

  revalidatePath(`/books/${bookId}`);
}

export async function leaveWaitlist(waitlistId: string, bookId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("waitlist").delete().eq("id", waitlistId);
  if (error) throw new Error(error.message);

  revalidatePath(`/books/${bookId}`);
}

export async function submitReview(
  bookId: string,
  rating: number,
  thoughts: string
) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not logged in");

  const { error } = await supabase
    .from("reviews")
    .upsert(
      { book_id: bookId, user_id: profile.id, rating, thoughts },
      { onConflict: "book_id,user_id" }
    );
  if (error) throw new Error(error.message);

  revalidatePath(`/books/${bookId}`);
  revalidatePath("/");
  revalidatePath("/community");
}

export async function deleteReview(reviewId: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not logged in");

  // The `user_id = profile.id` check here is belt-and-suspenders — RLS
  // ("friends delete their own reviews") already restricts this to your
  // own reviews at the database level.
  const { data, error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", profile.id)
    .select("book_id");
  if (error) throw new Error(error.message);

  const bookId = data?.[0]?.book_id;
  if (bookId) revalidatePath(`/books/${bookId}`);
  revalidatePath("/");
  revalidatePath("/community");
  revalidatePath("/card");
}

export async function submitNewBookRequest(
  title: string,
  author: string,
  note: string,
  googleBooksUrl?: string
) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not logged in");

  const normalizedTitle = title.trim().toLowerCase();
  if (!normalizedTitle) throw new Error("Title can't be empty");

  // Auto-verify against Google Books so the request (and later, the
  // catalog entry the librarian creates from it) gets the properly
  // capitalized title/author, even if the member typed it in lowercase.
  const verified = await verifyBookViaGoogleBooks(title, author);
  const finalTitle = verified?.title || title;
  const finalAuthor = verified?.author || author;

  // Already in the catalog?
  const { data: existingBooks } = await supabase
    .from("books")
    .select("title");
  if (
    (existingBooks || []).some(
      (b) => b.title.trim().toLowerCase() === normalizedTitle
    )
  ) {
    throw new Error("That book is already in the catalog.");
  }

  // Already requested (and not declined, so a declined request can be
  // asked for again later)?
  const { data: existingRequests } = await supabase
    .from("new_book_requests")
    .select("title, status")
    .neq("status", "declined");
  if (
    (existingRequests || []).some(
      (r) => r.title.trim().toLowerCase() === normalizedTitle
    )
  ) {
    throw new Error("Someone already requested that book.");
  }

  const fullNote = googleBooksUrl
    ? `${note}${note ? "\n\n" : ""}Confirmed on Google Books: ${googleBooksUrl}`
    : note;

  const { error } = await supabase.from("new_book_requests").insert({
    requested_by: profile.id,
    title: finalTitle,
    author: finalAuthor,
    note: fullNote,
  });
  if (error) throw new Error(error.message);

  await sendEmail({
    to: LIBRARIAN_EMAILS,
    subject: `New book request: ${finalTitle}`,
    text: `${profile.display_name || "Someone"} requested "${finalTitle}"${
      finalAuthor ? ` by ${finalAuthor}` : ""
    }.${note ? `\n\nTheir note: "${note}"` : ""}${
      googleBooksUrl ? `\n\nGoogle Books: ${googleBooksUrl}` : ""
    }\n\nReview it here: ${SITE_URL}/admin`,
  });

  revalidatePath("/requests");
}

// ---------- Admin actions ----------
// (Row Level Security also enforces admin-only at the database level —
// these calls will fail for non-admins even if this code were bypassed.)

export async function addBook(formData: {
  title: string;
  author: string;
  description: string;
  cover_url: string;
  genre: string;
  dewey_decimal: string;
  page_count?: number | null;
}) {
  const supabase = await createClient();

  // Auto-verify against Google Books so the catalog always gets the
  // properly capitalized title/author, even if the admin didn't use the
  // "look up" button or typed it in lowercase.
  const verified = await verifyBookViaGoogleBooks(
    formData.title,
    formData.author
  );
  const finalTitle = verified?.title || formData.title;
  const finalAuthor = verified?.author || formData.author;

  const normalizedTitle = finalTitle.trim().toLowerCase();
  const { data: existingBooks } = await supabase
    .from("books")
    .select("title, author");
  const duplicate = (existingBooks || []).find(
    (b) => b.title.trim().toLowerCase() === normalizedTitle
  );
  if (duplicate) {
    throw new Error(
      `"${duplicate.title}" is already in the catalog${
        duplicate.author ? ` (by ${duplicate.author})` : ""
      }.`
    );
  }

  const { error } = await supabase
    .from("books")
    .insert({ ...formData, title: finalTitle, author: finalAuthor });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function removeBook(bookId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("books").delete().eq("id", bookId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function approveCheckout(requestId: string, bookId: string, requestedBy: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not logged in");

  const { error: reqError } = await supabase
    .from("checkout_requests")
    .update({ status: "approved", decided_at: new Date().toISOString(), decided_by: profile.id })
    .eq("id", requestId);
  if (reqError) throw new Error(reqError.message);

  const { error: loanError } = await supabase
    .from("loans")
    .insert({ book_id: bookId, user_id: requestedBy, recorded_by: profile.id });
  if (loanError) throw new Error(loanError.message);

  const { error: bookError } = await supabase
    .from("books")
    .update({ status: "checked_out" })
    .eq("id", bookId);
  if (bookError) throw new Error(bookError.message);

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/books/${bookId}`);
}

export async function denyCheckout(requestId: string, bookId: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not logged in");

  const { error } = await supabase
    .from("checkout_requests")
    .update({ status: "denied", decided_at: new Date().toISOString(), decided_by: profile.id })
    .eq("id", requestId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath(`/books/${bookId}`);
}

export async function markReturned(loanId: string, bookId: string) {
  const supabase = await createClient();

  const { error: loanError } = await supabase
    .from("loans")
    .update({ returned_at: new Date().toISOString(), recall_requested_at: null })
    .eq("id", loanId);
  if (loanError) throw new Error(loanError.message);

  const { error: bookError } = await supabase
    .from("books")
    .update({ status: "available" })
    .eq("id", bookId);
  if (bookError) throw new Error(bookError.message);

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/card");
}

export async function setLoanRecall(loanId: string, recall: boolean) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("set_loan_recall", {
    loan_id: loanId,
    recall,
  });
  if (error) throw new Error(error.message);

  if (recall) {
    const { data: loan } = await supabase
      .from("loans")
      .select("user_id, book:books(title)")
      .eq("id", loanId)
      .single();

    if (loan) {
      const { data: borrower } = await supabase
        .from("profiles")
        .select("email, display_name")
        .eq("id", loan.user_id)
        .single();

      if (borrower?.email) {
        const bookTitle =
          (loan.book as unknown as { title: string } | null)?.title ||
          "your book";
        await sendEmail({
          to: borrower.email,
          subject: `Could you bring back "${bookTitle}"?`,
          text: `Hi ${borrower.display_name || "there"},\n\nThe librarians could use "${bookTitle}" back on the shelf when you get a chance — someone else might be waiting on it.\n\nThanks!\n${SITE_URL}/card`,
        });
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath("/card");
}

export async function manualCheckout(bookId: string, userId: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not logged in");

  const { error: loanError } = await supabase
    .from("loans")
    .insert({ book_id: bookId, user_id: userId, recorded_by: profile.id });
  if (loanError) throw new Error(loanError.message);

  const { error: bookError } = await supabase
    .from("books")
    .update({ status: "checked_out" })
    .eq("id", bookId);
  if (bookError) throw new Error(bookError.message);

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/books/${bookId}`);
}

export async function decideNewBookRequest(
  requestId: string,
  status: "added" | "declined"
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("new_book_requests")
    .update({ status })
    .eq("id", requestId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ---------- Librarian's Corner ----------

export async function addLibrarianPost(title: string, body: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not logged in");

  const { error } = await supabase
    .from("librarian_posts")
    .insert({ author_id: profile.id, title: title || null, body });
  if (error) throw new Error(error.message);

  revalidatePath("/community");
}

export async function deleteLibrarianPost(postId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("librarian_posts")
    .delete()
    .eq("id", postId);
  if (error) throw new Error(error.message);

  revalidatePath("/community");
}

export async function updateReadingStatus(
  currentlyReadingBookId: string | null,
  wantToReadBookId: string | null
) {
  const supabase = await createClient();

  // Goes through a narrow database function — it can only ever touch
  // these two columns on your own row, and only if you're an admin.
  const { error } = await supabase.rpc("update_my_reading_status", {
    currently_reading: currentlyReadingBookId,
    want_to_read: wantToReadBookId,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/community");
}

export async function logTip(amount: number, note: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not logged in");
  if (!(amount > 0)) throw new Error("Enter an amount greater than $0");

  const { error } = await supabase
    .from("tips")
    .insert({ user_id: profile.id, amount, note: note || null });
  if (error) throw new Error(error.message);

  revalidatePath("/community");
}
