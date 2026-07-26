import { useState } from 'react';
import { User, Lock, Bell, Save } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { changePassword } from '../services/authService';

type SettingsTab = 'profile' | 'security' | 'notifications';

export default function SettingsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <User size={16} /> },
    { key: 'security', label: 'Security', icon: <Lock size={16} /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && <ProfileTab user={user} addToast={addToast} />}
      {activeTab === 'security' && <SecurityTab addToast={addToast} />}
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      addToast('success', 'Profile updated successfully');
    } catch {
      addToast('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="max-w-lg space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            value={user?.email ?? ''}
            disabled
          />
          <p className="mt-1 text-xs text-gray-400">
            Email cannot be changed
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Display Name
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 XXXXXXXXXX"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Badge Number
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={badgeNumber}
              onChange={(e) => setBadgeNumber(e.target.value)}
              placeholder="e.g. KSP-#####"
            />
          </div>
        </div>
        <Button onClick={handleSave} isLoading={saving}>
          <Save size={16} />
          Save Changes
        </Button>
      </div>
    </Card>
  );
}

function SecurityTab({
  addToast,
}: {
  addToast: (type: 'success' | 'error', message: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [changing, setChanging] = useState(false);

  const handleChangePassword = async () => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) newErrors.current = 'Current password is required';
    if (!newPassword) newErrors.new = 'New password is required';
    else if (newPassword.length < 6)
      newErrors.new = 'Must be at least 6 characters';
    if (newPassword !== confirmPassword)
      newErrors.confirm = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setChanging(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      addToast('success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      addToast('error', 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  return (
    <Card>
      <div className="max-w-lg space-y-4">
        <div>
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={errors.current}
          />
        </div>
        <div>
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={errors.new}
            helperText="At least 6 characters"
          />
        </div>
        <div>
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirm}
          />
        </div>
        <Button onClick={handleChangePassword} isLoading={changing}>
          <Lock size={16} />
          Change Password
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
            className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
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
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300" />
            </label>
          </div>
        ))}
        <p className="text-xs text-gray-400">
          Notification preferences are saved automatically
        </p>
      </div>
    </Card>
  );
}
