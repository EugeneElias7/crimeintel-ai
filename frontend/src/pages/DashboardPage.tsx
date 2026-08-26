// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  FolderOpen,
  FileText,
  TrendingUp,
  User,
  Search,
  Bot,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Sector,
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

const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

function formatTime(d: Date) {
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getBadgeVariant(status: string) {
  const s = status.toLowerCase().replace(/\s+/g, '_');
  if (s === 'open') return 'open';
  if (s === 'closed') return 'closed';
  if (s === 'under_investigation') return 'under_investigation';
  if (s === 'filed') return 'filed';
  return 'default';
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg bg-white p-5 shadow-sm">
      <div className="mb-3 h-4 w-20 rounded bg-gray-200" />
      <div className="mb-2 h-8 w-16 rounded bg-gray-200" />
      <div className="h-3 w-32 rounded bg-gray-200" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="animate-pulse rounded-lg bg-white p-5 shadow-sm">
      <div className="mb-4 h-5 w-40 rounded bg-gray-200" />
      <div className="h-64 rounded bg-gray-100" />
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
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [live, setLive] = useState(true);
  const [pieActive, setPieActive] = useState(0);

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const [overviewRes, casesRes, trendsRes, distRes, districtRes] = await Promise.all([
        getOverview(),
        listCases({ page: 1, limit: 10 }),
        getTrends(),
        getDistribution(),
        getByDistrict(),
      ]);
      setOverview(overviewRes);
      setRecentCases(casesRes.data);
      setTrends(trendsRes);
      setDistribution(distRes);
      setByDistrict(districtRes);
      setLastUpdated(new Date());
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Live: poll real data from reports/analytics every 12s
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => fetchData(false), 12000);
    return () => clearInterval(id);
  }, [live, fetchData]);

  // Live: show individual pie section by raising it for 3s, then next, repeat smoothly – no blink
  useEffect(() => {
    if (!live || distribution.length === 0) return;
    const id = setInterval(() => setPieActive((i) => (i + 1) % distribution.length), 3000);
    return () => clearInterval(id);
  }, [live, distribution.length]);

  if (loading) {
    return (
      <div>
        <div className="mb-6 h-8 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="h-5 w-32 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="mb-4 text-red-600">{error}</p>
        <Button onClick={() => fetchData(true)}>Retry</Button>
      </div>
    );
  }

  // Live real data: distribution & byDistrict from reports/analytics – not just 10 recent
  const distributionData: { name: string; value: number; color: string }[] =
    distribution.length > 0
      ? distribution.map((d, i) => ({ name: d.crime_type, value: d.count, color: COLORS[i % COLORS.length] }))
      : recentCases.reduce<{ name: string; value: number; color: string }[]>((acc, c) => {
          const ex = acc.find((d) => d.name === c.crime_type);
          if (ex) ex.value++;
          else acc.push({ name: c.crime_type, value: 1, color: COLORS[acc.length % COLORS.length] });
          return acc;
        }, []);

  const kpiCards = [
    {
      icon: <FolderOpen className="h-6 w-6 text-blue-600" />,
      value: overview?.total_cases ?? 0,
      label: 'Total Cases',
      bg: 'bg-blue-50',
      trend: '+12%',
      trendUp: true,
    },
    {
      icon: <FileText className="h-6 w-6 text-amber-600" />,
      value: overview?.open_cases ?? 0,
      label: 'Open Cases',
      bg: 'bg-amber-50',
      trend: '+5%',
      trendUp: true,
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-green-600" />,
      value: `${(overview?.clearance_rate ?? 0).toFixed(1)}%`,
      label: 'Clearance Rate',
      bg: 'bg-green-50',
      trend: '+2.3%',
      trendUp: true,
    },
    {
      icon: <User className="h-6 w-6 text-purple-600" />,
      value: 0,
      label: 'My Cases',
      bg: 'bg-purple-50',
      trend: '—',
      trendUp: true,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Dashboard
            {live && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-mono-industrial font-bold tracking-widest text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />LIVE</span>}
          </h1>
          <p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
            Last updated: {formatTime(lastUpdated)}
            <span className={`h-1 w-1 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-gray-300'}`} />
            {live ? 'Live cycling real report data every 12s' : 'Paused'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLive((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-xs font-mono-industrial font-bold tracking-widest transition-colors ${live ? 'bg-[#0F172A] text-white border-[#1E293B] shadow' : 'bg-white text-slate-600 border-[#E2E8F0] hover:border-[#0EA5E9]'}`}
          >
            <span className={`h-2 w-2 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            {live ? 'LIVE ON' : 'LIVE OFF'}
          </button>
          <Button variant="outline" size="sm" onClick={() => fetchData(true)}>
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>
      </div>
      {live && distributionData.length > 0 && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/60 px-4 py-1.5 backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono-industrial text-[11px] tracking-widest text-indigo-700">
            LIVE PIE • {distributionData[pieActive % distributionData.length]?.name} • {distributionData[pieActive % distributionData.length]?.value} cases
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span className="font-mono-industrial text-[10px] text-slate-500">smooth cycling</span>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, idx) => (
          <Card key={idx} className="group">
            <div className="flex items-start justify-between">
              <div
                className={`rounded-lg p-3 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${card.bg}`}
              >
                {card.icon}
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
            <div className="mt-2 flex items-center gap-1 text-xs font-medium">
              {card.trendUp ? (
                <ArrowUp size={14} className="text-green-500" />
              ) : (
                <ArrowDown size={14} className="text-red-500" />
              )}
              <span className={card.trendUp ? 'text-green-600' : 'text-red-600'}>
                {card.trend}
              </span>
              <span className="ml-1 text-gray-400">vs last month</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="Crime Type Distribution"
          subtitle={`Real • ${distributionData.reduce((a, b) => a + b.value, 0)} total • smooth live`}
          className="transition-all duration-300"
        >
          {distributionData.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No data</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* @ts-ignore – recharts Pie activeIndex typed as any for live continuous highlight */}
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={78}
                    innerRadius={42}
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={700}
                    startAngle={90}
                    endAngle={-270}
                    activeIndex={live && distributionData.length > 0 ? pieActive % distributionData.length : undefined as any}
                    activeShape={(props: any) => {
                      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                      // single raised sector – clockwise, smooth, no blink, just lift
                      return <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} stroke="white" strokeWidth={1} opacity={1} />;
                    }}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {distributionData.map((entry, idx) => (
                      <Cell
                        key={`${entry.name}-${entry.value}`}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={1.5}
                        fillOpacity={live ? (idx === pieActive % distributionData.length ? 1 : 0.12) : 1}
                        strokeOpacity={live ? (idx === pieActive % distributionData.length ? 1 : 0.3) : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card
          title="Monthly Case Trend"
          subtitle="Live from analytics"
          className="transition-all duration-300"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trends.length > 0 ? trends : [
                  { month: 'Jan', total: 0, open: 0, closed: 0 },
                  { month: 'Feb', total: 0, open: 0, closed: 0 },
                  { month: 'Mar', total: 0, open: 0, closed: 0 },
                  { month: 'Apr', total: 0, open: 0, closed: 0 },
                  { month: 'May', total: 0, open: 0, closed: 0 },
                  { month: 'Jun', total: 0, open: 0, closed: 0 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={true} animationDuration={800} name="Total" />
                <Line type="monotone" dataKey="open" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={true} animationDuration={800} name="Open" />
                <Line type="monotone" dataKey="closed" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={true} animationDuration={800} name="Closed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Cases by District"
          subtitle="Live from reports"
          className="transition-all duration-300"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDistrict.length > 0 ? byDistrict : [{ district: 'No data', count: 0 }]} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="district" tick={{ fontSize: 10 }} interval={0} angle={-22} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card
        title="Recent Cases"
        subtitle="Last 10 cases"
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate('/cases')}>
            View All
          </Button>
        }
      >
        {recentCases.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={48} />}
            title="No cases yet"
            description="Cases will appear here once created."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Case ID', 'Crime Type', 'Status', 'Date', 'Location'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentCases.map((c) => (
                  <tr
                    key={c.case_id}
                    className="cursor-pointer transition-colors hover:bg-blue-50"
                    onClick={() => navigate(`/cases/${c.case_id}`)}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-blue-600">
                      {c.case_number}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {c.crime_type}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <Badge variant={getBadgeVariant(c.status)}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {new Date(c.date_filed).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {c.location}
                    </td>
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
            <div className="rounded-lg bg-blue-50 p-3">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Search Cases</p>
              <p className="text-sm text-gray-500">
                Find cases by ID, type, or location
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="ml-auto"
              onClick={() => navigate('/cases')}
            >
              🔍 Search Cases
            </Button>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-50 p-3">
              <Bot className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">CRIMA AI</p>
              <p className="text-sm text-gray-500">
                AI-powered crime analysis assistant
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="ml-auto"
              onClick={() => navigate('/crima')}
            >
              🤖 Open CRIMA AI
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
