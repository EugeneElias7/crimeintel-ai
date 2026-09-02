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
  Trash2,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import BackButton from '../components/ui/BackButton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import api from '../services/api';
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
  // support navigation like /cases/{case_id}?tab=evidence via CRIMA clickable cards
  const getInitialTab = (): Tab => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    if (t && ['fir','suspects','witnesses','timeline','evidence'].includes(t)) return t as Tab;
    return 'fir';
  };
  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canEdit = user && ['inspector', 'admin', 'super_admin'].includes((user.role as string).toLowerCase());
  const canDelete = user && ['admin', 'super_admin'].includes((user.role as string).toLowerCase());
  const { addToast } = useToast();

  const handleDeleteCase = async () => {
    if (!id || !canDelete) return;
    if (!confirm(`Delete case ${caseDetail?.case_number || id}? This will permanently remove the case and all its evidence/suspects/witnesses. Cannot be undone.`)) return;
    try {
      await api.delete(`/cases/${id}`);
      addToast('success', 'Case deleted successfully');
      navigate('/cases', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to delete case';
      addToast('error', typeof msg === 'string' ? msg : 'Failed to delete case');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    if (t && ['fir','suspects','witnesses','timeline','evidence'].includes(t)) {
      setActiveTab(t as Tab);
    }
  }, [id]);

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
          {canDelete && (
            <Button variant="danger" size="sm" onClick={handleDeleteCase}>
              <Trash2 size={16} />
              Delete
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
      {activeTab === 'suspects' && <SuspectsTab suspects={caseDetail.suspects ?? []} />}
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
    <div className="space-y-6">
      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">Case Information</h3>
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
            <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{detail.description}</p>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">Incident Location</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <span className="mt-0.5">📍</span>
            <div>
              <p className="font-medium text-gray-900">{detail.location || '—'}</p>
              {detail.district && <p className="text-xs text-gray-500">{detail.district}</p>}
            </div>
          </div>
          <div className="h-80 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <ReadOnlyMap lat={detail.latitude != null ? Number(detail.latitude) : 12.9716} lng={detail.longitude != null ? Number(detail.longitude) : 77.5946} district={detail.district} />
          </div>
          <p className="text-center text-xs text-slate-500">Shown in map • {detail.district || 'Karnataka'} • {detail.location || '—'}</p>
        </div>
      </Card>
    </div>
  );
}

const DISTRICT_MAP_CENTERS: Record<string, [number, number]> = {
  'Bangalore Urban': [12.9716, 77.5946],
  'Bangalore Rural': [13.2, 77.5],
  'Belgaum': [15.85, 74.5],
  'Mysore': [12.2958, 76.6394],
  'Mangalore': [12.87, 74.84],
  'Shimoga': [13.93, 75.56],
  'Tumkur': [13.339, 77.1],
  'Gulbarga': [17.33, 76.83],
  'Dharwad': [15.46, 75.01],
  'Hubli': [15.36, 75.12],
};

function ReadOnlyMap({ lat, lng, district }: { lat: number; lng: number; district?: string }) {
  const [Ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  if (!Ready) return <div className="h-full w-full bg-slate-100 animate-pulse" />;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 12.9716 && lng === 77.5946 && !district);
  // Fallback to district center if no coords
  let displayLat = lat;
  let displayLng = lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 12.9716 && lng === 77.5946 && !district)) {
    // keep default Bangalore
  }
  if (district && DISTRICT_MAP_CENTERS[district]) {
    // If no real coords, use district center with higher zoom
    if (!hasCoords || (lat === 12.9716 && lng === 77.5946)) {
      const c = DISTRICT_MAP_CENTERS[district];
      displayLat = c[0];
      displayLng = c[1];
    }
  }
  return (
    <div className="h-full w-full">
      <iframe
        title="Incident Location"
        className="h-full w-full border-0"
        loading="lazy"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${displayLng - 0.015}%2C${displayLat - 0.015}%2C${displayLng + 0.015}%2C${displayLat + 0.015}&layer=mapnik&marker=${displayLat}%2C${displayLng}`}
      />
    </div>
  );
}

function SuspectsTab({ suspects }: { suspects: Suspect[] }) {
  if (!suspects || suspects.length === 0) {
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
      {suspects.map((s: Suspect) => (
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

function EvidenceThumbSmall({ ev }: { ev: any }) {
  const fileName: string = ev.file_name || ev.original_file_name || 'file';
  const fileType: string = ev.mime_type || ev.file_type || '';
  const isImage = fileType.toLowerCase().includes('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);
  const isPdf = fileType.toLowerCase().includes('pdf') || /\.pdf$/i.test(fileName);
  const isVideo = fileType.toLowerCase().includes('video') || /\.(mp4|mov|avi|webm)$/i.test(fileName);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    // Use api baseURL correctly: "/evidence/..." not "/api/v1/evidence/..."
    const apiUrl = ev.evidence_id ? `/evidence/${ev.evidence_id}/file` : null;
    const url = ev.file_url && ev.file_url.startsWith('/storage') ? ev.file_url : apiUrl;
    if (!url || (!isImage && !isPdf && !isVideo)) return;
    if (isImage || isVideo) {
      (async () => {
        try {
          // api.get will prepend /api/v1 automatically
          const fetchUrl = url.startsWith('/storage') ? url : apiUrl!;
          // For /storage use fetch directly to avoid double /api/v1 prefix
          let res: any;
          if (fetchUrl.startsWith('/storage')) {
            const r = await fetch(fetchUrl);
            if (!r.ok) throw new Error('fetch failed');
            const blob = await r.blob();
            objectUrl = URL.createObjectURL(blob);
          } else {
            res = await api.get(fetchUrl, { responseType: 'blob' });
            const blob: Blob = res.data as unknown as Blob;
            objectUrl = URL.createObjectURL(blob);
          }
          if (!cancelled) setThumbUrl(objectUrl);
        } catch {
          if (!cancelled) setThumbUrl(url.startsWith('http') ? url : url);
        }
      })();
    }
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [ev.evidence_id, ev.file_url, ev.storage_path, isImage, isPdf, isVideo]);

  if (isImage && thumbUrl) {
    return <img src={thumbUrl} alt={fileName} className="h-full w-full object-cover" />;
  }
  if (isImage) {
    return <Image size={22} className="text-emerald-500" />;
  }
  if (isPdf) return <FileText size={22} className="text-red-500" />;
  if (isVideo) {
    // For video, try to show first frame via video element with poster fallback
    if (thumbUrl) {
      return (
        <div className="relative h-full w-full">
          <video src={thumbUrl} className="h-full w-full object-cover" muted preload="metadata" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
              <span className="ml-0.5 text-xs">▶</span>
            </div>
          </div>
        </div>
      );
    }
    return <Image size={22} className="text-violet-500" />;
  }
  return <FileText size={22} className="text-slate-400" />;
}

function EvidencePreviewModal({ ev, onClose }: { ev: any; onClose: () => void }) {
  const fileName = ev.file_name || ev.original_file_name || 'file';
  const fileType = ev.mime_type || ev.file_type || '';
  const isImage = fileType.toLowerCase().includes('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);
  const isVideo = fileType.toLowerCase().includes('video') || /\.(mp4|mov|avi|webm)$/i.test(fileName);
  const isPdf = fileType.toLowerCase().includes('pdf') || /\.pdf$/i.test(fileName);
  const fileUrl = ev.file_url && ev.file_url.startsWith('/storage') ? ev.file_url : (ev.evidence_id ? `/evidence/${ev.evidence_id}/file` : (ev.file_url || ev.storage_path || null));
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileUrl) {
      setLoading(false);
      setError('File URL not available');
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        let res: any;
        if (fileUrl.startsWith('/storage')) {
          const r = await fetch(fileUrl);
          if (!r.ok) throw new Error('fetch failed');
          const blob = await r.blob();
          objectUrl = URL.createObjectURL(blob);
          if (!cancelled) setBlobUrl(objectUrl);
          return;
        }
        res = await api.get(fileUrl, { responseType: 'blob' });
        const blob: Blob = res.data as unknown as Blob;
        const ct = (res.headers as any)?.['content-type'] || fileType || blob.type || '';
        const typedBlob = ct ? new Blob([blob], { type: ct }) : blob;
        objectUrl = URL.createObjectURL(typedBlob);
        if (!cancelled) setBlobUrl(objectUrl);
      } catch (e: any) {
        // Fallback to direct URL (public storage)
        const directUrl = fileUrl.startsWith('http') ? fileUrl : `${window.location.origin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
        if (!cancelled) setBlobUrl(directUrl);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileUrl, fileType]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Evidence Preview</h3>
            <p className="text-xs text-slate-500 truncate max-w-[400px]">{fileName} • {fileType || 'Unknown type'}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <span className="text-lg">✕</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-slate-50 p-4 flex items-center justify-center">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">Loading preview...</div>
          ) : error ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-red-600">
              <FileText size={28} />
              <span>{error}</span>
            </div>
          ) : !blobUrl ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">No preview available</div>
          ) : isImage ? (
            <img src={blobUrl} alt={fileName} className="max-h-[70vh] max-w-full rounded-lg object-contain shadow" />
          ) : isVideo ? (
            <video src={blobUrl} controls className="max-h-[70vh] w-full rounded-lg bg-black" />
          ) : isPdf ? (
            <iframe src={blobUrl} title={fileName} className="h-[70vh] w-full rounded-lg border border-slate-200 bg-white" />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-600">
              <FileText size={40} className="text-slate-400" />
              <p className="text-sm">{fileName}</p>
              <p className="text-xs text-slate-500">{fileType}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <span className="text-xs text-slate-500 truncate max-w-[300px]">{fileName}</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={handleDownload} disabled={!blobUrl}>Download</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

void EvidencePreviewModal;
function EvidenceGalleryPreview({ ev }: { ev: any }) {
  const fileName = ev.file_name || ev.original_file_name || 'file';
  const fileType = ev.mime_type || ev.file_type || '';
  const isImage = fileType.toLowerCase().includes('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);
  const isVideo = fileType.toLowerCase().includes('video') || /\.(mp4|mov|avi|webm)$/i.test(fileName);
  const isPdf = fileType.toLowerCase().includes('pdf') || /\.pdf$/i.test(fileName);
  const fileUrl = ev.file_url && ev.file_url.startsWith('/storage') ? ev.file_url : (ev.evidence_id ? `/evidence/${ev.evidence_id}/file` : (ev.file_url || ev.storage_path || null));
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!fileUrl) { setLoading(false); return; }
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        const res: any = await api.get(fileUrl, { responseType: 'blob' });
        const blob: Blob = res.data as unknown as Blob;
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setBlobUrl(objectUrl);
      } catch {
        if (!cancelled) setBlobUrl(fileUrl.startsWith('http') ? fileUrl : `${window.location.origin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [fileUrl]);
  if (loading) return <div className="text-sm text-slate-500">Loading...</div>;
  if (!blobUrl) return <div className="text-sm text-slate-500">No preview</div>;
  if (isImage) return <img src={blobUrl} alt={fileName} className="max-h-[55vh] max-w-full rounded-lg object-contain shadow" />;
  if (isVideo) return <video src={blobUrl} controls className="max-h-[55vh] w-full rounded-lg bg-black" />;
  if (isPdf) return <iframe src={blobUrl} title={fileName} className="h-[55vh] w-full max-w-3xl rounded-lg border bg-white" />;
  return <div className="text-sm text-slate-600">{fileName}</div>;
}

function EvidenceTab({ caseId }: { caseId: string }) {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'pdf'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const { addToast } = useToast();

  const fetchEvidence = async () => {
    try {
      const { listEvidence } = await import('../services/evidenceService');
      const items: any = await listEvidence(caseId);
      const arr = Array.isArray(items) ? items : (items as any)?.data || [];
      setEvidence(arr);
    } catch {
      setEvidence([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { listEvidence } = await import('../services/evidenceService');
        const items: any = await listEvidence(caseId);
        const arr = Array.isArray(items) ? items : (items as any)?.data || [];
        if (mounted) setEvidence(arr);
      } catch {
        if (mounted) setEvidence([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [caseId]);

  const filtered = evidence.filter((ev) => {
    const fileName = ev.file_name || ev.original_file_name || '';
    const fileType = ev.mime_type || ev.file_type || '';
    const isImage = fileType.toLowerCase().includes('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);
    const isVideo = fileType.toLowerCase().includes('video') || /\.(mp4|mov|avi|webm)$/i.test(fileName);
    const isPdf = fileType.toLowerCase().includes('pdf') || /\.pdf$/i.test(fileName);
    if (filterType === 'image' && !isImage) return false;
    if (filterType === 'video' && !isVideo) return false;
    if (filterType === 'pdf' && !isPdf) return false;
    return true;
  });

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { uploadEvidence } = await import('../services/evidenceService');
      await uploadEvidence(file, caseId, '', false);
      addToast('success', 'Evidence attached');
      await fetchEvidence();
    } catch (err: any) {
      addToast('error', err?.response?.data?.detail || 'Failed to attach evidence');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDownload = async (ev: any) => {
    const fileUrl = ev.file_url && ev.file_url.startsWith('/storage') ? ev.file_url : (ev.evidence_id || ev.id ? `/evidence/${ev.evidence_id || ev.id}/file` : (ev.file_url || ev.storage_path));
    const fileName = ev.file_name || ev.original_file_name || 'file';
    try {
      let res: any;
      let blob: Blob;
      if (fileUrl.startsWith('/storage')) {
        const r = await fetch(fileUrl);
        if (!r.ok) throw new Error('fetch failed');
        blob = await r.blob();
      } else {
        res = await api.get(fileUrl, { responseType: 'blob' });
        blob = res.data as unknown as Blob;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.open(fileUrl, '_blank');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" text="Loading evidence..." /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(['all','image','video','pdf'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-all ${filterType === t ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              {t === 'all' ? 'All' : t === 'image' ? 'Images' : t === 'video' ? 'Videos' : 'PDFs'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 hidden sm:inline">{filtered.length} of {evidence.length}</span>
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800 transition-all active:scale-[0.98] ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {isUploading ? 'Uploading...' : 'Attach Evidence'}
            <input type="file" className="hidden" onChange={handleAttach} disabled={isUploading} />
          </label>
        </div>
      </div>

      {evidence.length === 0 ? (
        <Card className="py-10">
          <EmptyState
            icon={<Image size={48} />}
            title="No evidence yet"
            description="Attach photos, videos, PDFs or documents to build a strong case."
            action={{ label: 'Attach First Evidence', onClick: () => document.querySelector<HTMLInputElement>('input[type="file"]')?.click() }}
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="py-12 text-center text-sm text-slate-500">No evidence matches the selected filter</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ev: any, idx: number) => {
            const fileName = ev.file_name || ev.original_file_name || 'file';
            const fileType = ev.mime_type || ev.file_type || '';
            const isImage = fileType.toLowerCase().includes('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);
            const isVideo = fileType.toLowerCase().includes('video') || /\.(mp4|mov|avi|webm)$/i.test(fileName);
            const isPdf = fileType.toLowerCase().includes('pdf') || /\.pdf$/i.test(fileName);
            const isSensitive = Boolean(ev.is_sensitive || ev.sensitive);
            return (
              <div
                key={ev.evidence_id || ev.id}
                onClick={() => openGallery(idx)}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 transition-all duration-300"
              >
                <div className="relative h-36 w-full overflow-hidden bg-slate-50">
                  <div className={`h-full w-full ${isSensitive ? 'blur-[6px] scale-105' : ''} transition-all duration-300`}>
                    <EvidenceThumbSmall ev={ev} />
                  </div>
                  {isSensitive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]">
                      <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow">Sensitive • Tap to view</span>
                    </div>
                  )}
                  <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[11px] font-medium border backdrop-blur-sm ${isImage ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200' : isVideo ? 'bg-violet-50/90 text-violet-700 border-violet-200' : isPdf ? 'bg-red-50/90 text-red-700 border-red-200' : 'bg-white/90 text-slate-600 border-slate-200'}`}>{isImage ? 'Image' : isVideo ? 'Video' : isPdf ? 'PDF' : 'File'}</span>
                  {isSensitive && <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">Sensitive</span>}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{fileName}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{ev.description || 'No description'}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{ev.file_size ? (ev.file_size / 1024).toFixed(1) + ' KB' : ''}</span>
                    <span className="text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Single popup gallery for all evidence - buttery smooth */}
      {galleryOpen && filtered.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-6 animate-fade-in" onClick={() => setGalleryOpen(false)}>
          <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-900">{filtered[galleryIndex]?.file_name || 'Evidence'}</h3>
                <p className="text-xs text-slate-500">{galleryIndex + 1} of {filtered.length} • {filtered[galleryIndex]?.description || filtered[galleryIndex]?.file_type || ''}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => handleDownload(filtered[galleryIndex])}>Download</Button>
                <button onClick={() => setGalleryOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><span className="text-lg leading-none">✕</span></button>
              </div>
            </div>
            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-50 p-4">
              <EvidenceGalleryPreview ev={filtered[galleryIndex]} />
              <button onClick={() => setGalleryIndex((i) => (i > 0 ? i - 1 : filtered.length - 1))} className="absolute left-3 rounded-full bg-white/90 p-2 shadow hover:bg-white">‹</button>
              <button onClick={() => setGalleryIndex((i) => (i < filtered.length - 1 ? i + 1 : 0))} className="absolute right-3 rounded-full bg-white/90 p-2 shadow hover:bg-white">›</button>
            </div>
            <div className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-white p-3">
              {filtered.map((ev: any, i: number) => (
                <button key={ev.evidence_id || i} onClick={() => setGalleryIndex(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === galleryIndex ? 'border-blue-500' : 'border-slate-200'} bg-slate-50`}>
                  <EvidenceThumbSmall ev={ev} />
                </button>
              ))}
              <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500 hover:border-blue-400">
                + Attach
                <input type="file" className="hidden" onChange={handleAttach} />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
