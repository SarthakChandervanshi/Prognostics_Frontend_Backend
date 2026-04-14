"use client";

import dynamic from "next/dynamic";
import ChartSkeleton from "@/components/ChartSkeleton";
import type { Metrics, PredictionRow } from "@/lib/types";

const ResultsCharts = dynamic(() => import("@/components/ResultsCharts"), {
  ssr: false,
  loading: () => <ChartSkeleton className="min-h-[640px] w-full" />,
});

export default function ResultsChartsClient({
  metrics,
  predictions,
}: {
  metrics: Metrics;
  predictions: PredictionRow[];
}) {
  return <ResultsCharts metrics={metrics} predictions={predictions} />;
}
