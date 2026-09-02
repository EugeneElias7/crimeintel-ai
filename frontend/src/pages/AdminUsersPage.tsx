import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Edit3, Ban, FileCheck, FileX, Eye, MoreVertical, Download, FileText, FileImage, X } from 'lucide-react';
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

function getStatusBadgeVariant(_status: AccountStatus) {
  void _status;
  return 'default' as const;
}
void getStatusBadgeVariant;
// keep Card referenced to satisfy noUnusedLocals
void Card;

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

// Reusable preview modal per spec
function IdProofPreviewModal({
  open,
  onClose,
  fileUrl,
  fileName,
  fileType,
}: {
  open: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName: string;
  fileType: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !fileUrl) {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    const fetchFile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(fileUrl, { responseType: 'blob' });
        const blob: Blob = res.data as unknown as Blob;
        // Try to infer type from response header if not provided
        const contentType = (res.headers as any)?.['content-type'] || fileType || blob.type || '';
        const typedBlob = contentType ? new Blob([blob], { type: contentType }) : blob;
        objectUrl = URL.createObjectURL(typedBlob);
        if (!cancelled) setBlobUrl(objectUrl);
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.detail || e?.message || 'Failed to load document');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchFile();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, fileUrl, fileType]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName || 'id_proof';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!open) return null;

  const isImage = fileType?.toLowerCase().includes('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);
  const isPdf = fileType?.toLowerCase().includes('pdf') || /\.pdf$/i.test(fileName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">ID Proof</h3>
            <p className="text-xs text-slate-500">Employee verification document</p>
            <p className="mt-1 text-xs font-medium text-slate-700 truncate max-w-[400px]">{fileName}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-slate-50 p-4">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">Loading document...</div>
          ) : error ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-red-600">
              <FileX size={28} />
              <span>{error}</span>
            </div>
          ) : !blobUrl ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">No preview available</div>
          ) : isImage ? (
            <div className="flex justify-center">
              <img src={blobUrl} alt={fileName} className="max-h-[65vh] max-w-full rounded-lg object-contain shadow" />
            </div>
          ) : isPdf ? (
            <iframe src={blobUrl} title={fileName} className="h-[65vh] w-full rounded-lg border border-slate-200 bg-white" />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-600">
              <FileText size={40} className="text-slate-400" />
              <p className="text-sm">{fileName}</p>
              <p className="text-xs text-slate-500">{fileType || 'Unknown type'}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleDownload} disabled={!blobUrl} className="gap-2">
            <Download size={14} /> Download
          </Button>
        </div>
      </div>
    </div>
  );
}

function IdProofCell({ user, onView }: { user: any; onView: (u: any) => void }) {
  const hasProof = Boolean(user.has_proof || user.id_proof_attached || user.id_proof_file_url || user.id_proof_file_name);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const fileName: string = user.id_proof_file_name || 'id_proof';
  const fileType: string = user.id_proof_file_type || (fileName.includes('.') ? fileName.split('.').pop() || '' : '');
  const isImage = fileType.toLowerCase().includes('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);
  const isPdf = fileType.toLowerCase().includes('pdf') || /\.pdf$/i.test(fileName);
  const rawUrl: string | null = user.id_proof_file_url || (hasProof && user.id ? `/admin/users/${user.id}/verification/file` : null);
  const fileUrl: string | null = rawUrl ? rawUrl.replace(/^\/api\/v1/, '') : null;

  useEffect(() => {
    if (!hasProof || !fileUrl || !isImage) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(fileUrl, { responseType: 'blob' });
        const blob = res.data as unknown as Blob;
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setThumbUrl(objectUrl);
      } catch {
        if (!cancelled) setThumbUrl(null);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [hasProof, fileUrl, isImage]);

  useEffect(() => {
    return () => {
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
    };
  }, [thumbUrl]);

  if (!hasProof) {
    return (
      <div className="flex items-center gap-3 whitespace-nowrap">
        <div className="h-12 w-12 shrink-0 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
          <FileText size={16} className="text-slate-300" />
        </div>
        <div className="leading-tight">
          <p className="text-xs font-medium text-slate-500">No ID proof</p>
          <p className="text-[11px] text-slate-400">Not uploaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 whitespace-nowrap">
      <button
        onClick={() => onView(user)}
        className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center hover:border-blue-300 transition-colors"
        title="View ID proof"
      >
        {isImage && thumbUrl ? (
          <img src={thumbUrl} alt="ID proof" className="h-full w-full object-cover" />
        ) : isImage ? (
          <FileImage size={18} className="text-emerald-600" />
        ) : isPdf ? (
          <span className="flex h-full w-full items-center justify-center bg-red-50 text-[10px] font-bold text-red-600">PDF</span>
        ) : (
          <FileText size={18} className="text-slate-400" />
        )}
      </button>
      <div className="min-w-0 leading-tight">
        <p className="text-xs font-medium text-slate-700 whitespace-nowrap">ID Proof</p>
        <button onClick={() => onView(user)} className="text-xs text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap">
          View document
        </button>
      </div>
    </div>
  );
}

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
  const [verifyingUserId, setVerifyingUserId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<{ open: boolean; fileUrl: string | null; fileName: string; fileType: string }>({ open: false, fileUrl: null, fileName: '', fileType: '' });
  const menuRef = useRef<HTMLDivElement | null>(null);

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
      const usersData: any[] = data.data || data.users || [];
      const normalized = usersData.map((u: any) => {
        const uid = u.id || u.user_id || u.ROWID;
        return {
          ...u,
          id: uid,
          user_id: uid,
          verification_status: u.verification_status || u.document_status || 'NOT_SUBMITTED',
          has_proof: u.id_proof_attached ?? u.has_proof ?? false,
          id_proof_file_name: u.id_proof_file_name || null,
          id_proof_file_type: u.id_proof_file_type || null,
          id_proof_file_url: (u.id_proof_file_url ? u.id_proof_file_url.replace(/^\/api\/v1/, '') : null) || (u.id_proof_attached ? `/admin/users/${uid}/verification/file` : null),
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewIdProof = (u: any) => {
    const raw = u.id_proof_file_url || (u.id ? `/admin/users/${u.id}/verification/file` : null);
    const fileUrl = raw ? raw.replace(/^\/api\/v1/, '') : null;
    const fileName = u.id_proof_file_name || 'id_proof';
    const fileType = u.id_proof_file_type || '';
    if (!u.has_proof && !u.id_proof_attached) {
      // still allow admin to see the absence, show info
      setPreviewState({ open: true, fileUrl: null, fileName: 'No ID Proof attached', fileType: '' });
      return;
    }
    if (!fileUrl) {
      setPreviewState({ open: true, fileUrl: null, fileName, fileType });
      return;
    }
    setPreviewState({ open: true, fileUrl, fileName, fileType });
  };

  const handleVerify = async (userId: string, decision: 'VERIFIED' | 'REJECTED') => {
    const user = users.find((u) => (u as any).id.toString() === userId.toString()) as any;
    const hasProof = Boolean((user as any)?.has_proof || (user as any)?.id_proof_attached);
    if (!hasProof) {
      const confirmMsg = decision === 'VERIFIED'
        ? `No ID proof attached for ${user?.full_name || user?.email}. Still APPROVE and grant login access?`
        : `No ID proof attached for ${user?.full_name || user?.email}. Still REJECT?`;
      if (!window.confirm(confirmMsg)) return;
    } else if (decision === 'REJECTED' && !window.confirm(`Reject verification for ${user?.full_name || user?.email}?`)) {
      return;
    }
    setVerifyingUserId(userId);
    setOpenMenuId(null);
    try {
      await api.patch(`/admin/users/${userId}/verification`, { status: decision });
      await fetchUsers();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || `Failed to ${decision.toLowerCase()} user`;
      setError(typeof msg === 'string' ? msg : `Failed to ${decision.toLowerCase()} user`);
    } finally {
      setVerifyingUserId(null);
    }
  };

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
    setOpenMenuId(null);
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
      setOpenMenuId(null);
      await fetchUsers();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Failed to disable user';
      setError(typeof msg === 'string' ? msg : 'Failed to disable user');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '—';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const columns: Column<User>[] = [
    {
      key: 'full_name',
      header: 'Name',
      sortable: true,
      width: '200px',
      render: (u) => (
        <div className="flex items-center gap-3 whitespace-nowrap">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 border border-slate-200">
            {getInitials(u.full_name)}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-medium text-slate-900 truncate">{u.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{(u as any).department || 'Karnataka State Police'}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', sortable: true, width: '220px', render: (u) => <span className="truncate whitespace-nowrap text-sm text-slate-700">{u.email}</span> },
    {
      key: 'employee_id',
      header: 'Employee',
      sortable: true,
      width: '180px',
      render: (u) => (
        <div className="leading-tight whitespace-nowrap">
          <p className="text-sm font-medium text-slate-900">{u.employee_id || '—'}</p>
          <p className="text-xs text-slate-500 truncate max-w-[160px]">{(u as any).department || 'Karnataka State Police'}</p>
        </div>
      ),
    },
    { key: 'role', header: 'Role', width: '150px', render: (u) => <Badge variant={getRoleBadgeVariant(u.role)}><span className="whitespace-nowrap text-xs">{getRoleLabel(u.role)}</span></Badge> },
    {
      key: 'account_status',
      header: 'Status',
      width: '140px',
      render: (u) => {
        const s = (u.account_status || '').toUpperCase();
        const isActive = s === 'APPROVED' || s === 'ACTIVE';
        const isPending = s.includes('PENDING');
        const isRejected = s === 'REJECTED';
        return (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${isActive ? 'text-emerald-700' : isPending ? 'text-amber-700' : isRejected ? 'text-red-600' : 'text-slate-600'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : isRejected ? 'bg-red-500' : 'bg-slate-400'}`} />
            {isActive ? 'Active' : isPending ? 'Pending' : isRejected ? 'Rejected' : u.account_status}
          </span>
        );
      },
    },
    {
      key: 'id_proof',
      header: 'ID Proof',
      width: '170px',
      render: (u: any) => <IdProofCell user={u} onView={handleViewIdProof} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '170px',
      className: 'whitespace-nowrap',
      render: (u: any) => {
        const status = (u.account_status || u.status || '').toUpperCase();
        const verif = (u.verification_status || '').toUpperCase();
        const isPending = status.includes('PENDING') || verif === 'PENDING' || verif === 'NOT_SUBMITTED' || status === 'PENDING_DOCUMENT';
        const isVerifying = verifyingUserId === u.id.toString();
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {isPending ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handleVerify(u.id.toString(), 'VERIFIED'); }}
                  disabled={isVerifying}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 whitespace-nowrap"
                >
                  <FileCheck size={12} /> Approve
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleVerify(u.id.toString(), 'REJECTED'); }}
                  disabled={isVerifying}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 whitespace-nowrap"
                >
                  <FileX size={12} /> Reject
                </button>
              </>
            ) : null}
            <div className="relative" ref={openMenuId === u.id.toString() ? menuRef : null}>
              <button
                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === u.id.toString() ? null : u.id.toString()); }}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-transparent hover:border-slate-200"
                aria-label="More actions"
              >
                <MoreVertical size={14} />
              </button>
              {openMenuId === u.id.toString() && (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                  <button onClick={(e) => { e.stopPropagation(); handleViewIdProof(u); setOpenMenuId(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                    <Eye size={14} /> View ID Proof
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(u); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                    <Edit3 size={14} /> Edit User
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button onClick={(e) => { e.stopPropagation(); setShowConfirmDisable(u.id.toString()); setOpenMenuId(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                    <Ban size={14} /> Disable Account
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and verify platform users • {total} total</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-[360px]">
            <Input
              placeholder="Search users..."
              icon={<Search size={16} />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-[42px]"
            />
          </div>
          <Button onClick={handleCreate} className="whitespace-nowrap shrink-0">
            <Plus size={16} />
            Add User
          </Button>
        </div>
      </div>

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
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              data={users}
            />
          </div>

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

      <IdProofPreviewModal
        open={previewState.open}
        onClose={() => setPreviewState({ open: false, fileUrl: null, fileName: '', fileType: '' })}
        fileUrl={previewState.fileUrl}
        fileName={previewState.fileName}
        fileType={previewState.fileType}
      />

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
