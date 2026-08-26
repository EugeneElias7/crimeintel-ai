// @ts-nocheck
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
  Sector,
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
  const [live, setLive] = useState(true);
  const [cycleLive, setCycleLive] = useState(0);
  const [pieActive, setPieActive] = useState(0);

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [byDistrict, setByDistrict] = useState<DistrictItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastLiveUpdate, setLastLiveUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const range = preset === 'custom' ? { from: customFrom, to: customTo } : getDateRange(preset);
      const [overviewRes, distRes, trendsRes, districtRes] = await Promise.all([
        getOverview(range.from, range.to),
        getDistribution(range.from, range.to),
        getTrends(range.from, range.to),
        getByDistrict(range.from, range.to),
      ]);
      setOverview(overviewRes);
      setDistribution(distRes);
      setTrends(trendsRes);
      setByDistrict(districtRes);
      setLastLiveUpdate(new Date());
    } catch {
      setError('Failed to load analytics data');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Live: poll real reports/analytics every 12s + cycle charts every 4s
  useEffect(() => {
    if (!live || preset === 'custom') return;
    const id = setInterval(() => fetchData(false), 12000);
    return () => clearInterval(id);
  }, [live, preset, fetchData]);

  useEffect(() => {
    if (!live || preset === 'custom') return;
    const order: Preset[] = ['7d', '30d', '12m'];
    const id = setInterval(() => {
      setPreset((prev) => {
        const idx = order.indexOf(prev as Preset);
        return idx === -1 ? '30d' : order[(idx + 1) % order.length];
      });
    }, 10000);
    return () => clearInterval(id);
  }, [live, preset]);

  useEffect(() => {
    if (!live || preset === 'custom') return;
    const id = setInterval(() => setCycleLive((c) => (c + 1) % 4), 3500);
    return () => clearInterval(id);
  }, [live, preset]);

  // Smooth: raise individual pie section for 3s, then next, repeat – no blink, real app feel
  useEffect(() => {
    if (!live || preset === 'custom' || distribution.length === 0) return;
    const id = setInterval(() => setPieActive((i) => (i + 1) % distribution.length), 3000);
    return () => clearInterval(id);
  }, [live, preset, distribution.length]);

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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Analytics
            {live && preset !== 'custom' && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-mono-industrial font-bold tracking-widest text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />LIVE</span>}
          </h1>
          <p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
            Crime data analysis and insights
            {live && preset !== 'custom' ? (
              <>
                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                Live cycling {preset} • {lastLiveUpdate ? lastLiveUpdate.toLocaleTimeString() : 'syncing'} • real reports/analytics
              </>
            ) : (
              <><span className="h-1 w-1 rounded-full bg-gray-300" /> Paused</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setLive((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-xs font-mono-industrial font-bold tracking-widest transition-colors ${live ? 'bg-[#0F172A] text-white border-[#1E293B]' : 'bg-white text-slate-600 border-[#E2E8F0]'}`}
          >
            <span className={`h-2 w-2 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            {live ? 'LIVE ON' : 'LIVE OFF'}
          </button>
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
      {live && preset !== 'custom' && (
        <div className="mb-4 flex items-center justify-center gap-1.5">
          {[0,1,2,3].map((i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${cycleLive === i ? 'w-6 bg-[#6366F1]' : 'w-1.5 bg-slate-200'}`} />
          ))}
          <span className="ml-2 font-mono-industrial text-[11px] tracking-widest text-slate-400">
            {cycleLive === 0 ? 'DISTRIBUTION' : cycleLive === 1 ? 'TREND' : cycleLive === 2 ? 'DISTRICT' : 'STATUS'} • Real-time
          </span>
        </div>
      )}

      {preset === 'custom' && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                From
              </label>
              <input
                type="date"
                className="input-field"
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
                className="input-field"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
            <Button size="sm" className="mt-5" onClick={() => fetchData(true)}>
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
          <Button onClick={() => fetchData(true)}>Retry</Button>
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
            <Card title="Crime Distribution" subtitle={live && preset !== 'custom' && distribution.length > 0 ? `Live • ${distribution[pieActive % distribution.length]?.crime_type} • smooth` : undefined} className="transition-all duration-300">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {/* @ts-ignore – recharts Pie activeIndex for smooth continuous highlight */}
                    <Pie
                      data={distribution.map((d, i) => ({
                        name: d.crime_type,
                        value: d.count,
                        color: COLORS[i % COLORS.length],
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={78}
                      innerRadius={36}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={700}
                      activeIndex={live && preset !== 'custom' && distribution.length > 0 ? (pieActive % distribution.length as any) : undefined as any}
                      activeShape={(props: any) => {
                        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                        return <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} stroke="white" strokeWidth={1} opacity={1} />;
                      }}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {distribution.map((_, i) => (
                        <Cell
                          key={`${distribution[i]?.crime_type}-${i}`}
                          fill={COLORS[i % COLORS.length]}
                          stroke="white"
                          strokeWidth={1.2}
                          fillOpacity={live && preset !== 'custom' ? (i === pieActive % distribution.length ? 1 : 0.12) : 1}
                          strokeOpacity={live && preset !== 'custom' ? (i === pieActive % distribution.length ? 1 : 0.3) : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Monthly Trend" className="transition-all duration-300">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} name="Total" isAnimationActive={true} animationDuration={800} />
                    <Line type="monotone" dataKey="open" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} name="Open" isAnimationActive={true} animationDuration={800} />
                    <Line type="monotone" dataKey="closed" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="Closed" isAnimationActive={true} animationDuration={800} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Cases by District" className="transition-all duration-300">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDistrict}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="district" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={900} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Status Breakdown" className="transition-all duration-300">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={900} />
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
