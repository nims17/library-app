import Link from "next/link";
import type { Book } from "@/lib/types";

const PALETTE = [
  "#7a2530", // burgundy
  "#2f4d3a", // forest green
  "#22344f", // navy
  "#7a5a20", // mustard brown
  "#4a2f4a", // plum
  "#1f4a4a", // teal
  "#5c3a21", // saddle brown
  "#8a3a2a", // rust
];

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// A single book rendered as a spine standing on the shelf, sized and
// colored deterministically from its id so the shelf looks the same
// every time you visit rather than reshuffling on every page load.
export default function BookSpine({ book }: { book: Book }) {
  const h = hashString(book.id);
  const color = PALETTE[h % PALETTE.length];
  const width = 30 + (h % 5) * 7;
  const height = 168 + (h % 4) * 14;

  return (
    <Link
      href={`/books/${book.id}`}
      className="group relative flex-shrink-0 rounded-t-[2px] shadow-md transition-transform duration-150 hover:-translate-y-2 hover:shadow-lg"
      style={{ backgroundColor: color, width, height }}
      title={`${book.title} — ${book.author}`}
    >
      <span className="absolute inset-x-1 top-1.5 h-px bg-parchment/25" />
      <span
        className="absolute inset-0 flex items-center justify-center overflow-hidden px-1 py-3 text-center font-serif text-[11px] leading-tight text-parchment"
        style={{ writingMode: "vertical-rl" }}
      >
        {book.title}
      </span>
      <span
        className={`absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
          book.status === "available" ? "bg-green-400" : "bg-red-400"
        }`}
      />
    </Link>
  );
}
