import type { PredictionRow } from "@/lib/types";

type MiniScatterPreviewProps = {
  predictions: PredictionRow[];
  maxPoints?: number;
};

/** Lightweight SVG — no chart library — for homepage snapshot. */
export default function MiniScatterPreview({
  predictions,
  maxPoints = 48,
}: MiniScatterPreviewProps) {
  const pts = predictions.slice(0, maxPoints);
  const w = 360;
  const h = 200;
  const pad = 28;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const vals = pts.flatMap((p) => [p.y_true, p.rul_mid]);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 125, 1);
  const span = max - min || 1;

  const project = (x: number, y: number) => ({
    px: pad + ((x - min) / span) * innerW,
    py: pad + innerH - ((y - min) / span) * innerH,
  });

  const diag = [
    project(min, min),
    project(max, max),
  ];

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full max-w-[360px] text-foreground"
        role="img"
        aria-label="True RUL versus predicted median RUL for a sample of test engines"
      >
        <rect
          width={w}
          height={h}
          rx={10}
          className="fill-muted/30 stroke-border/80"
          strokeWidth={1}
        />
        <line
          x1={diag[0].px}
          y1={diag[0].py}
          x2={diag[1].px}
          y2={diag[1].py}
          className="stroke-muted-foreground/35"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        {pts.map((p) => {
          const { px, py } = project(p.y_true, p.rul_mid);
          return (
            <circle
              key={p.engine_id}
              cx={px}
              cy={py}
              r={3}
              className="fill-primary/85 stroke-primary/30"
              strokeWidth={1}
            />
          );
        })}
        <text
          x={pad}
          y={h - 8}
          className="fill-muted-foreground text-[9px]"
          fontFamily="system-ui, sans-serif"
        >
          True RUL →
        </text>
        <text
          x={pad}
          y={14}
          className="fill-muted-foreground text-[9px]"
          fontFamily="system-ui, sans-serif"
        >
          ↑ Median pred.
        </text>
      </svg>
      <figcaption className="mt-2 text-center text-xs text-muted-foreground">
        Sample of engines: median prediction vs true RUL (dashed line = perfect).
      </figcaption>
    </figure>
  );
}
