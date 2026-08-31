export default function Loading() {
  return (
    <div className="grid gap-4">
      <div className="h-6 w-32 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-md border border-border bg-muted/60" />
        ))}
      </div>
    </div>
  );
}
