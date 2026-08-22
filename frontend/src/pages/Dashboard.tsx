import React, { useEffect, useState } from "react";
import { Briefcase, FolderOpen, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { KpiCard } from "../components/KpiCard";
import { ChartsRow } from "../components/ChartsRow";
import { dashboard, cases } from "../services/api";
import { getOverview, getTrends } from "../services/analyticsService";
import type { OverviewData, TrendItem } from "../types/analytics";

export const Dashboard = () => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          overviewRes,
          trendsRes,
          recentCasesRes,
        ] = await Promise.all([
          getOverview(),
          getTrends(),
          cases.list({ limit: 8 }),
        ]);

        setOverview(overviewRes);
        setTrends(trendsRes.data || []);
        setRecentCases(recentCasesRes.items || recentCasesRes || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">
          <span className="spinner spinner-spin w-8 h-8 mx-auto mb-4" />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">
          <p className="text-slate-600">Failed to load dashboard data.</p>
          <button
            onClick={() => setOverview(null)}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Dashboard Overview
        </h1>

        {/* The primary CTA button with the Theme Meridian cyan glow on hover */}
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          Ask CRIMA AI
        </button>
      </div>

      {/* KPI Grid - Responsive: 1 column on mobile, 2 on tablet, 4 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard
          title="Total Cases"
          value={overview.total_cases}
          icon={Briefcase}
          trend="12% from last month"
          trendUp={true}
        />
        <KpiCard
          title="Open Investigations"
          value={overview.open_cases}
          icon={FolderOpen}
        />
        <KpiCard
          title="Critical Priority"
          value={overview.critical_cases}
          icon={AlertTriangle}
          trend="Requires attention"
          trendUp={false}
        />
        <KpiCard
          title="Resolved This Month"
          value={overview.resolved_this_month}
          icon={CheckCircle}
          trend="8% from last month"
          trendUp={true}
        />
      </div>

      {/* Trends Chart Section */}
      <div className="mb-8">
        <h2 className="text-semibold text-slate-900 mb-4">Monthly Trends</h2>
        {trends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trends.map((trend, index) => (
              <div
                key={index}
                className="bg-white rounded-[10px] p-4 shadow-[0_1px_2px_rgba(11,18,32,0.06),0_4px_12px_rgba(11,18,32,0.06)] text-center"
              >
                <p className="text-sm font-medium text-slate-500">{trend.month}</p>
                <p className="text-2xl font-bold text-slate-900">{trend.total}</p>
                <p className="text-xs text-slate-400">Total</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[10px] p-6 text-center">
            <p className="text-slate-400">Loading trends...</p>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="mb-8">
        <ChartsRow />
      </div>

      {/* Recent Cases Section */}
      {recentCases.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-medium text-slate-900 mb-4">Recent Cases</h2>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {recentCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="flex items-start gap-3 p-3 bg-white rounded-[10px] shadow-[0_1px_2px_rgba(11,18,32,0.06)]"
              >
                <div className="w-3 h-3 bg-slate-300 rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 line-clamp-1">
                    {caseItem.case_number}: {caseItem.title}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {caseItem.category} • {caseItem.district}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};