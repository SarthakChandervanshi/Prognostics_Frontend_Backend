import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="font-medium text-foreground">NASA C-MAPSS FD001</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Model family: stacked LSTM with quantile regression heads. Tooling:
              TensorFlow / Keras, SHAP, Next.js. This interface displays
              precomputed artifacts only (no live training or SHAP in the browser).
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground/90">Disclaimer</p>
            <p className="mt-2">
              This site presents exported results from the final evaluation run.
              Figures and metrics are for communication and research storytelling,
              not operational certification.
            </p>
          </div>
        </div>
        <Separator className="my-8 bg-border/60" />
        <p className="text-center text-xs text-muted-foreground">
          Digital Twin Framework for Industrial Asset Prognostics · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
