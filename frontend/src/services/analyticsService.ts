import type { ApiResponse } from '../types/api';
import type { OverviewData, DistributionItem, TrendItem, DistrictItem } from '../types/analytics';
import api from './api';

export const getOverview = async (from?: string, to?: string): Promise<ApiResponse<OverviewData>> => {
  const { data } = await api.get<ApiResponse<OverviewData>>('/analytics/overview', {
    params: { from, to },
  });
  return data;
};

export const getDistribution = async (
  from?: string,
  to?: string,
): Promise<ApiResponse<DistributionItem[]>> => {
  const { data } = await api.get<ApiResponse<DistributionItem[]>>('/analytics/distribution', {
    params: { from, to },
  });
  return data;
};

export const getTrends = async (from?: string, to?: string): Promise<ApiResponse<TrendItem[]>> => {
  const { data } = await api.get<ApiResponse<TrendItem[]>>('/analytics/trends', {
    params: { from, to },
  });
  return data;
};

export const getByDistrict = async (
  from?: string,
  to?: string,
): Promise<ApiResponse<DistrictItem[]>> => {
  const { data } = await api.get<ApiResponse<DistrictItem[]>>('/analytics/by-district', {
    params: { from, to },
  });
  return data;
};
