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
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { getRoleLabel } from '../../config/roles';
import type { UserRole } from '../../types/user';

const navGroups = [
  {
    label: 'INTELLIGENCE',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/crima', icon: Brain, label: 'CRIMA AI' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/heatmap', icon: Map, label: 'Heat Maps' },
    ],
  },
  {
    label: 'INVESTIGATION',
    items: [
      { to: '/cases', icon: FolderSearch, label: 'Case Explorer' },
      { to: '/evidence', icon: FileSearch, label: 'Evidence' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/reports', icon: FileText, label: 'Reports' },
    ],
  },
];

const adminItems = [
  { to: '/admin/users', icon: Users, label: 'Manage Users' },
  { to: '/admin/audit', icon: Shield, label: 'Audit Log' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function NavItem({
  to,
  icon: Icon,
  label,
  collapsed,
  end,
  onClick,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  end?: boolean;
  onClick: () => void;
}) {
  if (collapsed) {
    return (
      <NavLink
        to={to}
        end={end}
        onClick={onClick}
        title={label}
        className={({ isActive }) =>
          `group relative flex h-9 w-9 items-center justify-center rounded-lg mx-auto transition-colors duration-200 ${
            isActive
              ? 'bg-[var(--color-intel-blue-50)] text-[var(--color-intel-blue-600)] border border-[var(--color-intel-blue-200)] shadow-sm'
              : 'text-white/70 hover:bg-white/[0.07] hover:text-white border border-transparent'
          }`
        }
      >
        <Icon size={18} className="shrink-0" aria-hidden="true" />
        <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-[#0F172A] px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
          {label}
        </span>
      </NavLink>
    );
  }
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
          isActive
            ? 'bg-[var(--color-intel-blue-50)] text-[var(--color-intel-blue-600)] border border-[var(--color-intel-blue-200)] shadow-sm'
            : 'text-[var(--color-text-sidebar)] hover:bg-[var(--color-navy-800)] hover:text-white border border-transparent hover:border-[var(--color-border-sidebar)]'
        }`
      }
    >
      <Icon
        size={18}
        className="shrink-0 text-[var(--color-slate-400)] group-hover:text-[var(--color-slate-300)] group-[.bg-[var(--color-intel-blue-50)]]:text-[var(--color-intel-blue-600)]"
        aria-hidden="true"
      />
      <span className="truncate text-[13px] font-medium whitespace-nowrap overflow-hidden">{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      setMobileOpen(false);
    }
  };

  const ToggleButton = (
    <button
      onClick={onToggle}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[var(--color-navy-800)] text-slate-400 hover:bg-white/[0.08] hover:text-white hover:border-white/20 transition-colors duration-200"
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-expanded={!collapsed}
    >
      {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
    </button>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop sidebar - flex item */}
      <aside
        className={`texture-sidebar hidden lg:flex h-screen shrink-0 flex-col bg-[var(--color-bg-sidebar)] text-white transition-[width] duration-[260ms] ease-in-out will-change-[width] [transform:translateZ(0)] ${
          collapsed ? 'w-[72px]' : 'w-[300px]'
        }`}
        aria-label="Main navigation"
      >
        <div className="hazard-stripe shrink-0" aria-hidden="true" />

        {/* Header - fixed */}
        {collapsed ? (
          <div className="flex h-14 shrink-0 items-center justify-center border-b border-[var(--color-border-sidebar)] bg-[var(--color-bg-sidebar-elevated)] overflow-hidden transition-all duration-260 ease-in-out">
            {ToggleButton}
          </div>
        ) : (
          <div className="relative flex h-16 shrink-0 items-center justify-center border-b border-[var(--color-border-sidebar)] bg-[var(--color-bg-sidebar-elevated)] px-3 overflow-hidden transition-all duration-260 ease-in-out">
            <NavLink to="/" className="flex items-center justify-center" aria-label="CrimeIntel Home" onClick={handleNavClick}>
              <img src="/Crime-Icon.png" alt="CrimeIntel" className="h-14 w-auto object-contain drop-shadow-md" />
            </NavLink>
            <div className="absolute right-3">{ToggleButton}</div>
          </div>
        )}

        {/* Navigation - flex:1 scroll only if necessary */}
        <nav
          className="flex-1 overflow-y-auto py-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20"
          aria-label="Main navigation"
        >
          <div className={`flex flex-col ${collapsed ? 'gap-3 px-1.5' : 'gap-4 px-2'}`}>
            {navGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                {!collapsed && (
                  <span className="label-industrial flex items-center gap-2 px-2 py-1">
                    <span className="h-px flex-1 bg-[var(--color-border-sidebar)]" />
                    {group.label}
                    <span className="h-px flex-1 bg-[var(--color-border-sidebar)]" />
                  </span>
                )}
                <ul className={`flex flex-col ${collapsed ? 'gap-1.5' : 'gap-1'}`}>
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavItem to={item.to} icon={item.icon} label={item.label} collapsed={collapsed} end={item.to === '/'} onClick={handleNavClick} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {isAdmin && (
              <div className="flex flex-col gap-1">
                {!collapsed && (
                  <span className="label-industrial flex items-center gap-2 px-2 py-1 pt-2">
                    <span className="h-px flex-1 bg-[var(--color-border-sidebar)]" />
                    ADMIN
                    <span className="h-px flex-1 bg-[var(--color-border-sidebar)]" />
                  </span>
                )}
                {collapsed && <div className="mx-2 h-px bg-[var(--color-border-sidebar)]" aria-hidden="true" />}
                <ul className={`flex flex-col ${collapsed ? 'gap-1.5' : 'gap-1'}`}>
                  {adminItems.map((item) => (
                    <li key={item.to}>
                      <NavItem to={item.to} icon={item.icon} label={item.label} collapsed={collapsed} onClick={handleNavClick} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-1">
              {!collapsed && (
                <span className="label-industrial flex items-center gap-2 px-2 py-1 pt-2">
                  <span className="h-px flex-1 bg-[var(--color-border-sidebar)]" />
                  System
                  <span className="h-px flex-1 bg-[var(--color-border-sidebar)]" />
                </span>
              )}
              {collapsed && <div className="mx-2 h-px bg-[var(--color-border-sidebar)]" aria-hidden="true" />}
              <ul className={`flex flex-col ${collapsed ? 'gap-1.5' : 'gap-1'}`}>
                <li>
                  <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} onClick={handleNavClick} />
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* User Profile - fixed bottom */}
        <div className="shrink-0 border-t border-[var(--color-border-sidebar)] bg-[var(--color-navy-900)] p-2.5">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent mb-2.5" aria-hidden="true" />
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-navy-950)] border border-[var(--color-border-sidebar)] text-[11px] font-mono-industrial font-bold text-[var(--color-amber-400)]"
                title={user?.full_name || 'Operator'}
              >
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={logout}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-[var(--color-navy-800)] text-slate-400 hover:text-white hover:bg-white/[0.06] hover:border-white/10 transition-colors"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-sidebar)] bg-[var(--color-navy-800)] p-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-navy-950)] border border-[var(--color-border-sidebar)] text-[11px] font-mono-industrial font-bold text-[var(--color-amber-400)]">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-white leading-none">{user?.full_name || 'Operator'}</p>
                <p className="truncate font-mono-industrial text-[10px] text-[var(--color-amber-400)] leading-none mt-1">
                  {(user?.role ? getRoleLabel(user.role as UserRole) : 'Police Officer').toUpperCase()} • ONLINE
                </p>
              </div>
              <button
                onClick={logout}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent text-slate-500 hover:text-red-400 hover:bg-red-950/30 hover:border-red-900/50 transition-colors"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar - overlay */}
      <aside
        className={`texture-sidebar fixed inset-y-0 left-0 z-50 flex h-screen w-[300px] flex-col bg-[var(--color-bg-sidebar)] text-white transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="hazard-stripe shrink-0" aria-hidden="true" />
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border-sidebar)] bg-[var(--color-bg-sidebar-elevated)] px-3">
          <NavLink to="/" className="flex items-center gap-2" aria-label="CrimeIntel Home" onClick={handleNavClick}>
            <img src="/Crime-Icon.png" alt="CrimeIntel" className="h-12 w-auto object-contain" />
          </NavLink>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[var(--color-navy-800)] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10">
          <div className="flex flex-col gap-4 px-2">
            {navGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                <span className="label-industrial flex items-center gap-2 px-2 py-1">
                  <span className="h-px flex-1 bg-[var(--color-border-sidebar)]" />
                  {group.label}
                  <span className="h-px flex-1 bg-[var(--color-border-sidebar)]" />
                </span>
                <ul className="flex flex-col gap-1">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-[var(--color-intel-blue-50)] text-[var(--color-intel-blue-600)] border border-[var(--color-intel-blue-200)] shadow-sm'
                              : 'text-[var(--color-text-sidebar)] hover:bg-[var(--color-navy-800)] hover:text-white border border-transparent'
                          }`
                        }
                      >
                        <item.icon size={18} className="shrink-0" aria-hidden="true" />
                        <span className="truncate text-[13px] font-medium">{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {isAdmin && (
              <div className="flex flex-col gap-1">
                <span className="label-industrial flex items-center gap-2 px-2 py-1 pt-2">
                  <span className="h-px flex-1 bg-[var(--color-border-sidebar)]" />
                  ADMIN
                  <span className="h-px flex-1 bg-[var(--color-border-sidebar)]" />
                </span>
                <ul className="flex flex-col gap-1">
                  {adminItems.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-[var(--color-intel-blue-50)] text-[var(--color-intel-blue-600)] border border-[var(--color-intel-blue-200)] shadow-sm'
                              : 'text-[var(--color-text-sidebar)] hover:bg-[var(--color-navy-800)] hover:text-white border border-transparent'
                          }`
                        }
                      >
                        <item.icon size={18} className="shrink-0" aria-hidden="true" />
                        <span className="truncate text-[13px] font-medium">{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="label-industrial flex items-center gap-2 px-2 py-1 pt-2">
                <span className="h-px flex-1 bg-[var(--color-border-sidebar)]" />
                System
                <span className="h-px flex-1 bg-[var(--color-border-sidebar)]" />
              </span>
              <ul className="flex flex-col gap-1">
                <li>
                  <NavLink
                    to="/settings"
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[var(--color-intel-blue-50)] text-[var(--color-intel-blue-600)] border border-[var(--color-intel-blue-200)] shadow-sm'
                          : 'text-[var(--color-text-sidebar)] hover:bg-[var(--color-navy-800)] hover:text-white border border-transparent'
                      }`
                    }
                  >
                    <Settings size={18} className="shrink-0" aria-hidden="true" />
                    <span className="truncate text-[13px] font-medium">Settings</span>
                  </NavLink>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div className="shrink-0 border-t border-[var(--color-border-sidebar)] bg-[var(--color-navy-900)] p-3">
          <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-sidebar)] bg-[var(--color-navy-800)] p-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-navy-950)] border border-[var(--color-border-sidebar)] text-[11px] font-mono-industrial font-bold text-[var(--color-amber-400)]">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-white leading-none">{user?.full_name || 'Operator'}</p>
              <p className="truncate font-mono-industrial text-[10px] text-[var(--color-amber-400)] leading-none mt-1">
                {(user?.role ? getRoleLabel(user.role as UserRole) : 'Police Officer').toUpperCase()} • ONLINE
              </p>
            </div>
            <button
              onClick={logout}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile hamburger - visible only on small screens, outside sidebar */}
      <button
        onClick={() => setMobileOpen(true)}
        className={`fixed top-3 left-3 z-30 flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 lg:hidden ${mobileOpen ? 'hidden' : 'flex'}`}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>
    </>
  );
}
