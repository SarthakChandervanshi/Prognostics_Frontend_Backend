import Image from "next/image";
import Hero from "@/components/Hero";
import ProblemSummary from "@/components/home/ProblemSummary";
import MethodSection from "@/components/home/MethodSection";
import ResultsSnapshot from "@/components/home/ResultsSnapshot";
import ProblemTimeline from "@/components/ProblemTimeline";
import ResultsChartsClient from "@/components/ResultsChartsClient";
import ShapGlobalChartClient from "@/components/ShapGlobalChartClient";
import ShapLocalPanel from "@/components/ShapLocalPanel";
import ComparisonTable from "@/components/ComparisonTable";
import SectionReveal from "@/components/SectionReveal";
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
        <ResultsSnapshot metrics={metrics} predictions={predictions} />
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-4 md:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Detailed evaluation
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
              {shap.aggregation.replace(/_/g, " ")} ·{" "}
              {shap.explain_scope.replace(/_/g, " ")} · {shap.n_explained} engines
              explained with {shap.n_background} background samples.
            </p>
          </div>

          <div className="mt-12 space-y-12">
            <div className="rounded-2xl border border-border/80 bg-card/40 p-4 md:p-6">
              <h3 className="text-lg font-semibold">Global SHAP (interactive)</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Mean absolute SHAP values aggregated over time — top features emphasize
                trends and rolling characteristics rather than raw sensor magnitudes
                alone.
              </p>
              <div className="mt-6">
                <ShapGlobalChartClient shap={shap} topN={12} />
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/15 p-4 md:p-6">
              <h3 className="text-lg font-semibold">Publication-style figure (placeholder)</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Drop in your exported PNG as{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  public/images/shap_global.png
                </code>{" "}
                and update this section if you prefer raster output for the thesis or
                paper.
              </p>
              <div className="mt-6 overflow-hidden rounded-xl border border-border/60">
                <Image
                  src="/images/shap_global.svg"
                  alt="Global SHAP bar chart placeholder"
                  width={800}
                  height={420}
                  className="h-auto w-full object-contain"
                />
              </div>
            </div>

            <ShapLocalPanel />
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
              Compact benchmark framing — edit{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                public/data/literature.json
              </code>{" "}
              to match the papers you cite. Ranges for baselines are illustrative until
              you lock exact numbers from sources.
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
