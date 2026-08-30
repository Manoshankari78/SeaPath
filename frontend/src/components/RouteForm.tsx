import { useState } from "react";
import type { Coordinate, VesselProfile, VesselType } from "../types";

interface RouteFormProps {
  onSubmit: (origin: Coordinate, destination: Coordinate, vessel: VesselProfile) => void;
  loading: boolean;
}

const VESSEL_TYPES: { value: VesselType; label: string }[] = [
  { value: "container", label: "Container Ship" },
  { value: "tanker", label: "Tanker" },
  { value: "bulk_carrier", label: "Bulk Carrier" },
  { value: "cruise", label: "Cruise Ship" },
  { value: "fishing", label: "Fishing Vessel" },
];

const PRESETS = [
  { label: "Mumbai → Dubai", origin: { lat: 18.96, lon: 72.82 }, destination: { lat: 25.2, lon: 55.27 } },
  { label: "Mumbai → Chennai", origin: { lat: 18.96, lon: 72.82 }, destination: { lat: 13.08, lon: 80.27 } },
  { label: "Singapore → Rotterdam", origin: { lat: 1.29, lon: 103.85 }, destination: { lat: 51.92, lon: 4.48 } },
];

export default function RouteForm({ onSubmit, loading }: RouteFormProps) {
  const [originLat, setOriginLat] = useState("18.96");
  const [originLon, setOriginLon] = useState("72.82");
  const [destLat, setDestLat] = useState("25.2");
  const [destLon, setDestLon] = useState("55.27");
  const [vesselType, setVesselType] = useState<VesselType>("container");
  const [speed, setSpeed] = useState(18);
  const [draft, setDraft] = useState(10);
  const [deadweight, setDeadweight] = useState(20000);

  function applyPreset(p: (typeof PRESETS)[number]) {
    setOriginLat(String(p.origin.lat));
    setOriginLon(String(p.origin.lon));
    setDestLat(String(p.destination.lat));
    setDestLon(String(p.destination.lon));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const origin: Coordinate = { lat: parseFloat(originLat), lon: parseFloat(originLon) };
    const destination: Coordinate = { lat: parseFloat(destLat), lon: parseFloat(destLon) };
    const vessel: VesselProfile = {
      name: "Planned Voyage",
      vessel_type: vesselType,
      cruise_speed_knots: speed,
      draft_m: draft,
      deadweight_tons: deadweight,
    };
    onSubmit(origin, destination, vessel);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-5 shadow-sm border border-slate-100">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Quick presets
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p.label}
              onClick={() => applyPreset(p)}
              className="rounded-full border border-deepblue/30 px-3 py-1 text-xs font-medium text-deepblue hover:bg-deepblue hover:text-white transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Origin latitude</label>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={originLat}
            onChange={(e) => setOriginLat(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Origin longitude</label>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={originLon}
            onChange={(e) => setOriginLon(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Destination latitude</label>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={destLat}
            onChange={(e) => setDestLat(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Destination longitude</label>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={destLon}
            onChange={(e) => setDestLon(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Vessel type</label>
        <select
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          value={vesselType}
          onChange={(e) => setVesselType(e.target.value as VesselType)}
        >
          {VESSEL_TYPES.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">
            Cruise speed: {speed} kn
          </label>
          <input
            type="range"
            min={8}
            max={28}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full accent-deepblue"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Draft (m)</label>
          <input
            type="number"
            min={1}
            max={25}
            value={draft}
            onChange={(e) => setDraft(Number(e.target.value))}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Deadweight (tons)</label>
        <input
          type="number"
          min={500}
          value={deadweight}
          onChange={(e) => setDeadweight(Number(e.target.value))}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-deepblue py-2.5 text-sm font-semibold text-white hover:bg-navy transition disabled:opacity-50"
      >
        {loading ? "Computing optimal routes…" : "Optimize Route"}
      </button>
    </form>
  );
}
