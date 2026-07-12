export default function BookCover({
  title,
  coverUrl,
}: {
  title: string;
  coverUrl: string | null;
}) {
  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={title}
        className="h-28 w-20 flex-shrink-0 rounded object-cover shadow"
      />
    );
  }

  return (
    <div className="flex h-28 w-20 flex-shrink-0 items-center justify-center rounded bg-amber-800 text-center font-serif text-2xl text-amber-50 shadow">
      {title.charAt(0).toUpperCase()}
    </div>
  );
}
