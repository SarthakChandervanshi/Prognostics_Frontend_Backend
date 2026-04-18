"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MethodBlockData } from "@/lib/methodBlocks";
import { METHOD_BLOCKS } from "@/lib/methodBlocks";
import MethodWorkflowLinked from "@/components/home/MethodWorkflowLinked";

const view = { once: true, margin: "-48px" as const };

const ACCENT_HEADER: readonly string[] = [
  "ring-emerald-500/35 bg-emerald-500/[0.08]",
  "ring-sky-500/35 bg-sky-500/[0.08]",
  "ring-violet-500/35 bg-violet-500/[0.08]",
  "ring-amber-500/35 bg-amber-500/[0.08]",
  "ring-rose-500/35 bg-rose-500/[0.08]",
  "ring-cyan-500/35 bg-cyan-500/[0.08]",
  "ring-orange-500/35 bg-orange-500/[0.08]",
  "ring-teal-500/35 bg-teal-500/[0.08]",
];

const BULLET_PREVIEW = 2;

function MethodBlockCard({ b, index }: { b: MethodBlockData; index: number }) {
  const [open, setOpen] = useState(false);
  const uid = useId();
  const panelId = `${uid}-details`;
  const needsDisclosure = b.bullets.length > BULLET_PREVIEW;
  const accent = ACCENT_HEADER[index] ?? ACCENT_HEADER[0]!;

  return (
    <Card
      id={`method-${b.id}`}
      className={cn(
        "flex h-full min-h-0 scroll-mt-28 flex-col border-border/80 bg-card/60 shadow-sm ring-1 ring-foreground/5 transition-shadow hover:shadow-md",
        accent,
      )}
    >
      <CardHeader className="shrink-0 border-b border-border/60 pb-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
              accent,
            )}
          >
            <b.icon className="h-5 w-5 text-foreground" aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {b.n} · {b.subtitle}
            </p>
            <CardTitle className="text-lg md:text-xl">{b.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-4 min-h-0">
        <p className="text-sm leading-relaxed text-muted-foreground">{b.teaser}</p>

        {needsDisclosure ? (
          <div className="mt-3">
            {!open ? (
              <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-muted-foreground marker:text-primary/80">
                {b.bullets.slice(0, BULLET_PREVIEW).map((line) => (
                  <li key={line} className="pl-0.5">
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <ul
                id={panelId}
                className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-muted-foreground marker:text-primary/80"
              >
                {b.bullets.map((line) => (
                  <li key={line} className="pl-0.5">
                    {line}
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 h-auto px-2 py-1 text-xs font-medium text-primary"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? "Hide details" : "Show details"}
              <ChevronDown
                className={cn("ml-0.5 transition-transform", open && "rotate-180")}
                aria-hidden
              />
            </Button>
          </div>
        ) : (
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-muted-foreground marker:text-primary/80">
            {b.bullets.map((line) => (
              <li key={line} className="pl-0.5">
                {line}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-4 text-sm leading-relaxed text-foreground">
          <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.07] to-transparent px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/90">Key idea</p>
            <p className="mt-1.5 text-muted-foreground">{b.key}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function MethodSection() {
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto max-w-6xl px-6">
      <div className="mx-auto max-w-3xl text-center">
        <motion.p
          initial={reduce ? undefined : { opacity: 0, y: 10 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={view}
          transition={{ duration: 0.45 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Method
        </motion.p>
        <motion.h2
          initial={reduce ? undefined : { opacity: 0, y: 12 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={view}
          transition={{ duration: 0.5, delay: 0.04 }}
          className="mt-4 text-balance text-3xl font-bold tracking-tight md:text-4xl"
        >
          How the model works
        </motion.h2>
        <motion.p
          initial={reduce ? undefined : { opacity: 0, y: 12 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={view}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mt-4 text-pretty text-muted-foreground md:text-lg"
        >
          This project uses a data-driven pipeline to predict remaining useful life (RUL) of aircraft
          engines from multivariate sensor data. The numbered strip below matches each card, use{" "}
          <span className="whitespace-nowrap">“Show details”</span> when a step has more than two
          bullet points.
        </motion.p>
      </div>

      <MethodWorkflowLinked />

      {reduce ? (
        <div className="mt-14 grid gap-6 md:grid-cols-2 md:items-stretch">
          {METHOD_BLOCKS.map((b, index) => (
            <div key={b.id} className="flex h-full min-h-0">
              <MethodBlockCard b={b} index={index} />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          className="mt-14 grid gap-6 md:grid-cols-2 md:items-stretch"
          variants={listVariants}
          initial="hidden"
          whileInView="show"
          viewport={view}
        >
          {METHOD_BLOCKS.map((b, index) => (
            <motion.div key={b.id} variants={rowVariants} className="flex h-full min-h-0">
              <MethodBlockCard b={b} index={index} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
