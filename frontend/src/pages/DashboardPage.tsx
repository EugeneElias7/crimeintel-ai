import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  FolderOpen,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  Search,
  Bot,
  ChevronRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { getOverview, getTrends, getDistribution, getByDistrict } from '../services/analyticsService';
import { listCases } from '../services/caseService';
import type { OverviewData, TrendItem, DistributionItem, DistrictItem } from '../types/analytics';
import type { Case } from '../types/case';

const CHART_COLORS = ['#2563EB', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

function getBadgeVariant(status: string) {
  const s = status.toLowerCase().replace(/\s+/g, '_');
  if (s === 'open') return 'open';
  if (s === 'closed') return 'closed';
  if (s === 'resolved') return 'closed';
  if (s === 'under_investigation') return 'under_investigation';
  if (s === 'filed') return 'filed';
  return 'default';
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg bg-white border border-[var(--color-border-primary)] p-5 shadow-sm">
      <div className="mb-3 h-4 w-20 rounded bg-[var(--color-slate-200)]" />
      <div className="mb-2 h-8 w-16 rounded bg-[var(--color-slate-200)]" />
      <div className="h-3 w-32 rounded bg-[var(--color-slate-200)]" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="animate-pulse rounded-lg bg-white border border-[var(--color-border-primary)] p-5 shadow-sm">
      <div className="mb-4 h-5 w-32 rounded bg-[var(--color-slate-200)]" />
      <div className="h-[240px] rounded bg-[var(--color-slate-100)]" />
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-[var(--color-border-primary)] bg-[var(--color-slate-50)]">
      <p className="text-sm text-[var(--color-text-tertiary)]">{message}</p>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [byDistrict, setByDistrict] = useState<DistrictItem[]>([]);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        getOverview(),
        listCases({ page: 1, limit: 10 }),
        getTrends(),
        getDistribution(),
        getByDistrict(),
      ]);
      const [overviewRes, casesRes, trendsRes, distRes, districtRes] = results;
      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value);
      if (casesRes.status === 'fulfilled') setRecentCases(casesRes.value.data);
      if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value);
      if (distRes.status === 'fulfilled') setDistribution(distRes.value);
      if (districtRes.status === 'fulfilled') setByDistrict(districtRes.value);
      const critical = [overviewRes, casesRes].every((r) => r.status === 'rejected');
      if (critical) {
        const reasons = results
          .filter((r) => r.status === 'rejected')
          .map((r) => (r.reason as any)?.response?.data?.detail || (r.reason as any)?.message || 'Unknown')
          .join(', ');
        setError(`Failed to load dashboard: ${reasons}`);
      }
    } catch (e) {
      setError('Failed to load dashboard data');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6 h-8 w-40 animate-pulse rounded bg-[var(--color-slate-200)]" />
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <SkeletonChart />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <p className="mb-4 text-[var(--color-red-600)]">{error}</p>
        <Button onClick={() => fetchData(true)}>Retry</Button>
      </div>
    );
  }

  // KPI mapping per spec: Total, Active Investigations (open), Resolved (closed), High Priority (filed)
  const kpiCards = [
    {
      icon: <FolderOpen className="h-5 w-5 text-[#2563EB]" />,
      value: overview?.total_cases ?? 0,
      label: 'Total Cases',
      sub: 'All registered cases',
      bg: 'bg-[#EFF6FF] border-[#DBEAFE]',
    },
    {
      icon: <FileSearch className="h-5 w-5 text-[#D97706]" />,
      value: overview?.open_cases ?? 0,
      label: 'Active Investigations',
      sub: 'Open & under investigation',
      bg: 'bg-[#FFFBEB] border-[#FDE68A]',
    },
    {
      icon: <CheckCircle2 className="h-5 w-5 text-[#059669]" />,
      value: overview?.closed_cases ?? 0,
      label: 'Resolved Cases',
      sub: 'Closed investigations',
      bg: 'bg-[#ECFDF5] border-[#A7F3D0]',
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-[#DC2626]" />,
      value: overview?.filed_cases ?? 0,
      label: 'High Priority Cases',
      sub: 'Filed & urgent',
      bg: 'bg-[#FEF2F2] border-[#FECACA]',
    },
  ];

  // Data prep - vertical only
  const topCrimeTypes = [...distribution]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((d, i) => ({ name: d.crime_type, count: d.count, fill: CHART_COLORS[i % CHART_COLORS.length] }));

  const topDistricts = [...byDistrict]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((d, i) => ({ name: d.district, count: d.count, fill: CHART_COLORS[i % CHART_COLORS.length] }));

  const distributionData = (() => {
    const base = distribution.map((d, i) => ({ name: d.crime_type, value: d.count, color: CHART_COLORS[i % CHART_COLORS.length] }));
    const sorted = [...base].sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 6);
    const others = sorted.slice(6).reduce((acc, cur) => acc + cur.value, 0);
    if (others > 0) top.push({ name: 'Others', value: others, color: '#94A3B8' });
    return top;
  })();

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Overview of current crime intelligence and investigation activity</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchData(true)}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* KPI Row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Card key={card.label} className="group border">
            <div className="flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${card.bg}`}>
                {card.icon}
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">{card.value}</p>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{card.label}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">{card.sub}</p>
          </Card>
        ))}
      </div>

      {/* Row 2: Crime Distribution (donut) + Monthly Trend (line) */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Crime Type Distribution" subtitle={`${distributionData.reduce((a, b) => a + b.value, 0)} total • Top 6 + Others`}>
          {distributionData.length === 0 ? (
            <ChartEmpty message="No distribution data available" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distributionData} cx="50%" cy="50%" outerRadius={85} innerRadius={52} dataKey="value" isAnimationActive={true} animationDuration={500} animationEasing="ease-out" animationBegin={0}>
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

        <Card title="Monthly Case Trend" subtitle="Total • Open • Closed">
          {trends.length === 0 ? (
            <ChartEmpty message="No trend data available" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="total" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Total" isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                  <Line type="monotone" dataKey="open" stroke="#F59E0B" strokeWidth={2} dot={false} name="Open" isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                  <Line type="monotone" dataKey="closed" stroke="#10B981" strokeWidth={2} dot={false} name="Closed" isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Row 3: District vertical column + Status vertical column */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Cases by District" subtitle="Top 10 districts • vertical — district crime distribution">
          {topDistricts.length === 0 ? (
            <ChartEmpty message="No district data available" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDistricts} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} angle={-18} textAnchor="end" height={48} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(37,99,235,0.06)' }} contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#2563EB" isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Top Crime Types" subtitle="Top 8 • vertical">
          {topCrimeTypes.length === 0 ? (
            <ChartEmpty message="No crime type data available" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCrimeTypes} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} angle={-18} textAnchor="end" height={48} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(37,99,235,0.06)' }} contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#6366F1" isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Row 4: Recent Cases */}
      <Card
        title="Recent Cases"
        subtitle="Latest 10 • click to investigate"
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate('/cases')}>
            View All <ChevronRight size={14} />
          </Button>
        }
      >
        {recentCases.length === 0 ? (
          <EmptyState icon={<FolderOpen size={48} />} title="No cases yet" description="Cases will appear here once created." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--color-border-primary)]">
              <thead className="bg-[var(--color-slate-50)]">
                <tr>
                  {['Case ID', 'Crime Type', 'Status', 'Date', 'Location'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-primary)] bg-white">
                {recentCases.map((c) => (
                  <tr key={c.case_id} className="cursor-pointer transition-colors hover:bg-[var(--color-intel-blue-50)]" onClick={() => navigate(`/cases/${c.case_id}`)}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-medium text-[var(--color-intel-blue-600)]">{c.case_number}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--color-text-secondary)]">{c.crime_type}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <Badge variant={getBadgeVariant(c.status)}>{c.status}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-[var(--color-text-tertiary)]">{new Date(c.date_filed).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--color-text-tertiary)]">{c.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-[#EFF6FF] p-3">
              <Search className="h-6 w-6 text-[#2563EB]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">Search Cases</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Find cases by ID, type, or location</p>
            </div>
            <Button variant="primary" size="sm" className="ml-auto" onClick={() => navigate('/cases')}>
              Search Cases
            </Button>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-[#EEF2FF] p-3">
              <Bot className="h-6 w-6 text-[#6366F1]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">CRIMA AI</p>
              <p className="text-sm text-[var(--color-text-secondary)]">AI-powered crime analysis assistant</p>
            </div>
            <Button variant="primary" size="sm" className="ml-auto" onClick={() => navigate('/crima')}>
              Open CRIMA AI
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
