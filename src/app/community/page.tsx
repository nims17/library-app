import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import BookCover from "@/components/BookCover";
import StarRating from "@/components/StarRating";
import LibrarianBanner from "@/components/LibrarianBanner";
import AddPostForm from "@/components/AddPostForm";
import ReadingStatusForm from "@/components/ReadingStatusForm";
import TipForm from "@/components/TipForm";
import { deleteLibrarianPost } from "@/app/actions";
import { VENMO_HANDLES, SUGGESTED_TIP_AMOUNT, venmoLink } from "@/lib/config";
import { daysAgo } from "@/lib/time";

export default async function CommunityPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [
    { data: profiles },
    { data: books },
    { data: posts },
    { data: reviews },
    { data: loans },
    { data: tips },
  ] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("books").select("*"),
    supabase
      .from("librarian_posts")
      .select(
        "*, author:profiles(display_name, avatar_url, is_public_librarian, currently_reading_book_id)"
      )
      .order("created_at", { ascending: false }),
    supabase.from("reviews").select("*"),
    supabase.from("loans").select("user_id, book_id"),
    supabase
      .from("tips")
      .select("*, donor:profiles(display_name)")
      .order("created_at", { ascending: false }),
  ]);

  const librarians = (profiles || []).filter((p) => p.is_public_librarian);
  const nameById = new Map((profiles || []).map((p) => [p.id, p.display_name]));
  const bookById = new Map((books || []).map((b) => [b.id, b]));
  const bannerLibrarians = librarians.map((p) => ({
    id: p.id,
    displayName: p.display_name,
    avatarUrl: p.avatar_url,
    currentlyReading: p.currently_reading_book_id
      ? bookById.get(p.currently_reading_book_id)?.title || null
      : null,
  }));

  // ---------- Top rated books (community rating, capped 25) ----------
  const reviewsByBook = new Map<string, NonNullable<typeof reviews>>();
  for (const r of reviews || []) {
    if (!reviewsByBook.has(r.book_id)) reviewsByBook.set(r.book_id, []);
    reviewsByBook.get(r.book_id)!.push(r);
  }
  const topBooks = [...reviewsByBook.entries()]
    .map(([bookId, list]) => {
      const book = bookById.get(bookId);
      if (!book) return null;
      const avgRating =
        list.reduce((s, r) => s + (r.rating || 0), 0) / list.length;
      return { book, avgRating, count: list.length };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 25);

  // ---------- Top readers (loan + review combined, capped 25) ----------
  const loanSet = new Set((loans || []).map((l) => `${l.user_id}:${l.book_id}`));
  const sevenDaysAgo = daysAgo(7);

  type ReaderEntry = { userId: string; name: string; count: number; recentCount: number };
  const byUser = new Map<string, ReaderEntry>();
  for (const r of reviews || []) {
    if (!loanSet.has(`${r.user_id}:${r.book_id}`)) continue;
    if (!byUser.has(r.user_id)) {
      byUser.set(r.user_id, {
        userId: r.user_id,
        name: nameById.get(r.user_id) || "Unknown",
        count: 0,
        recentCount: 0,
      });
    }
    const entry = byUser.get(r.user_id)!;
    entry.count += 1;
    if (new Date(r.created_at).getTime() >= sevenDaysAgo) entry.recentCount += 1;
  }
  const topReaders = [...byUser.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);

  // ---------- Tip jar ----------
  const totalTipped = (tips || []).reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 font-serif text-2xl text-brown">
        Tabor Street Community
      </h1>
      <p className="mb-6 text-sm text-brown/70">
        Vivek and Lasya opened up their shelves to the neighborhood — this is
        where everyone gathers to see what they&apos;re reading, swap
        thoughts on books, and keep the shelves growing.
      </p>

      <LibrarianBanner librarians={bannerLibrarians} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column: librarian cards + feed */}
        <div className="min-w-0">
      {/* Librarian cards */}
      {librarians.length > 0 && (
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {librarians.map((admin) => {
            const reading = admin.currently_reading_book_id
              ? bookById.get(admin.currently_reading_book_id)
              : null;
            const isMe = profile?.id === admin.id;

            return (
              <div
                key={admin.id}
                className="rounded-sm border border-brass/40 bg-card p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-3">
                  {admin.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={admin.avatar_url}
                      alt=""
                      className="h-12 w-12 rounded-full border border-brass/50 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-shelf font-serif text-lg text-parchment">
                      {(admin.display_name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p className="font-hand text-2xl text-ink">
                    {admin.display_name || "A librarian"}
                  </p>
                </div>

                <div className="mb-2">
                  <p className="font-stamp text-[9px] uppercase tracking-widest text-brown/50">
                    Currently reading
                  </p>
                  {reading ? (
                    <div className="mt-1 flex items-center gap-2">
                      <BookCover title={reading.title} coverUrl={reading.cover_url} />
                      <span className="text-sm text-brown">{reading.title}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-brown/40">Nothing set</p>
                  )}
                </div>

                {isMe && (
                  <ReadingStatusForm
                    currentBookId={admin.currently_reading_book_id}
                    books={(books || []).map((b) => ({
                      id: b.id,
                      title: b.title,
                    }))}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Write a post — any logged-in friend */}
      {profile && <AddPostForm />}

      {/* Post feed */}
      <div className="space-y-3">
        {(posts || []).map((post) => {
          const isLibrarianPost = !!post.author?.is_public_librarian;
          const reading = post.author?.currently_reading_book_id
            ? bookById.get(post.author.currently_reading_book_id)
            : null;
          return (
            <div
              key={post.id}
              className={
                isLibrarianPost
                  ? "-rotate-[0.3deg] rounded-sm border-2 border-ink/30 bg-card p-4 shadow-sm"
                  : "rounded-sm border border-brass/30 bg-parchment/60 p-4"
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {post.author?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.author.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full border border-brass/40 object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-shelf text-xs text-parchment">
                      {(post.author?.display_name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    {post.title && (
                      <p className="font-serif text-lg text-brown">{post.title}</p>
                    )}
                    <p className="font-stamp text-[10px] tracking-wide text-brown/50">
                      {post.author?.display_name || "A friend"}
                      {isLibrarianPost ? " · LIBRARIAN" : ""} —{" "}
                      {new Date(post.created_at).toLocaleDateString()}
                      {reading ? ` · reading ${reading.title}` : ""}
                    </p>
                  </div>
                </div>
                {profile?.id === post.author_id && (
                  <form action={deleteLibrarianPost.bind(null, post.id)}>
                    <button className="text-xs text-brown/40 underline hover:text-ink">
                      remove
                    </button>
                  </form>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-brown/90">
                {post.body}
              </p>
            </div>
          );
        })}
        {(!posts || posts.length === 0) && (
          <p className="text-sm text-brown/50">No notes posted yet.</p>
        )}
      </div>
        </div>

        {/* Sidebar: leaderboards */}
        <aside className="space-y-8 lg:pt-1">
      <section>
        <h2 className="mb-3 font-serif text-lg text-brown">Top rated books</h2>
        <div className="space-y-2">
          {topBooks.map(({ book, avgRating, count }, i) => (
            <div
              key={book.id}
              className="rounded-sm border border-brass/30 bg-card p-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium leading-snug text-brown">
                  {i + 1}. {book.title}
                </p>
                <StarRating value={avgRating} size="text-xs" />
              </div>
              <p className="mt-1 text-[11px] text-brown/50">
                {book.genre || "Uncategorized"} · {count} review
                {count !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
          {topBooks.length === 0 && (
            <p className="text-sm text-brown/50">No reviews yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg text-brown">Top readers</h2>
        <div className="space-y-2">
          {topReaders.map((entry, i) => (
            <div
              key={entry.userId}
              className="flex items-center justify-between rounded-sm border border-brass/30 bg-card p-2.5"
            >
              <p className="font-hand text-lg text-ink">
                {i + 1}. {entry.name}
              </p>
              <div className="text-right text-xs text-brown/70">
                <p>
                  {entry.count} book{entry.count !== 1 ? "s" : ""}
                </p>
                {entry.recentCount > 0 && (
                  <p className="text-[11px] text-green-800">
                    ↑ +{entry.recentCount} this week
                  </p>
                )}
              </div>
            </div>
          ))}
          {topReaders.length === 0 && (
            <p className="text-sm text-brown/50">
              No one&apos;s finished a book yet — the leaderboard starts once
              people do.
            </p>
          )}
        </div>
      </section>
        </aside>
      </div>

      {/* Tip jar */}
      <section className="mt-12 rounded-sm border-2 border-dashed border-brass/50 bg-card p-5">
        <h2 className="mb-1 font-serif text-lg text-brown">
          Tip your local librarian
        </h2>
        <p className="mb-4 text-sm text-brown/70">
          Vivek and Lasya buy the books — a ${SUGGESTED_TIP_AMOUNT} tip toward
          the book fund helps keep the shelves growing. Venmo doesn&apos;t let
          us verify payments automatically, so the running total below is
          just what people have reported sending.
        </p>

        <div className="mb-4 flex flex-wrap gap-3">
          <a
            href={venmoLink(
              VENMO_HANDLES.vivek,
              SUGGESTED_TIP_AMOUNT,
              "Tabor Street Books fund"
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm bg-ink px-4 py-2 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark"
          >
            VENMO VIVEK ${SUGGESTED_TIP_AMOUNT}
          </a>
          <a
            href={venmoLink(
              VENMO_HANDLES.lasya,
              SUGGESTED_TIP_AMOUNT,
              "Tabor Street Books fund"
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm bg-ink px-4 py-2 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark"
          >
            VENMO LASYA ${SUGGESTED_TIP_AMOUNT}
          </a>
        </div>

        <TipForm />

        <p className="mb-2 font-hand text-2xl text-ink">
          ${totalTipped.toFixed(2)} raised so far
        </p>

        <div className="space-y-1">
          {(tips || []).map((tip) => (
            <div key={tip.id} className="flex justify-between text-sm text-brown/80">
              <span>
                {tip.donor?.display_name || "someone"}
                {tip.note ? ` — "${tip.note}"` : ""}
              </span>
              <span className="font-stamp text-brown/60">
                ${Number(tip.amount).toFixed(2)}
              </span>
            </div>
          ))}
          {(!tips || tips.length === 0) && (
            <p className="text-sm text-brown/50">No tips logged yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
