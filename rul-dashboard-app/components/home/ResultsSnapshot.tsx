import type { Metrics, PredictionRow } from "@/lib/types";
import { MetricCard } from "@/components/MetricCard";
import MiniScatterPreview from "@/components/home/MiniScatterPreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResultsSnapshot({
  metrics,
  predictions,
}: {
  metrics: Metrics;
  predictions: PredictionRow[];
}) {
  return (
    <section className="border-t border-border/50 bg-gradient-to-b from-background to-muted/10">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Key result snapshot
          </h2>
          <p className="mt-3 text-muted-foreground">
            FD001 test evaluation (last window per engine). Numbers come from your
            exported <code className="rounded bg-muted px-1 py-0.5 text-xs">metrics.json</code>.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <MetricCard
              title="RMSE"
              value={metrics.RMSE.toFixed(2)}
              subtitle="Median head vs true"
            />
            <MetricCard
              title="NASA score"
              value={metrics.NASA_score.toFixed(2)}
              subtitle="Lower is better"
            />
            <MetricCard
              title="Within ±10%"
              value={`${metrics.within_10_pct.toFixed(0)}%`}
              subtitle="Of test engines"
            />
            <MetricCard
              title="Interval coverage"
              value={`${(metrics.coverage * 100).toFixed(0)}%`}
              subtitle="Nominal quantile band"
            />
          </div>

          <Card className="flex flex-col border-border/80 bg-card/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Prediction vs truth (quick look)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col items-center justify-center pt-0">
              <MiniScatterPreview predictions={predictions} />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
