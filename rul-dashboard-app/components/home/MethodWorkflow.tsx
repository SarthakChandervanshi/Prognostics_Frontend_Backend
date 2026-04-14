"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Gauge,
  Layers,
  Sparkles,
  Table2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nodes = [
  {
    key: "input",
    title: "Multivariate input",
    caption: "NASA C-MAPSS FD001",
    detail: "21 sensors · 3 settings · per-cycle series",
    icon: Table2,
  },
  {
    key: "prep",
    title: "Preprocess",
    caption: "Labels & windows",
    detail: "RUL cap · normalize · sliding window (30)",
    icon: Layers,
  },
  {
    key: "feat",
    title: "Engineered features",
    caption: "Dynamics over time",
    detail: "Δ, trend, rolling stats, interactions, Kalman",
    icon: Sparkles,
  },
  {
    key: "lstm",
    title: "LSTM + quantile loss",
    caption: "Sequence model",
    detail: "Temporal patterns · pinball training",
    icon: BrainCircuit,
  },
  {
    key: "out",
    title: "Probabilistic RUL",
    caption: "P10 · P50 · P90",
    detail: "Interval, not a single number",
    icon: BarChart3,
  },
  {
    key: "trust",
    title: "Confidence & metrics",
    caption: "Decision-ready",
    detail: "Width → trust · RMSE, NASA score, coverage",
    icon: Gauge,
  },
] as const;

const row1 = nodes.slice(0, 3);
const row2 = nodes.slice(3, 6);

/** Stagger: row 1 → L-bend → row 2 */
const section = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.14, delayChildren: 0.04 },
  },
};

/** Stagger: cards + arrows within one row */
const rowBlock = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, staggerChildren: 0.06, delayChildren: 0.02 },
  },
};

const rowInner = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0 },
  },
};

const lBendBlock = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const edgeFade = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25 },
  },
};

type Node = (typeof nodes)[number];

function ArrowRightIcon() {
  return (
    <div
      className="flex h-full min-h-[4.5rem] shrink-0 items-center justify-center px-0.5 md:min-h-0 md:px-1"
      aria-hidden
    >
      <ChevronRight
        strokeWidth={2.5}
        className="h-6 w-6 text-primary/75 md:h-7 md:w-7"
      />
    </div>
  );
}

function ArrowDownIcon() {
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <ChevronDown strokeWidth={2.5} className="h-6 w-6 text-primary/75" />
    </div>
  );
}

/**
 * Rounded “elbow” from end of row 1 (right) to start of row 2 (left).
 * Uses fixed viewBox + meet (no stretch), gradient stroke, soft corners.
 */
function LBendConnector({ animated }: { animated: boolean }) {
  const uid = useId();
  const gradId = `lbend-grad-${uid}`;
  const markerId = `lbend-arr-${uid}`;

  const pathD =
    "M 86.5 1 L 86.5 13.2 Q 86.5 15.8 84 15.8 L 18.5 15.8 Q 15.8 15.8 15.8 18.5 L 15.8 38";

  return (
    <div
      className="relative mx-auto flex w-full max-w-5xl justify-center px-2 py-1 md:px-3 md:py-1.5"
      aria-hidden
    >
      <svg
        className="h-[3.25rem] w-full max-w-[min(100%,42rem)] text-primary md:h-[3.75rem]"
        viewBox="0 0 100 40"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={gradId} x1="12%" y1="0%" x2="88%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
            <stop offset="42%" stopColor="currentColor" stopOpacity={0.72} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0.42} />
          </linearGradient>
          <marker
            id={markerId}
            markerUnits="userSpaceOnUse"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L5.2,3 z" fill="currentColor" opacity={0.72} />
          </marker>
        </defs>
        {animated ? (
          <motion.path
            d={pathD}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="nonScalingStroke"
            initial={{ pathLength: 0, opacity: 0.25 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            markerEnd={`url(#${markerId})`}
          />
        ) : (
          <path
            d={pathD}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="nonScalingStroke"
            markerEnd={`url(#${markerId})`}
          />
        )}
      </svg>
    </div>
  );
}

function NodeCard({ n, iconMotion }: { n: Node; iconMotion: boolean }) {
  return (
    <article
      className={cn(
        "flex w-full min-w-0 max-w-[11.25rem] flex-col rounded-xl border border-border/80 px-3 py-3.5 shadow-sm ring-1 ring-foreground/[0.04] md:max-w-[10.5rem] lg:max-w-[11.25rem]",
        iconMotion
          ? "group bg-gradient-to-b from-background/95 to-muted/15 transition-[box-shadow] hover:shadow-md hover:ring-primary/15"
          : "bg-background/80",
      )}
    >
      {iconMotion ? (
        <motion.span
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25"
          whileHover={{ scale: 1.06 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <n.icon className="h-4 w-4" aria-hidden />
        </motion.span>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25">
          <n.icon className="h-4 w-4" aria-hidden />
        </span>
      )}
      <p className="mt-2 text-[13px] font-semibold leading-tight text-foreground">
        {n.title}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-primary/90">{n.caption}</p>
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{n.detail}</p>
    </article>
  );
}

function HorizontalRow({
  items,
  animated,
}: {
  items: readonly Node[];
  animated: boolean;
}) {
  if (animated) {
    return (
      <motion.div
        variants={rowBlock}
        className="flex w-full min-w-0 flex-row flex-nowrap items-stretch justify-center gap-0"
      >
        {items.map((n, i) => (
          <motion.div
            key={n.key}
            variants={item}
            className="flex min-w-0 flex-row items-stretch"
          >
            <NodeCard n={n} iconMotion />
            {i < items.length - 1 ? (
              <motion.div variants={edgeFade}>
                <ArrowRightIcon />
              </motion.div>
            ) : null}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-row flex-nowrap items-stretch justify-center gap-0">
      {items.map((n, i) => (
        <div key={n.key} className="flex min-w-0 flex-row items-stretch">
          <NodeCard n={n} iconMotion={false} />
          {i < items.length - 1 ? <ArrowRightIcon /> : null}
        </div>
      ))}
    </div>
  );
}

export default function MethodWorkflow() {
  const reduce = useReducedMotion();

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-x-4 -inset-y-6 rounded-3xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/12 via-transparent to-transparent opacity-90 dark:from-primary/18"
        aria-hidden
      />

      <div className="relative rounded-2xl border border-border/70 bg-card/40 p-4 shadow-sm ring-1 ring-foreground/5 backdrop-blur-sm md:p-6">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          End-to-end workflow
        </p>

        {/* Narrow screens: single column, chevrons down */}
        <div className="md:hidden">
          {reduce ? (
            <div className="mx-auto flex max-w-sm flex-col items-center">
              {nodes.map((n, i) => (
                <div key={n.key} className="flex w-full flex-col items-center">
                  <NodeCard n={n} iconMotion={false} />
                  {i < nodes.length - 1 ? <ArrowDownIcon /> : null}
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="mx-auto flex max-w-sm flex-col items-center"
              variants={rowInner}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
            >
              {nodes.map((n, i) => (
                <motion.div
                  key={n.key}
                  variants={item}
                  className="flex w-full flex-col items-center"
                >
                  <NodeCard n={n} iconMotion />
                  {i < nodes.length - 1 ? (
                    <motion.div variants={edgeFade}>
                      <ArrowDownIcon />
                    </motion.div>
                  ) : null}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* md+: two centered rows + L-bend between */}
        <div className="hidden md:block md:overflow-x-auto md:overflow-y-visible md:pb-1">
          {reduce ? (
            <div className="mx-auto min-w-min space-y-0 px-1 md:max-w-5xl">
              <HorizontalRow items={row1} animated={false} />
              <LBendConnector animated={false} />
              <HorizontalRow items={row2} animated={false} />
            </div>
          ) : (
            <motion.div
              className="mx-auto min-w-min space-y-0 px-1 md:max-w-5xl"
              variants={section}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
            >
              <HorizontalRow items={row1} animated />
              <motion.div variants={lBendBlock}>
                <LBendConnector animated />
              </motion.div>
              <HorizontalRow items={row2} animated />
            </motion.div>
          )}
        </div>

        {!reduce ? (
          <motion.div
            className="pointer-events-none absolute bottom-3 left-1/2 h-px w-32 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/35 to-transparent"
            animate={{ opacity: [0.4, 1, 0.4], scaleX: [0.85, 1, 0.85] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  );
}
