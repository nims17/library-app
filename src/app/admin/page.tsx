import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import {
  approveCheckout,
  denyCheckout,
  markReturned,
  manualCheckout,
  decideNewBookRequest,
  addBook,
  removeBook,
} from "@/app/actions";

export default async function AdminPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-brown/70">This desk is for librarians only.</p>
      </main>
    );
  }

  const supabase = await createClient();

  const [
    { data: profiles },
    { data: books },
    { data: pendingRequests },
    { data: activeLoans },
    { data: bookRequests },
  ] = await Promise.all([
    supabase.from("profiles").select("*").order("display_name"),
    supabase.from("books").select("*").order("title"),
    supabase
      .from("checkout_requests")
      .select("*")
      .eq("status", "pending")
      .order("requested_at", { ascending: true }),
    supabase.from("loans").select("*").is("returned_at", null),
    supabase
      .from("new_book_requests")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const nameById = new Map(
    (profiles || []).map((p) => [p.id, p.display_name])
  );
  const bookById = new Map((books || []).map((b) => [b.id, b]));
  const availableBooks = (books || []).filter((b) => b.status === "available");
  const members = (profiles || []).filter((p) => p.role !== "admin");

  async function addBookAction(formData: FormData) {
    "use server";
    await addBook({
      title: String(formData.get("title") || "").trim(),
      author: String(formData.get("author") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      cover_url: String(formData.get("cover_url") || "").trim(),
      genre: String(formData.get("genre") || "").trim(),
      dewey_decimal: String(formData.get("dewey_decimal") || "").trim(),
    });
  }

  async function manualCheckoutAction(formData: FormData) {
    "use server";
    const bookId = String(formData.get("book_id") || "");
    const userId = String(formData.get("user_id") || "");
    if (!bookId || !userId) return;
    await manualCheckout(bookId, userId);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-10">
      <h1 className="font-serif text-2xl text-brown">Librarian&apos;s desk</h1>

      {/* Pending checkout requests */}
      <section>
        <h2 className="mb-3 font-serif text-lg text-brown">
          Checkout requests waiting on you
        </h2>
        <div className="space-y-2">
          {(pendingRequests || []).map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between rounded-sm border border-brass/30 bg-card p-3"
            >
              <div>
                <p className="text-sm font-medium text-brown">
                  {bookById.get(req.book_id)?.title || "Unknown book"}
                </p>
                <p className="text-xs text-brown/50">
                  Requested by {nameById.get(req.requested_by) || "someone"} on{" "}
                  {new Date(req.requested_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <form
                  action={approveCheckout.bind(
                    null,
                    req.id,
                    req.book_id,
                    req.requested_by
                  )}
                >
                  <button className="rounded-sm bg-green-800 px-3 py-1.5 font-stamp text-[10px] tracking-widest text-white hover:bg-green-900">
                    APPROVE
                  </button>
                </form>
                <form action={denyCheckout.bind(null, req.id, req.book_id)}>
                  <button className="rounded-sm border border-ink px-3 py-1.5 font-stamp text-[10px] tracking-widest text-ink hover:bg-parchment">
                    DENY
                  </button>
                </form>
              </div>
            </div>
          ))}
          {(!pendingRequests || pendingRequests.length === 0) && (
            <p className="text-sm text-brown/50">Nothing waiting. Nice.</p>
          )}
        </div>
      </section>

      {/* Currently checked out */}
      <section>
        <h2 className="mb-3 font-serif text-lg text-brown">
          Currently checked out
        </h2>
        <div className="space-y-2">
          {(activeLoans || []).map((loan) => (
            <div
              key={loan.id}
              className="flex items-center justify-between rounded-sm border border-brass/30 bg-card p-3"
            >
              <div>
                <p className="text-sm font-medium text-brown">
                  {bookById.get(loan.book_id)?.title || "Unknown book"}
                </p>
                <p className="text-xs text-brown/50">
                  {nameById.get(loan.user_id) || "someone"} — since{" "}
                  {new Date(loan.checked_out_at).toLocaleDateString()}
                </p>
              </div>
              <form action={markReturned.bind(null, loan.id, loan.book_id)}>
                <button className="rounded-sm border border-brown/40 px-3 py-1.5 font-stamp text-[10px] tracking-widest text-brown hover:bg-parchment">
                  MARK RETURNED
                </button>
              </form>
            </div>
          ))}
          {(!activeLoans || activeLoans.length === 0) && (
            <p className="text-sm text-brown/50">Everything&apos;s on the shelf.</p>
          )}
        </div>
      </section>

      {/* Manual checkout / return */}
      <section>
        <h2 className="mb-3 font-serif text-lg text-brown">
          Log a checkout by hand
        </h2>
        <p className="mb-2 text-xs text-brown/50">
          For handing a book to someone in person, skipping the request step.
        </p>
        <form
          action={manualCheckoutAction}
          className="flex flex-wrap items-end gap-3 rounded-sm border border-brass/30 bg-card p-4"
        >
          <div>
            <label className="mb-1 block text-xs text-brown/70">Book</label>
            <select
              name="book_id"
              required
              className="rounded border border-brown/30 bg-transparent px-2 py-1.5 text-sm text-brown"
            >
              {availableBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-brown/70">
              Borrowed by
            </label>
            <select
              name="user_id"
              required
              className="rounded border border-brown/30 bg-transparent px-2 py-1.5 text-sm text-brown"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name || "(hasn't set their name yet)"}
                </option>
              ))}
            </select>
          </div>
          <button className="rounded-sm bg-ink px-4 py-1.5 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark">
            LOG CHECKOUT
          </button>
        </form>
      </section>

      {/* New book requests */}
      <section>
        <h2 className="mb-3 font-serif text-lg text-brown">
          New book requests
        </h2>
        <div className="space-y-2">
          {(bookRequests || []).map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-sm border border-brass/30 bg-card p-3"
            >
              <div>
                <p className="text-sm font-medium text-brown">
                  {r.title} {r.author ? `— ${r.author}` : ""}
                </p>
                <p className="text-xs text-brown/50">
                  Requested by {nameById.get(r.requested_by) || "someone"}
                  {r.note ? `: "${r.note}"` : ""}
                </p>
              </div>
              {r.status === "pending" ? (
                <div className="flex gap-2">
                  <form
                    action={decideNewBookRequest.bind(null, r.id, "added")}
                  >
                    <button className="rounded-sm bg-green-800 px-3 py-1.5 font-stamp text-[10px] tracking-widest text-white hover:bg-green-900">
                      MARK ADDED
                    </button>
                  </form>
                  <form
                    action={decideNewBookRequest.bind(null, r.id, "declined")}
                  >
                    <button className="rounded-sm border border-ink px-3 py-1.5 font-stamp text-[10px] tracking-widest text-ink hover:bg-parchment">
                      DECLINE
                    </button>
                  </form>
                </div>
              ) : (
                <span className="font-stamp text-[10px] tracking-wide text-brown/50">
                  {r.status.toUpperCase()}
                </span>
              )}
            </div>
          ))}
          {(!bookRequests || bookRequests.length === 0) && (
            <p className="text-sm text-brown/50">No requests yet.</p>
          )}
        </div>
      </section>

      {/* Add a book */}
      <section>
        <h2 className="mb-3 font-serif text-lg text-brown">Add a book</h2>
        <form
          action={addBookAction}
          className="grid grid-cols-1 gap-3 rounded-sm border border-brass/30 bg-card p-4 sm:grid-cols-2"
        >
          <input
            name="title"
            placeholder="Title"
            required
            className="rounded border border-brown/30 bg-transparent px-3 py-2 text-sm text-brown"
          />
          <input
            name="author"
            placeholder="Author"
            required
            className="rounded border border-brown/30 bg-transparent px-3 py-2 text-sm text-brown"
          />
          <input
            name="genre"
            placeholder="Genre"
            className="rounded border border-brown/30 bg-transparent px-3 py-2 text-sm text-brown"
          />
          <input
            name="dewey_decimal"
            placeholder="Dewey Decimal (e.g. 813.54)"
            className="rounded border border-brown/30 bg-transparent px-3 py-2 text-sm text-brown"
          />
          <input
            name="cover_url"
            placeholder="Cover image URL (optional)"
            className="rounded border border-brown/30 bg-transparent px-3 py-2 text-sm text-brown sm:col-span-2"
          />
          <textarea
            name="description"
            placeholder="Description"
            rows={2}
            className="rounded border border-brown/30 bg-transparent px-3 py-2 text-sm text-brown sm:col-span-2"
          />
          <button className="rounded-sm bg-ink px-4 py-2 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark sm:col-span-2">
            ADD TO CATALOG
          </button>
        </form>
      </section>

      {/* All books / remove */}
      <section>
        <h2 className="mb-3 font-serif text-lg text-brown">All books</h2>
        <div className="space-y-2">
          {(books || []).map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-sm border border-brass/30 bg-card p-3"
            >
              <div>
                <p className="text-sm font-medium text-brown">{b.title}</p>
                <p className="text-xs text-brown/50">{b.author}</p>
              </div>
              <form action={removeBook.bind(null, b.id)}>
                <button className="rounded-sm border border-ink px-3 py-1.5 font-stamp text-[10px] tracking-widest text-ink hover:bg-parchment">
                  REMOVE
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
