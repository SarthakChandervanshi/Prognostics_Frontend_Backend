import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function MetricCard({
  title,
  value,
  subtitle,
  className,
  titleAccessory,
}: {
  title: string;
  value: string;
  subtitle?: string;
  className?: string;
  titleAccessory?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm ring-1 ring-foreground/5",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        {titleAccessory}
      </div>
      <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
        {value}
      </h3>
      {subtitle ? (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}
