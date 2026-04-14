import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="font-medium text-foreground">Project scope</p>
            <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground/90">Dataset:</span>{" "}
                NASA C-MAPSS FD001
              </p>
              <p>
                <span className="font-medium text-foreground/90">Model family:</span>{" "}
                Stacked LSTM with quantile regression heads
              </p>
              <p>
                <span className="font-medium text-foreground/90">Tools:</span>{" "}
                TensorFlow/Keras, SHAP
              </p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground/90">Disclaimer</p>
            <p className="mt-2">
              This site presents precomputed results from the final model
              evaluation run. Figures and metrics are intended for research
              communication and demonstration only, not for operational
              certification.
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
