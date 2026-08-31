export default function Loading() {
  return (
    <div className="grid gap-4">
      <div className="h-6 w-32 animate-pulse rounded bg-muted" />
      <div className="h-28 animate-pulse rounded-lg border border-border bg-muted/60" />
    </div>
  );
}
