"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type SectionRevealProps = {
  id?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Scroll-triggered reveal: fade + small lift only (no blur / fog — GPU-friendly).
 */
export default function SectionReveal({ id, className, children }: SectionRevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <section id={id} className={cn("scroll-mt-28", className)}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      id={id}
      className={cn("scroll-mt-28", className)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}
