import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Brain,
  Gauge,
  Layers,
  LineChart,
  Scale,
  Target,
} from "lucide-react";

export type MethodBlockData = {
  id: string;
  n: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  bullets: readonly string[];
  key: string;
  /** One-line summary for progressive-disclosure / workflow strip */
  teaser: string;
};

export const METHOD_BLOCKS: readonly MethodBlockData[] = [
  {
    id: "input",
    n: "01",
    title: "Input data",
    subtitle: "What goes into the model",
    icon: Layers,
    teaser:
      "NASA C-MAPSS FD001: multivariate sensor time series per engine from healthy operation to failure.",
    bullets: [
      "NASA C-MAPSS FD001 dataset",
      "21 sensor measurements per cycle",
      "3 operational settings",
      "Each engine is a time series from healthy operation to failure",
    ],
    key: "Instead of treating rows as independent samples, the model learns from sequences of engine behavior over time.",
  },
  {
    id: "preprocess",
    n: "02",
    title: "Data preprocessing",
    subtitle: "Steps performed",
    icon: Activity,
    teaser:
      "Remove uninformative sensors, build RUL targets, cap and normalize, then slice into fixed-length windows.",
    bullets: [
      "Removed constant / non-informative sensors",
      "Generated remaining useful life (RUL) labels",
      "Applied RUL capping to stabilize training",
      "Normalized sensor values",
      "Built sequences with a sliding window (length = 30 cycles)",
    ],
    key: "Stable training, a meaningful sequence representation, and a consistent scale across sensors.",
  },
  {
    id: "features",
    n: "03",
    title: "Feature engineering",
    subtitle: "Beyond raw readings",
    icon: LineChart,
    teaser:
      "Engineer trends, deltas, rolling stats, interactions, and smoothed signals so degradation shows up in dynamics.",
    bullets: [
      "Rate of change (rc) - short-term variation",
      "Trend (tr) - longer-horizon direction (slope)",
      "Rolling statistics (rs) - local min / max patterns",
      "Sensor interaction (si) - cross-sensor relationships",
      "Kalman smoothing - less noisy signals for learning",
    ],
    key: "Degradation shows up in how sensors evolve, not only in their levels. The model leans on dynamic patterns (change and trend) more than raw magnitudes alone.",
  },
  {
    id: "architecture",
    n: "04",
    title: "Model architecture",
    subtitle: "LSTM for sequences",
    icon: Brain,
    teaser:
      "An LSTM reads each engineered window and learns temporal structure toward probabilistic RUL heads.",
    bullets: [
      "Long Short-Term Memory (LSTM) network",
      "Input: last 30 cycles with multiple engineered features",
      "Learns temporal dependencies and degradation trajectories",
      "Well suited to variable-length histories and sequential structure",
    ],
    key: "The LSTM summarizes how the engineered sequence evolves - not just a snapshot at one cycle.",
  },
  {
    id: "probabilistic",
    n: "05",
    title: "Probabilistic prediction",
    subtitle: "Intervals, not only a point estimate",
    icon: BarChart3,
    teaser:
      "Instead of one number, the model outputs lower, median, and upper RUL to encode uncertainty.",
    bullets: [
      "Traditional: a single RUL number",
      "Here: lower bound (~10th percentile), median (~50th), upper bound (~90th)",
      "Example: RUL ≈ 32 with range [25, 40]",
      "Median = best central estimate; interval width reflects uncertainty",
    ],
    key: "A range makes late-RUL risk visible: when the band is wide, decisions should be more cautious.",
  },
  {
    id: "confidence",
    n: "06",
    title: "Confidence estimation",
    subtitle: "From interval width",
    icon: Gauge,
    teaser:
      "Narrow prediction intervals imply higher confidence; wide intervals flag uncertain regimes.",
    bullets: [
      "Confidence scales inversely with interval width (narrower → higher confidence)",
      "Supports maintenance decisions under noisy, real-world telemetry",
    ],
    key: "Turns probabilistic outputs into a simple reliability signal for operators and analysts.",
  },
  {
    id: "training",
    n: "07",
    title: "Model training",
    subtitle: "Quantile (pinball) loss",
    icon: Scale,
    teaser:
      "Quantile (pinball) loss trains low, median, and high outputs with asymmetric penalties.",
    bullets: [
      "Pinball loss trains low, median, and high heads with different asymmetry",
      "Underestimating vs overestimating RUL can carry different costs - quantile loss encodes that",
    ],
    key: "The model learns calibrated bounds around the central estimate, not only the middle of the distribution.",
  },
  {
    id: "metrics",
    n: "08",
    title: "Evaluation metrics",
    subtitle: "Multiple views of quality",
    icon: Target,
    teaser:
      "RMSE, NASA score, coverage, hit rates, and weighted errors capture accuracy and risk together.",
    bullets: [
      "RMSE - overall point accuracy",
      "NASA score - penalizes dangerously late predictions",
      "Within-10 / Within-20 - practical hit rates",
      "Coverage - whether intervals behave as intended",
      "Weighted MAE - emphasizes errors in the critical late-RUL phase",
    ],
    key: "No single number tells the whole story: accuracy, risk, and reliability are tracked separately.",
  },
] as const;
