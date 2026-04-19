"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { withBasePath } from "@/lib/basePath";
import { AlertTriangle, CircleDollarSign, Quote } from "lucide-react";

/** Stock photos (local copies): Unsplash + Pexels — see captions for links & license. */
const PROBLEM_IMAGES = {
  jetEngine: "/images/problem_jet_engine_hangar.jpg",
  analytics: "/images/problem_analytics_decisions.jpg",
} as const;

const view = { once: true, margin: "-80px" as const };

const block = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ProblemSummary() {
  return (
    <section className="relative overflow-hidden border-y border-border/50 bg-gradient-to-b from-muted/20 via-background to-muted/10">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
      >
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-16 bottom-32 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={view}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-800 dark:text-amber-300">
            <span className="text-base leading-none" aria-hidden>
              🔶
            </span>
            Problem overview
          </p>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            When failure is costly, timing is everything
          </h2>
        </motion.div>

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={view}
            variants={block}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              Why predict remaining useful life?
            </h3>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                Aircraft engines degrade over time due to wear and operational stress.
                Predicting <span className="font-medium text-foreground">remaining useful life (RUL)</span>{" "}
                is critical for planning maintenance and preventing unexpected failures.
              </p>
              <p>
                Operators do not get clean lab readings: sensors drift, loads change, and fleets age
                differently. The question is not only <em>how long</em> a unit might run, but{" "}
                <strong className="font-medium text-foreground">how wrong</strong> a prediction can be
                before a decision becomes unsafe or wasteful.
              </p>
            </div>
          </motion.div>

          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={view}
            variants={block}
            className="relative mx-auto w-full max-w-md"
          >
            <figure className="overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-lg ring-1 ring-foreground/5">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={withBasePath(PROBLEM_IMAGES.jetEngine)}
                  alt="Close-up of a turbofan jet engine in an aircraft hangar, representing hardware where wear accumulates and RUL is estimated."
                  fill
                  sizes="(max-width: 1024px) 100vw, 420px"
                  className="object-cover"
                />
              </div>
              <figcaption className="border-t border-border/50 px-3 py-2 text-center text-[10px] leading-snug text-muted-foreground">
                Degradation is physical: sensors and models must support safe maintenance timing.
                <span className="mt-1 block">
                  <a
                    href="https://unsplash.com/photos/a-close-up-of-a-jet-engine-in-a-hangar-DEcL2CJIYqk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Photo: Y M / Unsplash
                  </a>
                </span>
              </figcaption>
            </figure>
          </motion.div>
        </div>

        <motion.div
          custom={2}
          initial="hidden"
          whileInView="visible"
          viewport={view}
          variants={block}
          className="mt-20"
        >
          <h3 className="text-center text-lg font-semibold text-foreground md:text-xl">
            In real-world systems
          </h3>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <motion.article
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={view}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="group rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/[0.06] to-transparent p-6 shadow-sm ring-1 ring-red-500/10"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h4 className="font-semibold text-foreground">Late predictions</h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    If you think the engine has <em>more</em> life than it really does, maintenance and
                    inspections can slip until failure becomes plausible, often the worst-case risk in
                    safety-critical fleets.
                  </p>
                </div>
              </div>
            </motion.article>
            <motion.article
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={view}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="group rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] to-transparent p-6 shadow-sm ring-1 ring-amber-500/10"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  <CircleDollarSign className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h4 className="font-semibold text-foreground">Early predictions</h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    If you pull maintenance <em>too soon</em>, you pay for parts, labor, and downtime you
                    might not have needed, acceptable when safety dominates, painful when it happens
                    fleet-wide.
                  </p>
                </div>
              </div>
            </motion.article>
          </div>
        </motion.div>

        <motion.figure
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={view}
          variants={block}
          className="relative mx-auto mt-16 max-w-3xl"
        >
          <div className="absolute -left-1 top-0 bottom-0 w-1 rounded-full bg-primary/40" aria-hidden />
          <Quote
            className="absolute -left-1 top-4 h-8 w-8 -translate-x-1/3 text-primary/30"
            aria-hidden
          />
          <blockquote className="rounded-r-2xl border border-border/60 bg-card/40 py-6 pl-8 pr-6 text-left ring-1 ring-foreground/5">
            <p className="text-lg font-medium leading-snug text-foreground md:text-xl">
              &ldquo;A single RUL number is easy to report and hard to defend when stakes are high, 
              because it pretends the future is precise when the data is not.&rdquo;
            </p>
            <figcaption className="mt-4 text-sm text-muted-foreground">
              Common framing in prognostics and health management (PHM) practice
            </figcaption>
          </blockquote>
        </motion.figure>

        <div className="mt-20 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            custom={4}
            initial="hidden"
            whileInView="visible"
            viewport={view}
            variants={block}
            className="order-2 lg:order-1"
          >
            <figure className="overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-lg ring-1 ring-foreground/5">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={withBasePath(PROBLEM_IMAGES.analytics)}
                  alt="Person reviewing data and charts on a laptop, representing planning and decisions that should use ranges and uncertainty, not a single headline number."
                  fill
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="object-cover"
                />
              </div>
              <figcaption className="border-t border-border/50 px-3 py-2 text-center text-[10px] leading-snug text-muted-foreground">
                Decision teams need spread and risk visible, not only a point forecast on a dashboard.
                <span className="mt-1 block">
                  <a
                    href="https://www.pexels.com/photo/person-using-macbook-pro-265087/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Photo: Pexels
                  </a>
                </span>
              </figcaption>
            </figure>
          </motion.div>

          <motion.div
            custom={5}
            initial="hidden"
            whileInView="visible"
            viewport={view}
            variants={block}
            className="order-1 space-y-4 lg:order-2"
          >
            <h3 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              Beyond a single estimate
            </h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              Traditional models often output <span className="font-medium text-foreground">one</span>{" "}
              value per engine or time step. That is simple to log, but it does not reflect{" "}
              <strong className="font-medium text-foreground">uncertainty</strong> and without uncertainty,
              planners cannot weigh late-failure risk against early-maintenance cost in a principled way.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              Quantile intervals, confidence-style scores, and explanations turn the same sensors into
              a <em>decision-facing</em> view: not only <em>when</em> you think failure is near, but{" "}
              <em>how tight</em> that belief is, so teams can act with eyes open, not from a single guess.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
