"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import type { Metrics, PredictionRow } from "@/lib/types";
import { MetricCard } from "@/components/MetricCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleHelp } from "lucide-react";

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
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });
  const playCharts = isInView;

  const scatter = predictions.map((p) => ({
    y_true: p.y_true,
    rul_mid: p.rul_mid,
    engine_id: p.engine_id,
  }));

  const diagonalMin = Math.min(...scatter.map((p) => Math.min(p.y_true, p.rul_mid)));
  const diagonalMax = Math.max(...scatter.map((p) => Math.max(p.y_true, p.rul_mid)));

  const coverageData = [
    { label: "Nominal (80%)", value: 80 },
    { label: "Empirical", value: +(metrics.coverage * 100).toFixed(1) },
  ];

  const phasePerformance = [
    {
      phase: "Critical (<=20)",
      rmse: metrics.critical_rmse,
      within10: metrics.critical_within_10_pct,
      n: metrics.critical_n,
    },
    {
      phase: "Healthy (>20)",
      rmse: metrics.healthy_rmse,
      within10: metrics.healthy_within_10_pct,
      n: metrics.healthy_n,
    },
  ];

  const coverageBarColors = ["var(--chart-3)", "var(--chart-1)"];

  const infoIconClass =
    "inline-flex size-6 items-center justify-center rounded-md border border-border/70 bg-background/80 text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";
  const chartInfoIconClass =
    "inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";


  return (
    <div ref={sectionRef} className="space-y-10">
      <TooltipProvider delayDuration={180}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="RMSE"
          value={metrics.RMSE.toFixed(4)}
          subtitle="Last window per test engine"
        />
        <MetricCard
          title="NASA score"
          value={metrics.NASA_score.toFixed(4)}
          subtitle="Lower is better"
        />
        <MetricCard
          title="Within 10 / 20 cycles"
          value={`${metrics.within_10_pct.toFixed(0)}% / ${metrics.within_20_pct.toFixed(0)}%`}
          subtitle="Engines"
          titleAccessory={
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Explain within 10 and 20 cycles"
                  className={infoIconClass}
                >
                  <CircleHelp className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left leading-relaxed">
                <p>
                  This is cycle-based accuracy: prediction is counted as correct when
                  it falls within <span className="font-semibold">+/-10 cycles</span> (or{" "}
                  <span className="font-semibold">+/-20 cycles</span>) of the true RUL.
                </p>
                <p className="mt-1">
                  <span className="font-semibold">68% / 88%</span> means 68 of 100 engines
                  were within 10 cycles, and 88 of 100 were within 20 cycles.
                </p>
              </TooltipContent>
            </Tooltip>
          }
        />
        <MetricCard
          title="Critical (RUL ≤ 20) RMSE"
          value={metrics.critical_rmse.toFixed(4)}
          subtitle={`Within 10 cycles: ${metrics.critical_within_10_pct.toFixed(2)}% · n=${metrics.critical_n}`}
          titleAccessory={
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Explain critical split"
                  className={infoIconClass}
                >
                  <CircleHelp className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left leading-relaxed">
                <p>
                  <span className="font-semibold">Critical</span> means engines near failure:
                  true RUL <span className="font-semibold">&lt;= 20 cycles</span>.
                </p>
                <p className="mt-1">
                  <span className="font-semibold">n={metrics.critical_n}</span> is the number
                  of test engines in this bucket. RMSE and Within 10 cycles are computed only
                  on these engines.
                </p>
              </TooltipContent>
            </Tooltip>
          }
        />
        <MetricCard
          title="Healthy (RUL > 20) RMSE"
          value={metrics.healthy_rmse.toFixed(4)}
          subtitle={`Within 10 cycles: ${metrics.healthy_within_10_pct.toFixed(2)}% · n=${metrics.healthy_n}`}
          titleAccessory={
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Explain healthy split"
                  className={infoIconClass}
                >
                  <CircleHelp className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left leading-relaxed">
                <p>
                  <span className="font-semibold">Healthy</span> means engines with true RUL{" "}
                  <span className="font-semibold">{'>'} 20 cycles</span>.
                </p>
                <p className="mt-1">
                  <span className="font-semibold">n={metrics.healthy_n}</span> is the sample
                  size for this bucket. RMSE and Within 10 cycles are reported only for these
                  engines.
                </p>
              </TooltipContent>
            </Tooltip>
          }
        />
        </div>
      </TooltipProvider>

      <TooltipProvider delayDuration={180}>
      <div className="grid gap-8 lg:grid-cols-2">
        <motion.div
          className="min-w-0 rounded-2xl border border-border/80 bg-card/50 p-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Predicted vs true RUL (median)
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Explain predicted vs true RUL chart"
                  className={chartInfoIconClass}
                >
                  <CircleHelp className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left leading-relaxed">
                <p>
                  Each point is one engine: x-axis is true RUL and y-axis is predicted
                  median RUL.
                </p>
                <p className="mt-1">
                  The dashed diagonal is perfect prediction. Points close to it indicate
                  better accuracy.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="h-[320px] w-full min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 400, height: 320 }}
            >
              <ScatterChart
                key={playCharts ? "scatter-on" : "scatter-off"}
                margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
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
                <ReferenceLine
                  segment={[
                    { x: diagonalMin, y: diagonalMin },
                    { x: diagonalMax, y: diagonalMax },
                  ]}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="5 5"
                />
                <RechartsTooltip
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
                <Scatter
                  name="Engines"
                  data={scatter}
                  fill={chartColors.scatter}
                  isAnimationActive={playCharts}
                  animationBegin={120}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="min-w-0 rounded-2xl border border-border/80 bg-card/50 p-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Prediction interval coverage
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Explain prediction interval coverage chart"
                  className={chartInfoIconClass}
                >
                  <CircleHelp className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left leading-relaxed">
                <p>
                  Compares target coverage (80%) with empirical coverage observed on
                  test engines.
                </p>
                <p className="mt-1">
                  If empirical is close to nominal, interval uncertainty is reasonably
                  calibrated.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Nominal target is 80% for the 10th-90th interval. Empirical coverage is{" "}
            {(metrics.coverage * 100).toFixed(1)}% (mean interval width{" "}
            {metrics.mean_interval_width.toFixed(1)} cycles).
          </p>
          <div className="h-[320px] w-full min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 400, height: 320 }}
            >
              <BarChart
                key={playCharts ? "coverage-on" : "coverage-off"}
                data={coverageData}
                margin={{ top: 8, right: 8, bottom: 32, left: 8 }}
              >
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  stroke={chartColors.axis}
                  fontSize={11}
                  interval={0}
                  height={40}
                />
                <YAxis
                  stroke={chartColors.axis}
                  fontSize={11}
                  allowDecimals={false}
                  domain={[0, 100]}
                  unit="%"
                />
                <RechartsTooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(v) => [
                    `${typeof v === "number" ? v.toFixed(1) : String(v ?? "")}%`,
                    "Coverage",
                  ]}
                />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={playCharts}
                  animationBegin={180}
                  animationDuration={900}
                  animationEasing="ease-out"
                >
                  {coverageData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={coverageBarColors[i] ?? chartColors.bar}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="min-w-0 rounded-2xl border border-border/80 bg-card/50 p-4"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Critical vs healthy phase performance
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Explain phase performance chart"
                className={chartInfoIconClass}
              >
                <CircleHelp className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-left leading-relaxed">
              <p>
                Critical phase is engines with true RUL &lt;= 20; healthy phase is true
                RUL &gt; 20.
              </p>
              <p className="mt-1">
                Bars compare <span className="font-semibold">Within 10 cycles (%)</span> and{" "}
                <span className="font-semibold">RMSE</span> for both phases.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Critical phase is where true RUL is low and maintenance decisions are most
          sensitive. The model performs strongest there.
        </p>
        <div className="mx-auto h-[280px] w-full min-w-0 max-w-lg">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            initialDimension={{ width: 400, height: 280 }}
          >
            <BarChart
              key={playCharts ? "phase-on" : "phase-off"}
              data={phasePerformance}
              margin={{ top: 8, right: 20, bottom: 20, left: 8 }}
            >
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="phase"
                stroke={chartColors.axis}
                fontSize={11}
                interval={0}
                height={40}
              />
              <YAxis
                yAxisId="left"
                stroke={chartColors.axis}
                fontSize={11}
                domain={[0, 100]}
                unit="%"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={chartColors.axis}
                fontSize={11}
              />
              <RechartsTooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value, name) => {
                  if (name === "within10") {
                    return [
                      `${typeof value === "number" ? value.toFixed(2) : String(value ?? "")}%`,
                      "Within 10 cycles",
                    ];
                  }
                  return [
                    typeof value === "number" ? value.toFixed(4) : String(value ?? ""),
                    "RMSE",
                  ];
                }}
                labelFormatter={(label, payload) => {
                  const row = payload?.[0]?.payload as { n?: number } | undefined;
                  return row?.n ? `${label} · n=${row.n}` : String(label ?? "");
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(v) => (v === "within10" ? "Within 10 cycles (%)" : "RMSE")}
              />
              <Bar
                yAxisId="left"
                dataKey="within10"
                fill={chartColors.scatter}
                radius={[4, 4, 0, 0]}
                name="within10"
                isAnimationActive={playCharts}
                animationBegin={220}
                animationDuration={900}
                animationEasing="ease-out"
              />
              <Bar
                yAxisId="right"
                dataKey="rmse"
                fill={chartColors.alt}
                radius={[4, 4, 0, 0]}
                name="rmse"
                isAnimationActive={playCharts}
                animationBegin={300}
                animationDuration={900}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
      </TooltipProvider>
    </div>
  );
}
