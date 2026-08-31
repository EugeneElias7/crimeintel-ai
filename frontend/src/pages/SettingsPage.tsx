import { useState, useEffect } from 'react';
import { User, Bell, Save } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { updateProfile } from '../services/authService';
import { useAuthStore } from '../store/authStore';

type SettingsTab = 'profile' | 'notifications';

export default function SettingsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <User size={16} /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="mb-6 flex gap-2 border-b border-[var(--color-border-primary)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-[var(--color-accent-primary)] text-[var(--color-accent-primary)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && <ProfileTab user={user} addToast={addToast} />}
      {activeTab === 'notifications' && <NotificationsTab />}
    </div>
  );
}

function ProfileTab({
  user,
  addToast,
}: {
  user: { display_name?: string; email?: string; phone?: string; badge_number?: string } | null;
  addToast: (type: 'success' | 'error', message: string) => void;
}) {
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [badgeNumber, setBadgeNumber] = useState(user?.badge_number ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.display_name !== undefined) setDisplayName(user.display_name ?? '');
    if (user?.phone !== undefined) setPhone(user.phone ?? '');
    if (user?.badge_number !== undefined) setBadgeNumber(user.badge_number ?? '');
  }, [user?.display_name, user?.phone, user?.badge_number]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      addToast('error', 'Display name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      const updated: any = await updateProfile({
        display_name: displayName.trim(),
        phone: phone.trim(),
        badge_number: badgeNumber.trim(),
      });
      // Update authStore so Sidebar/Navbar show new display name immediately
      const raw = updated as any;
      // Normalize like authStore does
      const normalized = {
        id: raw.user_id || raw.ROWID || raw.id || 0,
        username: raw.username || raw.display_name?.toLowerCase().replace(/\s+/g, '_') || raw.email?.split('@')[0],
        email: raw.email || user?.email || '',
        full_name: raw.display_name || displayName,
        employee_id: raw.badge_number || badgeNumber,
        department: raw.department || 'Karnataka State Police',
        designation: raw.designation || raw.role || '',
        role: (raw.role || 'OFFICER').toUpperCase(),
        account_status: raw.status === 'active' ? 'APPROVED' : (raw.status || 'APPROVED').toUpperCase(),
        is_active: true,
        created_at: raw.created_at || new Date().toISOString(),
      } as any;
      useAuthStore.getState().setUser(normalized);
      // Also trigger re-initialize to be safe
      addToast('success', 'Profile updated successfully');
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'Failed to update profile';
      addToast('error', typeof msg === 'string' ? msg : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="max-w-lg space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
            Email
          </label>
          <input
            className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-slate-50)] px-3 py-2 text-sm text-[var(--color-text-tertiary)]"
            value={user?.email ?? ''}
            disabled
          />
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            Email cannot be changed
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
            Display Name
          </label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Phone
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 XXXXXXXXXX"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Badge Number
            </label>
            <Input
              value={badgeNumber}
              onChange={(e) => setBadgeNumber(e.target.value)}
              placeholder="e.g. KSP-#####"
            />
          </div>
        </div>
        <Button onClick={handleSave} isLoading={saving} className="border border-blue-600/20 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0">
          <Save size={16} />
          Save Changes
        </Button>
      </div>
    </Card>
  );
}

function NotificationsTab() {
  const [settings, setSettings] = useState({
    case_assigned: true,
    status_change: true,
    evidence_uploaded: false,
  });

  return (
    <Card>
      <div className="max-w-lg space-y-4">
        {[
          {
            key: 'case_assigned' as const,
            label: 'Case Assigned',
            description: 'When a new case is assigned to you',
          },
          {
            key: 'status_change' as const,
            label: 'Status Change',
            description: 'When a case status is updated',
          },
          {
            key: 'evidence_uploaded' as const,
            label: 'Evidence Uploaded',
            description: 'When new evidence is added to your cases',
          },
        ].map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-slate-50)] px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">{item.description}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    [item.key]: e.target.checked,
                  }))
                }
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-[var(--color-slate-200)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-[var(--color-slate-300)] after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-accent-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-accent-primary)]" />
            </label>
          </div>
        ))}
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Notification preferences are saved automatically
        </p>
      </div>
    </Card>
  );
}