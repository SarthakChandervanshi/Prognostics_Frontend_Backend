"use client";

import { create } from "zustand";

type IntervalMode = "all" | "median" | "band";
type ShapView = "local" | "global";
type PhaseFilter = "all" | "critical" | "healthy";

type DashboardState = {
  selectedEngine: number | null;
  selectedSensor: string;
  intervalMode: IntervalMode;
  shapView: ShapView;
  phaseFilter: PhaseFilter;
  setSelectedEngine: (engineId: number | null) => void;
  setSelectedSensor: (sensor: string) => void;
  setIntervalMode: (mode: IntervalMode) => void;
  setShapView: (view: ShapView) => void;
  setPhaseFilter: (filter: PhaseFilter) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedEngine: null,
  selectedSensor: "sensor_measurement_11_kalman",
  intervalMode: "all",
  shapView: "local",
  phaseFilter: "all",
  setSelectedEngine: (selectedEngine) => set({ selectedEngine }),
  setSelectedSensor: (selectedSensor) => set({ selectedSensor }),
  setIntervalMode: (intervalMode) => set({ intervalMode }),
  setShapView: (shapView) => set({ shapView }),
  setPhaseFilter: (phaseFilter) => set({ phaseFilter }),
}));
