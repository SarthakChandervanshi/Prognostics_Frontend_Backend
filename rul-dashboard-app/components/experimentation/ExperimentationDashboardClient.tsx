"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ChevronDown, CircleHelp, FlaskConical, ShieldCheck, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SensorMeanStdByRulChart from "@/components/dashboard/SensorMeanStdByRulChart";
import type { Metrics, PredictionRow, ShapGlobal } from "@/lib/types";
import { cn } from "@/lib/utils";
const PLAY_SYMBOL = "▶";
const PAUSE_SYMBOL = "⏸";
const NON_CONSTANT_RAW_SENSORS = [
  "sensor_measurement_2",
  "sensor_measurement_3",
  "sensor_measurement_4",
  "sensor_measurement_6",
  "sensor_measurement_7",
  "sensor_measurement_8",
  "sensor_measurement_9",
  "sensor_measurement_11",
  "sensor_measurement_12",
  "sensor_measurement_13",
  "sensor_measurement_14",
  "sensor_measurement_15",
  "sensor_measurement_17",
  "sensor_measurement_20",
  "sensor_measurement_21",
] as const;

const TREND_FEATURE_OPTIONS: readonly string[] = NON_CONSTANT_RAW_SENSORS;
/** Fresh `string[]` for props that are not typed as `readonly` (stable reference at module load). */
const TREND_FEATURE_OPTIONS_LIST: string[] = Array.from(TREND_FEATURE_OPTIONS);
/** Y-axis width (px) — `phase` bar uses the same `paddingLeft` (plot alignment). */
const PHASE_CHART_Y_AXIS_PX = 56;
const PHASE_RUL_THRESHOLD = 20;
const RUL_CAP = 125;

type Props = {
  metrics: Metrics;
  predictions: PredictionRow[];
  shapGlobal: ShapGlobal;
};

type RiskTier = "High" | "Medium" | "Low";

type FleetRow = PredictionRow & {
  error_signed: number;
  error_abs: number;
  risk_tier: RiskTier;
};

type EngineSeriesRow = {
  cycle: number;
  sensors?: Record<string, number>;
  operational?: Record<string, number>;
  smoothed?: Record<string, number>;
  features?: Record<string, number>;
  rul_low?: number;
  rul_mid?: number;
  rul_high?: number;
  y_true?: number;
};
type RawEngineSeriesRow = {
  cycle: number;
  sensors?: Record<string, number>;
  operational?: Record<string, number>;
};

type LocalShapPayload = {
  engine_id: number;
  values: { feature: string; shap_value: number }[];
};

const QUADRANT_TOUR_STEPS = [
  {
    id: "high-rul-low-uncertainty",
    title: "Quadrant 1: Higher RUL, Lower Uncertainty",
    description:
      "Monitor zone. Engines show more remaining life, but this quadrant is treated as medium priority in the current rule map.",
    fill: "#f59e0b",
  },
  {
    id: "high-rul-high-uncertainty",
    title: "Quadrant 2: Higher RUL, Higher Uncertainty",
    description:
      "Routine zone. Engines have higher remaining life; despite wider intervals, this quadrant is treated as low risk in this dashboard.",
    fill: "#10b981",
  },
  {
    id: "low-rul-high-uncertainty",
    title: "Quadrant 3: Lower RUL, Higher Uncertainty",
    description:
      "Monitor zone. Engines are lower-RUL but higher-uncertainty, so they remain medium priority for follow-up.",
    fill: "#f59e0b",
  },
  {
    id: "low-rul-low-uncertainty",
    title: "Quadrant 4: Lower RUL, Lower Uncertainty",
    description:
      "Highest-priority zone. Engines are lower-RUL with tighter intervals, so this quadrant is marked high risk.",
    fill: "#ef4444",
  },
] as const;

const colors = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
  primary: "var(--chart-1)",
  secondary: "var(--chart-3)",
  grid: "color-mix(in oklch, var(--border) 55%, transparent)",
  axis: "var(--muted-foreground)",
};

/** Local SHAP bar colors: app purple scale (not risk red/green). */
const localShapBarFill = {
  positive: "var(--chart-1)",
  negative: "var(--chart-3)",
} as const;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx] ?? 0;
}

function deriveRiskTier(row: PredictionRow, widthP50: number): RiskTier {
  const isLeft = row.rul_mid <= 40;
  const isBottom = row.width < widthP50;
  if (isLeft && isBottom) return "High";
  if ((isLeft && !isBottom) || (!isLeft && isBottom)) return "Medium";
  return "Low";
}

function riskColor(risk: RiskTier): string {
  if (risk === "High") return colors.high;
  if (risk === "Medium") return colors.medium;
  return colors.low;
}

function fmt(n: number, d = 1): string {
  return Number.isFinite(n) ? n.toFixed(d) : "-";
}

function roundUpToStep(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

function buildTicks(max: number, step: number): number[] {
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  return ticks;
}

/** Recharts `ResponsiveContainer` needs a non-zero parent box; use on wrappers in flex/grid. */
const chartWrap = "min-h-0 min-w-0 w-full";

export default function ExperimentationDashboardClient({
  metrics,
  predictions,
  shapGlobal,
}: Props) {
  const widthsSorted = useMemo(
    () => [...predictions.map((p) => p.width)].sort((a, b) => a - b),
    [predictions]
  );
  const widthP50 = useMemo(() => percentile(widthsSorted, 0.5), [widthsSorted]);

  const fleetRows = useMemo<FleetRow[]>(
    () =>
      predictions.map((p) => ({
        ...p,
        error_signed: p.y_true - p.rul_mid,
        error_abs: Math.abs(p.y_true - p.rul_mid),
        risk_tier: deriveRiskTier(p, widthP50),
      })),
    [predictions, widthP50]
  );

  const [riskFilter, setRiskFilter] = useState<"All" | RiskTier>("All");
  const [confidenceMinPct, setConfidenceMinPct] = useState(0);
  const [selectedEngine, setSelectedEngine] = useState<number | null>(null);
  const [selectedTrendFeature, setSelectedTrendFeature] = useState<string>("");
  const [quadrantTourStep, setQuadrantTourStep] = useState<number | null>(null);
  const [engineSeries, setEngineSeries] = useState<EngineSeriesRow[] | null>(null);
  const [engineSeriesLoadedFor, setEngineSeriesLoadedFor] = useState<number | null>(null);
  const [localShap, setLocalShap] = useState<LocalShapPayload | null>(null);
  const [localShapLoadedFor, setLocalShapLoadedFor] = useState<number | null>(null);

  const minConfidencePct = 0;
  const maxConfidencePct = 80;
  const filteredRows = useMemo(() => {
    const confidenceMin = confidenceMinPct / 100;
    return fleetRows.filter((r) => {
      const riskOk = riskFilter === "All" || r.risk_tier === riskFilter;
      return riskOk && r.confidence >= confidenceMin;
    });
  }, [fleetRows, riskFilter, confidenceMinPct]);

  const priorityRows = useMemo(() => {
    const rows = [...filteredRows];
    rows.sort((a, b) => a.rul_low - b.rul_low);
    return rows;
  }, [filteredRows]);

  const selectorEngineIds = useMemo(
    () => [...new Set(fleetRows.map((r) => r.engine_id))].sort((a, b) => a - b),
    [fleetRows]
  );

  useEffect(() => {
    if (priorityRows.length === 0) {
      setSelectedEngine(null);
      return;
    }
    if (selectedEngine == null || !priorityRows.some((r) => r.engine_id === selectedEngine)) {
      setSelectedEngine(priorityRows[0]?.engine_id ?? null);
    }
  }, [priorityRows, selectedEngine]);

  const selectedRow = useMemo(
    () => fleetRows.find((r) => r.engine_id === selectedEngine) ?? null,
    [fleetRows, selectedEngine]
  );
  const selectedRiskMeta = useMemo(() => {
    if (!selectedRow) return null;
    if (selectedRow.risk_tier === "High") {
      return {
        label: "High risk",
        cardClass: "border-red-300 bg-red-100/80 dark:border-red-900/60 dark:bg-red-950/40",
        textClass: "text-red-700 dark:text-red-300",
        Icon: AlertTriangle,
      };
    }
    if (selectedRow.risk_tier === "Medium") {
      return {
        label: "Medium risk",
        cardClass: "border-amber-300 bg-amber-100/80 dark:border-amber-900/60 dark:bg-amber-950/40",
        textClass: "text-amber-700 dark:text-amber-300",
        Icon: Wrench,
      };
    }
    return {
      label: "Low risk",
      cardClass: "border-emerald-300 bg-emerald-100/80 dark:border-emerald-900/60 dark:bg-emerald-950/40",
      textClass: "text-emerald-700 dark:text-emerald-300",
      Icon: ShieldCheck,
    };
  }, [selectedRow]);

  useEffect(() => {
    if (selectedEngine == null) return;
    let active = true;

    Promise.all([
      fetch(`/data/engine_series/engine_${selectedEngine}.json`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`/data/raw_engine_series/engine_${selectedEngine}.json`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([enginePayload, rawPayload]) => {
        if (!active) return;
        const baseRows = Array.isArray(enginePayload?.rows)
          ? (enginePayload.rows as EngineSeriesRow[])
          : null;
        const rawRows = Array.isArray(rawPayload?.rows) ? (rawPayload.rows as RawEngineSeriesRow[]) : [];
        const rawByCycle = new Map<number, RawEngineSeriesRow>(
          rawRows.map((row) => [row.cycle, row] as const)
        );
        const rows = baseRows?.map((row) => {
          const raw = rawByCycle.get(row.cycle);
          return {
            ...row,
            sensors:
              row.sensors && Object.keys(row.sensors).length > 0
                ? row.sensors
                : (raw?.sensors ?? {}),
            operational: raw?.operational ?? {},
          };
        }) ?? null;
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
        } else {
          setLocalShap(null);
        }
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

  useEffect(() => {
    if (TREND_FEATURE_OPTIONS.length === 0) {
      setSelectedTrendFeature("");
      return;
    }
    if (!selectedTrendFeature || !TREND_FEATURE_OPTIONS.includes(selectedTrendFeature)) {
      const preferred =
        TREND_FEATURE_OPTIONS.find((k) => k.startsWith("sensor_measurement_")) ?? TREND_FEATURE_OPTIONS[0];
      setSelectedTrendFeature(preferred ?? "");
    }
  }, [selectedTrendFeature]);

  const trendSeries = useMemo(() => {
    if (!engineSeries?.length) return [];
    return engineSeries.map((r) => ({
      cycle: r.cycle,
      value: selectedTrendFeature
        ? (r.sensors?.[selectedTrendFeature] ??
          r.smoothed?.[selectedTrendFeature] ??
          r.features?.[selectedTrendFeature] ??
          null)
        : null,
      low: r.rul_low ?? null,
      mid: r.rul_mid ?? null,
      high: r.rul_high ?? null,
      true: r.y_true ?? null,
    }));
  }, [engineSeries, selectedTrendFeature]);

  const hasPerCycleRul = useMemo(
    () => trendSeries.some((r) => r.low != null || r.mid != null || r.high != null),
    [trendSeries]
  );
  const enginePhaseTrend = useMemo(() => {
    if (!engineSeries?.length || !selectedRow) return [];
    const ordered = [...engineSeries].sort((a, b) => a.cycle - b.cycle);
    const lastObservedCycle = ordered[ordered.length - 1]?.cycle ?? 0;
    if (lastObservedCycle <= 0) return [];
    const cyclesToFailure = Math.max(0, Math.round(selectedRow.y_true));
    const totalSteps = lastObservedCycle + cyclesToFailure;

    return Array.from({ length: totalSteps }, (_, idx) => {
      const step = idx + 1;
      const rul = Math.max(0, selectedRow.y_true + (lastObservedCycle - step));
      return {
        step,
        rul,
        rulCapped: Math.min(RUL_CAP, rul),
      };
    });
  }, [engineSeries, selectedRow]);
  const maxStep = useMemo(
    () => enginePhaseTrend[enginePhaseTrend.length - 1]?.step ?? null,
    [enginePhaseTrend]
  );
  const degradationStartStep = useMemo(
    () => (maxStep == null ? null : Math.max(1, maxStep - PHASE_RUL_THRESHOLD)),
    [maxStep]
  );
  const enginePhaseCounts = useMemo(() => {
    if (!enginePhaseTrend.length) return { healthyPct: 0, criticalPct: 0 };
    const healthy = enginePhaseTrend.filter((d) => d.rul > PHASE_RUL_THRESHOLD).length;
    const critical = enginePhaseTrend.length - healthy;
    return {
      healthyPct: (healthy / enginePhaseTrend.length) * 100,
      criticalPct: (critical / enginePhaseTrend.length) * 100,
    };
  }, [enginePhaseTrend]);

  const riskHistogram = useMemo(() => {
    const bins = Array.from({ length: 8 }, (_, i) => ({
      label: `${i * 20}-${i * 20 + 20}`,
      low: i * 20,
      high: i * 20 + 20,
      count: 0,
    }));
    for (const row of filteredRows) {
      const idx = Math.max(0, Math.min(7, Math.floor(row.rul_mid / 20)));
      const bin = bins[idx];
      if (bin) bin.count += 1;
    }
    return bins;
  }, [filteredRows]);

  const scatterData = useMemo(
    () =>
      filteredRows.map((r) => ({
        engine_id: r.engine_id,
        rul_mid: r.rul_mid,
        width: r.width,
        confidence: r.confidence,
        risk_tier: r.risk_tier,
      })),
    [filteredRows]
  );
  const scatterRawXMax = useMemo(
    () => Math.max(45, ...scatterData.map((d) => d.rul_mid)),
    [scatterData]
  );
  const scatterRawYMax = useMemo(
    () => Math.max(10, ...scatterData.map((d) => d.width), widthP50),
    [scatterData, widthP50]
  );
  const scatterXMax = useMemo(
    () => roundUpToStep(scatterRawXMax + 4, 20),
    [scatterRawXMax]
  );
  const scatterYMax = useMemo(
    () => roundUpToStep(scatterRawYMax + 4, 10),
    [scatterRawYMax]
  );
  const scatterXTicks = useMemo(() => buildTicks(scatterXMax, 20), [scatterXMax]);
  const scatterYTicks = useMemo(() => buildTicks(scatterYMax, 10), [scatterYMax]);

  useEffect(() => {
    if (quadrantTourStep == null) return;
    const timer = window.setTimeout(() => {
      setQuadrantTourStep((prev) => {
        if (prev == null) return null;
        return prev >= QUADRANT_TOUR_STEPS.length - 1 ? null : prev + 1;
      });
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [quadrantTourStep]);

  const tourQuadrants = useMemo(
    () => [
      { ...QUADRANT_TOUR_STEPS[0], x1: 40, x2: scatterXMax, y1: 0, y2: widthP50 },
      { ...QUADRANT_TOUR_STEPS[1], x1: 40, x2: scatterXMax, y1: widthP50, y2: scatterYMax },
      { ...QUADRANT_TOUR_STEPS[2], x1: 0, x2: 40, y1: widthP50, y2: scatterYMax },
      { ...QUADRANT_TOUR_STEPS[3], x1: 0, x2: 40, y1: 0, y2: widthP50 },
    ],
    [scatterXMax, scatterYMax, widthP50]
  );

  const activeQuadrant = useMemo(
    () => (quadrantTourStep == null ? null : tourQuadrants[quadrantTourStep] ?? null),
    [quadrantTourStep, tourQuadrants]
  );

  const intervalPlotData = useMemo(
    () =>
      [...filteredRows]
        .sort((a, b) => a.engine_id - b.engine_id)
        .map((r) => ({
          engine_id: r.engine_id,
          low: r.rul_low,
          high: r.rul_high,
          true: r.y_true,
        })),
    [filteredRows]
  );

  const coverageData = useMemo(() => {
    const inside = filteredRows.filter((r) => r.inside_interval).length;
    const outside = filteredRows.length - inside;
    return [
      { name: "Inside Interval", value: inside, fill: colors.low },
      { name: "Outside Interval", value: outside, fill: colors.high },
    ];
  }, [filteredRows]);

  const errorData = useMemo(
    () =>
      [...filteredRows]
        .sort((a, b) => a.engine_id - b.engine_id)
        .map((r) => ({ engine_id: r.engine_id, error: r.error_signed })),
    [filteredRows]
  );

  const globalShapBars = useMemo(
    () =>
      [...shapGlobal.values]
        .sort((a, b) => b.mean_abs_shap - a.mean_abs_shap)
        .slice(0, 12)
        .map((v) => ({ feature: v.feature, value: v.mean_abs_shap })),
    [shapGlobal]
  );

  const localShapBars = useMemo(() => {
    if (!localShap?.values) return [];
    return [...localShap.values]
      .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
      .slice(0, 12)
      .map((v) => ({ feature: v.feature, value: v.shap_value }));
  }, [localShap]);

  const riskTierCounts = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    for (const r of filteredRows) {
      if (r.risk_tier === "High") high += 1;
      else if (r.risk_tier === "Medium") medium += 1;
      else low += 1;
    }
    return { high, medium, low };
  }, [filteredRows]);

  return (
    <div className="min-w-0 space-y-8">
      <div className="rounded-2xl border border-border/70 bg-card/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Fleet overview, uncertainty analysis, engine deep-dive, and SHAP explainability in one place.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Engine-level exploration of predictions, uncertainty, and feature attribution.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-border bg-muted/50 px-3 py-1">
                FD001 test engines
              </span>
              <span className="rounded-full border border-border bg-muted/50 px-3 py-1">
                Scope: last window per engine (100 engines)
              </span>
              <span className="rounded-full border border-border bg-muted/50 px-3 py-1">
                RUL cap: 125 cycles
              </span>
            </div>
          </div>
          <Badge className="rounded-full px-4 py-4 text-base font-medium">
            <FlaskConical className="mr-1.5 h-5 w-5" />
            Decision Support
          </Badge>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">1) Fleet Overview</h2>
        <p className="text-sm text-muted-foreground">
          Global metrics stay fixed; triage charts and table in this section update with Risk Tier
          and Min Confidence filters.
        </p>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <Card className="border-border/70">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">RMSE</CardTitle>
            </CardHeader>
            <CardContent>
              <p data-metric-anim="true" className="text-2xl font-bold tabular-nums">
                {fmt(metrics.RMSE, 2)}
              </p>
              <p className="text-xs text-muted-foreground">Global metric (fleet-wide), lower is better</p>
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center gap-1.5 text-sm">
                NASA Score
                <TooltipProvider delayDuration={180}>
                  <UiTooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="Explain NASA score metric"
                        className="inline-flex size-4 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <CircleHelp className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-left leading-relaxed">
                      <p>
                        NASA score is an asymmetric penalty metric for RUL errors. Late predictions
                        are penalized more than early ones.
                      </p>
                      <p className="mt-1 font-mono text-[11px]">
                        s(d) = exp(-d/13) - 1, if d &lt; 0
                        <br />
                        s(d) = exp(d/10) - 1, if d &gt;= 0
                        <br />
                        Score = Σ s(d), where d = y_pred - y_true
                      </p>
                    </TooltipContent>
                  </UiTooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p data-metric-anim="true" className="text-2xl font-bold tabular-nums">
                {fmt(metrics.NASA_score, 1)}
              </p>
              <p className="text-xs text-muted-foreground">Global metric (fleet-wide), penalty-weighted error</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid min-w-0 gap-4 xl:grid-cols-3">
          <Card className="min-w-0 xl:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  Risk Quadrant Scatter (RUL Mid vs Width)
                  <TooltipProvider delayDuration={150}>
                    <UiTooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
                          aria-label="Explain risk quadrant chart"
                        >
                          <CircleHelp className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs leading-relaxed">
                      <p>
                        This chart helps prioritize engines: left of the red line (
                        <code>RUL_MID &lt; 40</code>) indicates lower remaining life, and above the yellow line
                        indicates higher-than-median uncertainty.
                      </p>
                        <p className="mt-2">
                          The red dashed line at <code>RUL_MID = 40</code> marks a monitor zone guide. It is not
                          the critical cutoff.
                        </p>
                      <p className="mt-2">
                        Priority map used in this view: bottom-left is red (highest priority),
                        top-left and bottom-right are yellow (monitor), and top-right is green
                        (routine monitoring).
                      </p>
                      </TooltipContent>
                    </UiTooltip>
                  </TooltipProvider>
                </CardTitle>
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
                  onClick={() => {
                    if (quadrantTourStep != null) {
                      // Pause immediately ends the tour and clears all highlights.
                      setQuadrantTourStep(null);
                      return;
                    }
                    setQuadrantTourStep(0);
                  }}
                >
                  <span
                    aria-hidden
                    className={cn("mr-1 leading-none", quadrantTourStep != null ? "text-base" : "text-sm")}
                  >
                    {quadrantTourStep != null ? PAUSE_SYMBOL : PLAY_SYMBOL}
                  </span>
                  {quadrantTourStep != null ? "Pause Quadrant Tour" : "Play Quadrant Tour"}
                </button>
              </div>
            </CardHeader>
            <CardContent className="min-w-0 space-y-3">
              <div className={cn("h-[268px]", chartWrap)}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <ScatterChart margin={{ top: 10, right: 16, bottom: 14, left: 0 }}>
                  <CartesianGrid stroke={colors.grid} />
                  <XAxis
                    type="number"
                    dataKey="rul_mid"
                    stroke={colors.axis}
                    domain={[0, scatterXMax]}
                    ticks={scatterXTicks}
                    tickFormatter={(value) => (Number(value) === 0 ? "" : String(value))}
                  >
                    <Label value="Predicted Median RUL" position="insideBottom" offset={-8} />
                  </XAxis>
                  <YAxis
                    type="number"
                    dataKey="width"
                    stroke={colors.axis}
                    domain={[0, scatterYMax]}
                    ticks={scatterYTicks}
                    tickFormatter={(value) => (Number(value) === 0 ? "" : String(value))}
                  >
                    <Label value="Interval Width" angle={-90} position="insideLeft" dy={33} />
                  </YAxis>
                  <Tooltip
                    cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
                    formatter={(value, name) => {
                      const numeric = typeof value === "number" ? value : Number(value);
                      const label =
                        name === "rul_mid" ? "RUL Mid" : name === "width" ? "Width" : "Value";
                      return [fmt(Number.isFinite(numeric) ? numeric : NaN, 2), label];
                    }}
                    labelFormatter={(_, payload) => {
                      const point = payload?.[0]?.payload as { engine_id: number } | undefined;
                      return point ? `Engine ${point.engine_id}` : "";
                    }}
                  />
                  <ReferenceLine x={40} stroke={colors.high} strokeDasharray="4 4" />
                  <ReferenceLine y={widthP50} stroke={colors.medium} strokeDasharray="4 4" />
                  {quadrantTourStep != null
                    ? tourQuadrants.map((q, idx) => (
                        <ReferenceArea
                          key={`tour-quadrant-${q.id}`}
                          x1={q.x1}
                          x2={q.x2}
                          y1={q.y1}
                          y2={q.y2}
                          fill={q.fill}
                          fillOpacity={0.22}
                          opacity={quadrantTourStep === idx ? 1 : 0}
                          style={{ transition: "opacity 800ms ease" }}
                          strokeOpacity={0}
                        />
                      ))
                    : null}
                  <ReferenceDot
                    x={0}
                    y={0}
                    r={0}
                    ifOverflow="extendDomain"
                    label={{
                      value: "0",
                      position: "insideTopRight",
                      fill: "var(--muted-foreground)",
                      fontSize: 11,
                    }}
                  />
                  <Scatter
                    data={scatterData}
                    onClick={(point) => {
                      const maybeEngine = (point as { payload?: { engine_id?: number } } | undefined)
                        ?.payload?.engine_id;
                      if (typeof maybeEngine === "number") setSelectedEngine(maybeEngine);
                    }}
                  >
                    {scatterData.map((entry) => (
                      <Cell
                        key={`scatter-${entry.engine_id}`}
                        fill={riskColor(entry.risk_tier)}
                        stroke={selectedEngine === entry.engine_id ? "var(--foreground)" : "transparent"}
                        strokeWidth={selectedEngine === entry.engine_id ? 2 : 0}
                      />
                    ))}
                  </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              {activeQuadrant ? (
                <div
                  key={activeQuadrant.id}
                  className="animate-in fade-in-0 slide-in-from-bottom-1 duration-500 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs"
                >
                  <p className="font-medium text-foreground">{activeQuadrant.title}</p>
                  <p className="mt-1 text-muted-foreground">{activeQuadrant.description}</p>
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/90">Legend</span>
                <TooltipProvider delayDuration={150}>
                  <UiTooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Explain risk tier rules"
                      >
                        <CircleHelp className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm text-xs leading-relaxed">
                      <p>Dot colors follow quadrant-based risk rules:</p>
                      <p className="mt-2">
                        <span className="font-semibold">High (red):</span> bottom-left quadrant (
                        <code>rul_mid ≤ 40</code> and <code>width &lt; widthP50</code>).
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold">Medium (amber):</span> top-left or
                        bottom-right quadrants.
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold">Low (green):</span> top-right quadrant (
                        <code>rul_mid &gt; 40</code> and <code>width ≥ widthP50</code>).
                      </p>
                      <p className="mt-2">
                        Here <code>width = rul_high - rul_low</code> and <code>widthP50</code> is
                        the median interval width.
                      </p>
                    </TooltipContent>
                  </UiTooltip>
                </TooltipProvider>
              </div>
              <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-8 border-t-2 border-dashed" style={{ borderColor: colors.high }} />
                  <span>RUL threshold for monitor (RUL_MID = 40)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-8 border-t-2 border-dashed" style={{ borderColor: colors.medium }} />
                  <span>Median Uncertainty (50th Quantile of Interval Width = {fmt(widthP50, 1)})</span>
                </div>
                {activeQuadrant ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-8 rounded-sm"
                      style={{ backgroundColor: activeQuadrant.fill, opacity: 0.5 }}
                    />
                    <span>Tour highlight color for current quadrant</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.high }} />
                  <span>High risk engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.medium }} />
                  <span>Medium risk engine</span>
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.low }} />
                  <span>Low risk engine</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                Risk Distribution
                <TooltipProvider delayDuration={150}>
                  <UiTooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Explain risk distribution chart"
                      >
                        <CircleHelp className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs leading-relaxed">
                      <p>
                        This histogram shows how engines are distributed across predicted median
                        RUL ranges. Taller bars mean more engines in that RUL band.
                      </p>
                      <p className="mt-2">
                        Use it to quickly see whether the fleet is concentrated in lower-RUL
                        bins (higher near-term maintenance pressure) or higher-RUL bins
                        (healthier remaining life).
                      </p>
                    </TooltipContent>
                  </UiTooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-[300px] min-w-0 flex-col">
              <div className={cn("h-[210px]", chartWrap)}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={riskHistogram} margin={{ top: 8, right: 8, left: 0, bottom: 20 }}>
                    <CartesianGrid stroke={colors.grid} vertical={false} />
                    <XAxis dataKey="label" stroke={colors.axis}>
                      <Label value="Predicted RUL (bin)" position="insideBottom" offset={-6} />
                    </XAxis>
                    <YAxis stroke={colors.axis}>
                      <Label value="Engine count" angle={-90} position="insideLeft" dy={30} />
                    </YAxis>
                    <Tooltip />
                    <Bar dataKey="count" fill={colors.primary} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-auto pt-0">
                <p className="text-xs text-muted-foreground">
                  Number of engines in respective categories
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg border border-red-200 bg-red-50/40 p-2 dark:border-red-900/40 dark:bg-red-950/20">
                    <p className="font-semibold text-red-600 dark:text-red-300">{riskTierCounts.high}</p>
                    <p className="text-red-700 dark:text-red-300">High</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-2 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <p className="font-semibold text-amber-500">{riskTierCounts.medium}</p>
                    <p className="text-amber-700 dark:text-amber-300">Medium</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-2 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <p className="font-semibold text-emerald-600">{riskTierCounts.low}</p>
                    <p className="text-emerald-700 dark:text-emerald-300">Low</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              Filters & Interaction Controls
              <TooltipProvider delayDuration={150}>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Explain filter controls"
                    >
                      <CircleHelp className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs leading-relaxed">
                    <p>
                      Engine Selector updates selected-engine panels (snapshot, trends, local SHAP).
                    </p>
                    <p className="mt-2">
                      Risk Tier and Min Confidence filter fleet-level views like scatter, distribution,
                      prediction interval plot, and Top 20 table.
                    </p>
                  </TooltipContent>
                </UiTooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="mb-2 block text-muted-foreground">Engine Selector</span>
              <div className="relative">
                <select
                  value={selectedEngine ?? ""}
                  onChange={(e) => setSelectedEngine(Number(e.target.value))}
                  className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10"
                >
                  {selectorEngineIds.map((engineId) => (
                    <option key={engineId} value={engineId}>
                      Engine {engineId}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </label>
            <label className="space-y-2 text-sm">
              <span className="mb-2 block text-muted-foreground">Risk Tier</span>
              <div className="relative">
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value as "All" | RiskTier)}
                  className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10"
                >
                  <option>All</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-muted-foreground">Min Confidence: {confidenceMinPct}%</span>
              <input
                type="range"
                min={minConfidencePct}
                max={maxConfidencePct}
                step={5}
                value={confidenceMinPct}
                onChange={(e) => setConfidenceMinPct(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                {Array.from(
                  { length: Math.floor((maxConfidencePct - minConfidencePct) / 5) + 1 },
                  (_, i) => minConfidencePct + i * 5
                ).map((pct) => (
                  <span key={pct}>{pct}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Current slider range: {minConfidencePct}% to {maxConfidencePct}%.
              </p>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              Top 20 Priority Engines
              <TooltipProvider delayDuration={150}>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Explain top priority table"
                    >
                      <CircleHelp className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs leading-relaxed">
                    <p>
                      Engines are ranked by lowest <code>rul_low</code> first (most conservative
                      worst-case remaining life).
                    </p>
                    <p className="mt-2">
                      Click any row to select that engine and sync the deep-dive panels.
                    </p>
                  </TooltipContent>
                </UiTooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-purple-300 bg-purple-100/80 dark:border-purple-800 dark:bg-purple-950/40">
                  <TableHead className="rounded-tl-md pl-6 text-purple-900 dark:text-purple-200">Engine</TableHead>
                  <TableHead className="text-purple-900 dark:text-purple-200">RUL Low</TableHead>
                  <TableHead className="text-purple-900 dark:text-purple-200">RUL Mid</TableHead>
                  <TableHead className="text-purple-900 dark:text-purple-200">RUL High</TableHead>
                  <TableHead className="text-purple-900 dark:text-purple-200">Width</TableHead>
                  <TableHead className="text-purple-900 dark:text-purple-200">Confidence</TableHead>
                  <TableHead className="rounded-tr-md text-purple-900 dark:text-purple-200">Risk Tier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priorityRows.slice(0, 20).map((r) => (
                  <TableRow
                    key={r.engine_id}
                    onClick={() => setSelectedEngine(r.engine_id)}
                    className={cn(
                      "cursor-pointer",
                      selectedEngine === r.engine_id && "bg-muted/60"
                    )}
                  >
                    <TableCell className="pl-6 font-medium">Engine {r.engine_id}</TableCell>
                    <TableCell>{fmt(r.rul_low, 1)}</TableCell>
                    <TableCell>{fmt(r.rul_mid, 1)}</TableCell>
                    <TableCell>{fmt(r.rul_high, 1)}</TableCell>
                    <TableCell>{fmt(r.width, 1)}</TableCell>
                    <TableCell>{fmt(r.confidence, 2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={r.risk_tier === "High" ? "destructive" : "secondary"}
                        className={cn(r.risk_tier === "Low" && "bg-emerald-600/20 text-emerald-700")}
                      >
                        {r.risk_tier}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">2) Prediction Quality & Uncertainty</h2>
        <p className="text-sm text-muted-foreground">
          These quality views are fleet-level and respond to Risk Tier and Min Confidence filters.
        </p>
        <div className="grid min-w-0 gap-4 xl:grid-cols-3">
          <Card className="min-w-0 xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Prediction Interval Plot</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] min-w-0">
              <div className={cn("h-full", chartWrap)}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={intervalPlotData} margin={{ top: 10, right: 16, bottom: 14, left: 0 }}>
                  <CartesianGrid stroke={colors.grid} />
                  <XAxis dataKey="engine_id" stroke={colors.axis}>
                    <Label value="Engine ID" position="insideBottom" offset={-8} />
                  </XAxis>
                  <YAxis stroke={colors.axis}>
                    <Label value="RUL" angle={-90} position="insideLeft" />
                  </YAxis>
                  <Tooltip
                    formatter={(value) => fmt(Number(value), 2)}
                    labelFormatter={(engineId, payload) => {
                      const point = payload?.[0]?.payload as { engine_id: number } | undefined;
                      return point ? `Engine ${point.engine_id}` : `Engine ${engineId}`;
                    }}
                  />
                  <Line dataKey="low" stroke={colors.primary} dot={false} strokeWidth={1.3} />
                  <Line dataKey="high" stroke={colors.primary} dot={false} strokeWidth={1.3} />
                  <Line dataKey="true" stroke={colors.secondary} dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Coverage Summary</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0 space-y-3">
              <div className={cn("h-[180px]", chartWrap)}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={coverageData} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid stroke={colors.grid} horizontal={false} />
                    <XAxis type="number" stroke={colors.axis} />
                    <YAxis dataKey="name" type="category" stroke={colors.axis} width={110} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {coverageData.map((c) => (
                        <Cell key={c.name} fill={c.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground">
                Coverage on filtered fleet:{" "}
                <span className="font-semibold text-foreground">
                  {filteredRows.length
                    ? fmt(
                        (filteredRows.filter((r) => r.inside_interval).length / filteredRows.length) * 100,
                        1
                      )
                    : "0.0"}
                  %
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Signed Error Plot (True RUL - Predicted RUL)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] min-w-0">
            <div className={cn("h-full", chartWrap)}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={errorData} margin={{ top: 8, right: 10, bottom: 12, left: 0 }}>
                <CartesianGrid stroke={colors.grid} />
                <XAxis dataKey="engine_id" stroke={colors.axis}>
                  <Label value="Engine ID" position="insideBottom" offset={-8} />
                </XAxis>
                <YAxis stroke={colors.axis}>
                  <Label value="Signed Error" angle={-90} position="insideLeft" />
                </YAxis>
                <Tooltip formatter={(value) => fmt(Number(value), 2)} />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Bar dataKey="error" radius={[4, 4, 0, 0]}>
                  {errorData.map((d) => (
                    <Cell key={`err-${d.engine_id}`} fill={d.error >= 0 ? colors.low : colors.high} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">3) Engine Deep Dive (Selected Engine)</h2>
        <p className="text-sm text-muted-foreground">
          Panels in this section update when you change the selected engine.
        </p>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border/70">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">Predicted RUL (median)</CardTitle>
            </CardHeader>
            <CardContent>
              <p data-metric-anim="true" className="text-2xl font-bold tabular-nums">
                {selectedRow ? fmt(selectedRow.rul_mid, 2) : "--"}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedRow
                  ? `Interval [${fmt(selectedRow.rul_low, 1)}, ${fmt(selectedRow.rul_high, 1)}]`
                  : "Interval [--, --]"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">True RUL</CardTitle>
            </CardHeader>
            <CardContent>
              <p data-metric-anim="true" className="text-2xl font-bold tabular-nums">
                {selectedRow ? fmt(selectedRow.y_true, 2) : "--"}
              </p>
              <p className="text-xs text-muted-foreground">
                Ground-truth value for selected engine
              </p>
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
                        Confidence summarizes interval sharpness, not correctness. Narrower
                        prediction intervals imply higher confidence.
                      </p>
                      <p className="mt-1">
                        Formula: <span className="font-semibold">confidence = exp(-width / k)</span>,
                        where <span className="font-semibold">width = high - low</span> and{" "}
                        <span className="font-semibold">k</span> is median interval width.
                      </p>
                    </TooltipContent>
                  </UiTooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p data-metric-anim="true" className="text-2xl font-bold tabular-nums">
                {selectedRow ? `${fmt(selectedRow.confidence * 100, 1)}%` : "--"}
              </p>
              <p className="text-xs text-muted-foreground">
                Width {selectedRow ? fmt(selectedRow.width, 2) : "--"} cycles
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
                        Coverage is the fraction of engines whose true RUL lies inside predicted
                        interval [low, high].
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold">{fmt(metrics.coverage * 100, 1)}%</span>{" "}
                        means interval contained true RUL for this share of evaluated engines.
                      </p>
                    </TooltipContent>
                  </UiTooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Badge variant={selectedRow?.inside_interval ? "default" : "secondary"}>
                  {selectedRow ? (selectedRow.inside_interval ? "Inside interval" : "Outside interval") : "--"}
                </Badge>
              </div>
              {!selectedRow?.inside_interval && selectedRow ? (
                <p className="text-xs text-muted-foreground">
                  {selectedRow.y_true < selectedRow.rul_low
                    ? `Miss: true RUL is ${fmt(selectedRow.rul_low - selectedRow.y_true, 1)} cycles below lower bound.`
                    : `Miss: true RUL is ${fmt(selectedRow.y_true - selectedRow.rul_high, 1)} cycles above upper bound.`}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Global coverage {fmt(metrics.coverage * 100, 1)}%
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid min-w-0 gap-4 xl:grid-cols-3">
          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Risk Signal (Selected Engine)</CardTitle>
            </CardHeader>
            <CardContent className="h-[360px] text-sm">
              {selectedRow && selectedRiskMeta ? (
                <div
                  className={cn(
                    "flex h-full flex-col items-center justify-center rounded-xl border text-center",
                    selectedRiskMeta.cardClass
                  )}
                >
                  <p className="text-xl font-semibold text-muted-foreground">Engine {selectedRow.engine_id}</p>
                  <selectedRiskMeta.Icon className={cn("mt-3 h-16 w-16", selectedRiskMeta.textClass)} />
                  <p className={cn("mt-4 text-2xl font-semibold", selectedRiskMeta.textClass)}>
                    {selectedRiskMeta.label}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No engine selected.</p>
              )}
            </CardContent>
          </Card>

          <Card className="min-w-0 xl:col-span-2">
            <CardHeader className="pb-2">
              {hasPerCycleRul ? (
                <CardTitle className="text-base">RUL Trend Over Cycles (if available)</CardTitle>
              ) : (
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
                          with a phase split at RUL = 20: critical (RUL &le; 20) vs healthy (RUL &gt; 20).
                          Dashed line shows capped trajectory (RUL cap = 125) for direct comparison.
                        </p>
                      </TooltipContent>
                    </UiTooltip>
                  </TooltipProvider>
                </CardTitle>
              )}
            </CardHeader>
            <CardContent className={hasPerCycleRul ? "h-[280px] min-w-0" : "space-y-4"}>
              {isEngineSeriesLoading ? (
                <p className="text-sm text-muted-foreground">Loading engine series...</p>
              ) : hasPerCycleRul ? (
                <div className={cn("h-full", chartWrap)}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={trendSeries}>
                    <CartesianGrid stroke={colors.grid} />
                    <XAxis dataKey="cycle" stroke={colors.axis} />
                    <YAxis stroke={colors.axis} />
                    <Tooltip formatter={(value) => fmt(Number(value), 2)} />
                    <Line dataKey="low" stroke={colors.primary} dot={false} />
                    <Line dataKey="mid" stroke={colors.secondary} dot={false} />
                    <Line dataKey="high" stroke={colors.primary} dot={false} />
                    <Line dataKey="true" stroke={colors.low} dot={false} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
                </div>
              ) : enginePhaseTrend.length ? (
                <>
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
                  <div className={cn("h-[220px]", chartWrap)}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <LineChart
                        data={enginePhaseTrend}
                        margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                        <XAxis dataKey="step" hide />
                        <YAxis
                          width={PHASE_CHART_Y_AXIS_PX}
                          stroke={colors.axis}
                          fontSize={11}
                        >
                          <Label
                            value="RUL (cycles)"
                            angle={-90}
                            position="insideLeft"
                            style={{ textAnchor: "middle" }}
                          />
                        </YAxis>
                        <Tooltip formatter={(value) => fmt(Number(value), 1)} />
                        {degradationStartStep != null && maxStep != null ? (
                          <>
                            <ReferenceArea x1={enginePhaseTrend[0]?.step ?? 1} x2={degradationStartStep} fill="#86efac" fillOpacity={0.18} />
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
                    <div
                      className="flex w-full pr-2"
                      style={{ paddingLeft: PHASE_CHART_Y_AXIS_PX }}
                    >
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
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Engine series payload is not available for this selection.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <div className="min-w-0">
            <SensorMeanStdByRulChart
            key={`sensor-mean-std-${selectedTrendFeature || "default"}`}
            predictions={predictions}
            selectedSensor={selectedTrendFeature}
            sensorOptions={TREND_FEATURE_OPTIONS_LIST}
            onSensorChange={setSelectedTrendFeature}
            seriesField="sensors"
            seriesDataPath="/data/raw_engine_series"
            />
          </div>

          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                <span>Local SHAP (Selected Engine)</span>
                <TooltipProvider delayDuration={180}>
                  <UiTooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="What this chart shows"
                        className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <CircleHelp className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-left text-xs leading-relaxed">
                      <p>
                        This chart shows how much each input feature nudged the RUL output at the
                        last snapshot for the engine you selected, compared to a neutral baseline. Bars
                        to the right of zero increased the prediction; bars to the left decreased it. For
                        importance averaged over all engines, see global SHAP in section 4.
                      </p>
                    </TooltipContent>
                  </UiTooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[32rem] min-w-0">
              {isLocalShapLoading ? (
                <p className="text-sm text-muted-foreground">Loading local SHAP...</p>
              ) : localShapBars.length > 0 ? (
                <div className={cn("h-full", chartWrap)}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart
                    data={localShapBars}
                    layout="vertical"
                    barCategoryGap="12%"
                    margin={{ left: 4, right: 10, top: 4, bottom: 32 }}
                  >
                    <CartesianGrid stroke={colors.grid} horizontal={false} />
                    <XAxis type="number" stroke={colors.axis} tick={{ fontSize: 11 }}>
                      <Label
                        value="SHAP value"
                        position="bottom"
                        offset={4}
                        style={{ textAnchor: "middle" }}
                      />
                    </XAxis>
                    <YAxis
                      dataKey="feature"
                      type="category"
                      width={256}
                      stroke={colors.axis}
                      tick={{
                        fontSize: 13,
                        fontWeight: 500,
                        fill: "var(--foreground)",
                      }}
                      tickLine={false}
                      interval={0}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0]?.payload as { feature: string; value: number } | undefined;
                        if (!row) return null;
                        const v = row.value;
                        const effect =
                          v > 0
                            ? "It pushed the predicted RUL up relative to the baseline for this engine."
                            : v < 0
                              ? "It pulled the predicted RUL down relative to the baseline for this engine."
                              : "It had no net effect on the predicted RUL relative to the baseline for this engine.";
                        return (
                          <div className="max-w-[18rem] rounded-md border border-border bg-background px-3 py-2 text-xs shadow-sm leading-relaxed">
                            <p className="font-medium">{row.feature}</p>
                            <p className="mt-1.5 text-muted-foreground">
                              At this time step, SHAP is{" "}
                              <span className="font-mono text-foreground">{fmt(v, 4)}</span>
                              {". "}
                              {effect}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine x={0} stroke="var(--border)" />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {localShapBars.map((b) => (
                        <Cell
                          key={b.feature}
                          fill={b.value >= 0 ? localShapBarFill.positive : localShapBarFill.negative}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No local SHAP data for selected engine.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">4) Interpretability (Global)</h2>
        <p className="text-sm text-muted-foreground">
          Global SHAP stays constant across engine and filter selections.
        </p>
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <span>Global SHAP Top Features</span>
              <TooltipProvider delayDuration={180}>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="What this chart shows"
                      className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <CircleHelp className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-left text-xs leading-relaxed">
                    <p>
                      Ranks which inputs the model relies on when predicting RUL, averaged over the
                      test fleet. Each bar is the mean absolute SHAP for that feature (larger = more
                      overall influence on the model output). It is the same for every engine and
                      filter—use local SHAP above for a single engine&apos;s direction of effect.
                    </p>
                  </TooltipContent>
                </UiTooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[32rem] min-h-[24rem] min-w-0">
            <div className={cn("h-full", chartWrap)}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                data={globalShapBars}
                layout="vertical"
                barCategoryGap="12%"
                margin={{ top: 8, right: 12, bottom: 32, left: 4 }}
              >
                <CartesianGrid stroke={colors.grid} horizontal={false} />
                <XAxis type="number" stroke={colors.axis} tick={{ fontSize: 11 }}>
                  <Label value="Mean |SHAP|" position="bottom" offset={4} style={{ textAnchor: "middle" }} />
                </XAxis>
                <YAxis
                  dataKey="feature"
                  type="category"
                  width={280}
                  stroke={colors.axis}
                  tick={{
                    fontSize: 13,
                    fontWeight: 500,
                    fill: "var(--foreground)",
                  }}
                  tickLine={false}
                  interval={0}
                />
                <Tooltip formatter={(value) => fmt(Number(value), 4)} />
                <Bar dataKey="value" fill={colors.primary} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
