"use client";

import {
  Activity,
  ArrowRight,
  BarChart3,
  GitBranch,
  Layers,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  { title: "Raw sensors", icon: Activity, detail: "Multivariate C-MAPSS traces" },
  { title: "Engineered features", icon: GitBranch, detail: "Trends, ratios, rolling stats" },
  { title: "Kalman smoothing", icon: SlidersHorizontal, detail: "Noise-robust signals" },
  { title: "Stacked LSTM", icon: Layers, detail: "Sequence model on windows" },
  { title: "Quantile heads", icon: BarChart3, detail: "Low / median / high RUL" },
  { title: "Intervals & trust", icon: Sparkles, detail: "Widths → confidence" },
];

export default function PipelineDiagram() {
  return (
    <div className="space-y-8">
      <p className="mx-auto max-w-2xl text-center text-muted-foreground">
        The model predicts a <span className="text-foreground">range</span>, not
        just a single cycle count — better aligned with PHM decisions under noise
        and partial observability.
      </p>

      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:justify-center">
        {steps.map((step, i) => (
          <div key={step.title} className="flex items-stretch gap-2 lg:contents">
            <Card className="min-w-[140px] flex-1 border-border/80 bg-card/70 lg:max-w-[150px]">
              <CardContent className="flex flex-col items-center gap-2 px-3 py-4 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
                  <step.icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-sm font-medium leading-tight">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.detail}</p>
              </CardContent>
            </Card>
            {i < steps.length - 1 ? (
              <div className="flex items-center justify-center px-1 text-muted-foreground lg:px-0">
                <ArrowRight className="hidden h-5 w-5 lg:block" aria-hidden />
                <span className="py-1 text-xs lg:hidden">↓</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
