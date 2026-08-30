import { create } from "zustand";
import type { RouteResponse, VesselProfile } from "../types";

interface AppState {
  lastRoute: RouteResponse | null;
  selectedStrategy: string;
  vessel: VesselProfile;
  setLastRoute: (r: RouteResponse | null) => void;
  setSelectedStrategy: (s: string) => void;
  setVessel: (v: VesselProfile) => void;
}

export const useAppStore = create<AppState>((set) => ({
  lastRoute: null,
  selectedStrategy: "efficient",
  vessel: {
    name: "MV Demo",
    vessel_type: "container",
    cruise_speed_knots: 18,
    draft_m: 10,
    deadweight_tons: 20000,
  },
  setLastRoute: (r) => set({ lastRoute: r }),
  setSelectedStrategy: (s) => set({ selectedStrategy: s }),
  setVessel: (v) => set({ vessel: v }),
}));
