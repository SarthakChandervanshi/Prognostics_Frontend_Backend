"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleHelp } from "lucide-react";
import type { PredictionRow } from "@/lib/types";

type SeriesRow = { cycle: number; smoothed?: Record<string, number> };

function mean(vals: number[]): number {
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Pearson r; null if undefined or degenerate. */
function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3 || n !== ys.length) return null;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const vx = xs[i]! - mx;
    const vy = ys[i]! - my;
    num += vx * vy;
    dx += vx * vx;
    dy += vy * vy;
  }
  const den = Math.sqrt(dx * dy);
  if (den === 0 || !Number.isFinite(den)) return null;
  const r = num / den;
  return Number.isFinite(r) ? Math.max(-1, Math.min(1, r)) : null;
}

/**
 * Diverging fill using the same --chart-* purple scale as ResultsCharts / dashboard
 * (theme `styles/theme.css`): dark (--chart-5) for negative r → mid (--chart-3) → light (--chart-1) for positive r.
 */
function corrBarColor(r: number): string {
  const t = (Math.max(-1, Math.min(1, r)) + 1) / 2;
  if (t <= 0.5) {
    const u = t / 0.5;
    const pct = (1 - u) * 100;
    return `color-mix(in oklch, var(--chart-5) ${pct}%, var(--chart-3))`;
  }
  const u = (t - 0.5) / 0.5;
  const pct = (1 - u) * 100;
  return `color-mix(in oklch, var(--chart-3) ${pct}%, var(--chart-1))`;
}

function displaySensorName(key: string): string {
  return key.replace(/_kalman$/i, "");
}

export default function SensorRulCorrelationChart({ predictions }: { predictions: PredictionRow[] }) {
  const [lastResult, setLastResult] = useState<{
    key: string;
    data: { sensor: string; label: string; r: number }[];
    error?: boolean;
  } | null>(null);

  const predKey = useMemo(
    () =>
      predictions
        .map((p) => `${p.engine_id}:${p.y_true}`)
        .sort()
        .join("|"),
    [predictions],
  );

  useEffect(() => {
    if (predictions.length === 0) return;

    let cancelled = false;
    const key = predKey;

    (async () => {
      try {
        const chunkSize = 15;
        const pools = new Map<string, { xs: number[]; ys: number[] }>();

        const byEngine = new Map(predictions.map((p) => [p.engine_id, p] as const));

        const engineIds = [...new Set(predictions.map((p) => p.engine_id))].sort((a, b) => a - b);

        for (let i = 0; i < engineIds.length; i += chunkSize) {
          if (cancelled) return;
          const chunk = engineIds.slice(i, i + chunkSize);
          const results = await Promise.all(
            chunk.map(async (id) => {
              try {
                const res = await fetch(`/data/engine_series/engine_${id}.json`);
                if (!res.ok) return null;
                const json = (await res.json()) as { rows?: SeriesRow[] };
                const series = json?.rows;
                if (!Array.isArray(series) || series.length === 0) return null;
                const pred = byEngine.get(id);
                if (!pred) return null;
                const lastCycle = series[series.length - 1]!.cycle;
                const yTrue = pred.y_true;
                return { series, yTrue, lastCycle };
              } catch {
                return null;
              }
            }),
          );

          for (const item of results) {
            if (!item) continue;
            const { series, yTrue, lastCycle } = item;
            for (const row of series) {
              const rul = yTrue + (lastCycle - row.cycle);
              const sm = row.smoothed;
              if (!sm) continue;
              for (const [sensorKey, v] of Object.entries(sm)) {
                if (
                  typeof v !== "number" ||
                  !Number.isFinite(v) ||
                  !sensorKey.includes("sensor_measurement")
                )
                  continue;
                let pool = pools.get(sensorKey);
                if (!pool) {
                  pool = { xs: [], ys: [] };
                  pools.set(sensorKey, pool);
                }
                pool.xs.push(v);
                pool.ys.push(rul);
              }
            }
          }
        }

        if (cancelled) return;

        const out: { sensor: string; label: string; r: number }[] = [];
        for (const [sensor, pool] of pools) {
          const r = pearson(pool.xs, pool.ys);
          if (r == null) continue;
          out.push({ sensor, label: displaySensorName(sensor), r });
        }
        out.sort((a, b) => b.r - a.r);
        if (!cancelled) setLastResult({ key, data: out });
      } catch {
        if (!cancelled) setLastResult({ key, data: [], error: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [predKey, predictions]);

  const chartData = lastResult?.key === predKey ? lastResult.data : [];
  const loading = predictions.length > 0 && lastResult?.key !== predKey;
  const fetchError = lastResult?.key === predKey && lastResult.error === true;

  if (predictions.length === 0) {
    return (
      <Card className="border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Correlation of sensors with RUL</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No prediction rows loaded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          Correlation of sensors with RUL
          <TooltipProvider delayDuration={180}>
            <UiTooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Explain sensor–RUL correlation chart"
                  className="inline-flex size-4 items-center justify-center text-muted-foreground/70"
                >
                  <CircleHelp className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left text-xs leading-relaxed">
                <p>
                  Pearson <span className="font-mono">r</span> between each Kalman-smoothed sensor and{" "}
                  <strong>true RUL</strong> at the same cycle, pooled across all test engines and all
                  observed cycles. True RUL uses the run-out label:{" "}
                  <span className="font-mono">y_true + (c_last − c)</span>. Same idea as standard FD001
                  exploratory plots; strongest bars are most linearly aligned with remaining life in this
                  dataset.
                </p>
              </TooltipContent>
            </UiTooltip>
          </TooltipProvider>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Pooled over cycles and engines · smoothed sensors only
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[420px] animate-pulse rounded-lg border border-border/60 bg-muted/30" />
        ) : fetchError ? (
          <p className="text-sm text-muted-foreground">Could not compute correlations.</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pooled sensor data available.</p>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <div className="h-[420px] min-h-[320px] min-w-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartData}
                  margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
                  barCategoryGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis
                    type="number"
                    domain={[-1, 1]}
                    ticks={[-1, -0.5, 0, 0.5, 1]}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    label={{
                      value: "Correlation (Pearson r)",
                      position: "insideBottom",
                      offset: -2,
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={200}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    label={{
                      value: "Sensor",
                      angle: -90,
                      position: "insideLeft",
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    formatter={(value) =>
                      typeof value === "number" && Number.isFinite(value)
                        ? [value.toFixed(3), "Pearson r"]
                        : ["—", "Pearson r"]
                    }
                    labelFormatter={(label) => String(label)}
                  />
                  <ReferenceLine x={0} stroke="hsl(var(--border))" strokeDasharray="4 4" />
                  <Bar dataKey="r" radius={[0, 4, 4, 0]} barSize={14}>
                    {chartData.map((entry) => (
                      <Cell key={`cell-${entry.sensor}`} fill={corrBarColor(entry.r)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div
              className="flex shrink-0 flex-row items-center justify-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 sm:flex-col sm:justify-center sm:py-6"
              aria-label="Bar color encodes Pearson correlation: negative r darker purple, positive r lighter purple. Legend: positive at top, negative at bottom."
            >
              <p className="text-xs font-medium text-foreground sm:[writing-mode:vertical-rl] sm:rotate-180">
                Legend
              </p>
              <div className="flex flex-row items-center gap-2 sm:flex-col sm:gap-1">
                <span className="order-1 text-[11px] tabular-nums text-muted-foreground sm:order-3">
                  −1
                </span>
                <div
                  className="order-2 h-5 w-36 rounded-sm border border-border bg-[linear-gradient(90deg,var(--chart-5),var(--chart-3),var(--chart-1))] shadow-sm sm:h-36 sm:w-5 sm:bg-[linear-gradient(180deg,var(--chart-1),var(--chart-3),var(--chart-5))]"
                />
                <span className="order-3 text-[11px] tabular-nums text-muted-foreground sm:order-1">
                  +1
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
