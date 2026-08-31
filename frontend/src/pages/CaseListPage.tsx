import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderOpen, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import MapPicker from '../components/ui/MapPicker';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Table from '../components/ui/Table';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { listCases, createCase } from '../services/caseService';
import api from '../services/api';
import type { Case, CaseCreate, CaseFilters } from '../types/case';
import type { Column } from '../components/ui/Table';

function getBadgeVariant(status: string) {
  const s = status.toLowerCase().replace(/\s+/g, '_');
  if (s === 'open') return 'open';
  if (s === 'closed') return 'closed';
  if (s === 'under_investigation') return 'under_investigation';
  if (s === 'filed') return 'filed';
  return 'default';
}

const CRIME_TYPES = [
  'Kidnapping',
  'Unlawful Assembly',
  'Chain Snatching',
  'Assault',
  'Drug Trafficking',
  'Vehicle Theft',
  'Murder',
  'Credit Card Fraud',
  'Traffic Violation',
  'ATM Fraud',
  'Rash Driving',
  'Identity Theft',
  'Robbery',
  'Arson',
  'Public Nuisance',
  'Hit and Run',
  'Extortion',
  'Attempted Murder',
  'Burglary',
  'Rioting',
  'Over Speeding',
  'Vandalism',
  'Pickpocketing',
  'Theft',
  'Cyber Crime',
  'Fraud',
  'Drunk Driving',
  'Counterfeiting',
  'Identity Theft',
  'Online Fraud',
  'Domestic Violence',
];

const STATUSES = ['open', 'under_investigation', 'resolved', 'filed'];

const DISTRICTS = [
  'Raichur',
  'Haveri',
  'Mysuru',
  'Bengaluru Rural',
  'Mandya',
  'Ramanagara',
  'Ballari',
  'Bengaluru Urban',
  'Kolar',
  'Kodagu',
  'Bidar',
  'Yadgir',
  'Shivamogga',
  'Kalaburagi',
  'Koppal',
  'Gadag',
  'Chitradurga',
  'Dakshina Kannada',
  'Tumakuru',
  'Uttara Kannada',
  'Chamarajanagar',
  'Belagavi',
  'Udupi',
  'Vijayapura',
  'Chikkamagaluru',
  'Hubballi-Dharwad',
  'Mangaluru',
  'Hassan',
  'Davanagere',
];

export default function CaseListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [cases, setCases] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<CaseFilters>({});
  const [sortBy, setSortBy] = useState<string>('date_filed');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const canCreate = user && ['OFFICER', 'INSPECTOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
  const canDelete = user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        page,
        limit: 15,
        ...filters,
      };
      if (debouncedSearch) params.q = debouncedSearch;
      const res = await listCases(params);
      setCases(res?.data || []);
      setTotal(res?.total || 0);
      setPages(res?.pages || 0);
    } catch {
      setError('Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, [page, filters, debouncedSearch]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleDelete = async (caseId: string) => {
    try {
      await api.delete(`/cases/${caseId}`);
      addToast('success', 'Case deleted successfully');
      fetchCases();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to delete case';
      addToast('error', typeof msg === 'string' ? msg : 'Failed to delete case');
    }
  };

  const sortedCases = useMemo(() => {
    const sorted = [...cases];
    sorted.sort((a, b) => {
      const aVal = (a as any)[sortBy] as string;
      const bVal = (b as any)[sortBy] as string;
      if (!aVal || !bVal) return 0;
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
    return sorted;
  }, [cases, sortBy, sortOrder]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const columns: Column<Case>[] = [
    {
      key: 'case_number',
      header: 'Case ID',
      sortable: true,
      render: (c) => (
        <span className="font-medium text-[var(--color-intel-blue-600)]">{c.case_number}</span>
      ),
    },
    { key: 'crime_type', header: 'Crime Type', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (c) => <Badge variant={getBadgeVariant(c.status)}>{c.status}</Badge>,
    },
    {
      key: 'date_filed',
      header: 'Date Filed',
      sortable: true,
      render: (c) => new Date(c.date_filed).toLocaleDateString(),
    },
    { key: 'location', header: 'Location', sortable: true },
    {
      key: 'assigned_officer',
      header: 'Officer',
      render: (c) =>
        c.assigned_officer?.display_name ?? (
          <span className="text-[var(--color-text-tertiary)]">—</span>
        ),
    },
    ...(canDelete
      ? [
          {
            key: 'actions',
            header: 'Actions',
            render: (c: Case) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete case ${c.case_number}? This will permanently remove the case and all its evidence. Cannot be undone.`)) {
                    handleDelete(c.case_id);
                  }
                }}
                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                title="Delete case (Admin only)"
              >
                <Trash2 size={12} /> Delete
              </button>
            ),
          } as Column<Case>,
        ]
      : []),
  ];

  const limit = 15;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Case Explorer</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{total} total cases</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Create Case
          </Button>
        )}
      </div>

      <Card className="mb-4 !p-3">
        {/* Compact primary bar - always visible */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[200px] flex-1">
            <Input
              placeholder="🔍 Search cases..."
              icon={<Search size={16} />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="input-field !py-2 text-sm min-w-[140px]"
            value={filters.crime_type ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, crime_type: e.target.value || undefined }));
              setPage(1);
            }}
          >
            <option value="">Crime Type</option>
            {CRIME_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="input-field !py-2 text-sm min-w-[120px]"
            value={filters.status ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, status: e.target.value || undefined }));
              setPage(1);
            }}
          >
            <option value="">Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="input-field !py-2 text-sm min-w-[130px]"
            value={filters.district ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, district: e.target.value || undefined }));
              setPage(1);
            }}
          >
            <option value="">District</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilters({})}
            disabled={Object.keys(filters).length === 0 && !search}
            className="shrink-0"
          >
            Clear Filters
          </Button>
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="flex items-center gap-1 shrink-0 rounded-lg border border-[var(--color-border-primary)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-slate-50)] transition-colors"
            aria-expanded={filtersExpanded}
          >
            More Filters {filtersExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        {/* Advanced - collapsed by default, smooth */}
        <div className={`grid transition-all duration-200 ease-in-out ${filtersExpanded ? 'grid-rows-[1fr] opacity-100 mt-3 pt-3 border-t border-[var(--color-border-primary)]' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                className="input-field !py-2 text-sm"
                value={filters.date_from ?? ''}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, date_from: e.target.value || undefined }));
                  setPage(1);
                }}
                placeholder="Date From"
              />
              <input
                type="date"
                className="input-field !py-2 text-sm"
                value={filters.date_to ?? ''}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, date_to: e.target.value || undefined }));
                  setPage(1);
                }}
                placeholder="Date To"
              />
              <select
                className="input-field !py-2 text-sm min-w-[130px]"
                value={(filters as any).priority ?? ''}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, priority: e.target.value || undefined } as any));
                  setPage(1);
                }}
              >
                <option value="">Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input
                className="input-field !py-2 text-sm min-w-[160px]"
                placeholder="Assigned Officer"
                value={(filters as any).officer_id ?? ''}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, officer_id: e.target.value || undefined } as any));
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[var(--color-slate-100)]" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16">
          <p className="mb-4 text-[var(--color-red-600)]">{error}</p>
          <Button onClick={fetchCases}>Retry</Button>
        </div>
      ) : cases.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={48} />}
          title="No cases found"
          description="Try adjusting your search or filters."
          action={
            canCreate
              ? { label: 'Create New Case', onClick: () => setShowCreateModal(true) }
              : undefined
          }
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={sortedCases}
            onRowClick={(item) =>
              navigate(`/cases/${(item as any).case_id}`)
            }
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Showing {from}–{to} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === pages ||
                    Math.abs(p - page) <= 2,
                )
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center gap-1">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-[var(--color-text-tertiary)]">...</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`min-w-[32px] rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-[var(--color-accent-primary)] text-white'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-slate-100)]'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {showCreateModal && (
        <CreateCaseModal
          onClose={() => setShowCreateModal(false)}
          onCreated={async (createdCase: any) => {
            setShowCreateModal(false);
            const caseNumber = createdCase?.case_number || createdCase?.fir_number || createdCase?.case_id || '';
            const internalId = createdCase?.id || createdCase?.case_id || createdCase?.ROWID || caseNumber;
            if (caseNumber) addToast('success', `Case ${caseNumber} created successfully`);
            else addToast('success', 'Case created successfully');
            // Refresh list in background — don't block navigation and don't logout on 401
            fetchCases().catch(() => {});
            if (internalId) navigate(`/cases/${internalId}`);
          }}
        />
      )}
    </div>
  );
}

function CreateCaseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (createdCase?: any) => void;
}) {
  const [form, setForm] = useState<CaseCreate & { priority?: string; status?: string; incident_date?: string; date_filed?: string }>({
    title: '',
    crime_type: '',
    district: '',
    location: '',
    description: '',
    priority: 'medium',
    status: 'open',
    incident_date: new Date().toISOString().split('T')[0],
    date_filed: new Date().toISOString().split('T')[0],
  });
  const [shortSummary, setShortSummary] = useState('');
  const [mapValue, setMapValue] = useState<{ latitude: number | null; longitude: number | null; location_name: string; formatted_address: string; district: string; state: string }>({
    latitude: null,
    longitude: null,
    location_name: '',
    formatted_address: '',
    district: '',
    state: '',
  });
  const [evidenceFiles, setEvidenceFiles] = useState<{ file: File; description: string; sensitive: boolean }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suspects, setSuspects] = useState<{ name: string; age: string; gender: string; address: string; contact: string; description: string; status: string }[]>([]);
  const [witnesses, setWitnesses] = useState<{ name: string; age: string; gender: string; address: string; contact: string; statement: string }[]>([]);

  const handleFileAdd = (files: FileList | File[]) => {
    const arr = Array.from(files as FileList);
    const valid = arr.filter((f) => f.size <= 50 * 1024 * 1024);
    setEvidenceFiles((prev) => [...prev, ...valid.map((f) => ({ file: f, description: '', sensitive: false }))]);
  };

  const { user: authUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.crime_type || !form.district) {
      setError('Please fill Case Title, Crime Type and District');
      return;
    }
    if (mapValue.latitude === null || mapValue.longitude === null) {
      setError('Please select incident location on map');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const officerId = (authUser as any)?.id?.toString() || (authUser as any)?.user_id?.toString() || '';
      const payload: any = {
        title: form.title,
        crime_type: form.crime_type,
        district: mapValue.district || form.district,
        location: mapValue.formatted_address || mapValue.location_name || form.location,
        latitude: mapValue.latitude,
        longitude: mapValue.longitude,
        description: form.description || shortSummary || form.title,
        priority: (form as any).priority || 'medium',
        status: (form as any).status || 'open',
        date_filed: (form as any).date_filed || new Date().toISOString().split('T')[0],
        incident_date: (form as any).incident_date,
        fir_number: `KSP-${(mapValue.district || form.district).slice(0,3).toUpperCase()}-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000+1000))}`,
        officer_id: officerId,
      };
      const created: any = await createCase(payload);
      const raw = (created as any)?.data || created;
      const internalId = raw?.case_id || raw?.ROWID || (created as any)?.case_id;
      const caseNumber = raw?.fir_number || raw?.case_number || internalId;
      const createdCase = { id: internalId, case_id: internalId, case_number: caseNumber, fir_number: caseNumber, ...raw };
      if (evidenceFiles.length > 0 && internalId) {
        let evidenceFailed = false;
        for (const ef of evidenceFiles) {
          try {
            const formData = new FormData();
            formData.append('file', ef.file);
            formData.append('case_id', internalId);
            if (ef.description) formData.append('description', ef.description);
            formData.append('sensitive', String(ef.sensitive));
            const res = await fetch(`/api/v1/evidence/`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${localStorage.getItem('crimeintel_token')}` },
              body: formData,
            });
            if (!res.ok) throw new Error(`Evidence upload failed: ${res.status}`);
          } catch (evErr) {
            console.warn('Evidence upload failed for', ef.file.name, evErr);
            evidenceFailed = true;
          }
        }
        if (evidenceFailed) {
          setError('Case created but some evidence failed to upload. You can add it again from Case Details.');
        }
      }
      // Create suspects (if any) - optional
      const validSuspects = suspects.filter(s => s.name.trim());
      for (const s of validSuspects) {
        try {
          await fetch(`/api/v1/cases/${internalId}/suspects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('crimeintel_token')}` },
            body: JSON.stringify({
              name: s.name,
              age: s.age ? parseInt(s.age) : undefined,
              gender: s.gender || undefined,
              address: s.address || undefined,
              status: (s.status || 'Suspected').toLowerCase(),
              criminal_history: s.description || undefined,
            }),
          }).then(r => { if (!r.ok) throw new Error('suspect failed') });
        } catch (e) { console.warn('Suspect create failed', e); }
      }
      // Create witnesses (if any) - optional
      const validWitnesses = witnesses.filter(w => w.name.trim());
      for (const w of validWitnesses) {
        try {
          await fetch(`/api/v1/cases/${internalId}/witnesses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('crimeintel_token')}` },
            body: JSON.stringify({
              name: w.name,
              contact: w.contact || undefined,
              statement_summary: w.statement || undefined,
              age: w.age ? parseInt(w.age) : undefined,
              gender: w.gender || undefined,
              address: w.address || undefined,
            }),
          }).then(r => { if (!r.ok) throw new Error('witness failed') });
        } catch (e) { console.warn('Witness create failed', e); }
      }
      onCreated(createdCase);
    } catch (err: unknown) {
      const raw = (err as any)?.response?.data?.detail;
      const detail = Array.isArray(raw)
        ? raw.map((d: any) => d.msg || d.message || JSON.stringify(d)).join('; ')
        : (raw as string) || (err as any)?.message || 'Failed to create case';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white border border-[var(--color-border-primary)] shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border-primary)] bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Create Case</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">✕</button>
        </div>
        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-[var(--color-red-200)] bg-[var(--color-red-50)] px-4 py-2 text-sm text-[var(--color-red-700)]">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* SECTION 1 — CASE INFORMATION */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border-b border-[var(--color-border-primary)] pb-2">Case Information</h3>
            <div className="rounded-lg bg-[var(--color-slate-50)] border border-dashed border-[var(--color-border-primary)] px-3 py-2 mb-4 text-sm">
              <span className="text-[var(--color-text-tertiary)]">Case ID</span> <span className="ml-2 font-mono font-medium text-[var(--color-text-primary)]">Auto-generated after creation (KSP-MLR-{new Date().getFullYear()}-XXXX)</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Case Title *</label>
                <input className="input-field w-full" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g., Vehicle Theft Investigation" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Crime Type *</label>
                  <select className="input-field w-full" value={form.crime_type} onChange={(e) => setForm((f) => ({ ...f, crime_type: e.target.value }))}>
                    <option value="">Select Crime Type</option>
                    {CRIME_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Status *</label>
                  <select className="input-field w-full" value={(form as any).status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value } as any))}>
                    <option value="open">Open</option>
                    <option value="under_investigation">Under Investigation</option>
                    <option value="filed">Filed</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Priority *</label>
                  <select className="input-field w-full" value={(form as any).priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value } as any))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Incident Date *</label>
                  <input type="date" className="input-field w-full" value={(form as any).incident_date} onChange={(e) => setForm((f) => ({ ...f, incident_date: e.target.value } as any))} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">District *</label>
                  <select className="input-field w-full" value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}>
                    <option value="">Select...</option>
                    {DISTRICTS.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Date Filed *</label>
                  <input type="date" className="input-field w-full" value={(form as any).date_filed} onChange={(e) => setForm((f) => ({ ...f, date_filed: e.target.value } as any))} />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2 — CASE DESCRIPTION */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border-b border-[var(--color-border-primary)] pb-2">Case Description</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Short Summary</label>
                <input className="input-field w-full" value={shortSummary} onChange={(e) => setShortSummary(e.target.value)} placeholder="Brief summary..." />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Detailed Description</label>
                <textarea className="input-field w-full" rows={4} value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the case in detail..." />
              </div>
            </div>
          </div>

          {/* SECTION 3 — INCIDENT LOCATION */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border-b border-[var(--color-border-primary)] pb-2">Incident Location</h3>
            <MapPicker value={mapValue} onChange={setMapValue} />
          </div>

          {/* SECTION 4 — CASE EVIDENCE (Optional) */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border-b border-[var(--color-border-primary)] pb-2">Case Evidence <span className="ml-2 text-xs font-normal normal-case text-[var(--color-text-tertiary)]">Optional</span></h3>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) handleFileAdd(e.dataTransfer.files); }}
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-[var(--color-border-primary)] bg-[var(--color-slate-50)]'}`}
            >
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">⬆ Upload Files</p>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Drag and drop files here or click to browse</p>
              <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">JPG • PNG • PDF • MP4 • MP3 etc. (max 50MB)</p>
              <input type="file" multiple className="hidden" id="case-evidence-input" onChange={(e) => e.target.files && handleFileAdd(e.target.files)} accept=".jpg,.jpeg,.png,.pdf,.mp4,.mp3,.wav,.doc,.docx" />
              <label htmlFor="case-evidence-input" className="mt-3 cursor-pointer rounded-lg border bg-white px-4 py-1.5 text-sm font-medium hover:bg-slate-50">Browse</label>
            </div>
            {evidenceFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {evidenceFiles.map((ef, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-lg border border-[var(--color-border-primary)] bg-white p-3">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">📄 {ef.file.name}</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Type: {ef.file.type || 'unknown'} • Size: {(ef.file.size/1024/1024).toFixed(2)} MB</p>
                      <input className="input-field mt-2 w-full !py-1.5 text-xs" placeholder="Description: Crime scene near entrance..." value={ef.description} onChange={(e) => setEvidenceFiles(prev => prev.map((p,i)=> i===idx? {...p, description:e.target.value}:p))} />
                      <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={ef.sensitive} onChange={(e)=> setEvidenceFiles(prev=> prev.map((p,i)=> i===idx? {...p, sensitive:e.target.checked}:p))} /> Sensitive Evidence</label>
                    </div>
                    <button type="button" onClick={() => setEvidenceFiles(prev=> prev.filter((_,i)=>i!==idx))} className="text-xs text-red-600 hover:underline shrink-0">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SUSPECTS - Optional */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">Suspects <span className="text-xs font-normal text-[var(--color-text-tertiary)]">— Optional, if applicable</span></h4>
              <button type="button" onClick={() => setSuspects(prev => [...prev, { name: '', age: '', gender: '', address: '', contact: '', description: '', status: 'Suspected' }])} className="text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50">+ Add Suspect</button>
            </div>
            {suspects.length === 0 ? (
              <p className="text-xs text-[var(--color-text-tertiary)] italic border border-dashed rounded p-3 text-center">No suspects added. Click "Add Suspect" if applicable, or skip.</p>
            ) : (
              <div className="space-y-3">
                {suspects.map((s, idx) => (
                  <div key={idx} className="rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-slate-50)] p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Suspect {idx + 1}</span>
                      <button type="button" onClick={() => setSuspects(prev => prev.filter((_, i) => i !== idx))} className="text-xs text-red-600 hover:underline">Remove</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input-field !py-1.5 text-sm" placeholder="Full Name" value={s.name} onChange={(e) => setSuspects(prev => prev.map((p,i)=> i===idx? {...p, name: e.target.value}:p))} />
                      <input className="input-field !py-1.5 text-sm" placeholder="Age" type="number" value={s.age} onChange={(e) => setSuspects(prev => prev.map((p,i)=> i===idx? {...p, age: e.target.value}:p))} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="input-field !py-1.5 text-sm" value={s.gender} onChange={(e) => setSuspects(prev => prev.map((p,i)=> i===idx? {...p, gender: e.target.value}:p))}>
                        <option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                      </select>
                      <select className="input-field !py-1.5 text-sm" value={s.status} onChange={(e) => setSuspects(prev => prev.map((p,i)=> i===idx? {...p, status: e.target.value}:p))}>
                        <option value="Suspected">Suspected</option><option value="Arrested">Arrested</option><option value="Released">Released</option><option value="Unknown">Unknown</option>
                      </select>
                    </div>
                    <input className="input-field !py-1.5 text-sm" placeholder="Address" value={s.address} onChange={(e) => setSuspects(prev => prev.map((p,i)=> i===idx? {...p, address: e.target.value}:p))} />
                    <input className="input-field !py-1.5 text-sm" placeholder="Contact Number" value={s.contact} onChange={(e) => setSuspects(prev => prev.map((p,i)=> i===idx? {...p, contact: e.target.value}:p))} />
                    <input className="input-field !py-1.5 text-sm" placeholder="Description / Identification Details" value={s.description} onChange={(e) => setSuspects(prev => prev.map((p,i)=> i===idx? {...p, description: e.target.value}:p))} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WITNESSES - Optional */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">Witnesses <span className="text-xs font-normal text-[var(--color-text-tertiary)]">— Optional, if applicable</span></h4>
              <button type="button" onClick={() => setWitnesses(prev => [...prev, { name: '', age: '', gender: '', address: '', contact: '', statement: '' }])} className="text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50">+ Add Witness</button>
            </div>
            {witnesses.length === 0 ? (
              <p className="text-xs text-[var(--color-text-tertiary)] italic border border-dashed rounded p-3 text-center">No witnesses added. Click "Add Witness" if applicable, or skip.</p>
            ) : (
              <div className="space-y-3">
                {witnesses.map((w, idx) => (
                  <div key={idx} className="rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-slate-50)] p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Witness {idx + 1}</span>
                      <button type="button" onClick={() => setWitnesses(prev => prev.filter((_, i) => i !== idx))} className="text-xs text-red-600 hover:underline">Remove</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input-field !py-1.5 text-sm" placeholder="Full Name" value={w.name} onChange={(e) => setWitnesses(prev => prev.map((p,i)=> i===idx? {...p, name: e.target.value}:p))} />
                      <input className="input-field !py-1.5 text-sm" placeholder="Age" type="number" value={w.age} onChange={(e) => setWitnesses(prev => prev.map((p,i)=> i===idx? {...p, age: e.target.value}:p))} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="input-field !py-1.5 text-sm" value={w.gender} onChange={(e) => setWitnesses(prev => prev.map((p,i)=> i===idx? {...p, gender: e.target.value}:p))}>
                        <option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                      </select>
                      <input className="input-field !py-1.5 text-sm" placeholder="Contact Number" value={w.contact} onChange={(e) => setWitnesses(prev => prev.map((p,i)=> i===idx? {...p, contact: e.target.value}:p))} />
                    </div>
                    <input className="input-field !py-1.5 text-sm" placeholder="Address" value={w.address} onChange={(e) => setWitnesses(prev => prev.map((p,i)=> i===idx? {...p, address: e.target.value}:p))} />
                    <textarea className="input-field !py-1.5 text-sm" placeholder="Statement / Notes" rows={2} value={w.statement} onChange={(e) => setWitnesses(prev => prev.map((p,i)=> i===idx? {...p, statement: e.target.value}:p))} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--color-border-primary)] pt-4">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={submitting}>Create Case</Button>
          </div>
        </form>
      </div>
    </div>
  );
}