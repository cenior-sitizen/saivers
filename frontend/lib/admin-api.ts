/**
 * Admin API client — fetches from Next.js /api/admin/* (proxies to WattCoach backend).
 */

const BASE = "/api/admin";

export interface RegionSummary {
  neighborhood_id: string;
  period_days: number;
  household_count: number;
  total_kwh: number;
  total_cost_sgd: number;
  total_carbon_kg: number;
  peak_kwh: number;
  offpeak_kwh: number;
}

export interface HeatmapSlot {
  interval_date: string;
  slot_idx: number;
  total_kwh: number;
  active_homes: number;
}

export interface HouseholdContribution {
  household_id: number;
  this_week_peak_kwh: number;
  baseline_peak_kwh: number;
  reduction_pct: number;
}

export interface GridContribution {
  period: string;
  neighborhood_total_reduction_pct: number;
  households: HouseholdContribution[];
}

export interface HouseholdSummary {
  household_id: number;
  name: string;
  flat_type: string;
  today_kwh: number;
  today_baseline_kwh: number;
  anomaly_count: number;
}

export interface IncidentEvent {
  id: string;
  event_type: string;
  household_id: number | null;
  neighborhood_id: string;
  ts: string;
  severity: string;
  title: string;
  description: string;
  anomaly_score: number | null;
  excess_kwh?: number | null;
}

export interface AdminRecommendation {
  id: string;
  priority: string;
  action: string;
  region: string;
  reason: string;
  household_id: number | null;
}

export interface AnomaliesSummary {
  total_anomalies: number;
  affected_households: number;
  max_score: number;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`);
  return res.json();
}

export async function getRegionSummary(): Promise<RegionSummary> {
  return fetchJson(`${BASE}/region-summary`);
}

export async function getPeakHeatmap(): Promise<HeatmapSlot[]> {
  return fetchJson(`${BASE}/peak-heatmap`);
}

export async function getGridContribution(): Promise<GridContribution> {
  return fetchJson(`${BASE}/grid-contribution`);
}

export async function getHouseholds(): Promise<HouseholdSummary[]> {
  return fetchJson(`${BASE}/households`);
}

export async function getIncidents(days = 7): Promise<IncidentEvent[]> {
  return fetchJson(`${BASE}/incidents?days=${days}`);
}

export async function getRecommendations(): Promise<AdminRecommendation[]> {
  return fetchJson(`${BASE}/recommendations`);
}

export async function getAnomaliesSummary(days = 7): Promise<AnomaliesSummary> {
  return fetchJson(`${BASE}/anomalies-summary?days=${days}`);
}

export interface ExplainAnomalyRequest {
  household_id: number;
  ts: string;
  anomaly_score: number;
  excess_kwh: number;
}

export async function explainAnomaly(
  req: ExplainAnomalyRequest
): Promise<{ explanation: string }> {
  const res = await fetch(`${BASE}/explain-anomaly`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Explain failed: ${res.status}`);
  }
  return res.json();
}
