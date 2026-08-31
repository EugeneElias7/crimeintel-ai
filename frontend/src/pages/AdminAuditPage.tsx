import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import api from '../services/api';

interface AuditLogUser {
  user_id: string;
  display_name: string;
}

interface AuditLog {
  log_id: string;
  user: AuditLogUser;
  action: string;
  module: string;
  details: Record<string, unknown>;
  ip_address: string;
  timestamp: string;
}

const ACTION_TYPES = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'EXPORT'];

function getActionBadgeVariant(action: string) {
  if (action === 'CREATE') return 'closed';
  if (action === 'DELETE') return 'critical';
  if (action === 'UPDATE') return 'under_investigation';
  if (action === 'LOGIN' || action === 'LOGOUT') return 'open';
  return 'default';
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page,
        limit,
      };
      if (search) params.search = search;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (selectedAction) params.action = selectedAction;
      // selectedUser is display_name, use search for user filtering to match actor_name
      if (selectedUser) {
        // combine with existing search
        const existing = (params.search as string) || '';
        params.search = existing ? `${existing} ${selectedUser}` : selectedUser;
      }

      const { data } = await api.get<any>('/admin/audit-logs', { params });
      // backend returns PaginatedResponse with data as enriched logs, handle both shapes
      const rawData = data.data || data;
      const mapped: AuditLog[] = (Array.isArray(rawData) ? rawData : []).map((r: any) => ({
        log_id: r.log_id || r.ROWID || r.id || String(Math.random()),
        user: r.user || { user_id: r.actor_id || r.user_id || 'unknown', display_name: r.actor_name || r.user?.display_name || r.display_name || 'Unknown' },
        action: r.action || '—',
        module: r.module || r.resource_type || '—',
        details: typeof r.details === 'string' ? (() => { try { return JSON.parse(r.details); } catch { return { message: r.details }; } })() : r.details || {},
        ip_address: r.ip_address || r.ip || '—',
        timestamp: r.timestamp || r.created_at || new Date().toISOString(),
      }));
      setLogs(mapped);
      setTotalLogs(data.total ?? mapped.length);
      setTotalPages(data.pages ?? 1);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Failed to load audit logs';
      setError(typeof msg === 'string' ? msg : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, search, dateFrom, dateTo, selectedUser, selectedAction]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const uniqueUsers = [...new Set(logs.map((l) => l.user.display_name))];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track all system activities and changes
        </p>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[200px] flex-1">
            <Input
              placeholder="Search action or user..."
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
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Users</option>
            {uniqueUsers.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <select
            className="input-field"
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Actions</option>
            {ACTION_TYPES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input-field"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            placeholder="From"
          />
          <input
            type="date"
            className="input-field"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
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
          <Button onClick={fetchLogs}>Retry</Button>
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<Search size={48} />}
          title="No audit logs found"
          description="Try adjusting your filters."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Timestamp', 'User', 'Action', 'Module', 'Details', 'IP Address', ''].map(
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
                {logs.map((log) => (
                  <tr key={log.log_id} className="group">
                    <td
                      className="cursor-pointer px-4 py-3 text-sm text-gray-500"
                      onClick={() =>
                        setExpandedId(expandedId === log.log_id ? null : log.log_id)
                      }
                    >
                      <div className="flex items-center gap-2">
                        {expandedId === log.log_id ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {log.user.display_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {log.module}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-500">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {log.ip_address}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === log.log_id ? null : log.log_id)
                        }
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        {expandedId === log.log_id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
                {logs.map(
                  (log) =>
                    expandedId === log.log_id && (
                      <tr key={`${log.log_id}-expanded`}>
                        <td colSpan={7} className="bg-gray-50 px-4 py-4">
                          <div className="rounded-lg bg-white p-4 shadow-sm">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                              Full Details
                            </p>
                            <pre className="overflow-x-auto text-xs text-gray-700">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    ),
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1}–
              {Math.min(page * limit, totalLogs)} of{' '}
              {totalLogs}
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
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2,
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
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
