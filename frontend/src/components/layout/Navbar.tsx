import { useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../ui/BackButton';

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

export default function Navbar({ onToggleSidebar, sidebarCollapsed }: NavbarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const basePath = '/' + (location.pathname.split('/')[1] || '');
  const title = routeTitles[basePath] || 'CrimeIntel AI';

  return (
    <header
      className="fixed right-0 top-0 z-20 flex h-16 items-center border-b border-gray-200 bg-white transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      <div className="flex w-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <Menu size={20} />
          </button>
          {basePath !== '/' && <BackButton iconOnly fallbackTo="/" />}
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <Bell size={20} />
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
              {user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-700">{user?.display_name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.role || ''}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
