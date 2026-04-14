export type Metrics = {
  scope: string;
  n_engines: number;
  RMSE: number;
  R2: number;
  NASA_score: number;
  within_10_pct: number;
  within_20_pct: number;
  weighted_MAE: number;
  weighted_MAE_definition: string;
  coverage: number;
  mean_interval_width: number;
  critical_n: number;
  critical_rmse: number;
  critical_within_10_pct: number;
  healthy_n: number;
  healthy_rmse: number;
  healthy_within_10_pct: number;
};

export type PredictionRow = {
  engine_id: number;
  y_true: number;
  rul_low: number;
  rul_mid: number;
  rul_high: number;
  width: number;
  confidence: number;
  inside_interval: boolean;
};

export type ShapGlobal = {
  target: string;
  aggregation: string;
  explain_scope: string;
  n_background: number;
  n_explained: number;
  seq_len: number;
  n_features: number;
  values: { feature: string; mean_abs_shap: number; rank: number }[];
};

export type LiteratureEntry = {
  rank: number;
  model: string;
  source?: string;
  rmse: number;
  nasa_score: number;
  status: string;
  link: string;
  advantage: string;
};

export type Literature = {
  entries: LiteratureEntry[];
};
