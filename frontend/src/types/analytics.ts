export interface OverviewData {
  total_cases: number;
  open_cases: number;
  closed_cases: number;
  filed_cases: number;
  clearance_rate: number;
  avg_resolution_days: number;
  period: {
    from_date: string;
    to_date: string;
  };
  recent_activity?: any[];
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

export interface DistributionItem {
  crime_type: string;
  count: number;
  percentage: number;
}