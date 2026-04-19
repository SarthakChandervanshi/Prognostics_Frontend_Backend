"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Label,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Activity, ChevronDown, CircleHelp } from "lucide-react";
import type { PredictionRow } from "@/lib/types";
import { withBasePath } from "@/lib/basePath";

type SeriesRow = { cycle: number; smoothed?: Record<string, number> };

/** Matches `df.groupby("RUL")[sensor].agg(["mean", "std"])` then `mean ± std` band (Plotly tonexty). */
type SensorMeanStdRow = {
  RUL: number;
  mean: number;
  std: number;
  /** mean + std (upper envelope). */
  upper: number;
  /** mean - std (lower envelope). */
  lower: number;
  /** Stacked-area segments: lower from 0, then band height = upper − lower (Recharts equivalent of fill tonexty). */
  lowerStack: number;
  bandStack: number;
  n: number;
};

/** Pandas-compatible sample std (ddof=1); NaN when n &lt; 2 (pandas returns NaN for single-value groups). */
function meanStd(vals: number[]): { mean: number; std: number } {
  const n = vals.length;
  if (n === 0) return { mean: NaN, std: NaN };
  const mean = vals.reduce((a, b) => a + b, 0) / n;
  if (n < 2) return { mean, std: NaN };
  let s = 0;
  for (const v of vals) {
    const d = v - mean;
    s += d * d;
  }
  return { mean, std: Math.sqrt(s / (n - 1)) };
}

function displaySensorName(key: string): string {
  return key.replace(/_kalman$/i, "");
}

const colors = {
  grid: "color-mix(in oklch, var(--border) 55%, transparent)",
  axis: "var(--muted-foreground)",
  mean: "var(--chart-1)",
  band: "var(--chart-3)",
};

type SensorMeanStdByRulChartProps = {
  predictions: PredictionRow[];
  selectedSensor: string;
  sensorOptions: string[];
  onSensorChange: (sensor: string) => void;
  /** True while the parent is loading engine_series for the dropdown keys only. */
  keysLoading?: boolean;
};

export default function SensorMeanStdByRulChart({
  predictions,
  selectedSensor,
  sensorOptions,
  onSensorChange,
  keysLoading = false,
}: SensorMeanStdByRulChartProps) {
  const [lastResult, setLastResult] = useState<{
    key: string;
    data: SensorMeanStdRow[];
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
    if (predictions.length === 0 || !selectedSensor) return;

    let cancelled = false;
    const key = `${predKey}|${selectedSensor}`;

    (async () => {
      try {
        const chunkSize = 15;
        /** Same keys as pandas `groupby("RUL")`: integer cycles remaining (FD001 RUL is cycle-aligned). */
        const byRul = new Map<number, number[]>();
        const byEngine = new Map(predictions.map((p) => [p.engine_id, p] as const));
        const engineIds = [...new Set(predictions.map((p) => p.engine_id))].sort((a, b) => a - b);

        for (let i = 0; i < engineIds.length; i += chunkSize) {
          if (cancelled) return;
          const chunk = engineIds.slice(i, i + chunkSize);
          const results = await Promise.all(
            chunk.map(async (id) => {
              try {
                const res = await fetch(
                  withBasePath(`/data/engine_series/engine_${id}.json`)
                );
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
              const sm = row.smoothed?.[selectedSensor];
              if (typeof sm !== "number" || !Number.isFinite(sm)) continue;
              const rul = yTrue + (lastCycle - row.cycle);
              if (!Number.isFinite(rul)) continue;
              const RUL = Math.round(rul);
              let arr = byRul.get(RUL);
              if (!arr) {
                arr = [];
                byRul.set(RUL, arr);
              }
              arr.push(sm);
            }
          }
        }

        if (cancelled) return;

        const rows: SensorMeanStdRow[] = [];
        for (const [RUL, vals] of byRul) {
          if (vals.length === 0) continue;
          const { mean, std: stdRaw } = meanStd(vals);
          if (!Number.isFinite(mean)) continue;
          /* Pandas: std is NaN for n=1; band collapses to mean. */
          const s = Number.isFinite(stdRaw) ? stdRaw : 0;
          const upper = mean + s;
          const lower = mean - s;
          const lowerStack = lower;
          const bandStack = upper - lower;
          rows.push({
            RUL,
            mean,
            std: s,
            upper,
            lower,
            lowerStack,
            bandStack,
            n: vals.length,
          });
        }
        /* Plotly: stats.sort_values("RUL", ascending=False) — for Recharts + reversed X we keep ascending RUL. */
        rows.sort((a, b) => a.RUL - b.RUL);

        if (!cancelled) setLastResult({ key, data: rows });
      } catch {
        if (!cancelled) setLastResult({ key, data: [], error: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [predKey, predictions, selectedSensor]);

  const chartData = useMemo(
    () => (lastResult?.key === `${predKey}|${selectedSensor}` ? lastResult.data : []),
    [lastResult, predKey, selectedSensor],
  );
  const loading = predictions.length > 0 && lastResult?.key !== `${predKey}|${selectedSensor}`;
  const fetchError = lastResult?.key === `${predKey}|${selectedSensor}` && lastResult.error === true;
  const label = displaySensorName(selectedSensor);

  /**
   * Pooled Kalman-smoothed sensors often move a tiny amount in **raw engineering units** (e.g. 0.07
   * on ~8, or 0.2 on ~400) — looks "flat" unless we zoom the Y scale. We plot **deviation from the
   * fleet mean at max RUL** when either relative or **absolute** span is small (many sensors sit in
   * the 0.4%–2% relative band but still need a zoomed axis).
   */
  const plotConfig = useMemo(() => {
    if (chartData.length === 0) return null;

    const means = chartData.map((d) => d.mean);
    const mMin = Math.min(...means);
    const mMax = Math.max(...means);
    const mid =
      means.reduce((a, b) => a + b, 0) / Math.max(1, means.length);
    const absSpan = mMax - mMin;
    const relSpan = Math.abs(mid) > 1e-9 ? absSpan / Math.abs(mid) : 0;
    /** Wider than 0.4% alone — catches e.g. absSpan 0.07 with relSpan ~0.9% (still flat on raw axis). */
    const useDeviation = relSpan < 0.02 || absSpan < 5;

    type Row = SensorMeanStdRow & {
      meanPlot: number;
      lowerStackPlot: number;
      bandStackPlot: number;
      stackOffset: number;
    };

    if (!useDeviation) {
      const lows = chartData.map((d) => d.lower).filter((v) => Number.isFinite(v));
      const highs = chartData.map((d) => d.upper).filter((v) => Number.isFinite(v));
      const lo = Math.min(...lows);
      const hi = Math.max(...highs);
      const yMin = Math.min(lo, mMin);
      const yMax = Math.max(hi, mMax);
      const span = yMax - yMin;
      const pad = span > 0 ? span * 0.06 : Math.max(Math.abs(yMax) * 0.002, 0.01);
      const domain: [number, number] = [yMin - pad, yMax + pad];
      const plotData: Row[] = chartData.map((d) => ({
        ...d,
        meanPlot: d.mean,
        lowerStackPlot: d.lowerStack,
        bandStackPlot: d.bandStack,
        stackOffset: 0,
      }));
      return {
        plotData,
        domain,
        useDeviation: false,
        relSpan,
        absSpan,
        weakPooledTrend: absSpan < 0.35,
        yTick: (v: number) => (Number.isFinite(v) ? v.toFixed(3) : ""),
        yLabel: label,
      };
    }

    const refMean = chartData[chartData.length - 1]!.mean;
    const dLowers = chartData.map((d) => d.lower - refMean);
    const minDL = Math.min(...dLowers);
    const stackOffset = -Math.min(0, minDL);

    const plotData: Row[] = chartData.map((d) => ({
      ...d,
      meanPlot: d.mean - refMean + stackOffset,
      lowerStackPlot: d.lower - refMean + stackOffset,
      bandStackPlot: d.bandStack,
      stackOffset,
    }));

    const tops = plotData.map((d) => d.lowerStackPlot + d.bandStackPlot);
    const yMaxPlot = Math.max(...tops);
    /** Minimum vertical span so near-constant sensors do not collapse to a hairline. */
    const minSpan = Math.max(Math.abs(refMean) * 1e-5, 0.02);
    const effMax = Math.max(yMaxPlot, minSpan);
    const pad = Math.max(effMax * 0.08, minSpan * 0.1);
    const domain: [number, number] = [-pad, effMax + pad];

    const maxAbsDev = Math.max(
      ...chartData.map((d) => Math.abs(d.mean - refMean)),
      1e-9,
    );
    const tickDecimals = maxAbsDev < 0.35 ? 4 : 3;

    return {
      plotData,
      domain,
      useDeviation: true,
      relSpan,
      absSpan,
      refMean,
      stackOffset,
      weakPooledTrend: absSpan < 0.35,
      yTick: (v: number) => {
        if (!Number.isFinite(v)) return "";
        const dev = v - stackOffset;
        return dev.toFixed(tickDecimals);
      },
      yLabel: `Δ ${label} (vs mean at max RUL)`,
    };
  }, [chartData, label]);

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-1">
        <div className="space-y-1">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <Activity className="size-4 shrink-0 text-primary" />
            <span className="min-w-0">
              {label} - mean ± std across engines
            </span>
            <TooltipProvider delayDuration={180}>
              <UiTooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Explain mean and standard deviation by RUL chart"
                    className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <CircleHelp className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left text-xs leading-relaxed">
                  <p>
                    Same logic as{" "}
                    <span className="font-mono">df.groupby(&quot;RUL&quot;)[sensor].agg([&quot;mean&quot;,&quot;std&quot;])</span>
                    : pool all engines, then for each RUL value plot <strong>mean</strong> and a
                    shaded <strong>mean ± std</strong> band (Plotly <span className="font-mono">fill=&quot;tonexty&quot;</span>
                    ). RUL per row is <span className="font-mono">y_true + (c_last − c)</span>.
                  </p>
                  <p className="mt-1">
                    X-axis is reversed so high remaining life is on the left and failure (0) on the
                    right—fleet-level sensor degradation vs true RUL, not one engine trace.
                  </p>
                </TooltipContent>
              </UiTooltip>
            </TooltipProvider>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {plotConfig?.useDeviation
              ? plotConfig.weakPooledTrend
                ? "Pooled mean barely moves with RUL in this window (~30 cycles/engine)—this sensor may be weak for fleet-level degradation here; tooltip has exact values."
                : "Y-axis shows deviation from the fleet mean at the highest RUL (raw change is small vs magnitude—see tooltip for mean ± std)."
              : "Degradation trend: mean ± std vs RUL (pooled test engines)."}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sensorOptions.length > 0 ? (
          <div className="relative w-full max-w-sm">
            <select
              className="h-9 w-full appearance-none rounded-md border border-border bg-background px-3 pr-10 text-sm"
              value={selectedSensor}
              onChange={(e) => onSensorChange(e.target.value)}
            >
              {sensorOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No per-engine sensor series found in <code>/public/data/engine_series</code> yet.
          </p>
        )}
        {keysLoading || loading ? (
          <div className="h-[450px] animate-pulse rounded-lg border border-border/60 bg-muted/30" />
        ) : fetchError ? (
          <p className="text-sm text-muted-foreground">Could not load engine series.</p>
        ) : chartData.length === 0 || !plotConfig ? (
          <p className="text-sm text-muted-foreground">No pooled data for this sensor.</p>
        ) : (
          <div className="h-[450px] min-h-[320px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={plotConfig.plotData} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="RUL"
                  domain={["dataMin", "dataMax"]}
                  reversed
                  stroke={colors.axis}
                  fontSize={11}
                  tickFormatter={(v) => Math.round(Number(v)).toString()}
                >
                  <Label value="RUL (cycles remaining)" position="insideBottom" offset={-2} />
                </XAxis>
                <YAxis
                  stroke={colors.axis}
                  fontSize={11}
                  domain={plotConfig.domain}
                  tickFormatter={plotConfig.yTick}
                  width={56}
                >
                  <Label value={plotConfig.yLabel} angle={-90} position="insideLeft" style={{ textAnchor: "middle" }} />
                </YAxis>
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0]?.payload as SensorMeanStdRow & {
                      meanPlot?: number;
                      stackOffset?: number;
                    };
                    if (!row) return null;
                    const refM = chartData[chartData.length - 1]?.mean;
                    const deltaVsRef =
                      refM !== undefined ? row.mean - refM : null;
                    return (
                      <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-sm">
                        <p className="font-medium">RUL = {Math.round(Number(label))}</p>
                        <p className="mt-1 text-muted-foreground">
                          Mean: <span className="font-mono text-foreground">{row.mean.toFixed(4)}</span>
                        </p>
                        {plotConfig.useDeviation && deltaVsRef != null && Number.isFinite(deltaVsRef) ? (
                          <p className="text-muted-foreground">
                            Δ vs mean at max RUL:{" "}
                            <span className="font-mono text-foreground">{deltaVsRef.toFixed(4)}</span>
                          </p>
                        ) : null}
                        <p className="text-muted-foreground">
                          Std: <span className="font-mono text-foreground">{row.std.toFixed(4)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          mean ± std: [{row.lower.toFixed(4)}, {row.upper.toFixed(4)}]
                        </p>
                        <p className="text-muted-foreground">
                          n: <span className="text-foreground">{row.n}</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="top" height={28} />
                <Area
                  type="monotone"
                  dataKey="lowerStackPlot"
                  stackId="std"
                  stroke="none"
                  fill="none"
                  legendType="none"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="bandStackPlot"
                  stackId="std"
                  stroke="none"
                  fill={colors.band}
                  fillOpacity={0.22}
                  name="±1 std"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="meanPlot"
                  name="Mean"
                  stroke={colors.mean}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
