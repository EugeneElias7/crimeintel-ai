// frontend/src/pages/Dashboard.tsx
import React from 'react';
import { Briefcase, FolderOpen, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { ChartsRow } from '../components/ChartsRow';
import { mockDashboardSummary } from '../lib/mockData';

export const Dashboard = () => {
  // Using our mock data until Eugene finishes the real API
  const data = mockDashboardSummary;

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
          value={data.total_cases}
          icon={Briefcase}
          trend="12% from last month"
          trendUp={true}
        />
        <KpiCard
          title="Open Investigations"
          value={data.open_cases}
          icon={FolderOpen}
        />
        <KpiCard
          title="Critical Priority"
          value={data.critical_cases}
          icon={AlertTriangle}
          trend="Requires attention"
          trendUp={false}
        />
        <KpiCard
          title="Resolved This Month"
          value={data.resolved_this_month}
          icon={CheckCircle}
          trend="8% from last month"
          trendUp={true}
        />
      </div>

      {/* Placeholder for the charts we will build next */}
      <div className="mb-8">
        <ChartsRow />
      </div>
    </div>
  );
};