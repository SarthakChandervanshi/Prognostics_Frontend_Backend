"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Metrics, PredictionRow } from "@/lib/types";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ArrowRight, CircleHelp } from "lucide-react";

/** Placeholder until the dashboard route and URL are defined. */
const DASHBOARD_HREF = "/dashboard";

type HeroProps = {
  metrics: Metrics;
  sample: PredictionRow;
};

export default function Hero({ metrics, sample }: HeroProps) {
  const [intervalHover, setIntervalHover] = useState<{
    offsetX: number;
    rul: number;
  } | null>(null);

  const minR = Math.min(sample.rul_low, sample.y_true);
  const maxR = Math.max(sample.rul_high, sample.y_true);
  const span = maxR - minR || 1;
  const confPct = (sample.confidence * 100).toFixed(1);

  const rulPct = (v: number) => ((v - minR) / span) * 100;

  const intervalLineLabels = [
    { key: "low", name: "Low", value: sample.rul_low, align: "start" as const },
    { key: "median", name: "Median", value: sample.rul_mid, align: "center" as const },
    { key: "high", name: "High", value: sample.rul_high, align: "end" as const },
  ];

  return (
    <section
      id="home"
      className="scroll-mt-28 relative overflow-hidden border-b border-border/40"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      >
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-accent/40 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:min-h-[80vh] md:grid-cols-2 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            NASA C-MAPSS FD001
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl">
            Digital Twin Framework for Industrial Asset Prognostics
          </h1>

          <p className="mt-5 text-lg font-medium text-foreground/95">
            Engine wear is hard to observe directly, and sensor readings are noisy.
            Operators still need a reliable estimate of how many operating cycles remain
            before failure, not just the direction of a trend line.
          </p>
          <p className="mt-3 text-base text-muted-foreground">
            My approach turns noisy engine data into predictions that give both a{" "}
            <span className="font-semibold text-primary">
              plausible range for remaining life
            </span>{" "}
            and a sense of{" "}
            <span className="font-semibold text-primary">
              how trustworthy that prediction is
            </span>
            , so maintenance and safety teams can plan with risk in view, not a single
            guess.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={DASHBOARD_HREF}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4"
        >
          <Card className="gap-0 overflow-hidden border-primary/25 bg-gradient-to-br from-card via-card to-primary/[0.07] py-0 shadow-lg ring-1 ring-primary/15">
            <div className="relative px-5 py-4">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-2 rounded-l-md rounded-r-none bg-primary/35"
                aria-hidden
              />
              <div className="pl-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Primary benchmark
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground/90">Test set</p>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end sm:gap-6">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">RMSE</p>
                    <p className="mt-0.5 text-4xl font-bold tabular-nums leading-none tracking-tight text-primary">
                      {metrics.RMSE.toFixed(2)}
                    </p>
                  </div>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          tabIndex={0}
                          className="cursor-help rounded-md border-t border-t-primary/10 pt-3 outline-none hover:bg-primary/[0.04] sm:border-l sm:border-t-0 sm:border-l-primary/10 sm:pt-0 sm:pl-6 focus-visible:ring-2 focus-visible:ring-ring/50"
                        >
                          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            NASA score
                            <CircleHelp
                              className="size-3.5 shrink-0 text-primary/70"
                              aria-hidden
                            />
                          </p>
                          <p className="mt-0.5 text-2xl font-semibold tabular-nums leading-none text-foreground">
                            {metrics.NASA_score.toFixed(2)}
                          </p>
                          <p className="mt-1.5 text-[11px] text-muted-foreground">
                            Lower is better
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="end"
                        className="max-w-[min(100vw-2rem,22rem)] space-y-2 text-left text-[11px] leading-snug"
                      >
                        <p className="font-semibold text-foreground">
                          NASA prognostic score (C-MAPSS)
                        </p>
                        <p className="text-muted-foreground">
                          Benchmark metric from the NASA turbofan RUL literature: each test engine gets
                          an asymmetric penalty, predicting <span className="text-foreground/90">more</span>{" "}
                          remaining life than actually occurred is punished more than predicting{" "}
                          <span className="text-foreground/90">less</span>. That matches operational
                          risk better than symmetric error alone.
                        </p>
                        <p className="font-medium text-foreground/95">Per-engine formula</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          e = predicted RUL − true RUL (cycles)
                        </p>
                        <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
                          <li>
                            If e ≤ 0: penalty = exp(−e / 13) − 1
                          </li>
                          <li>If e &gt; 0: penalty = exp(e / 10) − 1</li>
                        </ul>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Total score</span> is the sum
                          over test engines.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-border/80 bg-muted/25">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold leading-snug">
                Sample RUL - Engine {sample.engine_id}
              </CardTitle>
              <CardDescription className="text-xs">
                The predicted interval is shown against ground truth. The bar is scaled using only
                this engine&apos;s low, high, and true values.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border/50 pb-3 text-[11px] text-muted-foreground"
                aria-label="Chart legend"
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2.5 w-9 shrink-0 rounded-sm bg-gradient-to-r from-primary/70 via-primary/45 to-accent/70 shadow-sm ring-1 ring-primary/25"
                    aria-hidden
                  />
                  <span className="text-foreground/90">Predicted interval</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="flex h-3 w-5 items-center justify-center"
                    aria-hidden
                  >
                    <span className="h-3 w-0.5 rounded-full bg-white shadow ring-1 ring-black/25" />
                  </span>
                  <span className="text-foreground/90">True RUL</span>
                </span>
                <span className="tabular-nums text-foreground/80">
                  Confidence <span className="font-medium text-primary">{confPct}%</span>
                </span>
              </div>

              <div className="relative w-full px-2 sm:px-3">
                <div className="relative z-0 h-4 w-full">
                  <div className="absolute inset-0 overflow-hidden rounded-full bg-muted" />
                  <div
                    className="absolute inset-y-0 z-[5] cursor-crosshair rounded-full"
                    style={{
                      left: `${rulPct(sample.rul_low)}%`,
                      width: `${rulPct(sample.rul_high) - rulPct(sample.rul_low)}%`,
                    }}
                    onMouseMove={(e) => {
                      const el = e.currentTarget;
                      const w = el.clientWidth;
                      const x = Math.min(Math.max(e.nativeEvent.offsetX, 0), w);
                      const t = w > 0 ? x / w : 0;
                      const rul =
                        sample.rul_low + t * (sample.rul_high - sample.rul_low);
                      setIntervalHover({ offsetX: x, rul });
                    }}
                    onMouseLeave={() => setIntervalHover(null)}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/70 via-primary/45 to-accent/70" />
                    {intervalHover !== null && (
                      <>
                        <div
                          className="pointer-events-none absolute top-1/2 z-[6] h-6 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/45 shadow-sm ring-1 ring-primary/25"
                          style={{ left: intervalHover.offsetX }}
                          aria-hidden
                        />
                        <div
                          className="pointer-events-none absolute bottom-full z-[6] mb-0.5 -translate-x-1/2 rounded bg-background/95 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground shadow ring-1 ring-border"
                          style={{ left: intervalHover.offsetX }}
                        >
                          {intervalHover.rul.toFixed(1)}
                        </div>
                      </>
                    )}
                  </div>
                  <div
                    className="absolute top-1/2 z-10 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md ring-1 ring-black/20"
                    style={{ left: `${rulPct(sample.y_true)}%` }}
                    title={`True RUL ${sample.y_true}`}
                  />
                </div>

                <div className="relative mt-2 min-h-[2.75rem] w-full">
                  {intervalLineLabels.map((m) => (
                    <div
                      key={m.key}
                      className={cn(
                        "absolute top-0 flex max-w-[min(100%,5.5rem)] flex-col gap-0.5",
                        m.align === "start" && "items-start text-left",
                        m.align === "center" && "items-center text-center",
                        m.align === "end" && "items-end text-right"
                      )}
                      style={{
                        left: `${rulPct(m.value)}%`,
                        transform:
                          m.align === "start"
                            ? "translateX(0)"
                            : m.align === "end"
                              ? "translateX(-100%)"
                              : "translateX(-50%)",
                      }}
                    >
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {m.name}
                      </span>
                      <span className="text-xs font-semibold tabular-nums leading-none text-foreground">
                        {m.value.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-left text-[10px] text-muted-foreground">
                  Note: Units are in cycles.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
