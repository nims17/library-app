import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import { submitNewBookRequest } from "@/app/actions";

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
    pending: "bg-amber-100 text-amber-900",
    added: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 font-serif text-2xl text-amber-900">
        Request a new book
      </h1>
      <p className="mb-6 text-sm text-amber-700">
        Don&apos;t see it on the shelf? Put in a request for the librarian.
      </p>

      <form
        action={submit}
        className="mb-10 space-y-3 rounded-lg border border-amber-900/15 bg-white p-4"
      >
        <div>
          <label className="mb-1 block text-sm text-amber-900">Title</label>
          <input
            name="title"
            required
            className="w-full rounded border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-700 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-amber-900">
            Author (if known)
          </label>
          <input
            name="author"
            className="w-full rounded border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-700 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-amber-900">
            Why you want it (optional)
          </label>
          <textarea
            name="note"
            rows={2}
            className="w-full rounded border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-700 focus:outline-none"
          />
        </div>
        <button className="rounded bg-amber-900 px-4 py-2 text-sm text-white hover:bg-amber-800">
          Submit request
        </button>
      </form>

      <h2 className="mb-3 font-serif text-lg text-amber-900">
        Your requests
      </h2>
      <div className="space-y-2">
        {(myRequests || []).map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-lg border border-amber-900/15 bg-white p-3"
          >
            <div>
              <p className="text-sm font-medium text-amber-900">{r.title}</p>
              {r.author && (
                <p className="text-xs text-amber-600">{r.author}</p>
              )}
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${statusColor[r.status]}`}
            >
              {r.status}
            </span>
          </div>
        ))}
        {(!myRequests || myRequests.length === 0) && (
          <p className="text-sm text-amber-600">
            You haven&apos;t requested anything yet.
          </p>
        )}
      </div>
    </main>
  );
}
