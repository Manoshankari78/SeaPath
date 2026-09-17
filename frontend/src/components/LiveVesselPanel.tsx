import { Pause, Play, RotateCcw, Crosshair } from "lucide-react";
import type { TrackingStatus, VesselPosition, VoyageTracking } from "../types";

interface LiveVesselPanelProps {
  tracking: VoyageTracking | null;
  position: VesselPosition | null;
  status: TrackingStatus | null;
  connection: string;
  error?: string | null;
  onControl: (action: "start" | "pause" | "reset" | "speed", speed?: number) => void;
  onFocusVessel: () => void;
  /** Demo playback controls are hidden when the feed is real AIS. */
  showDemoControls?: boolean;
}

const SPEED_OPTIONS = [1, 2, 5, 10];

function riskTone(label: string): string {
  if (label === "High") return "bg-red-100 text-red-700";
  if (label === "Moderate") return "bg-amber/25 text-[#8a5a12]";
  return "bg-emerald-100 text-emerald-700";
}

function formatEta(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LiveVesselPanel({
  tracking,
  position,
  status,
  connection,
  error,
  onControl,
  onFocusVessel,
  showDemoControls = true,
}: LiveVesselPanelProps) {
  const running = tracking?.simulation_running ?? false;
  const progress = tracking?.progress_percent ?? 0;
  const conditions = tracking?.conditions;

  return (
    <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      {/* --- provenance banner: never let simulated data look like real AIS --- */}
      {status && (
        <div
          className={`flex items-start gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wide ${
            status.simulated
              ? "bg-amber/20 text-[#8a5a12]"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          <span
            className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
              connection === "live"
                ? "animate-pulse bg-current"
                : connection === "polling"
                  ? "bg-current opacity-60"
                  : "bg-slate-400"
            }`}
          />
          <div>
            <div>{status.label}</div>
            <div className="mt-0.5 font-normal normal-case tracking-normal opacity-80">
              {connection === "live"
                ? "Streaming over WebSocket."
                : connection === "polling"
                  ? "WebSocket unavailable — polling for updates."
                  : connection === "error"
                    ? "Feed unavailable."
                    : "Idle."}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* --- voyage header --- */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current voyage
          </h3>
          <p className="truncate text-lg font-bold text-ink">
            {tracking?.vessel_name ?? "Vessel"}
          </p>
          <p className="truncate text-xs text-slate-500">
            {tracking?.start_port ?? "Origin"} → {tracking?.end_port ?? "Destination"}
          </p>
        </div>
        <button
          type="button"
          onClick={onFocusVessel}
          disabled={!position}
          title="Centre the map on the vessel"
          className="flex shrink-0 items-center gap-1 rounded-md border border-deepblue/30 px-2.5 py-1.5 text-xs font-semibold text-deepblue transition hover:bg-deepblue hover:text-white disabled:opacity-40"
        >
          <Crosshair size={13} />
          Track Ship
        </button>
      </div>

      {/* --- progress --- */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-500">Progress</span>
          <span className="font-bold text-ink">{progress.toFixed(0)}%</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-deepblue transition-all duration-700 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* --- live figures --- */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <Stat label="Status" value={position?.status ?? tracking?.status ?? "—"} />
        <Stat
          label="Speed"
          value={position ? `${position.speed_knots.toFixed(1)} kn` : "—"}
        />
        <Stat
          label="Heading"
          value={position ? `${Math.round(position.heading_deg)}°` : "—"}
        />
        <Stat
          label="Position"
          value={
            position
              ? `${position.latitude.toFixed(3)}°, ${position.longitude.toFixed(3)}°`
              : "—"
          }
        />
        <Stat
          label="Travelled"
          value={tracking ? `${tracking.distance_travelled_nm.toFixed(0)} nm` : "—"}
        />
        <Stat
          label="Remaining"
          value={tracking ? `${tracking.distance_remaining_nm.toFixed(0)} nm` : "—"}
        />
        <div className="col-span-2">
          <Stat label="ETA" value={formatEta(tracking?.eta)} />
        </div>
      </dl>

      {/* --- live conditions from the existing weather + risk services --- */}
      {conditions && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current conditions
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <Stat
              label="Wave height"
              value={`${conditions.weather.wave_height_m?.toFixed(1) ?? "—"} m`}
            />
            <Stat
              label="Wind speed"
              value={`${conditions.weather.wind_speed_kmh?.toFixed(0) ?? "—"} km/h`}
            />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <RiskChip label="Wave" value={conditions.wave_risk_label} />
            <RiskChip label="Wind" value={conditions.wind_risk_label} />
            <RiskChip label="Overall" value={conditions.overall_risk_label} />
          </div>
        </div>
      )}

      {/* --- demo playback controls --- */}
      {showDemoControls && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Simulation
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onControl(running ? "pause" : "start")}
              className="flex items-center gap-1.5 rounded-md bg-deepblue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy"
            >
              {running ? <Pause size={13} /> : <Play size={13} />}
              {running ? "Pause" : "Start"}
            </button>
            <button
              type="button"
              onClick={() => onControl("reset")}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-slate-500">Speed</span>
            <div className="flex gap-1">
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onControl("speed", s)}
                  aria-pressed={tracking?.speed_multiplier === s}
                  className={`rounded px-2 py-1 text-xs font-semibold transition ${
                    tracking?.speed_multiplier === s
                      ? "bg-deepblue text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate font-semibold text-ink">{value}</dd>
    </div>
  );
}

function RiskChip({ label, value }: { label: string; value: string }) {
  return (
    <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${riskTone(value)}`}>
      {label}: {value}
    </span>
  );
}
