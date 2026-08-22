import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit3, Ban } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import type { User, UserRole } from '../types/user';
import type { Column } from '../components/ui/Table';
import Table from '../components/ui/Table';

const ROLES: UserRole[] = ['officer', 'inspector', 'admin', 'super_admin'];

function getRoleBadgeVariant(role: UserRole) {
  if (role === 'super_admin') return 'critical';
  if (role === 'admin') return 'open';
  if (role === 'inspector') return 'under_investigation';
  return 'default';
}

function getStatusBadgeVariant(status: string) {
  if (status === 'active') return 'closed';
  if (status === 'disabled') return 'open';
  return 'default';
}

interface UserForm {
  display_name: string;
  email: string;
  badge_number: string;
  phone: string;
  role: UserRole;
  status: string;
}

const emptyForm: UserForm = {
  display_name: '',
  email: '',
  badge_number: '',
  phone: '',
  role: 'officer',
  status: 'active',
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setUsers([] as User[]);
      setTotal(0);
      setPages(1);
    } catch {
      setError('Failed to load users');
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
      display_name: u.display_name,
      email: u.email,
      badge_number: u.badge_number ?? '',
      phone: u.phone ?? '',
      role: u.role,
      status: u.status,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.display_name || !form.email) {
      setFormError('Name and email are required');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setShowModal(false);
      fetchUsers();
    } catch {
      setFormError('Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async (_userId: string) => {
    try {
      await new Promise((r) => setTimeout(r, 300));
      setShowConfirmDisable(null);
      fetchUsers();
    } catch {
      // ignore
    }
  };

  const limit = 15;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const columns: Column<User>[] = [
    {
      key: 'display_name',
      header: 'Name',
      sortable: true,
      render: (u) => (
        <span className="font-medium text-gray-900">{u.display_name}</span>
      ),
    },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'role',
      header: 'Role',
      render: (u) => <Badge variant={getRoleBadgeVariant(u.role)}>{u.role}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <Badge variant={getStatusBadgeVariant(u.status)}>{u.status}</Badge>
      ),
    },
    {
      key: 'last_login',
      header: 'Last Login',
      render: () => (
        <span className="text-gray-400">—</span>
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
              setShowConfirmDisable(u.user_id);
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
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
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
                    Name *
                  </label>
                  <input
                    className="input-field w-full"
                    value={form.display_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, display_name: e.target.value }))
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
                    Badge #
                  </label>
                  <input
                    className="input-field w-full"
                    value={form.badge_number}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, badge_number: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    className="input-field w-full"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                        {r.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    className="input-field w-full"
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value }))
                    }
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
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
