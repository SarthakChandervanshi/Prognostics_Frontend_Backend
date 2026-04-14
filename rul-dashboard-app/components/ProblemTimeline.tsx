"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stages = [
  {
    label: "Healthy",
    caption: "Stable sensors, full margin before service.",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    icon: Shield,
  },
  {
    label: "Degradation",
    caption: "Wear accumulates; early warnings matter.",
    color: "text-amber-400",
    border: "border-amber-500/30",
    icon: Activity,
  },
  {
    label: "Failure risk",
    caption: "Late RUL errors are most costly - uncertainty helps.",
    color: "text-red-400",
    border: "border-red-500/30",
    icon: AlertTriangle,
  },
];

const flowViewport = { once: true, margin: "-60px" as const };

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const gridContainerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.22, delayChildren: 0.95 },
  },
};

export default function ProblemTimeline() {
  return (
    <div className="space-y-10">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight">How condition evolves</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Three stages from stable operation to rising failure risk, a simple curve to anchor interval
          forecasts and explanations.
        </p>
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* One-shot L→R: line draws, dot travels, then cards stagger (md+) */}
        <div
          className="pointer-events-none absolute left-3 right-3 top-[calc(50%-0.125rem)] z-0 hidden h-1 md:block"
          aria-hidden
        >
          <div className="relative h-full w-full overflow-visible">
            <motion.div
              className="h-0.5 w-full origin-left rounded-full bg-gradient-to-r from-emerald-500/55 via-amber-500/55 to-red-500/55 shadow-sm"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={flowViewport}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.85)] ring-2 ring-amber-400/70 dark:bg-amber-300"
              initial={{ left: "0%" }}
              whileInView={{ left: "100%" }}
              viewport={flowViewport}
              transition={{
                duration: 1.15,
                delay: 0.12,
                ease: [0.45, 0.05, 0.55, 0.95],
              }}
            />
          </div>
        </div>

        <motion.div
          className="relative z-10 grid gap-6 md:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={flowViewport}
          variants={gridContainerVariants}
        >
          {stages.map((s) => (
            <motion.div key={s.label} variants={cardVariants}>
              <Card
                className={`h-full border bg-card/80 backdrop-blur transition-shadow duration-300 hover:shadow-md ${s.border}`}
              >
                <CardContent className="flex flex-col gap-3 pt-6">
                  <s.icon className={`h-8 w-8 ${s.color}`} aria-hidden />
                  <h3 className={`text-lg font-semibold ${s.color}`}>{s.label}</h3>
                  <p className="text-sm text-muted-foreground">{s.caption}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
