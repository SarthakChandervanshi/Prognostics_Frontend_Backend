"use client";

import { useId } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MethodBlockData } from "@/lib/methodBlocks";
import { METHOD_BLOCKS } from "@/lib/methodBlocks";

const row1 = METHOD_BLOCKS.slice(0, 4);
const row2 = METHOD_BLOCKS.slice(4, 8);

/** Matches card accent rings — distinct hues for 01–08 */
const STEP_RING: readonly string[] = [
  "ring-emerald-500/45 bg-emerald-500/[0.12] text-emerald-900 dark:text-emerald-100",
  "ring-sky-500/45 bg-sky-500/[0.12] text-sky-900 dark:text-sky-100",
  "ring-violet-500/45 bg-violet-500/[0.12] text-violet-900 dark:text-violet-100",
  "ring-amber-500/45 bg-amber-500/[0.12] text-amber-950 dark:text-amber-100",
  "ring-rose-500/45 bg-rose-500/[0.12] text-rose-900 dark:text-rose-100",
  "ring-cyan-500/45 bg-cyan-500/[0.12] text-cyan-950 dark:text-cyan-100",
  "ring-orange-500/45 bg-orange-500/[0.12] text-orange-950 dark:text-orange-100",
  "ring-teal-500/45 bg-teal-500/[0.12] text-teal-950 dark:text-teal-100",
];

function StepChip({ b, accent }: { b: MethodBlockData; accent: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="shrink-0"
      initial={false}
      whileHover={
        reduce
          ? undefined
          : {
              y: -6,
              scale: 1.045,
              transition: { type: "spring", stiffness: 420, damping: 24 },
            }
      }
      whileTap={reduce ? undefined : { scale: 0.97 }}
    >
      <Link
        href={`#method-${b.id}`}
        scroll={true}
        className={cn(
          "group flex min-h-[4.25rem] w-[7.4rem] flex-col items-center gap-1.5 text-center rounded-xl p-2 shadow-sm ring-2 ring-inset transition-[box-shadow,filter] duration-200 hover:shadow-md hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[4rem] sm:w-[8.25rem] sm:p-2.5",
          accent,
        )}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] font-bold tabular-nums opacity-90">{b.n}</span>
          <b.icon className="h-3.5 w-3.5 shrink-0 opacity-90 transition-transform duration-200 group-hover:scale-110" aria-hidden />
        </div>
        <span className="line-clamp-2 w-full text-[11px] font-medium leading-snug transition-colors duration-200 group-hover:text-foreground">
          {b.title}
        </span>
      </Link>
    </motion.div>
  );
}

function RowArrow() {
  return (
    <ChevronRight
      className="h-4 w-4 shrink-0 text-muted-foreground/55 sm:h-5 sm:w-5"
      strokeWidth={2.25}
      aria-hidden
    />
  );
}

/**
 * U-turn: exit after step 04 (right), run along the gap, enter above step 05 (left).
 * Matches a left-handed U between two horizontal flow lines.
 */
function UturnBetweenRows() {
  const id = useId();
  const gradId = `uturn-grad-${id}`;
  const markerId = `uturn-arr-${id}`;
  const pathD =
    "M 88 1.5 L 88 13.5 Q 88 15.8 85.5 15.8 L 14.5 15.8 Q 12 15.8 12 18.2 L 12 34.5";

  return (
    <div
      className="relative mx-auto w-full max-w-[min(100%,36rem)] px-2 py-1 sm:max-w-4xl md:py-1.5"
      aria-hidden
    >
      <svg
        className="h-12 w-full text-rose-400/75 dark:text-rose-400/65"
        viewBox="0 0 100 38"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={gradId} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.45} />
            <stop offset="50%" stopColor="currentColor" stopOpacity={0.85} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0.55} />
          </linearGradient>
          <marker
            id={markerId}
            markerUnits="userSpaceOnUse"
            markerWidth="7"
            markerHeight="7"
            refX="5.5"
            refY="3.5"
            orient="auto"
          >
            <path d="M0,0 L0,7 L6,3.5 z" fill="currentColor" opacity={0.85} />
          </marker>
        </defs>
        <path
          d={pathD}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="nonScalingStroke"
          markerEnd={`url(#${markerId})`}
        />
      </svg>
    </div>
  );
}

function StepRow({
  items,
  offset,
}: {
  items: readonly MethodBlockData[];
  offset: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-0.5 gap-y-2 sm:gap-x-1">
      {items.map((b, i) => (
        <div key={b.id} className="flex items-center gap-x-0.5 sm:gap-x-1">
          <StepChip b={b} accent={STEP_RING[offset + i]!} />
          {i < items.length - 1 ? <RowArrow /> : null}
        </div>
      ))}
    </div>
  );
}

export default function MethodWorkflowLinked() {
  return (
    <div className="mt-10">
      <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Pipeline steps · tap to jump
      </p>
      <div className="mx-auto flex max-w-5xl flex-col items-stretch gap-0 sm:items-center">
        <StepRow items={row1} offset={0} />
        <UturnBetweenRows />
        <StepRow items={row2} offset={4} />
      </div>
    </div>
  );
}
