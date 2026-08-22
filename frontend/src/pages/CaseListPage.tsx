import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderOpen } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Table from '../components/ui/Table';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { listCases, createCase } from '../services/caseService';
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
  'assault',
  'cybercrime',
  'dacoity',
  'fraud',
  'kidnapping',
  'murder',
  'other',
  'rioting',
  'robbery',
  'theft',
];

const STATUSES = ['open', 'under_investigation', 'closed', 'filed'];

const DISTRICTS = [
  'Bangalore Rural',
  'Bangalore Urban',
  'Belgaum',
  'Dharwad',
  'Gulbarga',
  'Hubli',
  'Mangalore',
  'Mysore',
  'Shimoga',
  'Tumkur',
];

export default function CaseListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const canCreate = user && ['inspector', 'admin', 'super_admin'].includes(user.role);

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
        <span className="font-medium text-blue-600">{c.case_number}</span>
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
          <span className="text-gray-400">—</span>
        ),
    },
  ];

  const limit = 15;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Case Explorer</h1>
          <p className="mt-1 text-sm text-gray-500">{total} total cases</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            New Case
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[240px] flex-1">
            <Input
              placeholder="Search by case ID, type, location..."
              icon={<Search size={16} />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="input-field"
            value={filters.crime_type ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, crime_type: e.target.value || undefined }));
              setPage(1);
            }}
          >
            <option value="">All Crime Types</option>
            {CRIME_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="input-field"
            value={filters.status ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, status: e.target.value || undefined }));
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="input-field"
            value={filters.district ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, district: e.target.value || undefined }));
              setPage(1);
            }}
          >
            <option value="">All Districts</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input-field"
            value={filters.date_from ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, date_from: e.target.value || undefined }));
              setPage(1);
            }}
            placeholder="From"
          />
          <input
            type="date"
            className="input-field"
            value={filters.date_to ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, date_to: e.target.value || undefined }));
              setPage(1);
            }}
            placeholder="To"
          />
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16">
          <p className="mb-4 text-red-600">{error}</p>
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
            <p className="text-sm text-gray-500">
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
                      <span className="px-1 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`min-w-[32px] rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
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
          onCreated={() => {
            setShowCreateModal(false);
            fetchCases();
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
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CaseCreate>({
    title: '',
    crime_type: '',
    district: '',
    location: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.crime_type || !form.district || !form.location) {
      setError('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createCase(form);
      onCreated();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to create case';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">New Case</h2>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              className="input-field w-full"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Crime Type *
              </label>
              <select
                className="input-field w-full"
                value={form.crime_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, crime_type: e.target.value }))
                }
              >
                <option value="">Select...</option>
                {CRIME_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                District *
              </label>
              <select
                className="input-field w-full"
                value={form.district}
                onChange={(e) =>
                  setForm((f) => ({ ...f, district: e.target.value }))
                }
              >
                <option value="">Select...</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Location *
            </label>
            <input
              className="input-field w-full"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="input-field w-full"
              rows={3}
              value={form.description ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Create Case
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
