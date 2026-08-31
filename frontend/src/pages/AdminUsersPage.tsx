import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit3, Ban, FileCheck, FileX } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import type { User, UserRole, AccountStatus } from '../types/user';
import type { Column } from '../components/ui/Table';
import Table from '../components/ui/Table';
import { getRoleLabel, getRoleBadgeVariant, ROLE_LABELS } from '../config/roles';
import api from '../services/api';

const ROLES: UserRole[] = ['OFFICER', 'INSPECTOR', 'ADMIN', 'SUPER_ADMIN'];

function getStatusBadgeVariant(status: AccountStatus) {
  if (status === 'APPROVED') return 'closed';
  if (status === 'REJECTED') return 'open';
  if (status === 'SUSPENDED') return 'critical';
  if (status === 'PENDING_VERIFICATION') return 'under_investigation';
  return 'default';
}

interface UserForm {
  full_name: string;
  email: string;
  employee_id: string;
  department: string;
  designation: string;
  role: UserRole;
  account_status: AccountStatus;
}

const emptyForm: UserForm = {
  full_name: '',
  email: '',
  employee_id: '',
  department: '',
  designation: '',
  role: 'OFFICER',
  account_status: 'PENDING_DOCUMENT',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDisable, setShowConfirmDisable] = useState<string | null>(null);

  const limit = 15;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      const { data } = await api.get('/admin/users', { params });
      // Backend now returns enriched data with verification fields - no N+1 needed
      const usersData: any[] = data.data || data.users || [];
      const normalized = usersData.map((u: any) => {
        const uid = u.id || u.user_id || u.ROWID;
        return {
          ...u,
          id: uid,
          user_id: uid,
          // Use backend-provided enriched fields
          verification_status: u.verification_status || u.document_status || 'NOT_SUBMITTED',
          has_proof: u.id_proof_attached ?? u.has_proof ?? false,
          verification_document: u.verification_document || null,
          id_proof_file_name: u.id_proof_file_name || null,
          account_status: u.account_status || u.status || 'PENDING',
        };
      });
      setUsers(normalized as unknown as User[]);
      setTotal(data.total ?? normalized.length);
      setPages(data.pages ?? 1);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Failed to load users';
      setError(typeof msg === 'string' ? msg : 'Failed to load users');
      setUsers([]);
      setTotal(0);
      setPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = (u: User) => {
    setEditingUser(u);
    setForm({
      full_name: u.full_name,
      email: u.email,
      employee_id: u.employee_id ?? '',
      department: u.department ?? '',
      designation: u.designation ?? '',
      role: u.role,
      account_status: u.account_status,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.email) {
      setFormError('Name and email are required');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingUser) {
        const payload: any = {
          display_name: form.full_name,
          email: form.email,
          badge_number: form.employee_id,
          role: form.role,
          status: form.account_status,
        };
        const { data } = await api.put(`/admin/users/${editingUser.id}`, payload);
        const updated = (data as any).data || data;
        setUsers((prev) => prev.map((u) => (u.id.toString() === editingUser.id.toString() ? { ...u, ...updated, id: editingUser.id } as User : u)));
      } else {
        const payload: any = {
          display_name: form.full_name,
          email: form.email,
          password: 'TempPass123',
          badge_number: form.employee_id,
          role: form.role,
          status: form.account_status,
        };
        await api.post('/admin/users', payload);
      }
      setShowModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'Failed to save user';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async (userId: string) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setShowConfirmDisable(null);
      setUsers((prev) => prev.filter((u) => u.id.toString() !== userId));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Failed to disable user';
      setError(typeof msg === 'string' ? msg : 'Failed to disable user');
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'full_name',
      header: 'Name',
      sortable: true,
      render: (u) => (
        <span className="font-medium text-gray-900">{u.full_name}</span>
      ),
    },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'employee_id', header: 'Employee ID', sortable: true },
    { key: 'department', header: 'Department', sortable: true },
    {
      key: 'role',
      header: 'Role',
      render: (u) => <Badge variant={getRoleBadgeVariant(u.role)}>{getRoleLabel(u.role)}</Badge>,
    },
    {
      key: 'account_status',
      header: 'Account Status',
      render: (u) => (
        <Badge variant={getStatusBadgeVariant(u.account_status)}>{u.account_status}</Badge>
      ),
    },
    {
      key: 'id_proof',
      header: 'ID Proof',
      render: (u: any) => (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${u.has_proof ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {u.has_proof ? <FileCheck size={12} /> : <FileX size={12} />}
          {u.has_proof ? (u.verification_status === 'APPROVED' ? 'Verified' : u.verification_status === 'PENDING' ? 'Pending' : 'Attached') : 'Not Attached'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(u);
            }}
            className="rounded p-1 text-gray-400 hover:text-blue-600"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirmDisable(u.id.toString());
            }}
            className="rounded p-1 text-gray-400 hover:text-red-600"
          >
            <Ban size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">{total} total users</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus size={16} />
          Add User
        </Button>
      </div>

      <Card className="mb-6">
        <div className="min-w-[240px] max-w-sm">
          <Input
            placeholder="Search by name or email..."
            icon={<Search size={16} />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
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
          <Button onClick={fetchUsers}>Retry</Button>
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={users}
          />

          {total > 0 && (
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
                  .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 2)
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
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {editingUser ? 'Edit User' : 'Add User'}
            </h2>
            {formError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    className="input-field w-full"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, full_name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    className="input-field w-full"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Employee ID
                  </label>
                  <input
                    className="input-field w-full"
                    value={form.employee_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, employee_id: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <input
                    className="input-field w-full"
                    value={form.department}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, department: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Designation
                  </label>
                  <input
                    className="input-field w-full"
                    value={form.designation}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, designation: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    className="input-field w-full"
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        role: e.target.value as UserRole,
                      }))
                    }
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Account Status
                  </label>
                  <select
                    className="input-field w-full"
                    value={form.account_status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, account_status: e.target.value as AccountStatus }))
                    }
                  >
                    <option value="PENDING_DOCUMENT">Pending Document</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} isLoading={submitting}>
                  {editingUser ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmDisable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Disable User</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to disable this user?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDisable(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDisable(showConfirmDisable)}
              >
                Disable
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


