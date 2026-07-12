export default function LibraryCardFrame({
  children,
  eyebrow = "BORROWER'S REGISTRATION CARD",
}: {
  children: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="w-full max-w-sm -rotate-1 rounded-sm border border-brass/50 bg-card shadow-xl">
      {/* Top stripe, like the colored band across a real library card */}
      <div className="flex items-center justify-between rounded-t-sm bg-ink px-5 py-2">
        <span className="font-stamp text-[10px] tracking-[0.2em] text-parchment">
          {eyebrow}
        </span>
        <span className="font-stamp text-[10px] tracking-[0.2em] text-parchment/70">
          EST. 2026
        </span>
      </div>

      <div
        className="px-8 py-8"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(122,37,48,0.18) 32px)",
          backgroundPosition: "0 118px",
        }}
      >
        <h1 className="mb-1 text-center font-serif text-2xl text-brown">
          Tabor Street Books
        </h1>
        <p className="mb-6 text-center font-stamp text-[11px] tracking-wide text-brown/60">
          est. 2026 · a neighborhood library
        </p>

        {children}
      </div>
    </div>
  );
}
