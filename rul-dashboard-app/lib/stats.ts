import type { PredictionRow } from "@/lib/types";

function rmse(rows: PredictionRow[]): number {
  if (rows.length === 0) return 0;
  const mse =
    rows.reduce((s, r) => s + (r.rul_mid - r.y_true) ** 2, 0) / rows.length;
  return Math.sqrt(mse);
}

export function splitPhaseStats(predictions: PredictionRow[]) {
  const critical = predictions.filter((r) => r.y_true <= 20);
  const healthy = predictions.filter((r) => r.y_true > 20);
  return {
    critical: {
      n: critical.length,
      rmse: rmse(critical),
    },
    healthy: {
      n: healthy.length,
      rmse: rmse(healthy),
    },
  };
}

export function widthHistogram(
  predictions: PredictionRow[],
  bins = 8
): { label: string; count: number }[] {
  const widths = predictions.map((p) => p.width);
  const min = Math.min(...widths);
  const max = Math.max(...widths);
  const step = (max - min) / bins || 1;
  const counts = new Array(bins).fill(0);
  for (const w of widths) {
    let i = Math.floor((w - min) / step);
    if (i >= bins) i = bins - 1;
    if (i < 0) i = 0;
    counts[i]++;
  }
  return counts.map((count, i) => ({
    label: `${(min + i * step).toFixed(0)}–${(min + (i + 1) * step).toFixed(0)}`,
    count,
  }));
}
