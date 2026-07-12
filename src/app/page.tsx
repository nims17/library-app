import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/types";
import BookCover from "@/components/BookCover";

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
        <h1 className="font-serif text-2xl text-amber-900">Browse the stacks</h1>

        <form className="flex gap-2" action="/">
          <input type="hidden" name="group" value={grouping} />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search title or author..."
            className="rounded border border-amber-900/30 px-3 py-1.5 text-sm focus:border-amber-700 focus:outline-none"
          />
          <button className="rounded bg-amber-900 px-3 py-1.5 text-sm text-white hover:bg-amber-800">
            Search
          </button>
        </form>
      </div>

      <div className="mb-8 flex gap-2 border-b border-amber-900/20 pb-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/?group=${tab.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded px-3 py-1.5 text-sm ${
              grouping === tab.value
                ? "bg-amber-900 text-white"
                : "text-amber-800 hover:bg-amber-100"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {grouped.length === 0 && (
        <p className="text-amber-700">
          No books found{query ? ` matching "${q}"` : ""} yet.
        </p>
      )}

      <div className="space-y-8">
        {grouped.map(([groupName, groupBooksList]) => (
          <section key={groupName}>
            <h2 className="mb-3 font-serif text-lg text-amber-900">
              {groupName}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {groupBooksList.map((book) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="flex gap-3 rounded-lg border border-amber-900/15 bg-white p-3 shadow-sm hover:shadow-md"
                >
                  <BookCover title={book.title} coverUrl={book.cover_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-amber-900">
                      {book.title}
                    </p>
                    <p className="truncate text-sm text-amber-700">
                      {book.author}
                    </p>
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${
                        book.status === "available"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-200 text-amber-900"
                      }`}
                    >
                      {book.status === "available" ? "Available" : "Checked out"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
