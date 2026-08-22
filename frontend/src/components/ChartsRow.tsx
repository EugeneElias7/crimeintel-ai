import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { dashboard } from "../services/api";
import { DashboardSummary } from "../types/api";

interface ChartData {
  name: string;
  uv: number;
  cost: number;
  click: number;
}

export const ChartsRow = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboard.summary();
        setSummary(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data for charts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !summary) {
    return (
      <div className="h-64 bg-white rounded-[10px] p-6 flex items-center justify-center">
        <span className="text-slate-400">Loading charts...</span>
      </div>
    );
  }

  // District chart data
  const districtData = [
    { name: "Bengaluru Urban", uv: summary?.total_cases || 300, cost: 0, click: 0 },
    { name: "Bengaluru Rural", uv: 154, cost: 0, click: 0 },
    { name: "Mysuru", uv: 88, cost: 0, click: 0 },
    { name: "Hubballi-Dharwad", uv: 67, cost: 0, click: 0 },
  ];

  // Category chart data
  const categoryData = [
    { name: "Vehicle Theft", uv: 54, cost: 0, click: 0 },
    { name: "Burglary", uv: 42, cost: 0, click: 0 },
    { name: "Assault", uv: 31, cost: 0, click: 0 },
    { name: "Fraud", uv: 28, cost: 0, click: 0 },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* District Chart */}
      <div className="bg-white rounded-[10px] p-6 shadow-[0_1px_2px_rgba(11,18,32,0.06),0_4px_12px_rgba(11,18,32,0.06)]">
        <h3 className="text-semibold text-slate-900 mb-4">Cases by District</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={districtData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="uv" stroke="#8884d8" activeDot={{ r: 8 }} />
            <CartesianGrid strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category Chart */}
      <div className="bg-white rounded-[10px] p-6 shadow-[0_1px_2px_rgba(11,18,32,0.06),0_4px_12px_rgba(11,18,32,0.06)]">
        <h3 className="text-semibold text-slate-900 mb-4">Cases by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={categoryData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="uv" stroke="#82ca9d" activeDot={{ r: 8 }} />
            <CartesianGrid strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};