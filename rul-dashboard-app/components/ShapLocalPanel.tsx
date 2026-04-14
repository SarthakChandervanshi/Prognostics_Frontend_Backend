import Image from "next/image";

export default function ShapLocalPanel() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Local explanation (example engine)</h3>
        <p className="text-sm text-muted-foreground">
          Local SHAP highlights which features push the median RUL up or down for a
          single trajectory window. Swap this placeholder for your notebook export
          (PNG/SVG) while keeping the interactive global chart from JSON.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Trend and rate-of-change features (e.g. slopes, rolling stats) tend to
            dominate over raw sensor levels.
          </li>
          <li>
            Pair local plots with interval outputs to connect &quot;why&quot; with
            &quot;how uncertain.&quot;
          </li>
        </ul>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/20 ring-1 ring-foreground/5">
        <Image
          src="/images/shap_local_engine1.svg"
          alt="Local SHAP waterfall placeholder for engine 1"
          width={720}
          height={400}
          className="h-auto w-full object-contain"
          priority
        />
      </div>
    </div>
  );
}
