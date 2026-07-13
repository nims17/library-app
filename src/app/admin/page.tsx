import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import {
  approveCheckout,
  denyCheckout,
  markReturned,
  decideNewBookRequest,
  removeBook,
  setLoanRecall,
} from "@/app/actions";
import AddBookForm from "@/components/AddBookForm";
import ManualCheckoutForm from "@/components/ManualCheckoutForm";

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
  // Librarians can borrow books too, so everyone with a profile is a
  // possible "borrowed by" — not just non-admin members.
  const borrowers = (profiles || []).filter((p) => p.display_name);

  const pendingCount = pendingRequests?.length || 0;
  const checkedOutCount = activeLoans?.length || 0;
  const newRequestCount = (bookRequests || []).filter(
    (r) => r.status === "pending"
  ).length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-10">
      <div>
        <h1 className="font-serif text-2xl text-brown">Librarian&apos;s desk</h1>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-sm border border-brass/30 bg-card p-3 text-center">
            <p className="font-serif text-2xl text-ink">{pendingCount}</p>
            <p className="font-stamp text-[9px] uppercase tracking-widest text-brown/50">
              Waiting on you
            </p>
          </div>
          <div className="rounded-sm border border-brass/30 bg-card p-3 text-center">
            <p className="font-serif text-2xl text-ink">{checkedOutCount}</p>
            <p className="font-stamp text-[9px] uppercase tracking-widest text-brown/50">
              Checked out
            </p>
          </div>
          <div className="rounded-sm border border-brass/30 bg-card p-3 text-center">
            <p className="font-serif text-2xl text-ink">{newRequestCount}</p>
            <p className="font-stamp text-[9px] uppercase tracking-widest text-brown/50">
              New book requests
            </p>
          </div>
        </div>
      </div>

      {/* Pending checkout requests */}
      <section>
        <h2 className="mb-3 font-serif text-lg text-brown">
          Checkout requests waiting on you
          {pendingCount > 0 && (
            <span className="ml-2 text-sm font-normal text-brown/40">
              ({pendingCount})
            </span>
          )}
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
          {(activeLoans || []).map((loan) => {
            const loanBook = bookById.get(loan.book_id);
            return (
            <div
              key={loan.id}
              className="flex items-center justify-between gap-3 rounded-sm border border-brass/30 bg-card p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="relative flex-shrink-0 overflow-hidden rounded-r-sm rounded-l-[2px]"
                  style={{ width: 32, height: 48 }}
                >
                  {loanBook?.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={loanBook.cover_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-shelf font-serif text-xs text-parchment">
                      {(loanBook?.title || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brown">
                    {loanBook?.title || "Unknown book"}
                  </p>
                  {loanBook?.author && (
                    <p className="truncate text-xs text-brown/60">
                      {loanBook.author}
                    </p>
                  )}
                  <p className="truncate text-xs text-brown/50">
                    {nameById.get(loan.user_id) || "someone"} — since{" "}
                    {new Date(loan.checked_out_at).toLocaleDateString()}
                    {loan.recall_requested_at ? " · recalled" : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <form action={setLoanRecall.bind(null, loan.id, !loan.recall_requested_at)}>
                  <button className="rounded-sm border border-ink px-3 py-1.5 font-stamp text-[10px] tracking-widest text-ink hover:bg-parchment">
                    {loan.recall_requested_at ? "CANCEL RECALL" : "ASK FOR IT BACK"}
                  </button>
                </form>
                <form action={markReturned.bind(null, loan.id, loan.book_id)}>
                  <button className="rounded-sm border border-brown/40 px-3 py-1.5 font-stamp text-[10px] tracking-widest text-brown hover:bg-parchment">
                    MARK RETURNED
                  </button>
                </form>
              </div>
            </div>
            );
          })}
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
        <ManualCheckoutForm
          availableBooks={availableBooks.map((b) => ({
            id: b.id,
            title: b.title,
            cover_url: b.cover_url,
          }))}
          borrowers={borrowers.map((m) => ({
            id: m.id,
            display_name: m.display_name,
            role: m.role,
          }))}
        />
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
        <h2 className="mb-1 font-serif text-lg text-brown">Add a book</h2>
        <p className="mb-3 text-sm text-brown/60">
          Type in the title and author yourself, or just take a picture of
          the cover and we&apos;ll fill in the details for you.
        </p>
        <AddBookForm />
      </section>

      {/* All books / remove */}
      <section>
        <h2 className="mb-3 font-serif text-lg text-brown">
          All books
          <span className="ml-2 text-sm font-normal text-brown/40">
            ({(books || []).length})
          </span>
        </h2>
        <div className="space-y-2">
          {(books || []).map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-sm border border-brass/30 bg-card p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="relative flex-shrink-0 overflow-hidden rounded-r-sm rounded-l-[2px]"
                  style={{ width: 32, height: 48 }}
                >
                  {b.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.cover_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-shelf font-serif text-xs text-parchment">
                      {b.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brown">
                    {b.title}
                  </p>
                  <p className="truncate text-xs text-brown/50">{b.author}</p>
                </div>
              </div>
              <form action={removeBook.bind(null, b.id)}>
                <button className="flex-shrink-0 rounded-sm border border-ink px-3 py-1.5 font-stamp text-[10px] tracking-widest text-ink hover:bg-parchment">
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
