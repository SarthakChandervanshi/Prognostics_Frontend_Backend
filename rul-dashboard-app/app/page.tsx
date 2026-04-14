import Hero from "@/components/Hero";
import ProblemSummary from "@/components/home/ProblemSummary";
import MethodSection from "@/components/home/MethodSection";
import ProblemTimeline from "@/components/ProblemTimeline";
import ResultsChartsClient from "@/components/ResultsChartsClient";
import ShapGlobalChartClient from "@/components/ShapGlobalChartClient";
import ComparisonTable from "@/components/ComparisonTable";
import SectionReveal from "@/components/SectionReveal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleHelp } from "lucide-react";
import {
  loadLiterature,
  loadMetrics,
  loadPredictions,
  loadShapGlobal,
  pickHeroSampleByConfidence,
} from "@/lib/data";

export default async function HomePage() {
  const [metrics, predictions, shap, literature] = await Promise.all([
    loadMetrics(),
    loadPredictions(),
    loadShapGlobal(),
    loadLiterature(),
  ]);
  const sample = pickHeroSampleByConfidence(predictions);

  return (
    <>
      <Hero metrics={metrics} sample={sample} />

      <SectionReveal id="problem">
        <ProblemSummary />
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-8 md:pb-24 md:pt-12">
          <ProblemTimeline />
        </div>
      </SectionReveal>

      <SectionReveal
        id="method"
        className="border-t border-border/40 bg-muted/5 py-16 md:py-24"
      >
        <MethodSection />
      </SectionReveal>

      <SectionReveal id="results" className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Key results
            </h2>
            <p className="mt-4 text-muted-foreground">
              Precomputed evaluation on FD001 test engines (last window per engine).
              Strong global fit with interpretable interval behavior.
            </p>
          </div>
          <div className="mt-12">
            <ResultsChartsClient metrics={metrics} predictions={predictions} />
          </div>
        </div>
      </SectionReveal>

      <SectionReveal
        id="interpretability"
        className="border-t border-border/40 bg-muted/5 py-16 md:py-24"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Interpretability
            </h2>
            <p className="mt-4 text-muted-foreground">
              Global SHAP importance is computed as mean absolute SHAP values
              aggregated across samples and time steps, evaluated on the last window
              per test engine ({shap.n_explained} engines), using {shap.n_background}{" "}
              background samples.
            </p>
          </div>

          <div className="mt-12">
            <div className="rounded-2xl border border-border/80 bg-card/40 p-4 md:p-6">
              <TooltipProvider delayDuration={180}>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Global SHAP (interactive)</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="Explain SHAP feature code naming"
                        className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <CircleHelp className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm text-left leading-relaxed">
                      <p className="font-semibold text-foreground">Feature code guide</p>
                      <p className="mt-1">
                        <span className="font-semibold">tr_</span> trend slope,{" "}
                        <span className="font-semibold">rc_</span> rate of change,{" "}
                        <span className="font-semibold">rs_</span> rolling statistic,{" "}
                        <span className="font-semibold">si_</span> sensor interaction.
                      </p>
                      <p className="mt-1">
                        Suffixes: <span className="font-semibold">slope5</span> (5-cycle
                        slope), <span className="font-semibold">pct1</span> (1-step % change),{" "}
                        <span className="font-semibold">rmin5</span> (5-cycle rolling min),{" "}
                        <span className="font-semibold">_kalman</span> (smoothed raw sensor).
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
              <p className="mt-1 text-sm text-muted-foreground">
                Mean absolute SHAP values aggregated over time — top features emphasize
                trends and rolling characteristics rather than raw sensor magnitudes
                alone.
              </p>
              <div className="mt-6">
                <ShapGlobalChartClient shap={shap} topN={12} />
              </div>
            </div>
          </div>
        </div>
      </SectionReveal>

      <SectionReveal
        id="comparison"
        className="border-t border-border/40 py-16 md:pb-28 md:pt-16"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Literature comparison
            </h2>
            <p className="mt-4 text-muted-foreground">
              This section presents a concise benchmark comparison against selected
              published methods. Reported values should be interpreted in the context
              of each study&apos;s evaluation protocol and source-reported settings.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Note: This is not a strictly controlled head-to-head comparison.
              Preprocessing choices and feature-engineering pipelines vary across
              studies and this project, so alignment is interpreted as a loosely
              bounded comparison using NASA score and RMSE.
            </p>
          </div>
          <div className="mt-12">
            <ComparisonTable data={literature} />
          </div>
        </div>
      </SectionReveal>
    </>
  );
}
