import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import RequestBookForm from "@/components/RequestBookForm";
import { VENMO_HANDLES, SUGGESTED_TIP_AMOUNT, venmoLink } from "@/lib/config";

export default async function RequestsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: myRequests } = await supabase
    .from("new_book_requests")
    .select("*")
    .eq("requested_by", profile?.id || "")
    .order("created_at", { ascending: false });

  const statusColor: Record<string, string> = {
    pending: "bg-parchment text-brown",
    added: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
  };

  return (
    <main className="relative mx-auto max-w-2xl px-4 py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/library-nook-reading.jpg"
          alt=""
          className="h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-parchment/10 via-parchment/80 to-parchment" />
      </div>

      <h1 className="mb-1 font-serif text-2xl text-brown">
        Request a new book
      </h1>
      <p className="mb-6 text-sm text-brown/70">
        Don&apos;t see it on the shelf? Put in a request for the librarian.
      </p>

      <RequestBookForm />

      {/* Tip nudge */}
      <div className="mb-10 rounded-sm border border-dashed border-brass/50 bg-parchment/60 p-4">
        <p className="text-sm text-brown/80">
          Requesting something new? Consider tossing ${SUGGESTED_TIP_AMOUNT}{" "}
          into the book fund so Vivek and Lasya can actually go buy it —
          details on{" "}
          <Link href="/community" className="underline">
            Tabor Street Community
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
