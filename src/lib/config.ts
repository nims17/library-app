// Venmo usernames for the tip jar (Librarian's Corner). Replace the
// placeholders below with the real @handles, e.g. "vivek-shah-12".
// No code changes needed elsewhere — this is the only place these live.
export const VENMO_HANDLES = {
  vivek: "vivek-shah-5",
  lasya: "Siri-Rallabhandi",
};

export const SUGGESTED_TIP_AMOUNT = 5;

// Real email addresses for new-book-request and return-recall notifications.
export const LIBRARIAN_EMAILS = [
  "Vivek.v.shah405@gmail.com",
  "Siri.rallabhandi@gmail.com",
];

// Used to build links inside emails. Set NEXT_PUBLIC_SITE_URL in Vercel if
// the deployment URL ever changes.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://taborstreetbooks.vercel.app";

export function venmoLink(username: string, amount?: number, note?: string) {
  const params = new URLSearchParams({ txn: "pay" });
  if (amount) params.set("amount", String(amount));
  if (note) params.set("note", note);
  return `https://venmo.com/${encodeURIComponent(username)}?${params.toString()}`;
}
