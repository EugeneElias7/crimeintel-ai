// Mock data for local UI development
// frontend/src/lib/mockData.ts
import { DashboardSummary } from '../types/api';

export const mockDashboardSummary: DashboardSummary = {
  total_cases: 300,
  open_cases: 154,
  under_investigation: 41,
  critical_cases: 12,
  resolved_this_month: 23,
  total_evidence: 740,
  recent_activity: [
    {
      id: 1,
      action: "create",
      entity_type: "case",
      entity_id: 1024,
      user: "kavya",
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      action: "update",
      entity_type: "evidence",
      entity_id: 205,
      user: "arjun",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    }
  ]
};