import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import BookCover from "@/components/BookCover";
import Link from "next/link";
import {
  addLibrarianPost,
  deleteLibrarianPost,
  updateReadingStatus,
  logTip,
} from "@/app/actions";
import { VENMO_HANDLES, SUGGESTED_TIP_AMOUNT, venmoLink } from "@/lib/config";

export default async function LibrariansCornerPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [
    { data: admins },
    { data: books },
    { data: posts },
    { data: tips },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "admin").order("display_name"),
    supabase.from("books").select("id, title, author, cover_url"),
    supabase
      .from("librarian_posts")
      .select("*, author:profiles(display_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("tips")
      .select("*, donor:profiles(display_name)")
      .order("created_at", { ascending: false }),
  ]);

  const bookById = new Map((books || []).map((b) => [b.id, b]));
  const totalTipped = (tips || []).reduce((sum, t) => sum + Number(t.amount), 0);

  async function addPostAction(formData: FormData) {
    "use server";
    const title = String(formData.get("title") || "").trim();
    const body = String(formData.get("body") || "").trim();
    if (!body) return;
    await addLibrarianPost(title, body);
  }

  async function logTipAction(formData: FormData) {
    "use server";
    const amount = Number(formData.get("amount"));
    const note = String(formData.get("note") || "").trim();
    await logTip(amount, note);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 font-serif text-2xl text-brown">
        The Librarian&apos;s Corner
      </h1>
      <p className="mb-8 text-sm text-brown/70">
        Notes from Vivek &amp; Lasya on what they&apos;re reading, and what&apos;s
        coming next.
      </p>

      {/* Reading status cards */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(admins || []).map((admin) => {
          const reading = admin.currently_reading_book_id
            ? bookById.get(admin.currently_reading_book_id)
            : null;
          const wantToRead = admin.want_to_read_book_id
            ? bookById.get(admin.want_to_read_book_id)
            : null;
          const isMe = profile?.id === admin.id;

          async function saveStatus(formData: FormData) {
            "use server";
            const reading = String(formData.get("currently_reading") || "") || null;
            const next = String(formData.get("want_to_read") || "") || null;
            await updateReadingStatus(reading, next);
          }

          return (
            <div
              key={admin.id}
              className="rounded-sm border border-brass/40 bg-card p-4 shadow-sm"
            >
              <p className="mb-3 font-hand text-2xl text-ink">
                {admin.display_name || "A librarian"}
              </p>

              <div className="mb-3">
                <p className="font-stamp text-[9px] uppercase tracking-widest text-brown/50">
                  Currently reading
                </p>
                {reading ? (
                  <Link
                    href={`/books/${reading.id}`}
                    className="mt-1 flex items-center gap-2 hover:underline"
                  >
                    <BookCover title={reading.title} coverUrl={reading.cover_url} />
                    <span className="text-sm text-brown">{reading.title}</span>
                  </Link>
                ) : (
                  <p className="text-sm text-brown/40">Nothing set</p>
                )}
              </div>

              <div className="mb-3">
                <p className="font-stamp text-[9px] uppercase tracking-widest text-brown/50">
                  Want to read next
                </p>
                {wantToRead ? (
                  <Link
                    href={`/books/${wantToRead.id}`}
                    className="mt-1 flex items-center gap-2 hover:underline"
                  >
                    <BookCover
                      title={wantToRead.title}
                      coverUrl={wantToRead.cover_url}
                    />
                    <span className="text-sm text-brown">{wantToRead.title}</span>
                  </Link>
                ) : (
                  <p className="text-sm text-brown/40">Nothing set</p>
                )}
              </div>

              {isMe && (
                <form action={saveStatus} className="mt-3 space-y-2 border-t border-brass/20 pt-3">
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-widest text-brown/50">
                      Currently reading
                    </label>
                    <select
                      name="currently_reading"
                      defaultValue={admin.currently_reading_book_id || ""}
                      className="w-full rounded border border-brown/30 bg-transparent px-2 py-1 text-sm"
                    >
                      <option value="">— none —</option>
                      {(books || []).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-widest text-brown/50">
                      Want to read next
                    </label>
                    <select
                      name="want_to_read"
                      defaultValue={admin.want_to_read_book_id || ""}
                      className="w-full rounded border border-brown/30 bg-transparent px-2 py-1 text-sm"
                    >
                      <option value="">— none —</option>
                      {(books || []).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="rounded-sm bg-ink px-3 py-1 font-stamp text-[10px] tracking-widest text-parchment hover:bg-ink-dark">
                    SAVE
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {/* Write a post (admins only) */}
      {profile?.role === "admin" && (
        <form
          action={addPostAction}
          className="mb-8 space-y-2 rounded-sm border border-brass/40 bg-card p-4"
        >
          <p className="font-stamp text-[10px] uppercase tracking-widest text-brown/50">
            Post a note
          </p>
          <input
            name="title"
            placeholder="Title (optional)"
            className="w-full border-0 border-b border-brown/30 bg-transparent px-0 py-1 text-brown focus:border-ink focus:outline-none"
          />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="What are you reading? What are you excited about next?"
            className="w-full rounded border border-brown/30 bg-transparent px-2 py-1.5 text-sm text-brown focus:border-ink focus:outline-none"
          />
          <button className="rounded-sm bg-ink px-4 py-1.5 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark">
            POST
          </button>
        </form>
      )}

      {/* Post feed */}
      <div className="mb-12 space-y-3">
        {(posts || []).map((post) => (
          <div
            key={post.id}
            className="-rotate-[0.3deg] rounded-sm border border-brass/40 bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                {post.title && (
                  <p className="font-serif text-lg text-brown">{post.title}</p>
                )}
                <p className="font-stamp text-[10px] tracking-wide text-brown/50">
                  {post.author?.display_name || "A librarian"} —{" "}
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
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
        ))}
        {(!posts || posts.length === 0) && (
          <p className="text-sm text-brown/50">No notes posted yet.</p>
        )}
      </div>

      {/* Tip jar */}
      <section className="rounded-sm border-2 border-dashed border-brass/50 bg-card p-5">
        <h2 className="mb-1 font-serif text-lg text-brown">
          Tip your local librarian
        </h2>
        <p className="mb-4 text-sm text-brown/70">
          Vivek and Lasya buy the books — a ${SUGGESTED_TIP_AMOUNT} tip toward
          the book fund helps keep the shelves growing, especially when you
          request something new. Venmo doesn&apos;t let us verify payments
          automatically, so the running total below is just what people have
          reported sending.
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

        <form
          action={logTipAction}
          className="mb-5 flex flex-wrap items-end gap-2 border-t border-brass/30 pt-4"
        >
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-widest text-brown/50">
              I sent
            </label>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="1"
              defaultValue={SUGGESTED_TIP_AMOUNT}
              required
              className="w-24 rounded border border-brown/30 bg-transparent px-2 py-1 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[10px] uppercase tracking-widest text-brown/50">
              Note (optional)
            </label>
            <input
              name="note"
              placeholder="for the new mysteries!"
              className="w-full rounded border border-brown/30 bg-transparent px-2 py-1 text-sm"
            />
          </div>
          <button className="rounded-sm border border-ink px-3 py-1.5 text-xs text-ink hover:bg-parchment">
            Log my tip
          </button>
        </form>

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
