import { createClient } from "@/lib/supabase/server";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, profile:profiles(display_name), book:books(title)");

  const { data: loans } = await supabase
    .from("loans")
    .select("user_id, book_id");

  const loanSet = new Set(
    (loans || []).map((l) => `${l.user_id}:${l.book_id}`)
  );

  type Entry = {
    userId: string;
    name: string;
    count: number;
    books: { title: string; rating: number | null }[];
  };

  const byUser = new Map<string, Entry>();

  for (const r of reviews || []) {
    // Only counts toward the leaderboard if they actually had a loan for this book.
    if (!loanSet.has(`${r.user_id}:${r.book_id}`)) continue;

    if (!byUser.has(r.user_id)) {
      byUser.set(r.user_id, {
        userId: r.user_id,
        name: r.profile?.display_name || "Unknown",
        count: 0,
        books: [],
      });
    }
    const entry = byUser.get(r.user_id)!;
    entry.count += 1;
    entry.books.push({ title: r.book?.title || "Untitled", rating: r.rating });
  }

  const ranked = [...byUser.values()].sort((a, b) => b.count - a.count);

  const medal = ["🥇", "🥈", "🥉"];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 font-serif text-2xl text-amber-900">Leaderboard</h1>
      <p className="mb-6 text-sm text-amber-700">
        Ranked by books read (and reviewed).
      </p>

      <div className="space-y-3">
        {ranked.map((entry, i) => (
          <div
            key={entry.userId}
            className="rounded-lg border border-amber-900/15 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-amber-900">
                {medal[i] ? `${medal[i]} ` : `${i + 1}. `}
                {entry.name}
              </p>
              <span className="text-sm text-amber-700">
                {entry.count} book{entry.count !== 1 ? "s" : ""}
              </span>
            </div>
            <ul className="mt-2 space-y-0.5 text-xs text-amber-600">
              {entry.books.map((b, j) => (
                <li key={j}>
                  {b.title}
                  {b.rating ? ` — ${"★".repeat(b.rating)}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {ranked.length === 0 && (
          <p className="text-sm text-amber-600">
            No reviews yet — the leaderboard starts once people finish books.
          </p>
        )}
      </div>
    </main>
  );
}
