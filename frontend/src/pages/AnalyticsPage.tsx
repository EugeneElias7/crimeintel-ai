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
import { Calendar, FolderOpen, FileText, TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { getOverview, getDistribution, getTrends, getByDistrict } from '../services/analyticsService';
import type { OverviewData, DistributionItem, TrendItem, DistrictItem } from '../types/analytics';

const COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#4F46E5', '#BE123C'];

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
      <div className="mb-4 h-5 w-32 rounded bg-(--color-border-primary)" />
      <div className="h-70 rounded bg-gray-100" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<Preset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [appliedCustom, setAppliedCustom] = useState<{ from: string; to: string } | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [byDistrict, setByDistrict] = useState<DistrictItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      let range: { from: string; to: string };
      if (preset === 'custom') {
        if (!appliedCustom || !appliedCustom.from || !appliedCustom.to) {
          if (showLoader) setLoading(false);
          return;
        }
        range = appliedCustom;
      } else {
        range = getDateRange(preset);
      }
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
    } catch {
      setError('Failed to load analytics data');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [preset, appliedCustom]);

  useEffect(() => {
    if (preset !== 'custom') {
      fetchData(!overview);
    } else if (appliedCustom) {
      fetchData(!overview);
    } else {
      setLoading(false);
    }
  }, [fetchData, preset, appliedCustom]);

  const handleApplyCustom = () => {
    if (!customFrom || !customTo) return;
    setAppliedCustom({ from: customFrom, to: customTo });
  };

  const kpiCards = [
    {
      icon: <FolderOpen className="h-5 w-5 text-[#2563EB]" />,
      value: overview?.total_cases ?? 0,
      label: 'Total Cases',
      sub: 'All registered cases',
      bg: 'bg-[#EFF6FF] border-[#DBEAFE]',
    },
    {
      icon: <FileText className="h-5 w-5 text-amber-600" />,
      value: overview?.open_cases ?? 0,
      label: 'Active Cases',
      sub: 'Open & under investigation',
      bg: 'bg-[#FFFBEB] border-[#FDE68A]',
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
      value: overview?.closed_cases ?? 0,
      label: 'Resolved Cases',
      sub: 'Closed investigations',
      bg: 'bg-[#ECFDF5] border-[#A7F3D0]',
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-red-600" />,
      value: overview?.filed_cases ?? 0,
      label: 'High Priority Cases',
      sub: 'Filed & urgent',
      bg: 'bg-[#FEF2F2] border-[#FECACA]',
    },
  ];

  const distributionData = (() => {
    const base = distribution.map((d, i) => ({ name: d.crime_type, value: d.count, color: COLORS[i % COLORS.length] }));
    const sorted = [...base].sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 6);
    const others = sorted.slice(6).reduce((acc, cur) => acc + cur.value, 0);
    if (others > 0) top.push({ name: 'Others', value: others, color: '#94A3B8' });
    return top;
  })();

  const topCrimeTypes = [...distribution].sort((a, b) => b.count - a.count).slice(0, 8);
  const topDistricts = [...byDistrict]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((d) => ({ name: d.district, count: d.count }));

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-(--color-text-primary)">Analytics</h1>
          <p className="mt-1 text-sm text-(--color-text-secondary)">Analyze crime patterns, trends, locations, and investigation activity</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['7d', '30d', '12m'] as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${preset === p ? 'bg-blue-600 text-white' : 'bg-white border border-(--color-border-primary) text-(--color-text-secondary) hover:bg-(--color-slate-50)'}`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '12 Months'}
            </button>
          ))}
          <button
            onClick={() => setPreset('custom')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${preset === 'custom' ? 'bg-blue-600 text-white' : 'bg-white border border-(--color-border-primary) text-(--color-text-secondary) hover:bg-(--color-slate-50)'}`}
          >
            <Calendar size={14} className="inline" /> Custom
          </button>
        </div>
      </div>

      {preset === 'custom' && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-(--color-text-secondary)">From</label>
              <input type="date" className="input-field" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-(--color-text-secondary)">To</label>
              <input type="date" className="input-field" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </div>
            <Button size="sm" className="mt-5" onClick={handleApplyCustom} disabled={!customFrom || !customTo}>
              Apply
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-white shadow-sm" />
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
        <EmptyState icon={<TrendingUp size={48} />} title="No data for selected period" description="Try a different date range." />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((card) => (
              <Card key={card.label} className="border">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${card.bg}`}>{card.icon}</div>
                <p className="mt-3 text-3xl font-bold tracking-tight text-(--color-text-primary)">{card.value}</p>
                <p className="text-sm font-medium text-(--color-text-primary)">{card.label}</p>
                {(card as any).sub && <p className="text-xs text-(--color-text-tertiary)">{(card as any).sub}</p>}
              </Card>
            ))}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Crime Trend Over Time" subtitle="Cases filed and resolved">
              {trends.length === 0 ? (
                <div className="flex h-75 items-center justify-center rounded-lg border border-dashed border-(--color-border-primary) bg-(--color-slate-50)">
                  <p className="text-sm text-(--color-text-tertiary)">No trend data available</p>
                </div>
              ) : (
                <div className="h-75">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                      <Line type="monotone" dataKey="total" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Total" isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                      <Line type="monotone" dataKey="open" stroke="#F59E0B" strokeWidth={2} dot={false} name="Open" isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                      <Line type="monotone" dataKey="closed" stroke="#10B981" strokeWidth={2} dot={false} name="Closed" isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card title="Crime Type Distribution" subtitle="Top 6 + Others">
              {distributionData.length === 0 ? (
                <div className="flex h-75 items-center justify-center rounded-lg border border-dashed border-(--color-border-primary) bg-(--color-slate-50)">
                  <p className="text-sm text-(--color-text-tertiary)">No distribution data available</p>
                </div>
              ) : (
                <div className="h-75">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={distributionData} cx="50%" cy="50%" outerRadius={92} innerRadius={58} dataKey="value" isAnimationActive={true} animationDuration={500} animationEasing="ease-out" animationBegin={0}>
                        {distributionData.map((e) => (
                          <Cell key={e.name} fill={e.color} stroke="white" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => [`${v} cases`, n]} contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                      <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="District Crime Distribution" subtitle="Top 10 districts • district crime distribution">
              {topDistricts.length === 0 ? (
                <div className="flex h-75 items-center justify-center rounded-lg border border-dashed border-(--color-border-primary) bg-(--color-slate-50)">
                  <p className="text-sm text-(--color-text-tertiary)">No district data available</p>
                </div>
              ) : (
                <div className="h-75">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topDistricts} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} angle={-14} textAnchor="end" height={48} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: 'rgba(37,99,235,0.06)' }} contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#2563EB" isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card title="Top Crime Types" subtitle="Top 8 vertical">
              {topCrimeTypes.length === 0 ? (
                <div className="flex h-75 items-center justify-center rounded-lg border border-dashed border-(--color-border-primary) bg-(--color-slate-50)">
                  <p className="text-sm text-(--color-text-tertiary)">No crime type data available</p>
                </div>
              ) : (
                <div className="h-75">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCrimeTypes.map((d) => ({ name: d.crime_type, count: d.count }))} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} angle={-14} textAnchor="end" height={48} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: 'rgba(37,99,235,0.06)' }} contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#7C3AED" isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <Card title="Case Status Distribution">
            {((overview?.open_cases ?? 0) + (overview?.closed_cases ?? 0) + (overview?.filed_cases ?? 0) === 0) ? (
              <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-(--color-border-primary) bg-(--color-slate-50)">
                <p className="text-sm text-(--color-text-tertiary)">No status data available</p>
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(() => {
                      const data = [
                        { name: 'Open', value: overview?.open_cases ?? 0 },
                        { name: 'Closed', value: overview?.closed_cases ?? 0 },
                        { name: 'Filed', value: overview?.filed_cases ?? 0 },
                      ].filter((s) => s.value > 0);
                      return data;
                    })()}
                    margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#4F46E5" isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
