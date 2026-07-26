export interface OverviewData {
  total_cases: number;
  open_cases: number;
  closed_cases: number;
  filed_cases: number;
  clearance_rate: number;
  avg_resolution_days: number;
}

export interface DistributionItem {
  crime_type: string;
  count: number;
  percentage: number;
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
}
