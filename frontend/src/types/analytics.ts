export interface OverviewData {
  total_cases: number;
  open_cases: number;
  under_investigation: number;
  critical_cases: number;
  resolved_this_month: number;
  total_evidence: number;
  recent_activity: any[];
}

export interface TrendItem {
  month: string;
  total: number;
  open: number;
  closed: number;
}

export interface DistrictItem {
  district: string;
  count: number;
  percentage: number;
}