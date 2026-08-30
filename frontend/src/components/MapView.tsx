import L from "leaflet";
import { useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { RouteOption, Coordinate } from "../types";

// Leaflet's default marker icons reference image files that Vite doesn't
// resolve automatically — rebuild them from the CDN so pins render correctly.
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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

export default function MapView({
  origin,
  destination,
  options,
  activeStrategy,
  showRiskRadar = false,
}: MapViewProps) {
  const center: [number, number] = origin ? [origin.lat, origin.lon] : [15, 70];
  const activeOption = options.find((o) => o.strategy === activeStrategy);

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

      {origin && (
        <Marker position={[origin.lat, origin.lon]} icon={defaultIcon}>
          <Popup>Origin</Popup>
        </Marker>
      )}
      {destination && (
        <Marker position={[destination.lat, destination.lon]} icon={defaultIcon}>
          <Popup>Destination</Popup>
        </Marker>
      )}

      {options.length > 0 && <FitBounds options={options} />}
    </MapContainer>
  );
}
