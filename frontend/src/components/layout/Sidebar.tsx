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
      className={`texture-sidebar fixed left-0 top-0 z-30 flex h-screen flex-col bg-[#020617] text-white shadow-2xl shadow-black/60 transition-all duration-500 ease-out-expo before:absolute before:right-0 before:top-0 before:h-full before:w-px before:bg-[#1E293B] ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      style={{
        transform: collapsed ? 'translateX(0)' : 'translateX(0)',
        boxShadow: collapsed
          ? '0 0 30px -10px rgba(30, 58, 138, 0.5), 0 0 60px -20px rgba(99, 102, 241, 0.3)'
          : '0 0 40px -10px rgba(30, 58, 138, 0.6), 0 0 80px -20px rgba(99, 102, 241, 0.4)',
      }}
    >
      {/* Industrial hazard stripe */}
      <div className="hazard-stripe relative z-10 shrink-0" />
      {/* Industrial logo plate – steel with rivets */}
      <div className="relative z-10 flex h-[68px] items-center px-3 border-b border-[#1E293B] bg-gradient-to-b from-[#0F172A] to-[#020617]">
        <div className="rivet rivet-tl" /> <div className="rivet rivet-tr" />
        <div className="flex-1 flex items-center">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#0F172A] border border-[#1E293B] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.5)]">
                <img src="/logo-icon.svg" alt="CrimeIntel AI" className="h-8 w-8 object-contain" />
                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#F59E0B] border border-[#020617] shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-pulse" />
              </div>
              <div className="leading-none">
                <img src="/logo.svg" alt="CrimeIntel AI" className="h-8 w-auto object-contain brightness-110" />
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
                  <span className="font-mono-industrial text-[10px] leading-none text-emerald-400">SYSTEM SECURE</span>
                  <span className="font-mono-industrial text-[9px] text-slate-500">• KSP COMMAND</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#0F172A] border border-[#1E293B] shadow-lg">
                <img src="/logo-icon.svg" alt="CI" className="h-7 w-7 object-contain" />
              </div>
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#F59E0B] border border-[#020617]" />
            </div>
          )}
        </div>
        {/* Industrial toggle – steel */}
        <button
          onClick={onToggle}
          className={`absolute right-1.5 rounded-[6px] border border-[#1E293B] bg-[#0F172A] p-1.5 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:bg-[#1E293B] hover:text-white hover:border-[#334155] ${collapsed ? 'hidden' : ''}`}
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
          {navItems.map((item, index) => (
            <li key={item.to} style={{ transitionDelay: `${collapsed ? 0 : index * 30}ms` }}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#1E293B] text-white border border-[#334155] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] border-l-[3px] border-l-amber-500'
                      : 'text-slate-400 hover:bg-[#0F172A] hover:text-slate-100 border border-transparent hover:border-[#1E293B]'
                  } ${collapsed ? 'justify-center' : ''}`
                }
              >
                <item.icon size={18} className={`shrink-0 transition-colors ${collapsed ? '' : 'group-[.border-l-amber-500]:text-amber-400'}`} />
                {!collapsed && (
                  <span className="font-mono-industrial tracking-wide text-[12px]">
                    {item.label}
                  </span>
                )}
                {collapsed && <span className="sr-only">{item.label}</span>}
              </NavLink>
            </li>
          ))}

          {isAdmin && (
            <>
              <li className={`px-3 pt-5 ${collapsed ? 'text-center' : ''}`} style={{ transitionDelay: `${collapsed ? 0 : navItems.length * 30}ms` }}>
                {!collapsed && (
                  <span className="label-industrial flex items-center gap-2">
                    <span className="h-px flex-1 bg-[#1E293B]" /> Admin <span className="h-px flex-1 bg-[#1E293B]" />
                  </span>
                )}
              </li>
              {adminItems.map((item, index) => (
                <li key={item.to} style={{ transitionDelay: `${collapsed ? 0 : (navItems.length + 1 + index) * 30}ms` }}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-[#1E293B] text-white border border-[#334155] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] border-l-[3px] border-l-amber-500'
                          : 'text-slate-400 hover:bg-[#0F172A] hover:text-slate-100 border border-transparent hover:border-[#1E293B]'
                      } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <item.icon size={18} className="shrink-0" />
                    {!collapsed && <span className="font-mono-industrial tracking-wide text-[12px]">{item.label}</span>}
                    {collapsed && <span className="sr-only">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </>
          )}

          <li className={`px-3 pt-5 ${collapsed ? 'text-center' : ''}`} style={{ transitionDelay: `${collapsed ? 0 : (navItems.length + (isAdmin ? adminItems.length + 1 : 0) + 1) * 30}ms` }}>
            {!collapsed && (
              <span className="label-industrial flex items-center gap-2">
                <span className="h-px flex-1 bg-[#1E293B]" /> System <span className="h-px flex-1 bg-[#1E293B]" />
              </span>
            )}
          </li>
          <li style={{ transitionDelay: `${collapsed ? 0 : (navItems.length + (isAdmin ? adminItems.length + 1 : 0) + 2) * 30}ms` }}>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1E293B] text-white border border-[#334155] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] border-l-[3px] border-l-amber-500'
                    : 'text-slate-400 hover:bg-[#0F172A] hover:text-slate-100 border border-transparent hover:border-[#1E293B]'
                } ${collapsed ? 'justify-center' : ''}`}
            >
              <Settings size={18} className="shrink-0" />
              {!collapsed && <span className="font-mono-industrial tracking-wide text-[12px]">Settings</span>}
              {collapsed && <span className="sr-only">Settings</span>}
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="relative p-3 border-t border-[#1E293B] bg-[#0A1020]">
        <div className="rivet rivet-tl !top-2 !left-2 !w-1.5 !h-1.5" /> <div className="rivet rivet-tr !top-2 !right-2 !w-1.5 !h-1.5" />
        <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/30 to-transparent mb-3" />
        {collapsed ? (
          <button
            onClick={logout}
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#1E293B] border border-[#334155] text-slate-400 hover:text-white hover:border-amber-500/50 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-[8px] border border-[#1E293B] bg-[#0F172A] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#020617] border border-[#1E293B] text-[11px] font-mono-industrial font-bold text-amber-400">
              {user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-[12px] font-semibold text-slate-100 leading-none">{user?.display_name || 'Operator'}</p>
              <p className="truncate font-mono-industrial text-[10px] text-amber-400/80">{(user?.role || 'OFFICER').toUpperCase()} • ONLINE</p>
            </div>
            <button onClick={logout} className="rounded-[6px] p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 transition-colors" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}