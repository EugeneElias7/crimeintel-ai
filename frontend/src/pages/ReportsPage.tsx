import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Printer,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { listCases, getCase } from '../services/caseService';
import { getOverview, getTrends, getByDistrict } from '../services/analyticsService';
import type { Case, CaseDetail } from '../types/case';
import type { OverviewData, TrendItem, DistrictItem } from '../types/analytics';

const DISTRICTS = ['North', 'South', 'East', 'West', 'Central'];

type ReportMode = 'case' | 'summary';

export default function ReportsPage() {
  const [mode, setMode] = useState<ReportMode>('case');
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loadingCase, setLoadingCase] = useState(false);

  const [summaryFrom, setSummaryFrom] = useState('');
  const [summaryTo, setSummaryTo] = useState('');
  const [summaryDistrict, setSummaryDistrict] = useState('');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [byDistrict, setByDistrict] = useState<DistrictItem[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listCases({ limit: 200 })
      .then((res) => setCases(res.data))
      .catch(() => {});
  }, []);

  const handleGenerateCase = async () => {
    if (!selectedCaseId) return;
    setLoadingCase(true);
    try {
      const caseDetail = await getCase(selectedCaseId);
      setCaseDetail(caseDetail);
    } catch {
      setCaseDetail(null);
    } finally {
      setLoadingCase(false);
    }
  };

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
      const [overviewRes, trendsRes, districtRes] = await Promise.all([
        getOverview(summaryFrom || undefined, summaryTo || undefined),
        getTrends(summaryFrom || undefined, summaryTo || undefined),
        getByDistrict(summaryFrom || undefined, summaryTo || undefined),
      ]);
      setOverview(overviewRes);
      setTrends(trendsRes);
      setByDistrict(districtRes);
    } catch {
      setOverview(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate case and summary reports
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => {
            setMode('case');
            setCaseDetail(null);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'case'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FileText size={16} className="inline" /> Case Report
        </button>
        <button
          onClick={() => {
            setMode('summary');
            setOverview(null);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'summary'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FileText size={16} className="inline" /> Summary Report
        </button>
      </div>

      {mode === 'case' && (
        <Card>
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div className="min-w-[240px] flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Select Case
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
              >
                <option value="">Choose a case...</option>
                {cases.map((c) => (
                  <option key={c.case_id} value={c.case_id}>
                    {c.case_number} - {c.title}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleGenerateCase} isLoading={loadingCase}>
              Generate
            </Button>
          </div>

          {caseDetail && (
            <div ref={printRef}>
              <div className="mb-4 flex justify-end print:hidden">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer size={16} />
                  Print
                </Button>
              </div>

              <div className="rounded-lg border border-gray-200 p-6">
                <div className="mb-6 border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Case Report: {caseDetail.case_number}
                  </h2>
                  <p className="mt-1 text-gray-600">{caseDetail.title}</p>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {[
                    ['Case Number', caseDetail.case_number],
                    ['Crime Type', caseDetail.crime_type],
                    ['Status', caseDetail.status],
                    ['Priority', caseDetail.priority],
                    ['District', caseDetail.district],
                    ['Location', caseDetail.location],
                    [
                      'Date Filed',
                      new Date(caseDetail.date_filed).toLocaleDateString(),
                    ],
                    [
                      'Assigned Officer',
                      caseDetail.assigned_officer?.display_name ?? '—',
                    ],
                    [
                      'Filing Officer',
                      caseDetail.filing_officer?.display_name ?? '—',
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {caseDetail.description && (
                  <div className="mb-6">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Description
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      {caseDetail.description}
                    </p>
                  </div>
                )}

                {caseDetail.witnesses && caseDetail.witnesses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Witnesses
                    </h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Contact</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Credibility</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseDetail.witnesses.map((w) => (
                          <tr key={w.witness_id} className="border-b">
                            <td className="px-3 py-2 text-gray-900">{w.name}</td>
                            <td className="px-3 py-2 text-gray-500">{w.contact ?? '—'}</td>
                            <td className="px-3 py-2 text-gray-500">{w.credibility ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {caseDetail.timeline && caseDetail.timeline.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Timeline
                    </h3>
                    <div className="space-y-2">
                      {caseDetail.timeline.map((e) => (
                        <div key={e.event_id} className="flex gap-3 rounded-lg bg-gray-50 p-3">
                          <div className="text-xs text-gray-400">
                            {new Date(e.date).toLocaleDateString()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{e.title}</p>
                            <p className="text-xs text-gray-500">{e.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {mode === 'summary' && (
        <Card>
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                From
              </label>
              <input
                type="date"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={summaryFrom}
                onChange={(e) => setSummaryFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                To
              </label>
              <input
                type="date"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={summaryTo}
                onChange={(e) => setSummaryTo(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                District
              </label>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={summaryDistrict}
                onChange={(e) => setSummaryDistrict(e.target.value)}
              >
                <option value="">All Districts</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleGenerateSummary} isLoading={loadingSummary}>
              Generate
            </Button>
          </div>

          {overview && (
            <div ref={printRef}>
              <div className="mb-4 flex justify-end print:hidden">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer size={16} />
                  Print
                </Button>
              </div>

              <div className="rounded-lg border border-gray-200 p-6">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  Summary Report
                </h2>

                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    ['Total Cases', overview.total_cases],
                    ['Open', overview.open_cases],
                    ['Closed', overview.closed_cases],
                    ['Clearance Rate', `${overview.clearance_rate.toFixed(1)}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-gray-50 p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900">{value}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>

                {trends.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Monthly Trend
                    </h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Month</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Open</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Closed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trends.map((t, i) => (
                          <tr key={i} className="border-b">
                            <td className="px-3 py-2 text-gray-900">{t.month}</td>
                            <td className="px-3 py-2 text-gray-700">{t.total}</td>
                            <td className="px-3 py-2 text-gray-700">{t.open}</td>
                            <td className="px-3 py-2 text-gray-700">{t.closed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {byDistrict.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Cases by District
                    </h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">District</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byDistrict.map((d, i) => (
                          <tr key={i} className="border-b">
                            <td className="px-3 py-2 text-gray-900">{d.district}</td>
                            <td className="px-3 py-2 text-gray-700">{d.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {!overview && !loadingSummary && (
            <EmptyState
              icon={<FileText size={48} />}
              title="Generate a summary"
              description="Select a date range and district, then click Generate."
            />
          )}
        </Card>
      )}
    </div>
  );
}
