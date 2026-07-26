import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Calendar,
  FolderOpen,
  FileText,
  TrendingUp,
  Activity,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import {
  getOverview,
  getDistribution,
  getTrends,
  getByDistrict,
} from '../services/analyticsService';
import type { OverviewData, DistributionItem, TrendItem, DistrictItem } from '../types/analytics';

const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

type Preset = '7d' | '30d' | '12m' | 'custom';

function getDateRange(preset: Preset): { from: string; to: string } {
  const to = new Date().toISOString().split('T')[0];
  const fromDate = new Date();
  if (preset === '7d') fromDate.setDate(fromDate.getDate() - 7);
  else if (preset === '30d') fromDate.setDate(fromDate.getDate() - 30);
  else fromDate.setFullYear(fromDate.getFullYear() - 1);
  return { from: fromDate.toISOString().split('T')[0], to };
}

function SkeletonChart() {
  return (
    <div className="animate-pulse rounded-lg bg-white p-5 shadow-sm">
      <div className="mb-4 h-5 w-32 rounded bg-gray-200" />
      <div className="h-72 rounded bg-gray-100" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<Preset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [byDistrict, setByDistrict] = useState<DistrictItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = preset === 'custom' ? { from: customFrom, to: customTo } : getDateRange(preset);
      const [overviewRes, distRes, trendsRes, districtRes] = await Promise.all([
        getOverview(range.from, range.to),
        getDistribution(range.from, range.to),
        getTrends(range.from, range.to),
        getByDistrict(range.from, range.to),
      ]);
      setOverview(overviewRes.data);
      setDistribution(distRes.data);
      setTrends(trendsRes.data);
      setByDistrict(districtRes.data);
    } catch {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpiCards = [
    {
      icon: <FolderOpen className="h-6 w-6 text-blue-600" />,
      value: overview?.total_cases ?? 0,
      label: 'Total Cases',
      bg: 'bg-blue-50',
    },
    {
      icon: <FileText className="h-6 w-6 text-amber-600" />,
      value: overview?.open_cases ?? 0,
      label: 'Open',
      bg: 'bg-amber-50',
    },
    {
      icon: <Activity className="h-6 w-6 text-green-600" />,
      value: overview?.closed_cases ?? 0,
      label: 'Closed',
      bg: 'bg-green-50',
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-purple-600" />,
      value: `${(overview?.clearance_rate ?? 0).toFixed(1)}%`,
      label: 'Clearance Rate',
      bg: 'bg-purple-50',
    },
  ];

  const statusData = [
    { name: 'Open', value: overview?.open_cases ?? 0 },
    { name: 'Closed', value: overview?.closed_cases ?? 0 },
    { name: 'Under Investigation', value: Math.max(0, (overview?.total_cases ?? 0) - (overview?.open_cases ?? 0) - (overview?.closed_cases ?? 0)) },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Crime data analysis and insights
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['7d', '30d', '12m'] as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                preset === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '12 Months'}
            </button>
          ))}
          <button
            onClick={() => setPreset('custom')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              preset === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Calendar size={14} className="inline" /> Custom
          </button>
        </div>
      </div>

      {preset === 'custom' && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                From
              </label>
              <input
                type="date"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                To
              </label>
              <input
                type="date"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
            <Button size="sm" className="mt-5" onClick={fetchData}>
              Apply
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-lg bg-white shadow-sm"
              />
            ))}
          </div>
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SkeletonChart />
            <SkeletonChart />
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16">
          <p className="mb-4 text-red-600">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </div>
      ) : !overview || overview.total_cases === 0 ? (
        <EmptyState
          icon={<TrendingUp size={48} />}
          title="No data for selected period"
          description="Try a different date range."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((card, idx) => (
              <Card key={idx}>
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg p-3 ${card.bg}`}>{card.icon}</div>
                </div>
                <p className="mt-3 text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </Card>
            ))}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Crime Distribution">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution.map((d, i) => ({
                        name: d.crime_type,
                        value: d.count,
                        color: COLORS[i % COLORS.length],
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {distribution.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Monthly Trend">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Total"
                    />
                    <Line
                      type="monotone"
                      dataKey="open"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Open"
                    />
                    <Line
                      type="monotone"
                      dataKey="closed"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Closed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Cases by District">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDistrict}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="district" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Status Breakdown">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
