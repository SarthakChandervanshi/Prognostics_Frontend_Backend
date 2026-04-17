"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, ChevronDown, CircleHelp, Radar, Settings2 } from "lucide-react";
import type { Metrics, PredictionRow, ShapGlobal } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/lib/dashboardStore";

type DashboardClientProps = {
  metrics: Metrics;
  predictions: PredictionRow[];
  shapGlobal: ShapGlobal;
};

type EngineSeriesRow = {
  cycle: number;
  sensors?: Record<string, number>;
  smoothed?: Record<string, number>;
  features?: Record<string, number>;
  rul_low?: number;
  rul_mid?: number;
  rul_high?: number;
  y_true?: number;
};

type LocalShapPayload = {
  engine_id: number;
  values: { feature: string; shap_value: number }[];
};

function pickDefaultSensor(keys: string[]): string {
  const kalman = keys.filter(
    (k) => k.includes("sensor_measurement_") && k.includes("kalman")
  );
  if (kalman.length) return kalman.sort()[0] ?? "";
  const trend = keys.filter((k) => k.startsWith("tr_"));
  if (trend.length) return trend.sort()[0] ?? "";
  return [...keys].sort()[0] ?? "";
}

const colors = {
  grid: "color-mix(in oklch, var(--border) 55%, transparent)",
  axis: "var(--muted-foreground)",
  true: "var(--chart-3)",
  pred: "var(--chart-1)",
  low: "var(--chart-2)",
  high: "var(--chart-4)",
};

export default function DashboardClient({
  metrics,
  predictions,
  shapGlobal,
}: DashboardClientProps) {
  const {
    selectedEngine,
    selectedSensor,
    intervalMode,
    shapView,
    setSelectedEngine,
    setSelectedSensor,
    setIntervalMode,
    setShapView,
  } = useDashboardStore();
  const metricsGridRef = useRef<HTMLDivElement | null>(null);
  const coverageBadgeRef = useRef<HTMLDivElement | null>(null);
  const prevInsideIntervalRef = useRef<boolean | null>(null);

  const engineIds = useMemo(
    () => [...new Set(predictions.map((p) => p.engine_id))].sort((a, b) => a - b),
    [predictions]
  );

  useEffect(() => {
    if (engineIds.length === 0) {
      setSelectedEngine(null);
      return;
    }
    if (selectedEngine == null || !engineIds.includes(selectedEngine)) {
      setSelectedEngine(engineIds[0]);
    }
  }, [engineIds, selectedEngine, setSelectedEngine]);

  const selected = useMemo(
    () => predictions.find((p) => p.engine_id === selectedEngine) ?? null,
    [predictions, selectedEngine]
  );

  const [engineSeries, setEngineSeries] = useState<EngineSeriesRow[] | null>(null);
  const [engineSeriesLoadedFor, setEngineSeriesLoadedFor] = useState<number | null>(null);
  const [localShap, setLocalShap] = useState<LocalShapPayload | null>(null);
  const [localShapLoadedFor, setLocalShapLoadedFor] = useState<number | null>(null);

  useEffect(() => {
    if (selectedEngine == null) return;

    let active = true;
    fetch(`/data/engine_series/engine_${selectedEngine}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (!active) return;
        const rows = Array.isArray(payload?.rows) ? payload.rows : null;
        setEngineSeries(rows);
        setEngineSeriesLoadedFor(selectedEngine);
      })
      .catch(() => {
        if (!active) return;
        setEngineSeries(null);
        setEngineSeriesLoadedFor(selectedEngine);
      });

    fetch(`/data/shap_local/engine_${selectedEngine}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (!active) return;
        if (payload?.values && Array.isArray(payload.values)) {
          setLocalShap(payload as LocalShapPayload);
          setLocalShapLoadedFor(selectedEngine);
          return;
        }
        setLocalShap(null);
        setLocalShapLoadedFor(selectedEngine);
      })
      .catch(() => {
        if (!active) return;
        setLocalShap(null);
        setLocalShapLoadedFor(selectedEngine);
      });

    return () => {
      active = false;
    };
  }, [selectedEngine]);

  const isEngineSeriesLoading = selectedEngine != null && engineSeriesLoadedFor !== selectedEngine;
  const isLocalShapLoading = selectedEngine != null && localShapLoadedFor !== selectedEngine;

  const sensorOptions = useMemo(() => {
    if (!engineSeries || engineSeries.length === 0) return [];
    const row = engineSeries[0];
    const keys = Object.keys(row.smoothed ?? row.sensors ?? row.features ?? {});
    return keys.sort();
  }, [engineSeries]);

  useEffect(() => {
    if (sensorOptions.length > 0 && !sensorOptions.includes(selectedSensor)) {
      setSelectedSensor(pickDefaultSensor(sensorOptions));
    }
  }, [selectedSensor, sensorOptions, setSelectedSensor]);

  const sensorTrendData = useMemo(() => {
    if (!engineSeries) return [];
    return engineSeries.map((r) => ({
      cycle: r.cycle,
      raw: r.sensors?.[selectedSensor] ?? null,
      smoothed: r.smoothed?.[selectedSensor] ?? r.features?.[selectedSensor] ?? null,
    }));
  }, [engineSeries, selectedSensor]);

  const sensorDisplayMode = useMemo<"absolute" | "relative">(() => {
    const smoothedValues = sensorTrendData
      .map((d) => d.smoothed)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (smoothedValues.length < 2) return "absolute";
    const min = Math.min(...smoothedValues);
    const max = Math.max(...smoothedValues);
    const mean = Math.abs(smoothedValues.reduce((acc, v) => acc + v, 0) / smoothedValues.length);
    if (mean === 0) return "absolute";
    const relativeSpan = (max - min) / mean;
    return relativeSpan < 0.01 ? "relative" : "absolute";
  }, [sensorTrendData]);

  const sensorPlotData = useMemo(() => {
    if (sensorDisplayMode === "absolute") {
      return sensorTrendData.map((d) => ({ ...d, rawPlot: d.raw, smoothedPlot: d.smoothed }));
    }

    const firstSmoothed =
      sensorTrendData.find((d) => typeof d.smoothed === "number" && Number.isFinite(d.smoothed))
        ?.smoothed ?? null;
    const firstRaw =
      sensorTrendData.find((d) => typeof d.raw === "number" && Number.isFinite(d.raw))?.raw ?? null;
    const smoothedBase = firstSmoothed && firstSmoothed !== 0 ? firstSmoothed : null;
    const rawBase = firstRaw && firstRaw !== 0 ? firstRaw : smoothedBase;

    return sensorTrendData.map((d) => ({
      ...d,
      rawPlot: rawBase != null && d.raw != null ? ((d.raw - rawBase) / Math.abs(rawBase)) * 100 : null,
      smoothedPlot:
        smoothedBase != null && d.smoothed != null
          ? ((d.smoothed - smoothedBase) / Math.abs(smoothedBase)) * 100
          : null,
    }));
  }, [sensorDisplayMode, sensorTrendData]);

  const sensorYAxisDomain = useMemo<[number, number] | undefined>(() => {
    const values = sensorPlotData
      .flatMap((d) => [d.rawPlot, d.smoothedPlot])
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (values.length === 0) return undefined;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min;
    const pad = span === 0 ? Math.max(Math.abs(min) * 0.05, 1) : span * 0.1;
    return [min - pad, max + pad];
  }, [sensorPlotData]);

  const intervalAcrossEngines = useMemo(
    () =>
      [...predictions]
        .sort((a, b) => a.engine_id - b.engine_id)
        .map((p) => ({
          engine: p.engine_id,
          low: p.rul_low,
          mid: p.rul_mid,
          high: p.rul_high,
          true: p.y_true,
        })),
    [predictions]
  );

  const shapBars = useMemo(() => {
    if (shapView === "local" && localShap?.values?.length) {
      return [...localShap.values]
        .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
        .slice(0, 10)
        .map((v) => ({ feature: v.feature, value: v.shap_value }));
    }
    return [...shapGlobal.values]
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 10)
      .map((v) => ({ feature: v.feature, value: v.mean_abs_shap }));
  }, [localShap, shapGlobal, shapView]);

  const phaseRulThreshold = 20;
  const rulCap = 125;
  const enginePhaseTrend = useMemo(() => {
    if (!engineSeries?.length || !selected) return [];
    const lastObservedCycle = engineSeries[engineSeries.length - 1]?.cycle ?? 0;
    if (lastObservedCycle <= 0) return [];
    const cyclesToFailure = Math.max(0, Math.round(selected.y_true));
    const totalSteps = lastObservedCycle + cyclesToFailure;

    return Array.from({ length: totalSteps }, (_, idx) => {
      const step = idx + 1;
      // Extend the trajectory beyond the observed test window until RUL reaches 0.
      const rul = Math.max(0, selected.y_true + (lastObservedCycle - step));
      return {
        step,
        rul,
        rulCapped: Math.min(rulCap, rul),
        healthyRul: rul > phaseRulThreshold ? rul : null,
        criticalRul: rul <= phaseRulThreshold ? rul : null,
      };
    });
  }, [engineSeries, selected]);

  const enginePhaseCounts = useMemo(() => {
    const healthy = enginePhaseTrend.filter((d) => d.rul > phaseRulThreshold).length;
    const critical = enginePhaseTrend.filter((d) => d.rul <= phaseRulThreshold).length;
    const total = Math.max(healthy + critical, 1);
    return {
      healthy,
      critical,
      healthyPct: (healthy / total) * 100,
      criticalPct: (critical / total) * 100,
    };
  }, [enginePhaseTrend]);

  const maxStep = enginePhaseTrend[enginePhaseTrend.length - 1]?.step ?? null;
  const degradationStartStep = useMemo(() => {
    if (maxStep == null) return null;
    return Math.max(1, maxStep - 20);
  }, [maxStep]);

  const renderIntervalTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: ReadonlyArray<{
      payload?: {
        engine: number;
        low: number;
        mid: number;
        high: number;
        true: number;
      };
    }>;
    label?: number | string;
  }) => {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload;
    if (!point) return null;

    return (
      <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-sm">
        <p className="mb-1 font-medium">Engine {label}</p>
        {intervalMode !== "median" ? <p>Low: {point.low.toFixed(2)}</p> : null}
        {intervalMode !== "median" ? <p>High: {point.high.toFixed(2)}</p> : null}
        {intervalMode !== "band" ? <p>Median: {point.mid.toFixed(2)}</p> : null}
        {intervalMode !== "band" ? <p>True RUL: {point.true.toFixed(2)}</p> : null}
      </div>
    );
  };

  useEffect(() => {
    if (selectedEngine == null) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const nodes = metricsGridRef.current?.querySelectorAll<HTMLElement>("[data-metric-anim='true']");
    nodes?.forEach((el) => {
      el.animate(
        [
          { opacity: 0.75, transform: "translateY(3px)" },
          { opacity: 1, transform: "translateY(0px)" },
        ],
        { duration: 170, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );
    });

    const currentInside = selected?.inside_interval ?? null;
    if (
      prevInsideIntervalRef.current != null &&
      currentInside != null &&
      prevInsideIntervalRef.current !== currentInside
    ) {
      coverageBadgeRef.current?.animate(
        [
          { opacity: 0.75, transform: "translateY(3px)" },
          { opacity: 1, transform: "translateY(0px)" },
        ],
        { duration: 170, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );
    }
    prevInsideIntervalRef.current = currentInside;
  }, [selected, selectedEngine]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/80 bg-card/40 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold md:text-2xl">Interactive Prognostics Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Engine-level exploration of predictions, uncertainty, and feature attribution.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">FD001 test engines</Badge>
              <Badge variant="outline">Sensor view: last 30 observed cycles</Badge>
              <Badge variant="outline">RUL cap: 125 cycles</Badge>
            </div>
          </div>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Home
          </Link>
        </div>
      </div>

      <div ref={metricsGridRef} className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border/70">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Engine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <select
                className="h-10 w-full appearance-none rounded-md border border-border bg-background px-3 pr-10 text-sm"
                value={selectedEngine ?? ""}
                onChange={(e) => setSelectedEngine(Number(e.target.value))}
              >
                {engineIds.map((id) => (
                  <option key={id} value={id}>
                    Engine {id}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Predicted RUL (median)</CardTitle>
          </CardHeader>
          <CardContent>
            <p data-metric-anim="true" className="text-2xl font-bold tabular-nums">
              {selected?.rul_mid.toFixed(2) ?? "--"}
            </p>
            <p className="text-xs text-muted-foreground">
              Interval [{selected?.rul_low.toFixed(1) ?? "--"}, {selected?.rul_high.toFixed(1) ?? "--"}]
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">True RUL</CardTitle>
          </CardHeader>
          <CardContent>
            <p data-metric-anim="true" className="text-2xl font-bold tabular-nums">
              {selected?.y_true.toFixed(2) ?? "--"}
            </p>
            <p className="text-xs text-muted-foreground">Ground-truth value for selected engine</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-1.5 text-sm">
              Confidence
              <TooltipProvider delayDuration={180}>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Explain confidence metric"
                      className="inline-flex size-4 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <CircleHelp className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-left leading-relaxed">
                    <p>
                      Confidence summarizes interval sharpness, not correctness.
                      Narrower prediction intervals imply higher confidence.
                    </p>
                    <p className="mt-1">
                      Formula: <span className="font-semibold">confidence = exp(-width / k)</span>,
                      where <span className="font-semibold">width = high - low</span> and{" "}
                      <span className="font-semibold">k</span> is the median interval width
                      across engines.
                    </p>
                  </TooltipContent>
                </UiTooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p data-metric-anim="true" className="text-2xl font-bold tabular-nums">
              {selected ? `${(selected.confidence * 100).toFixed(1)}%` : "--"}
            </p>
            <p className="text-xs text-muted-foreground">
              Width {selected?.width.toFixed(2) ?? "--"} cycles
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-1.5 text-sm">
              Coverage status
              <TooltipProvider delayDuration={180}>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Explain global coverage metric"
                      className="inline-flex size-4 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <CircleHelp className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-left leading-relaxed">
                    <p>
                      Coverage is the fraction of engines whose true RUL lies inside the
                      predicted interval [low, high].
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold">83%</span> means the interval
                      contained true RUL for 83 out of 100 engines in this evaluation.
                    </p>
                  </TooltipContent>
                </UiTooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div ref={coverageBadgeRef}>
              <Badge variant={selected?.inside_interval ? "default" : "secondary"}>
              {selected?.inside_interval ? "Inside interval" : "Outside interval"}
              </Badge>
            </div>
            {!selected?.inside_interval && selected ? (
              <p className="text-xs text-muted-foreground">
                {selected.y_true < selected.rul_low
                  ? `Miss: true RUL is ${(selected.rul_low - selected.y_true).toFixed(1)} cycles below the lower bound.`
                  : `Miss: true RUL is ${(selected.y_true - selected.rul_high).toFixed(1)} cycles above the upper bound.`}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Global coverage {(metrics.coverage * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="size-4 text-primary" />
              Sensor trend (selected engine)
              <TooltipProvider delayDuration={180}>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Explain sensor trend chart"
                      className="inline-flex size-4 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <CircleHelp className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-left leading-relaxed">
                    <p>
                      Shows the selected sensor over the last 30 cycles for the chosen engine.
                      Blue is the smoothed signal used by the model.
                    </p>
                  </TooltipContent>
                </UiTooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sensorOptions.length > 0 ? (
              <div className="relative w-full max-w-sm">
                <select
                  className="h-9 w-full appearance-none rounded-md border border-border bg-background px-3 pr-10 text-sm"
                  value={selectedSensor}
                  onChange={(e) => setSelectedSensor(e.target.value)}
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
            {sensorDisplayMode === "relative" ? (
              <p className="text-xs text-muted-foreground">
                Auto-scaled to relative change (%): this sensor varies very little in absolute units.
              </p>
            ) : null}
            {isEngineSeriesLoading ? (
              <div className="h-[320px] animate-pulse rounded-lg border border-border/60 bg-muted/30" />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensorPlotData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="cycle" stroke={colors.axis} fontSize={11}>
                      <Label value="Cycle" position="insideBottom" offset={-2} />
                    </XAxis>
                    <YAxis
                      stroke={colors.axis}
                      fontSize={11}
                      domain={sensorYAxisDomain}
                      tickFormatter={(value) =>
                        sensorDisplayMode === "relative" ? `${Number(value).toFixed(2)}%` : Number(value).toFixed(2)
                      }
                    >
                      <Label
                        value={sensorDisplayMode === "relative" ? "Sensor value change (%)" : "Sensor value"}
                        angle={-90}
                        position="insideLeft"
                        style={{ textAnchor: "middle" }}
                      />
                    </YAxis>
                    <Tooltip />
                    <Line
                      dataKey="rawPlot"
                      stroke={colors.true}
                      strokeWidth={1.5}
                      dot={false}
                      connectNulls
                    />
                    <Line
                      dataKey="smoothedPlot"
                      stroke={colors.pred}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Radar className="size-4 text-primary" />
              SHAP explanation
              <TooltipProvider delayDuration={180}>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Explain SHAP chart"
                      className="inline-flex size-4 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <CircleHelp className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-left leading-relaxed">
                    <p>
                      Ranks features by contribution magnitude to the prediction. Local explains
                      the selected engine and global shows overall model behavior.
                    </p>
                  </TooltipContent>
                </UiTooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex gap-2">
              {(["local", "global"] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs capitalize",
                    shapView === view
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  )}
                  onClick={() => setShapView(view)}
                >
                  {view}
                </button>
              ))}
            </div>
            {shapView === "local" && !localShap ? (
              <p className="mb-3 text-xs text-muted-foreground">
                Local SHAP file not found in <code>/public/data/shap_local</code>; showing global
                ranking fallback.
              </p>
            ) : null}
            {isLocalShapLoading ? (
              <div className="h-[320px] animate-pulse rounded-lg border border-border/60 bg-muted/30" />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shapBars}
                    layout="vertical"
                    margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                    <XAxis type="number" stroke={colors.axis} fontSize={11}>
                      <Label value="SHAP value" position="insideBottom" offset={-2} />
                    </XAxis>
                    <YAxis
                      type="category"
                      dataKey="feature"
                      width={150}
                      stroke={colors.axis}
                      fontSize={10}
                    >
                      <Label
                        value="Feature"
                        angle={-90}
                        position="insideLeft"
                        style={{ textAnchor: "middle" }}
                      />
                    </YAxis>
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      fill={shapView === "local" ? "var(--chart-3)" : "var(--chart-1)"}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2 text-base">
            Engine Phase Split and Capping Rationale
            <TooltipProvider delayDuration={180}>
              <UiTooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Explain phase split and capping chart"
                    className="inline-flex size-4 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <CircleHelp className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left leading-relaxed">
                  <p>
                    RUL-only degradation trajectory (implicit progression from start to end of life)
                    with a phase split at RUL = 20: critical (RUL ≤ 20) vs healthy (RUL &gt; 20).
                    Dashed line shows capped trajectory (RUL cap = 125) for direct comparison.
                  </p>
                </TooltipContent>
              </UiTooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="inline-block h-0.5 w-8 bg-violet-400" />
              <span>RUL trajectory (uncapped)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-0 w-8 border-t-2 border-dashed border-[var(--chart-2)]" />
              <span>RUL trajectory (capped at 125)</span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enginePhaseTrend} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis dataKey="step" hide />
                <YAxis stroke={colors.axis} fontSize={11}>
                  <Label value="RUL (cycles)" angle={-90} position="insideLeft" style={{ textAnchor: "middle" }} />
                </YAxis>
                <Tooltip />
                {degradationStartStep != null && maxStep != null ? (
                  <>
                    <ReferenceArea x1={1} x2={degradationStartStep} fill="#86efac" fillOpacity={0.18} />
                    <ReferenceArea x1={degradationStartStep} x2={maxStep} fill="#fca5a5" fillOpacity={0.22} />
                  </>
                ) : null}
                <Line
                  dataKey="rul"
                  name="RUL trajectory (uncapped)"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  dataKey="rulCapped"
                  name="RUL trajectory (capped at 125)"
                  stroke="var(--chart-2)"
                  strokeDasharray="5 4"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Selected engine phase share (of total cycles)</p>
            <div className="flex w-full">
              <div
                className="relative min-w-0 pt-3 text-emerald-700"
                style={{ width: `${enginePhaseCounts.healthyPct}%` }}
              >
                <span className="absolute left-0 top-0 h-2 border-l-2 border-emerald-400" />
                <span className="absolute right-0 top-0 h-2 border-r-2 border-emerald-400" />
                <span className="absolute inset-x-0 top-0 border-t-2 border-emerald-400" />
                <p className="truncate text-center text-[11px] font-medium">
                  Healthy {enginePhaseCounts.healthyPct.toFixed(1)}%
                </p>
              </div>
              <div
                className="relative min-w-0 pt-3 text-rose-700"
                style={{ width: `${enginePhaseCounts.criticalPct}%` }}
              >
                <span className="absolute left-0 top-0 h-2 border-l-2 border-rose-400" />
                <span className="absolute right-0 top-0 h-2 border-r-2 border-rose-400" />
                <span className="absolute inset-x-0 top-0 border-t-2 border-rose-400" />
                <p className="truncate text-center text-[11px] font-medium">
                  Critical {enginePhaseCounts.criticalPct.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            RUL capping (125 cycles) mitigates long healthy-phase dominance so training focuses more on
            degradation-critical behavior.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2 text-base">
            Quantile interval chart (across engines)
            <TooltipProvider delayDuration={180}>
              <UiTooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Explain quantile interval chart"
                    className="inline-flex size-4 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <CircleHelp className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left leading-relaxed">
                  <p>
                    Compares predicted low/median/high RUL against true RUL for all engines.
                    Use mode buttons to switch between full quantiles, band-only, and median view.
                  </p>
                </TooltipContent>
              </UiTooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["all", "band", "median"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1 text-xs capitalize",
                  intervalMode === mode
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                )}
                onClick={() => setIntervalMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {intervalMode === "all" && "Showing true RUL, median, and low/high quantile lines."}
            {intervalMode === "band" && "Showing uncertainty band (low-high area) only."}
            {intervalMode === "median" && "Showing median prediction with true RUL only."}
          </p>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={intervalAcrossEngines} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis dataKey="engine" stroke={colors.axis} fontSize={11}>
                  <Label value="Engine ID" position="insideBottom" offset={-2} />
                </XAxis>
                <YAxis stroke={colors.axis} fontSize={11}>
                  <Label value="RUL (cycles)" angle={-90} position="insideLeft" style={{ textAnchor: "middle" }} />
                </YAxis>
                <Tooltip content={renderIntervalTooltip} />
                {selectedEngine != null ? (
                  <ReferenceLine x={selectedEngine} stroke={colors.axis} strokeDasharray="4 4" />
                ) : null}
                {intervalMode !== "median" ? (
                  <Area
                    type="monotone"
                    dataKey="high"
                    stroke="transparent"
                    fill="var(--chart-1)"
                    fillOpacity={0.08}
                  />
                ) : null}
                {intervalMode !== "median" ? (
                  <Area
                    type="monotone"
                    dataKey="low"
                    stroke="transparent"
                    fill="var(--card)"
                    fillOpacity={1}
                  />
                ) : null}
                {intervalMode !== "band" ? (
                  <Line dataKey="mid" stroke={colors.pred} strokeWidth={2} dot={false} />
                ) : null}
                {intervalMode === "all" ? (
                  <>
                    <Line dataKey="low" stroke={colors.low} strokeWidth={1.3} dot={false} />
                    <Line dataKey="high" stroke={colors.high} strokeWidth={1.3} dot={false} />
                  </>
                ) : null}
                {intervalMode !== "band" ? (
                  <Line dataKey="true" stroke={colors.true} strokeWidth={1.8} dot={false} />
                ) : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
