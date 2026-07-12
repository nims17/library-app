import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import { submitNewBookRequest } from "@/app/actions";
import { VENMO_HANDLES, SUGGESTED_TIP_AMOUNT, venmoLink } from "@/lib/config";

export default async function RequestsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: myRequests } = await supabase
    .from("new_book_requests")
    .select("*")
    .eq("requested_by", profile?.id || "")
    .order("created_at", { ascending: false });

  async function submit(formData: FormData) {
    "use server";
    const title = String(formData.get("title") || "").trim();
    const author = String(formData.get("author") || "").trim();
    const note = String(formData.get("note") || "").trim();
    if (!title) return;
    await submitNewBookRequest(title, author, note);
  }

  const statusColor: Record<string, string> = {
    pending: "bg-parchment text-brown",
    added: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 font-serif text-2xl text-brown">
        Request a new book
      </h1>
      <p className="mb-6 text-sm text-brown/70">
        Don&apos;t see it on the shelf? Put in a request for the librarian.
      </p>

      <form
        action={submit}
        className="mb-4 space-y-3 rounded-sm border border-brass/40 bg-card p-4"
      >
        <div>
          <label className="mb-1 block font-stamp text-[10px] uppercase tracking-widest text-brown/60">
            Title
          </label>
          <input
            name="title"
            required
            className="w-full border-0 border-b border-brown/30 bg-transparent px-0 py-1.5 text-brown focus:border-ink focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block font-stamp text-[10px] uppercase tracking-widest text-brown/60">
            Author (if known)
          </label>
          <input
            name="author"
            className="w-full border-0 border-b border-brown/30 bg-transparent px-0 py-1.5 text-brown focus:border-ink focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block font-stamp text-[10px] uppercase tracking-widest text-brown/60">
            Why you want it (optional)
          </label>
          <textarea
            name="note"
            rows={2}
            className="w-full rounded border border-brown/30 bg-transparent px-2 py-1.5 text-sm text-brown focus:border-ink focus:outline-none"
          />
        </div>
        <button className="rounded-sm bg-ink px-4 py-2 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark">
          SUBMIT REQUEST
        </button>
      </form>

      {/* Tip nudge */}
      <div className="mb-10 rounded-sm border border-dashed border-brass/50 bg-parchment/60 p-4">
        <p className="text-sm text-brown/80">
          Requesting something new? Consider tossing ${SUGGESTED_TIP_AMOUNT}{" "}
          into the book fund so Vivek and Lasya can actually go buy it —
          details on the{" "}
          <Link href="/librarians-corner" className="underline">
            Librarian&apos;s Corner
          </Link>
          .
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href={venmoLink(VENMO_HANDLES.vivek, SUGGESTED_TIP_AMOUNT, "New book fund")}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm border border-ink px-3 py-1 text-xs text-ink hover:bg-card"
          >
            Venmo Vivek ${SUGGESTED_TIP_AMOUNT}
          </a>
          <a
            href={venmoLink(VENMO_HANDLES.lasya, SUGGESTED_TIP_AMOUNT, "New book fund")}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm border border-ink px-3 py-1 text-xs text-ink hover:bg-card"
          >
            Venmo Lasya ${SUGGESTED_TIP_AMOUNT}
          </a>
        </div>
      </div>

      <h2 className="mb-3 font-serif text-lg text-brown">Your requests</h2>
      <div className="space-y-2">
        {(myRequests || []).map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-sm border border-brass/30 bg-card p-3"
          >
            <div>
              <p className="text-sm font-medium text-brown">{r.title}</p>
              {r.author && <p className="text-xs text-brown/60">{r.author}</p>}
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${statusColor[r.status]}`}
            >
              {r.status}
            </span>
          </div>
        ))}
        {(!myRequests || myRequests.length === 0) && (
          <p className="text-sm text-brown/60">
            You haven&apos;t requested anything yet.
          </p>
        )}
      </div>
    </main>
  );
}
