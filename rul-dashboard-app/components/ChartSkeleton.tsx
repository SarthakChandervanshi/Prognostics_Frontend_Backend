export default function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-muted/40 ring-1 ring-border/60 ${className ?? "h-[320px] w-full"}`}
      role="status"
      aria-label="Loading chart"
    />
  );
}
