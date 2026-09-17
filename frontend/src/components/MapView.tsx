import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import PortMarkers from "./PortMarkers";
import ShipMarker from "./ShipMarker";
import type { Coordinate, Port, RouteOption, TrackPoint, VesselPosition } from "../types";

// Leaflet's default marker icons reference image files that Vite doesn't
// resolve automatically — rebuild them from the CDN so pins render correctly.
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/** Coloured endpoint pins so origin (green) and destination (red) are distinct. */
function endpointIcon(color: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      width:16px;height:16px;border-radius:9999px;background:${color};
      border:3px solid #ffffff;box-shadow:0 1px 4px rgba(14,34,51,0.4);
    "></div>`,
    className: "seapath-endpoint-marker",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

const originIcon = endpointIcon("#16A34A");
const destinationIcon = endpointIcon("#DC2626");

const STRATEGY_COLORS: Record<string, string> = {
  fastest: "#F2A65A",
  efficient: "#065A82",
  safest: "#1C7293",
};

// risk 0 -> green, 0.5 -> amber, 1 -> red — used by the risk-radar overlay
function riskColor(risk: number): string {
  if (risk >= 0.66) return "#DC2626";
  if (risk >= 0.33) return "#F2A65A";
  return "#16A34A";
}

interface MapViewProps {
  origin: Coordinate | null;
  destination: Coordinate | null;
  options: RouteOption[];
  activeStrategy: string;
  showRiskRadar?: boolean;

  // --- live tracking (all optional: the map works exactly as before without them) ---
  vesselId?: number | null;
  vesselName?: string;
  vesselPosition?: VesselPosition | null;
  vesselTrack?: TrackPoint[];
  originPort?: Port | null;
  destinationPort?: Port | null;
  ports?: Port[];
  showPorts?: boolean;
  onSetOriginPort?: (port: Port) => void;
  onSetDestinationPort?: (port: Port) => void;
  /** Bumping this number re-centres the map on the vessel. */
  focusVesselSignal?: number;
}

function FitBounds({ options }: { options: RouteOption[] }) {
  const map = useMap();
  useMemo(() => {
    const all = options.flatMap((o) => o.points);
    if (all.length > 0) {
      const bounds = L.latLngBounds(all.map((p) => [p.lat, p.lon]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [options, map]);
  return null;
}

/** Pans to the vessel when the caller bumps `signal` (the "Track Ship" button). */
function FocusVessel({
  position,
  signal,
}: {
  position: VesselPosition | null | undefined;
  signal: number | undefined;
}) {
  const map = useMap();
  useEffect(() => {
    if (!signal || !position) return;
    map.flyTo([position.latitude, position.longitude], Math.max(map.getZoom(), 6), {
      duration: 0.8,
    });
  }, [signal, position, map]);
  return null;
}

export default function MapView({
  origin,
  destination,
  options,
  activeStrategy,
  showRiskRadar = false,
  vesselName = "Vessel",
  vesselPosition = null,
  vesselTrack = [],
  originPort = null,
  destinationPort = null,
  ports = [],
  showPorts = false,
  onSetOriginPort,
  onSetDestinationPort,
  focusVesselSignal,
}: MapViewProps) {
  const center: [number, number] = origin ? [origin.lat, origin.lon] : [15, 70];
  const activeOption = options.find((o) => o.strategy === activeStrategy);

  // Split the active route at the vessel into "already sailed" and "still to
  // go" so the remaining leg reads differently from the completed one.
  const remainingRoute = useMemo(() => {
    if (!activeOption || !vesselPosition) return null;
    let nearest = 0;
    let best = Infinity;
    activeOption.points.forEach((p, i) => {
      const d =
        (p.lat - vesselPosition.latitude) ** 2 + (p.lon - vesselPosition.longitude) ** 2;
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    const tail = activeOption.points.slice(nearest);
    return tail.length > 1 ? tail : null;
  }, [activeOption, vesselPosition]);

  return (
    <MapContainer center={center} zoom={4} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {!showRiskRadar &&
        options.map((opt) => (
          <Polyline
            key={opt.strategy}
            positions={opt.points.map((p) => [p.lat, p.lon])}
            pathOptions={{
              color: STRATEGY_COLORS[opt.strategy] ?? "#065A82",
              weight: opt.strategy === activeStrategy ? 5 : 2,
              opacity: opt.strategy === activeStrategy ? 0.95 : 0.4,
            }}
          />
        ))}

      {/* Risk-radar overlay: draw the active route as individually-colored
          segments so wave/wind risk along the corridor is visible at a glance. */}
      {showRiskRadar &&
        activeOption &&
        activeOption.points.slice(0, -1).map((p, i) => {
          const next = activeOption.points[i + 1];
          const risk = activeOption.risk_segments[i] ?? 0;
          return (
            <Polyline
              key={i}
              positions={[
                [p.lat, p.lon],
                [next.lat, next.lon],
              ]}
              pathOptions={{ color: riskColor(risk), weight: 6, opacity: 0.85 }}
            />
          );
        })}

      {/* Remaining leg — dashed, so it's visually distinct from the sailed track. */}
      {remainingRoute && (
        <Polyline
          positions={remainingRoute.map((p) => [p.lat, p.lon])}
          pathOptions={{
            color: "#21295C",
            weight: 3,
            opacity: 0.55,
            dashArray: "6 8",
          }}
        />
      )}

      {/* Travelled track — the vessel's actual breadcrumb trail. */}
      {vesselTrack.length > 1 && (
        <Polyline
          positions={vesselTrack.map((p) => [p.latitude, p.longitude])}
          pathOptions={{ color: "#16A34A", weight: 4, opacity: 0.9 }}
        />
      )}

      {showPorts && ports.length > 0 && (
        <PortMarkers
          ports={ports}
          onSetOrigin={onSetOriginPort}
          onSetDestination={onSetDestinationPort}
          originPortId={originPort?.id ?? null}
          destinationPortId={destinationPort?.id ?? null}
        />
      )}

      {origin && (
        <Marker
          position={[origin.lat, origin.lon]}
          icon={originPort ? originIcon : defaultIcon}
        >
          <Popup>
            <div className="text-xs">
              <div className="font-bold text-ink">🟢 Origin</div>
              {originPort ? (
                <>
                  <div className="font-semibold text-ink">{originPort.name}</div>
                  <div className="text-slate-500">{originPort.state}</div>
                  <div className="text-slate-500">{originPort.port_type}</div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {originPort.latitude.toFixed(4)}°, {originPort.longitude.toFixed(4)}°
                  </div>
                </>
              ) : (
                <div className="text-slate-500">
                  {origin.lat.toFixed(4)}°, {origin.lon.toFixed(4)}°
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      )}

      {destination && (
        <Marker
          position={[destination.lat, destination.lon]}
          icon={destinationPort ? destinationIcon : defaultIcon}
        >
          <Popup>
            <div className="text-xs">
              <div className="font-bold text-ink">🔴 Destination</div>
              {destinationPort ? (
                <>
                  <div className="font-semibold text-ink">{destinationPort.name}</div>
                  <div className="text-slate-500">{destinationPort.state}</div>
                  <div className="text-slate-500">{destinationPort.port_type}</div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {destinationPort.latitude.toFixed(4)}°,{" "}
                    {destinationPort.longitude.toFixed(4)}°
                  </div>
                </>
              ) : (
                <div className="text-slate-500">
                  {destination.lat.toFixed(4)}°, {destination.lon.toFixed(4)}°
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      )}

      {vesselPosition && (
        <ShipMarker
          position={vesselPosition}
          vesselName={vesselName}
          originName={originPort?.name}
          destinationName={destinationPort?.name}
          progressPercent={vesselPosition.progress_percent}
        />
      )}

      <FocusVessel position={vesselPosition} signal={focusVesselSignal} />

      {options.length > 0 && <FitBounds options={options} />}
    </MapContainer>
  );
}
