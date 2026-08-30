import { useState } from "react";
import AlertBanner from "../components/AlertBanner";
import MapView from "../components/MapView";
import MarineWeatherCard from "../components/MarineWeatherCard";
import RiskRadarLegend from "../components/RiskRadarLegend";
import RouteComparisonCards from "../components/RouteComparisonCards";
import RouteForm from "../components/RouteForm";
import WhatIfSimulator from "../components/WhatIfSimulator";
import api from "../api/client";
import { useAppStore } from "../store/useAppStore";
import type { Coordinate, RouteStrategy, VesselProfile, RouteOption } from "../types";

export default function Home() {
  const { lastRoute, setLastRoute, selectedStrategy, setSelectedStrategy } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [showRiskRadar, setShowRiskRadar] = useState(false);

  async function handleSubmit(origin: Coordinate, destination: Coordinate, vessel: VesselProfile) {
    setLoading(true);
    setError(null);
    setSavedMsg(null);
    try {
      const resp = await api.optimizeRoute({ origin, destination, vessel });
      setLastRoute(resp);
      if (resp.options.length > 0) {
        setSelectedStrategy(resp.options[0].strategy);
      }
    } catch (e) {
      console.error(e);
      setError("Could not compute a route. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveVoyage(opt: RouteOption) {
    if (!lastRoute) return;
    try {
      await api.createVoyage({
        vessel_id: 1, // demo: associates with the first fleet vessel; wire up a picker for multi-vessel use
        origin: lastRoute.origin,
        destination: lastRoute.destination,
        strategy: opt.strategy as RouteStrategy,
        status: "Planned",
        distance_nm: opt.distance_nm,
        duration_hr: opt.duration_hr,
        fuel_tons: opt.fuel_tons,
        co2_tons: opt.co2_tons,
        route_points: opt.points,
        risk_segments: opt.risk_segments,
      });
      setSavedMsg(`Saved the ${opt.strategy} route to voyage history.`);
    } catch {
      setSavedMsg("Could not save voyage — add a vessel to your fleet first.");
    }
  }

  const activeOption = lastRoute?.options.find((o) => o.strategy === selectedStrategy);

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-4">
        <RouteForm onSubmit={handleSubmit} loading={loading} />
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {savedMsg && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {savedMsg}
          </div>
        )}
        {activeOption && <WhatIfSimulator baseline={activeOption} />}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={showRiskRadar}
              onChange={(e) => setShowRiskRadar(e.target.checked)}
              className="h-4 w-4 accent-deepblue"
            />
            Risk radar overlay
          </label>
          {showRiskRadar && <RiskRadarLegend />}
        </div>

        <div className="h-[420px] overflow-hidden rounded-xl shadow-sm">
          <MapView
            origin={lastRoute?.origin ?? null}
            destination={lastRoute?.destination ?? null}
            options={lastRoute?.options ?? []}
            activeStrategy={selectedStrategy}
            showRiskRadar={showRiskRadar}
          />
        </div>

        {lastRoute && <AlertBanner options={lastRoute.options} warnings={lastRoute.warnings} />}

        {lastRoute && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MarineWeatherCard label="Conditions at origin" point={lastRoute.origin} />
            <MarineWeatherCard label="Conditions at destination" point={lastRoute.destination} />
          </div>
        )}

        {lastRoute && (
          <RouteComparisonCards
            options={lastRoute.options}
            activeStrategy={selectedStrategy as RouteStrategy}
            onSelect={setSelectedStrategy}
            onSaveVoyage={handleSaveVoyage}
          />
        )}

        {!lastRoute && !loading && (
          <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400">
            Enter an origin and destination, then click "Optimize Route" to see results here.
          </div>
        )}
      </div>
    </div>
  );
}
