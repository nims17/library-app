import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server-side proxy to the Google Books API so the API key never reaches
// the browser. Used by the admin's "Add a book" form to auto-fill
// description/genre/cover/page count, and by the "Request a book" form to
// confirm a request matches a real, findable book.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const title = request.nextUrl.searchParams.get("title")?.trim();
  const author = request.nextUrl.searchParams.get("author")?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_BOOKS_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let q = `intitle:${title}`;
  if (author) q += `+inauthor:${author}`;

  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", q);
  url.searchParams.set("maxResults", "3");
  url.searchParams.set(
    "fields",
    "items(volumeInfo(title,authors,description,categories,imageLinks,pageCount,infoLink))"
  );
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    return NextResponse.json(
      { error: `Google Books lookup failed (${res.status})` },
      { status: 502 }
    );
  }

  const json = await res.json();
  const items = (json.items || []) as Array<{
    volumeInfo?: {
      title?: string;
      authors?: string[];
      description?: string;
      categories?: string[];
      imageLinks?: { thumbnail?: string; smallThumbnail?: string };
      pageCount?: number;
      infoLink?: string;
    };
  }>;

  const results = items.map((item) => {
    const v = item.volumeInfo || {};
    return {
      title: v.title || null,
      author: v.authors?.join(", ") || null,
      description: v.description || null,
      genre: v.categories?.[0] || null,
      cover_url:
        v.imageLinks?.thumbnail?.replace("http://", "https://") ||
        v.imageLinks?.smallThumbnail?.replace("http://", "https://") ||
        null,
      page_count: v.pageCount || null,
      info_link: v.infoLink || null,
    };
  });

  return NextResponse.json({ results });
}
