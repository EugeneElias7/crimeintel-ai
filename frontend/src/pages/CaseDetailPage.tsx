import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Edit3,
  User,
  FileText,
  Shield,
  Clock,
  AlertTriangle,
  Star,
  Image,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import BackButton from '../components/ui/BackButton';
import { useAuth } from '../context/AuthContext';
import { getCase, getRelatedCases } from '../services/caseService';
import type { Case, CaseDetail, Suspect, Witness, TimelineEvent } from '../types/case';

type Tab = 'fir' | 'suspects' | 'witnesses' | 'timeline' | 'evidence';

function getBadgeVariant(status: string) {
  const s = status.toLowerCase().replace(/\s+/g, '_');
  if (s === 'open') return 'open';
  if (s === 'closed') return 'closed';
  if (s === 'under_investigation') return 'under_investigation';
  if (s === 'filed') return 'filed';
  return 'default';
}

function getPriorityVariant(p: string) {
  if (p === 'critical' || p === 'high') return 'critical';
  return 'default';
}

function TimelineIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  if (t.includes('arrest')) return <Shield className="h-4 w-4 text-red-500" />;
  if (t.includes('filed') || t.includes('report'))
    return <FileText className="h-4 w-4 text-blue-500" />;
  if (t.includes('evidence'))
    return <Image className="h-4 w-4 text-green-500" />;
  return <Clock className="h-4 w-4 text-gray-500" />;
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [relatedCases, setRelatedCases] = useState<Case[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('fir');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canEdit = user && ['inspector', 'admin', 'super_admin'].includes(user.role);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      getCase(id),
      getRelatedCases(id).catch(() => null),
    ])
      .then(([caseRes, relatedRes]) => {
        setCaseDetail(caseRes);
        if (relatedRes) setRelatedCases(relatedRes);
      })
      .catch(() => setError('Case not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" text="Loading case details..." />
      </div>
    );
  }

  if (error || !caseDetail) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle size={48} className="mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700">
          {error || 'Case not found'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          The case you are looking for does not exist or has been removed.
        </p>
        <BackButton fallbackTo="/cases" label="Back to Cases" className="mt-4" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'fir', label: 'FIR Info' },
    { key: 'suspects', label: `Suspects (${caseDetail.suspect_count ?? 0})` },
    { key: 'witnesses', label: `Witnesses (${caseDetail.witnesses?.length ?? 0})` },
    { key: 'timeline', label: 'Timeline' },
    { key: 'evidence', label: 'Evidence' },
  ];

  return (
    <div>
      <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/cases" className="hover:text-blue-600">
          Cases
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900">
          {caseDetail.case_number}
        </span>
      </nav>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {caseDetail.case_number}
            </h1>
            <Badge variant={getBadgeVariant(caseDetail.status)}>
              {caseDetail.status}
            </Badge>
            <Badge variant={getPriorityVariant(caseDetail.priority)}>
              {caseDetail.priority}
            </Badge>
          </div>
          <p className="mt-1 text-lg text-gray-600">{caseDetail.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <BackButton fallbackTo="/cases" />
          {canEdit && (
            <Button variant="primary" size="sm">
              <Edit3 size={16} />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'fir' && <FIRInfoTab detail={caseDetail} />}
      {activeTab === 'suspects' && <SuspectsTab />}
      {activeTab === 'witnesses' && (
        <WitnessesTab witnesses={caseDetail.witnesses ?? []} />
      )}
      {activeTab === 'timeline' && (
        <TimelineTab timeline={caseDetail.timeline ?? []} />
      )}
      {activeTab === 'evidence' && <EvidenceTab caseId={caseDetail.case_id} />}

      {relatedCases.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Related Cases
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCases.slice(0, 6).map((rc) => (
              <Card
                key={rc.case_id}
                className="cursor-pointer transition-shadow hover:shadow-md"
              >
                <div
                  onClick={() => navigate(`/cases/${rc.case_id}`)}
                  className="flex items-start justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-blue-600">
                      {rc.case_number}
                    </p>
                    <p className="mt-1 text-sm text-gray-700">{rc.title}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {rc.crime_type} · {rc.district}
                    </p>
                  </div>
                  <Badge variant={getBadgeVariant(rc.status)}>
                    {rc.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FIRInfoTab({ detail }: { detail: CaseDetail }) {
  const rows: { label: string; value: string }[] = [
    { label: 'FIR Number', value: detail.case_number },
    { label: 'Crime Type', value: detail.crime_type },
    {
      label: 'Date Filed',
      value: new Date(detail.date_filed).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    },
    { label: 'Location', value: detail.location },
    { label: 'District', value: detail.district },
    { label: 'Assigned Officer', value: detail.assigned_officer?.display_name ?? '—' },
    { label: 'Filing Officer', value: detail.filing_officer?.display_name ?? '—' },
    { label: 'Victims', value: String(detail.victim_count ?? 0) },
    { label: 'Suspects', value: String(detail.suspect_count ?? 0) },
  ];

  return (
    <Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label}>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              {r.label}
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">{r.value}</p>
          </div>
        ))}
      </div>
      {detail.description && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Description
          </p>
          <p className="mt-1 text-sm text-gray-700">{detail.description}</p>
        </div>
      )}
    </Card>
  );
}

function SuspectsTab() {
  const emptySuspects: never[] = [];

  if (emptySuspects.length === 0) {
    return (
      <EmptyState
        icon={<User size={48} />}
        title="No suspects"
        description="No suspects have been identified for this case."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {emptySuspects.map((s: Suspect) => (
        <Card key={s.suspect_id}>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              {s.photo_url ? (
                <img
                  src={s.photo_url}
                  alt={s.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <User size={24} />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{s.name}</p>
              {s.age && (
                <p className="text-sm text-gray-500">
                  Age: {s.age} · {s.gender ?? 'N/A'}
                </p>
              )}
              <Badge
                variant={
                  s.status === 'arrested' ? 'closed' : s.status === 'wanted' ? 'open' : 'default'
                }
              >
                {s.status}
              </Badge>
              {s.charges && s.charges.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.charges.map((c, i) => (
                    <span
                      key={i}
                      className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function WitnessesTab({ witnesses }: { witnesses: Witness[] }) {
  if (witnesses.length === 0) {
    return (
      <EmptyState
        icon={<User size={48} />}
        title="No witnesses"
        description="No witnesses have been recorded for this case."
      />
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Contact', 'Statement', 'Credibility'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {witnesses.map((w) => (
              <tr key={w.witness_id}>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  {w.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {w.contact ?? '—'}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-500">
                  {w.statement ?? '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      w.credibility === 'high'
                        ? 'bg-green-100 text-green-800'
                        : w.credibility === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <Star size={12} />
                    {w.credibility ?? 'N/A'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TimelineTab({ timeline }: { timeline: TimelineEvent[] }) {
  if (timeline.length === 0) {
    return (
      <EmptyState
        icon={<Clock size={48} />}
        title="No timeline events"
        description="Timeline events will appear here as the case progresses."
      />
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 h-full w-0.5 bg-gray-200" />
      <div className="space-y-6">
        {timeline.map((event) => (
          <div key={event.event_id} className="relative flex items-start gap-4">
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-white shadow">
              <TimelineIcon type={event.event_type} />
            </div>
            <div className="flex-1 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">
                  {event.title}
                </p>
                <span className="text-xs text-gray-400">
                  {new Date(event.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-xs text-gray-500">{event.event_type}</p>
              {event.description && (
                <p className="mt-2 text-sm text-gray-700">
                  {event.description}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                By: {event.created_by}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvidenceTab({ caseId }: { caseId: string }) {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={<Image size={48} />}
      title="No evidence uploaded"
      description="Evidence will appear here once uploaded."
      action={{
        label: 'Go to Evidence',
        onClick: () => navigate(`/evidence/${caseId}`),
      }}
    />
  );
}
