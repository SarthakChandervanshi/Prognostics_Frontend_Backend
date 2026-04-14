"use client";

import dynamic from "next/dynamic";
import ChartSkeleton from "@/components/ChartSkeleton";
import type { ShapGlobal } from "@/lib/types";

const ShapGlobalChart = dynamic(() => import("@/components/ShapGlobalChart"), {
  ssr: false,
  loading: () => <ChartSkeleton className="h-[420px] w-full" />,
});

export default function ShapGlobalChartClient({
  shap,
  topN = 12,
}: {
  shap: ShapGlobal;
  topN?: number;
}) {
  return <ShapGlobalChart shap={shap} topN={topN} />;
}
