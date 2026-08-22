import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Brain,
  FolderSearch,
  FileSearch,
  BarChart3,
  Map,
  FileText,
  Shield,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/crima', icon: Brain, label: 'CRIMA AI' },
  { to: '/cases', icon: FolderSearch, label: 'Case Explorer' },
  { to: '/evidence', icon: FileSearch, label: 'Evidence' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/heatmap', icon: Map, label: 'Heat Maps' },
  { to: '/reports', icon: FileText, label: 'Reports' },
];

const adminItems = [
  { to: '/admin/users', icon: Users, label: 'Manage Users' },
  { to: '/admin/audit', icon: Shield, label: 'Audit Log' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl shadow-blue-950/40 transition-all duration-300 before:absolute before:right-0 before:top-0 before:h-full before:w-px before:bg-gradient-to-b before:from-transparent before:via-blue-500/40 before:to-transparent ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="relative flex h-16 items-center px-4">
        {!collapsed ? (
          <h1 className="text-lg font-bold tracking-wide">
            <span className="text-gradient-light">Crime</span>Intel{' '}
            <span className="text-gradient-light">AI</span>
          </h1>
        ) : (
          <span className="mx-auto text-lg font-bold text-gradient-light">CI</span>
        )}
        <button
          onClick={onToggle}
          className={`absolute right-2 rounded p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white ${
            collapsed ? 'hidden' : ''
          }`}
        >
          <ChevronLeft size={18} />
        </button>
      </div>
      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mb-2 rounded p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronRight size={18} />
        </button>
      )}

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600/90 to-violet-600/70 text-white shadow-lg shadow-blue-950/40'
                      : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  } ${collapsed ? 'justify-center border-l-0' : ''}`
                }
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}

          {isAdmin && (
            <>
              <li className={`px-3 pt-4 ${collapsed ? 'text-center' : ''}`}>
                {!collapsed && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Admin
                  </span>
                )}
              </li>
              {adminItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 via-indigo-600/90 to-violet-600/70 text-white shadow-lg shadow-blue-950/40'
                          : 'text-slate-400 hover:bg-white/10 hover:text-white'
                      } ${collapsed ? 'justify-center border-l-0' : ''}`
                    }
                  >
                    <item.icon size={20} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </>
          )}

          <li className={`px-3 pt-4 ${collapsed ? 'text-center' : ''}`}>
            {!collapsed && (
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                System
              </span>
            )}
          </li>
          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600/90 to-violet-600/70 text-white shadow-lg shadow-blue-950/40'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                } ${collapsed ? 'justify-center border-l-0' : ''}`
              }
            >
              <Settings size={20} />
              {!collapsed && <span>Settings</span>}
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="p-4">
        <div className="mb-3 gradient-line opacity-40" />
        {collapsed ? (
          <button
            onClick={logout}
            className="mx-auto flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 text-sm font-medium ring-2 ring-white/10 ring-offset-2 ring-offset-slate-950">
              {user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium">{user?.display_name || 'User'}</p>
              <p className="truncate text-xs text-slate-400">{user?.role || ''}</p>
            </div>
            <button
              onClick={logout}
              className="rounded p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
