import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  File,
  FileImage,
  FileText,
  FileVideo,
  MapPin,
  Search,
  Shield,
  UserRound,
} from 'lucide-react';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { getCase, listCases } from '../services/caseService';
import { listEvidence } from '../services/evidenceService';
import type { Case, CaseDetail } from '../types/case';
import type { Evidence } from '../types/evidence';

function getAuthToken() {
  return localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('crimeintel_token');
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function isImageType(fileType?: string) {
  const type = (fileType || '').toLowerCase();
  return type.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].some((ext) => type.includes(ext));
}

function isVideoType(fileType?: string) {
  const type = (fileType || '').toLowerCase();
  return type.includes('video') || ['mp4', 'mov', 'avi', 'webm'].some((ext) => type.includes(ext));
}

function isPdfType(fileType?: string) {
  return (fileType || '').toLowerCase().includes('pdf');
}

function createFallbackPreviewSvg(label: string, color: string) {
  const safeLabel = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#f8fafc"/>
      <rect x="50" y="60" width="700" height="480" rx="28" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
      <rect x="150" y="190" width="500" height="160" rx="20" fill="${color}" opacity="0.12"/>
      <text x="400" y="240" font-family="Segoe UI, Arial" font-size="90" text-anchor="middle" fill="${color}" font-weight="700">📄</text>
      <text x="400" y="340" font-family="Segoe UI, Arial" font-size="36" text-anchor="middle" fill="#334155">${safeLabel}</text>
    </svg>
  `)}`;
}

function classifyMedia(fileType?: string, fileName?: string, contentType?: string): 'image' | 'video' | 'pdf' | 'other' {
  const mediaType = (contentType || fileType || fileName || '').toLowerCase();
  if (mediaType.includes('image')) return 'image';
  if (mediaType.includes('video')) return 'video';
  if (mediaType.includes('pdf')) return 'pdf';

  const extension = (fileName || fileType || '').split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) return 'image';
  if (['mp4', 'mov', 'avi', 'webm'].includes(extension)) return 'video';
  if (extension === 'pdf') return 'pdf';

  return 'other';
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadgeClass(status?: string) {
  const value = (status || '').toUpperCase();
  if (value.includes('OPEN')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (value.includes('UNDER') || value.includes('INVESTIGATION')) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (value.includes('FILED')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (value.includes('CLOSED')) return 'bg-slate-200 text-slate-700 border-slate-300';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function getPriorityBadgeClass(priority?: string) {
  const value = (priority || '').toUpperCase();
  if (value.includes('CRITICAL')) return 'bg-red-100 text-red-700 border-red-200';
  if (value.includes('HIGH')) return 'bg-orange-100 text-orange-700 border-orange-200';
  if (value.includes('MEDIUM')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (value.includes('LOW')) return 'bg-cyan-100 text-cyan-700 border-cyan-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function getReportId(caseNumber?: string) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = (caseNumber || 'CASE').replace(/[^A-Z0-9]/gi, '').slice(0, 12).toUpperCase();
  return `RPT-${suffix || 'CASE'}-${date}`;
}

function getFileIcon(fileType: string) {
  const type = fileType?.toLowerCase() || '';
  if (type.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].some((ext) => type.includes(ext))) {
    return <FileImage className="h-8 w-8 text-emerald-500" />;
  }
  if (type.includes('video') || ['mp4', 'mov', 'avi', 'webm'].some((ext) => type.includes(ext))) {
    return <FileVideo className="h-8 w-8 text-violet-500" />;
  }
  if (type.includes('pdf')) {
    return <FileText className="h-8 w-8 text-red-500" />;
  }
  return <File className="h-8 w-8 text-slate-500" />;
}

function EvidenceThumb({ evidence }: { evidence: Evidence }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    const canPreview = isImageType(evidence.file_type) || isVideoType(evidence.file_type) || isPdfType(evidence.file_type);

    if (!canPreview) {
      setPreviewUrl(null);
      return undefined;
    }

    let cancelled = false;

    const loadPreview = async () => {
      try {
        const response = await fetch(`/api/v1/evidence/${evidence.evidence_id}/file`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) return;
        const blob = await response.blob();
        const mimeType = response.headers.get('content-type') || blob.type || evidence.file_type || evidence.file_name;
        const kind = classifyMedia(evidence.file_type, evidence.file_name, mimeType);
        if (kind === 'other') {
          if (!cancelled) setPreviewUrl(null);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setPreviewUrl(objectUrl);
      } catch {
        if (!cancelled) setPreviewUrl(null);
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [evidence.evidence_id, evidence.file_type]);

  if (previewUrl && isImageType(evidence.file_type)) {
    return <img src={previewUrl} alt={evidence.file_name} className="h-20 w-full rounded-lg object-cover" />;
  }

  if (previewUrl && isVideoType(evidence.file_type)) {
    return <video src={previewUrl} className="h-20 w-full rounded-lg object-cover" muted playsInline preload="metadata" />;
  }

  if (previewUrl && isPdfType(evidence.file_type)) {
    return <iframe title={evidence.file_name} src={previewUrl} className="h-20 w-full rounded-lg border border-slate-200 bg-white" />;
  }

  if (isImageType(evidence.file_type)) {
    return <img src={createFallbackPreviewSvg(evidence.file_name, '#10b981')} alt={evidence.file_name} className="h-20 w-full rounded-lg object-cover" />;
  }
  if (isVideoType(evidence.file_type)) {
    return <img src={createFallbackPreviewSvg(evidence.file_name, '#8b5cf6')} alt={evidence.file_name} className="h-20 w-full rounded-lg object-cover" />;
  }
  if (isPdfType(evidence.file_type)) {
    return <img src={createFallbackPreviewSvg(evidence.file_name, '#ef4444')} alt={evidence.file_name} className="h-20 w-full rounded-lg object-cover" />;
  }

  return (
    <div className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
      {getFileIcon(evidence.file_type)}
    </div>
  );
}

function ReportPreview({
  caseData,
  caseEvidence,
  reportRef,
}: {
  caseData: CaseDetail;
  caseEvidence: Evidence[];
  reportRef: React.RefObject<HTMLDivElement | null>;
}) {
  const reportId = getReportId(caseData.case_number);

  return (
    <div
      ref={reportRef}
      style={{ fontFamily: '"Inter", "Segoe UI", Arial, sans-serif' }}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
    >
      <div className="bg-[#0f172a] px-6 py-5 text-white sm:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <img src="/Crime-Icon.png" alt="CrimeIntel" className="h-14 w-auto max-w-40 object-contain" />
            <div>
              <div className="text-lg font-semibold uppercase tracking-[0.18em] text-slate-100 sm:text-xl">
                Crime Intelligence Report
              </div>
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300">Case Report</div>
            <div className="mt-1 text-lg font-semibold text-white">{caseData.case_number}</div>
            <div className="mt-1 text-xs text-slate-300">Generated {formatDateTime(new Date().toISOString())}</div>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 sm:px-8">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Report ID</span>
            <span className="font-medium text-slate-800">{reportId}</span>
          </div>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getStatusBadgeClass(caseData.status)}`}>
            {caseData.status || 'Unknown'}
          </span>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getPriorityBadgeClass(caseData.priority)}`}>
            {caseData.priority || 'Medium'}
          </span>
        </div>
      </div>

      <div className="space-y-6 bg-slate-50 px-6 py-6 sm:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <Shield className="h-4 w-4 text-blue-600" />
            Case Summary
          </div>
          <p className="text-base leading-7 text-slate-700 sm:text-lg">
            {caseData.description || 'No case summary available.'}
          </p>
          <div className="mt-5 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-3">
            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
              <MapPin className="mt-0.5 h-4 w-4 text-blue-600" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Location</div>
                <div className="mt-1 text-sm font-medium text-slate-800">{caseData.location || '—'}</div>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
              <Calendar className="mt-0.5 h-4 w-4 text-blue-600" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Date Filed</div>
                <div className="mt-1 text-sm font-medium text-slate-800">{formatDate(caseData.date_filed)}</div>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
              <UserRound className="mt-0.5 h-4 w-4 text-blue-600" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Filing Officer</div>
                <div className="mt-1 text-sm font-medium text-slate-800">{caseData.filing_officer?.display_name || caseData.assigned_officer?.display_name || '—'}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <FileText className="h-4 w-4 text-blue-600" />
            Case Information
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Case No', caseData.case_number],
              ['Crime', caseData.crime_type || '—'],
              ['Status', caseData.status || '—'],
              ['Priority', caseData.priority || '—'],
              ['District', caseData.district || '—'],
              ['Filing Officer', caseData.filing_officer?.display_name || caseData.assigned_officer?.display_name || '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
                <div className="mt-1 text-sm font-semibold text-slate-800">{String(value)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <FileText className="h-4 w-4 text-blue-600" />
            Description
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
            {caseData.description || 'No detailed description available.'}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Suspects: {caseData.suspects?.length || 0}
          </div>
          {caseData.suspects && caseData.suspects.length > 0 ? (
            <div className="space-y-3">
              {caseData.suspects.map((suspect) => (
                <div key={suspect.suspect_id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-base font-semibold text-slate-800">{suspect.name}</div>
                      <div className="text-xs text-slate-500">{suspect.status || 'Unspecified status'}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                      {suspect.age ? <span className="rounded-full bg-white px-2 py-1">Age: {suspect.age}</span> : null}
                      {suspect.gender ? <span className="rounded-full bg-white px-2 py-1">Gender: {suspect.gender}</span> : null}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    {suspect.arrest_date ? <div><span className="font-medium text-slate-500">Arrest Date:</span> {formatDate(suspect.arrest_date)}</div> : null}
                    {suspect.charges && suspect.charges.length > 0 ? (
                      <div className="sm:col-span-2">
                        <span className="font-medium text-slate-500">Charges:</span>{' '}
                        <span>{suspect.charges.join(', ')}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No suspects recorded for this case.</div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Witnesses: {caseData.witnesses?.length || 0}
          </div>
          {caseData.witnesses && caseData.witnesses.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 bg-white text-left text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em] text-slate-500">Name</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em] text-slate-500">Contact</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em] text-slate-500">Credibility</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em] text-slate-500">Statement</th>
                  </tr>
                </thead>
                <tbody>
                  {caseData.witnesses.map((witness) => (
                    <tr key={witness.witness_id} className="border-t border-slate-200">
                      <td className="px-3 py-2 font-medium text-slate-800">{witness.name}</td>
                      <td className="px-3 py-2 text-slate-600">{witness.contact || '—'}</td>
                      <td className="px-3 py-2">
                        {witness.credibility ? (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">{witness.credibility}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {witness.statement ? (
                          <div className="text-xs text-slate-500 break-all">{witness.statement}</div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No witnesses recorded for this case.</div>
          )}
        </section>

        {caseData.timeline && caseData.timeline.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Timeline</div>
            <div className="space-y-4 border-l-2 border-slate-200 pl-4">
              {caseData.timeline.map((event) => (
                <div key={event.event_id} className="relative">
                  <div className="absolute left-[-1.05rem] top-2 h-3 w-3 rounded-full border-2 border-white bg-blue-600" />
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">{event.title || event.event_type || 'Timeline Event'}</div>
                      <div className="text-xs text-slate-500">{formatDate(event.date)}</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">{event.description || 'No description provided.'}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Evidence: {caseEvidence.length}
          </div>
          {caseEvidence.length > 0 ? (
            <div className="space-y-3">
              {caseEvidence.map((item) => (
                <div key={item.evidence_id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="w-full max-w-32.5 shrink-0">
                      <EvidenceThumb evidence={item} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm font-semibold text-slate-800">{item.file_name}</div>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 border border-slate-200">{item.file_type || 'Unknown Type'}</span>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">{item.description || 'No description provided.'}</div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span className="font-medium">Evidence ID: {item.evidence_id}</span>
                        <span>Uploaded {formatDate(item.uploaded_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No evidence recorded for this case.</div>
          )}
        </section>

        {caseData.latitude && caseData.longitude ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <MapPin className="h-4 w-4 text-blue-600" />
              Case Location
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Location</div>
                <div className="mt-1 text-sm font-medium text-slate-800">{caseData.location || '—'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Coordinates</div>
                <div className="mt-1 text-sm font-medium text-slate-800">{caseData.latitude}, {caseData.longitude}</div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [casesError, setCasesError] = useState<string | null>(null);
  const [casesLoading, setCasesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedCase, setSelectedCase] = useState<CaseDetail | null>(null);
  const [selectedCaseEvidence, setSelectedCaseEvidence] = useState<Evidence[]>([]);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const { addToast } = useToast();

  useEffect(() => {
    let active = true;

    const fetchCases = async () => {
      try {
        setCasesLoading(true);
        setCasesError(null);
        const result = await listCases({ limit: 500 });
        if (!active) return;
        setCases(result?.data || []);
      } catch (error) {
        console.error('Failed to load cases:', error);
        if (active) {
          setCasesError('Failed to load cases. Please try again.');
          setCases([]);
        }
      } finally {
        if (active) setCasesLoading(false);
      }
    };

    fetchCases();
    return () => {
      active = false;
    };
  }, []);

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return cases;

    return cases.filter((item) => {
      const haystack = [
        item.case_number,
        item.case_id,
        item.title,
        item.crime_type,
        item.location,
        item.district,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [cases, search]);

  const handleSelectCase = async (caseId: string) => {
    setSelectedCaseId(caseId);
    setSelectedCase(null);
    setSelectedCaseEvidence([]);
    setGeneratedPdfBlob(null);

    try {
      setPreviewLoading(true);
      const [detail, evidence] = await Promise.all([getCase(caseId), listEvidence(caseId)]);
      setSelectedCase(detail);
      setSelectedCaseEvidence(evidence || []);
    } catch (error) {
      console.error('Failed to load selected case details:', error);
      addToast('error', 'Failed to load case report preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const triggerDownload = (blob: Blob, caseNumber?: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `CrimeIntel_Report_${caseNumber || 'case'}_${new Date().toISOString().split('T')[0]}.pdf`;
    anchor.type = 'application/pdf';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleGeneratePDF = async () => {
    if (!selectedCase) return;

    setIsGeneratingPdf(true);
    setGeneratedPdfBlob(null);

    try {
      const response = await fetch(`/api/v1/reports/case/${selectedCase.case_id}/pdf`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PDF generation failed (${response.status}): ${errorText || 'Unable to generate the PDF report.'}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const pdfBytes = new Uint8Array(await response.arrayBuffer());
      const isPdfMagic = pdfBytes.length >= 5 && pdfBytes[0] === 0x25 && pdfBytes[1] === 0x50 && pdfBytes[2] === 0x44 && pdfBytes[3] === 0x46 && pdfBytes[4] === 0x2d;

      if (!contentType.includes('application/pdf') && !isPdfMagic) {
        const fallbackText = new TextDecoder().decode(pdfBytes.slice(0, 256));
        throw new Error(`Expected a PDF response but received ${contentType || 'unknown content type'}: ${fallbackText || 'No response body'}`);
      }

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      if (blob.size === 0) {
        throw new Error('Generated PDF is empty.');
      }

      setGeneratedPdfBlob(blob);
      triggerDownload(blob, selectedCase.case_number || selectedCase.case_id);
      addToast('success', 'PDF generated and downloaded successfully.');
    } catch (error: any) {
      console.error('Generate PDF failed:', error);
      addToast('error', error.message || 'Failed to generate PDF report.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedCase || !generatedPdfBlob) {
      addToast('error', 'Please generate the PDF report first.');
      return;
    }

    setIsDownloadingPdf(true);

    try {
      triggerDownload(generatedPdfBlob, selectedCase.case_number || selectedCase.case_id);
      addToast('success', 'PDF report downloaded successfully.');
    } catch (error: any) {
      console.error('Download PDF failed:', error);
      addToast('error', error.message || 'Unable to download the PDF report.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Case Reports</h1>
          <p className="text-sm text-slate-500">Generate, preview and download investigation reports</p>
        </div>

        <div className="grid min-h-190 grid-cols-1 gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(500px,1.6fr)]">
          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-800">Case List</h2>
            </div>
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search cases..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                />
              </div>
            </div>
            <div className="h-[calc(100vh-250px)] overflow-y-auto px-3 py-3">
              {casesLoading ? (
                <div className="flex h-full items-center justify-center">
                  <EmptyState icon={<FileText size={40} />} title="Loading Cases" description="Fetching case records..." />
                </div>
              ) : casesError ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{casesError}</div>
              ) : filteredCases.length === 0 ? (
                <EmptyState icon={<Search size={40} />} title="No matching cases" description="Try a different case number, title, location, or district." />
              ) : (
                <div className="space-y-3">
                  {filteredCases.map((item) => (
                    <button
                      key={item.case_id}
                      type="button"
                      onClick={() => handleSelectCase(item.case_id)}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${selectedCaseId === item.case_id ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-100' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{item.case_number}</p>
                          <p className="mt-1 text-sm text-slate-700 line-clamp-2">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.location || item.district || 'Location not available'}</p>
                        </div>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-800">Report Preview</h2>
            </div>

            {!selectedCase ? (
              <div className="flex h-[calc(100vh-250px)] items-center justify-center px-6">
                <EmptyState
                  icon={<FileText size={42} />}
                  title="Select a Case"
                  description="Choose a case from the list to preview and generate its investigation report."
                />
              </div>
            ) : (
              <>
                <div className="h-[calc(100vh-340px)] overflow-y-auto p-4 pb-28">
                  {previewLoading ? (
                    <div className="flex h-64 items-center justify-center text-sm text-slate-500">Loading report preview...</div>
                  ) : (
                    <ReportPreview caseData={selectedCase} caseEvidence={selectedCaseEvidence} reportRef={reportRef} />
                  )}
                </div>

                <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button onClick={handleGeneratePDF} disabled={!selectedCase || isGeneratingPdf || isDownloadingPdf} className="w-full sm:w-auto">
                      {isGeneratingPdf ? 'Generating PDF...' : 'Generate PDF Report'}
                    </Button>
                    <Button onClick={handleDownloadPDF} disabled={!selectedCase || !generatedPdfBlob || isGeneratingPdf || isDownloadingPdf} className="w-full sm:w-auto">
                      {isDownloadingPdf ? 'Downloading PDF...' : 'Download PDF'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
