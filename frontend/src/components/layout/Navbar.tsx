import { useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../ui/BackButton';
import { getRoleLabel } from '../../config/roles';
import type { UserRole } from '../../types/user';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/crima': 'CRIMA AI',
  '/cases': 'Case Explorer',
  '/evidence': 'Evidence',
  '/analytics': 'Analytics',
  '/heatmap': 'Heat Maps',
  '/reports': 'Reports',
  '/admin/users': 'Manage Users',
  '/admin/audit': 'Audit Log',
  '/settings': 'Settings',
};

interface NavbarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export default function Navbar({ onToggleSidebar, sidebarCollapsed: _sidebarCollapsed }: NavbarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const basePath = '/' + (location.pathname.split('/')[1] || '');
  const title = routeTitles[basePath] || 'CrimeIntel';

  return (
    <header
      className="sticky top-0 z-30 flex h-14 shrink-0 items-center bg-white/95 backdrop-blur-md border-b border-(--color-border-primary) shadow-sm"
    >
      <div className="flex w-full items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden rounded-md border border-(--color-border-primary) bg-white p-2 text-(--color-slate-500) hover:border-(--color-accent-primary) hover:text-(--color-accent-primary) transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
          {basePath !== '/' && <BackButton iconOnly fallbackTo="/" />}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-(--color-text-primary) truncate">{title}</h2>
            <p className="text-xs text-(--color-text-tertiary)">Crime Intelligence Investigation Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button
            className="group relative rounded-lg border border-(--color-border-primary) bg-white p-2 text-(--color-slate-500) hover:border-(--color-amber-300) hover:text-(--color-amber-600) hover:bg-amber-50 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-(--color-red-500) text-[10px] font-mono font-bold text-white border border-white shadow-sm">
              3
            </span>
          </button>

          {/* User Profile */}
          <div className="hidden md:flex items-center gap-2.5 rounded-lg border border-(--color-border-primary) bg-white px-2.5 py-1.5 shadow-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-(--color-navy-800) border border-(--color-navy-700) text-[11px] font-mono font-bold text-(--color-amber-400)">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="leading-none">
              <p className="text-sm font-semibold text-(--color-text-primary) leading-none">{user?.full_name || 'Operator'}</p>
              <p className="font-mono text-[10px] text-(--color-amber-600) leading-none">{(user?.role ? getRoleLabel(user.role as UserRole) : 'Police Officer').toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}