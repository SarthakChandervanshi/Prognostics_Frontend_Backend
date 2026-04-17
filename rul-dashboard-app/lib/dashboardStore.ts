"use client";

import { create } from "zustand";

type IntervalMode = "all" | "median" | "band";
type ShapView = "local" | "global";

type DashboardState = {
  selectedEngine: number | null;
  selectedSensor: string;
  intervalMode: IntervalMode;
  shapView: ShapView;
  setSelectedEngine: (engineId: number | null) => void;
  setSelectedSensor: (sensor: string) => void;
  setIntervalMode: (mode: IntervalMode) => void;
  setShapView: (view: ShapView) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedEngine: null,
  selectedSensor: "sensor_measurement_11_kalman",
  intervalMode: "all",
  shapView: "local",
  setSelectedEngine: (selectedEngine) => set({ selectedEngine }),
  setSelectedSensor: (selectedSensor) => set({ selectedSensor }),
  setIntervalMode: (intervalMode) => set({ intervalMode }),
  setShapView: (shapView) => set({ shapView }),
}));
