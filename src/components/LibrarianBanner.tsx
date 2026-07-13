type Librarian = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  currentlyReading: string | null;
};

export default function LibrarianBanner({
  librarians,
}: {
  librarians: Librarian[];
}) {
  if (librarians.length === 0) return null;

  const readingLines = librarians
    .filter((l) => l.currentlyReading)
    .map((l) => `${l.displayName || "One of us"} is reading ${l.currentlyReading}`);

  return (
    <div className="mb-6 flex flex-col overflow-hidden rounded-sm border border-brass/30 bg-card sm:flex-row">
      <div className="relative h-56 w-full flex-shrink-0 sm:h-auto sm:w-44">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/vivek-lasya-portrait.jpg"
          alt="Vivek and Lasya, the librarians behind this shelf"
          className="h-full w-full object-cover object-top"
        />
      </div>
      <div className="flex flex-1 flex-col justify-center px-5 py-4">
        <p className="font-stamp text-[12px] uppercase tracking-widest text-brown/50">
          Vivek and Lasya&apos;s Library &middot; Est. 2026
        </p>
        <p className="mt-1.5 text-sm text-brown/80">
          We started this shelf so friends could borrow what we love. Come
          dig through the stacks, take something home, and tell us what you
          thought.
        </p>
        {readingLines.length > 0 && (
          <p className="mt-2 text-sm text-brown">{readingLines.join(" · ")}</p>
        )}
      </div>
    </div>
  );
}
