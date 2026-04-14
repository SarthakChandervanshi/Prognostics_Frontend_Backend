import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  subtitle,
  className,
}: {
  title: string;
  value: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm ring-1 ring-foreground/5",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">{title}</p>
      <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
        {value}
      </h3>
      {subtitle ? (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}
