"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ShapGlobal } from "@/lib/types";

const axis = "var(--muted-foreground)";
const grid = "color-mix(in oklch, var(--border) 55%, transparent)";

export default function ShapGlobalChart({
  shap,
  topN = 12,
}: {
  shap: ShapGlobal;
  topN?: number;
}) {
  const data = [...shap.values]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, topN)
    .map((v) => ({
      feature: v.feature,
      shap: v.mean_abs_shap,
    }));

  return (
    <div className="h-[420px] w-full min-w-0">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 400, height: 420 }}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
        >
          <CartesianGrid stroke={grid} strokeDasharray="3 3" />
          <XAxis type="number" stroke={axis} fontSize={11} />
          <YAxis
            type="category"
            dataKey="feature"
            width={148}
            stroke={axis}
            fontSize={10}
            tick={{ fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(v) => [
              typeof v === "number" ? v.toFixed(4) : String(v ?? ""),
              "Mean |SHAP|",
            ]}
          />
          <Bar dataKey="shap" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
