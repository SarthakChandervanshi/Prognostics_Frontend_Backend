import DashboardClient from "@/components/dashboard/DashboardClient";
import { loadMetrics, loadPredictions, loadShapGlobal } from "@/lib/data";

export default async function DashboardPage() {
  const [metrics, predictions, shapGlobal] = await Promise.all([
    loadMetrics(),
    loadPredictions(),
    loadShapGlobal(),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
      <DashboardClient
        metrics={metrics}
        predictions={predictions}
        shapGlobal={shapGlobal}
      />
    </main>
  );
}
