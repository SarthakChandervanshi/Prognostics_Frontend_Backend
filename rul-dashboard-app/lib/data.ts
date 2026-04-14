import { readFile } from "fs/promises";
import path from "path";
import type { Literature, Metrics, PredictionRow, ShapGlobal } from "@/lib/types";

export type {
  Literature,
  LiteratureEntry,
  Metrics,
  PredictionRow,
  ShapGlobal,
} from "@/lib/types";

const dataDir = (...segments: string[]) =>
  path.join(process.cwd(), "public", "data", ...segments);

export async function loadMetrics(): Promise<Metrics> {
  const raw = await readFile(dataDir("metrics.json"), "utf8");
  return JSON.parse(raw) as Metrics;
}

export async function loadPredictions(): Promise<PredictionRow[]> {
  const raw = await readFile(dataDir("predictions.json"), "utf8");
  return JSON.parse(raw) as PredictionRow[];
}

/** Highest-confidence engine — for the hero showcase (narrower interval → higher score). */
export function pickHeroSampleByConfidence(rows: PredictionRow[]): PredictionRow {
  if (rows.length === 0) {
    throw new Error("pickHeroSampleByConfidence: empty predictions");
  }
  return rows.reduce((best, row) =>
    row.confidence > best.confidence ? row : best
  );
}

export async function loadShapGlobal(): Promise<ShapGlobal> {
  const raw = await readFile(dataDir("shap_global.json"), "utf8");
  return JSON.parse(raw) as ShapGlobal;
}

export async function loadLiterature(): Promise<Literature> {
  const raw = await readFile(dataDir("literature.json"), "utf8");
  return JSON.parse(raw) as Literature;
}
