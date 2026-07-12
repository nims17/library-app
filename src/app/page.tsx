import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/types";
import BookSpine from "@/components/BookSpine";

type Grouping = "dewey" | "genre" | "author";

function groupBooks(books: Book[], grouping: Grouping) {
  const groups = new Map<string, Book[]>();

  for (const book of books) {
    let key: string;
    if (grouping === "dewey") key = book.dewey_decimal || "Uncategorized";
    else if (grouping === "genre") key = book.genre || "Uncategorized";
    else key = book.author || "Unknown";

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(book);
  }

  return [...groups.entries()].sort((a, b) => {
    if (a[0] === "Uncategorized" || a[0] === "Unknown") return 1;
    if (b[0] === "Uncategorized" || b[0] === "Unknown") return -1;
    return a[0].localeCompare(b[0]);
  });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; q?: string }>;
}) {
  const { group, q } = await searchParams;
  const grouping: Grouping =
    group === "genre" || group === "author" ? group : "dewey";
  const query = (q || "").trim().toLowerCase();

  const supabase = await createClient();
  const { data: books } = await supabase
    .from("books")
    .select("*")
    .order("title");

  const allBooks = (books || []) as Book[];
  const filtered = query
    ? allBooks.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.author.toLowerCase().includes(query)
      )
    : allBooks;

  const grouped = groupBooks(filtered, grouping);

  const tabs: { label: string; value: Grouping }[] = [
    { label: "Dewey Decimal", value: "dewey" },
    { label: "Genre", value: "genre" },
    { label: "Author", value: "author" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-brown">Browse the stacks</h1>
          <p className="font-stamp text-[11px] tracking-wide text-brown/50">
            {allBooks.length} volume{allBooks.length !== 1 ? "s" : ""} on the shelves
          </p>
        </div>

        <form className="flex gap-2" action="/">
          <input type="hidden" name="group" value={grouping} />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search title or author..."
            className="rounded-sm border border-brass/40 bg-card px-3 py-1.5 text-sm text-brown focus:border-ink focus:outline-none"
          />
          <button className="rounded-sm bg-ink px-3 py-1.5 font-stamp text-xs tracking-widest text-parchment hover:bg-ink-dark">
            SEARCH
          </button>
        </form>
      </div>

      <div className="mb-8 flex gap-2 border-b-2 border-brass/30 pb-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/?group=${tab.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-sm px-3 py-1.5 font-stamp text-xs tracking-widest ${
              grouping === tab.value
                ? "bg-ink text-parchment"
                : "text-brown/70 hover:bg-card"
            }`}
          >
            {tab.label.toUpperCase()}
          </Link>
        ))}
      </div>

      {grouped.length === 0 && (
        <p className="text-brown/60">
          No books found{query ? ` matching "${q}"` : ""} yet.
        </p>
      )}

      <div className="space-y-10">
        {grouped.map(([groupName, groupBooksList]) => (
          <section key={groupName}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-serif text-lg text-brown">{groupName}</h2>
              <span className="font-stamp text-[10px] tracking-wide text-brown/40">
                {groupBooksList.length} book
                {groupBooksList.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* The shelf itself: spines stand on a wooden plank */}
            <div className="rounded-sm border border-brass/30 bg-parchment-dark/40 px-4 pt-5">
              <div className="flex items-end gap-1.5 overflow-x-auto pb-0">
                {groupBooksList.map((book) => (
                  <BookSpine key={book.id} book={book} />
                ))}
              </div>
              <div
                className="mt-0 h-4 rounded-b-sm border-t border-black/10 bg-shelf shadow-[inset_0_3px_6px_rgba(0,0,0,0.35)]"
              />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
