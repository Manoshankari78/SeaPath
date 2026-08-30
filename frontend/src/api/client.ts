import axios from "axios";
import type {
  AlertOut,
  AlertStatus,
  AuthResponse,
  RouteRequest,
  RouteResponse,
  User,
  VesselCreate,
  VesselOut,
  VoyageCreate,
  VoyageOut,
  VoyageStatus,
  WaypointOut,
  WeatherPoint,
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// attach the JWT (if present) to every outgoing request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("seapath_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  health: () => client.get("/health").then((r) => r.data),

  // --- auth ---
  register: (name: string, email: string, password: string) =>
    client.post<AuthResponse>("/auth/register", { name, email, password }).then((r) => r.data),

  login: (email: string, password: string) =>
    client.post<AuthResponse>("/auth/login", { email, password }).then((r) => r.data),

  me: () => client.get<User>("/auth/me").then((r) => r.data),

  // --- routing ---
  optimizeRoute: (req: RouteRequest) =>
    client.post<RouteResponse>("/route/optimize", req).then((r) => r.data),

  reoptimizeVoyage: (voyageId: number) =>
    client.post<RouteResponse>(`/route/reoptimize/${voyageId}`).then((r) => r.data),

  // --- fleet ---
  listFleet: () => client.get<VesselOut[]>("/fleet").then((r) => r.data),

  createVessel: (v: VesselCreate) => client.post<VesselOut>("/fleet", v).then((r) => r.data),

  deleteVessel: (id: number) => client.delete(`/fleet/${id}`),

  // --- voyages ---
  listVoyages: () => client.get<VoyageOut[]>("/voyages").then((r) => r.data),

  createVoyage: (v: VoyageCreate) => client.post<VoyageOut>("/voyages", v).then((r) => r.data),

  updateVoyageStatus: (id: number, status: VoyageStatus) =>
    client.patch<VoyageOut>(`/voyages/${id}/status`, { status }).then((r) => r.data),

  getWaypoints: (voyageId: number) =>
    client.get<WaypointOut[]>(`/voyages/${voyageId}/waypoints`).then((r) => r.data),

  voyageReportUrl: (id: number) => `${API_BASE}/voyages/${id}/report`,

  downloadVoyageReport: async (id: number) => {
    const resp = await client.get(`/voyages/${id}/report`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([resp.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `voyage_${id}_report.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // --- weather ---
  weather: (lat: number, lon: number) =>
    client.get<WeatherPoint>("/weather", { params: { lat, lon } }).then((r) => r.data),

  // --- alerts ---
  listAlerts: () => client.get<AlertOut[]>("/alerts").then((r) => r.data),

  updateAlertStatus: (id: number, status: AlertStatus) =>
    client.patch<AlertOut>(`/alerts/${id}`, { status }).then((r) => r.data),
};

export default api;
