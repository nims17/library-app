"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ---------- Auth ----------

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function completeOnboarding(firstName: string, lastName: string) {
  const supabase = await createClient();
  const displayName = `${firstName} ${lastName}`.trim();
  if (!displayName) throw new Error("Name can't be empty");

  // Goes through a narrow database function rather than updating the
  // profiles row directly — it can only ever set *your own* display
  // name, never role or anyone else's row.
  const { error } = await supabase.rpc("update_my_display_name", {
    new_display_name: displayName,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  redirect("/");
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
  revalidatePath("/leaderboard");
}

export async function submitNewBookRequest(
  title: string,
  author: string,
  note: string
) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not logged in");

  const { error } = await supabase
    .from("new_book_requests")
    .insert({ requested_by: profile.id, title, author, note });
  if (error) throw new Error(error.message);

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
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("books").insert(formData);
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
    .update({ returned_at: new Date().toISOString() })
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
