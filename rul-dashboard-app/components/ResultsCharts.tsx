"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import type { Metrics, PredictionRow } from "@/lib/types";
import { splitPhaseStats, widthHistogram } from "@/lib/stats";
import { MetricCard } from "@/components/MetricCard";

const chartColors = {
  grid: "color-mix(in oklch, var(--border) 55%, transparent)",
  axis: "var(--muted-foreground)",
  scatter: "var(--chart-1)",
  alt: "var(--chart-3)",
  bar: "var(--chart-1)",
};

type ResultsChartsProps = {
  metrics: Metrics;
  predictions: PredictionRow[];
};

export default function ResultsCharts({ metrics, predictions }: ResultsChartsProps) {
  const phase = splitPhaseStats(predictions);
  const hist = widthHistogram(predictions, 8);
  const scatter = predictions.map((p) => ({
    y_true: p.y_true,
    rul_mid: p.rul_mid,
    engine_id: p.engine_id,
  }));

  const phaseBars = [
    { name: "Critical (true RUL ≤ 20)", rmse: phase.critical.rmse, n: phase.critical.n },
    { name: "Healthy (true RUL > 20)", rmse: phase.healthy.rmse, n: phase.healthy.n },
  ];

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="RMSE"
          value={metrics.RMSE.toFixed(3)}
          subtitle="Last window per test engine"
        />
        <MetricCard
          title="NASA score"
          value={metrics.NASA_score.toFixed(2)}
          subtitle="Lower is better"
        />
        <MetricCard
          title="Interval coverage"
          value={`${(metrics.coverage * 100).toFixed(0)}%`}
          subtitle={`Mean width ${metrics.mean_interval_width.toFixed(1)} cycles`}
        />
        <MetricCard
          title="Within ±10%"
          value={`${metrics.within_10_pct.toFixed(0)}%`}
          subtitle="Engines"
        />
        <MetricCard
          title="Within ±20%"
          value={`${metrics.within_20_pct.toFixed(0)}%`}
          subtitle="Engines"
        />
        <MetricCard
          title="Weighted MAE"
          value={metrics.weighted_MAE.toFixed(3)}
          subtitle="Emphasizes late-RUL errors"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-border/80 bg-card/50 p-4">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            Predicted vs true RUL (median head)
          </h3>
          <div className="h-[320px] w-full min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 400, height: 320 }}
            >
              <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="y_true"
                  name="True RUL"
                  stroke={chartColors.axis}
                  fontSize={11}
                />
                <YAxis
                  type="number"
                  dataKey="rul_mid"
                  name="Predicted RUL"
                  stroke={chartColors.axis}
                  fontSize={11}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value, name) => {
                    const v =
                      typeof value === "number"
                        ? value.toFixed(2)
                        : String(value ?? "");
                    const label =
                      String(name) === "rul_mid" ? "Predicted RUL" : String(name);
                    return [v, label];
                  }}
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload as
                      | { engine_id?: number }
                      | undefined;
                    return p?.engine_id != null
                      ? `Engine ${p.engine_id}`
                      : "Engine";
                  }}
                />
                <Scatter name="Engines" data={scatter} fill={chartColors.scatter} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-border/80 bg-card/50 p-4">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            Interval width distribution (bins)
          </h3>
          <div className="h-[320px] w-full min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 400, height: 320 }}
            >
              <BarChart data={hist} margin={{ top: 8, right: 8, bottom: 32, left: 8 }}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  stroke={chartColors.axis}
                  fontSize={10}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke={chartColors.axis} fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {hist.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i % 2 === 0 ? chartColors.scatter : chartColors.alt}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="min-w-0 rounded-2xl border border-border/80 bg-card/50 p-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
          Phase-specific RMSE (median prediction)
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Near-failure windows are weighted more heavily in operations — errors
          often matter most when true RUL is small.
        </p>
        <div className="h-[280px] w-full min-w-0 max-w-lg">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            initialDimension={{ width: 400, height: 280 }}
          >
            <BarChart
              data={phaseBars}
              layout="vertical"
              margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
            >
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis type="number" stroke={chartColors.axis} fontSize={11} />
              <YAxis
                type="category"
                dataKey="name"
                width={200}
                stroke={chartColors.axis}
                fontSize={11}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(v) => [
                  typeof v === "number" ? v.toFixed(3) : String(v ?? ""),
                  "RMSE",
                ]}
              />
              <Bar dataKey="rmse" fill={chartColors.bar} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
