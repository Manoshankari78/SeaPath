import { useEffect, useState } from "react";
import api from "../api/client";
import type { VesselOut, VesselType } from "../types";

const VESSEL_TYPES: VesselType[] = ["container", "tanker", "bulk_carrier", "cruise", "fishing"];

export default function Fleet() {
  const [vessels, setVessels] = useState<VesselOut[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<VesselType>("container");
  const [speed, setSpeed] = useState(18);
  const [draft, setDraft] = useState(10);
  const [deadweight, setDeadweight] = useState(20000);
  const [fuelRate, setFuelRate] = useState<number | "">("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      setVessels(await api.listFleet());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await api.createVessel({
      name,
      vessel_type: type,
      cruise_speed_knots: speed,
      draft_m: draft,
      deadweight_tons: deadweight,
      fuel_rate_ton_per_hr: fuelRate === "" ? null : fuelRate,
    });
    setName("");
    setFuelRate("");
    refresh();
  }

  async function handleDelete(id: number) {
    await api.deleteVessel(id);
    refresh();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Fleet Dashboard</h1>
        <p className="text-sm text-slate-500">
          Manage vessel profiles — type, speed, draft, deadweight, and baseline fuel rate.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="grid grid-cols-1 gap-3 rounded-xl bg-white p-5 shadow-sm border border-slate-100 sm:grid-cols-3 lg:grid-cols-6"
      >
        <input
          className="rounded-md border border-slate-200 px-3 py-2 text-sm sm:col-span-2 lg:col-span-2"
          placeholder="Vessel name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as VesselType)}
        >
          {VESSEL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
        <input
          type="number"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          placeholder="Speed (kn)"
        />
        <input
          type="number"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          value={draft}
          onChange={(e) => setDraft(Number(e.target.value))}
          placeholder="Draft (m)"
        />
        <input
          type="number"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          value={deadweight}
          onChange={(e) => setDeadweight(Number(e.target.value))}
          placeholder="Deadweight (t)"
        />
        <input
          type="number"
          step="0.1"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          value={fuelRate}
          onChange={(e) => setFuelRate(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Fuel rate (t/hr, optional)"
        />
        <button className="rounded-md bg-deepblue px-3 py-2 text-sm font-semibold text-white hover:bg-navy sm:col-span-3 lg:col-span-1">
          Add vessel
        </button>
      </form>

      {loading ? (
        <div className="text-sm text-slate-400">Loading fleet…</div>
      ) : vessels.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400">
          No vessels yet — add one above to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vessels.map((v) => (
            <div key={v.id} className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold text-ink">{v.name}</span>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="text-xs font-medium text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
              <dl className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <dt>Type</dt>
                  <dd className="capitalize font-medium text-ink">{v.vessel_type.replace("_", " ")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Cruise speed</dt>
                  <dd className="font-medium text-ink">{v.cruise_speed_knots} kn</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Draft</dt>
                  <dd className="font-medium text-ink">{v.draft_m} m</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Deadweight</dt>
                  <dd className="font-medium text-ink">{v.deadweight_tons.toLocaleString()} t</dd>
                </div>
                {v.fuel_rate_ton_per_hr != null && (
                  <div className="flex justify-between">
                    <dt>Fuel rate</dt>
                    <dd className="font-medium text-ink">{v.fuel_rate_ton_per_hr} t/hr</dd>
                  </div>
                )}
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
