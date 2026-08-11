// API Interfaces for Dashboard and Cases
// frontend/src/types/api.ts

export interface DashboardActivity {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  user: string;
  created_at: string;
}

export interface DashboardSummary {
  total_cases: number;
  open_cases: number;
  under_investigation: number;
  critical_cases: number;
  resolved_this_month: number;
  total_evidence: number;
  recent_activity: DashboardActivity[];
}