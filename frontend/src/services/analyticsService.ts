import type { OverviewData, TrendItem, DistrictItem } from "../types/analytics";
import type { DistributionItem } from "../types/analytics";
import api from "./api";

export const getOverview = async (
  from?: string,
  to?: string
): Promise<OverviewData> => {
  const { data } = await api.get<OverviewData>("/analytics/overview", {
    params: { from, to },
  });
  return data;
};

export const getDistribution = async (
  from?: string,
  to?: string
): Promise<DistributionItem[]> => {
  const { data } = await api.get<DistributionItem[]>("/analytics/distribution", {
    params: { from, to },
  });
  return data;
};

export const getTrends = async (
  from?: string,
  to?: string
): Promise<TrendItem[]> => {
  const { data } = await api.get<TrendItem[]>("/analytics/trends", {
    params: { from, to },
  });
  return data;
};

export const getByDistrict = async (
  from?: string,
  to?: string
): Promise<DistrictItem[]> => {
  const { data } = await api.get<DistrictItem[]>("/analytics/by-district", {
    params: { from, to },
  });
  return data;
};