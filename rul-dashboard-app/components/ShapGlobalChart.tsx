"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ShapGlobal } from "@/lib/types";

const axis = "var(--muted-foreground)";
const grid = "color-mix(in oklch, var(--border) 55%, transparent)";

export default function ShapGlobalChart({
  shap,
  topN = 12,
}: {
  shap: ShapGlobal;
  topN?: number;
}) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.45 });
  const [playBars, setPlayBars] = useState(false);

  useEffect(() => {
    if (isInView) setPlayBars(true);
  }, [isInView]);

  const data = [...shap.values]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, topN)
    .map((v) => ({
      feature: v.feature,
      shap: v.mean_abs_shap,
    }));

  return (
    <motion.div
      ref={sectionRef}
      className="h-[420px] w-full min-w-0"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 400, height: 420 }}
      >
        <BarChart
          key={playBars ? "bars-animated" : "bars-idle"}
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
        >
          <CartesianGrid stroke={grid} strokeDasharray="3 3" />
          <XAxis type="number" stroke={axis} fontSize={11} />
          <YAxis
            type="category"
            dataKey="feature"
            width={148}
            stroke={axis}
            fontSize={10}
            tick={{ fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(v) => [
              typeof v === "number" ? v.toFixed(4) : String(v ?? ""),
              "Mean |SHAP|",
            ]}
          />
          <Bar
            dataKey="shap"
            fill="var(--chart-1)"
            radius={[0, 4, 4, 0]}
            isAnimationActive={playBars}
            animationBegin={120}
            animationDuration={1400}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
