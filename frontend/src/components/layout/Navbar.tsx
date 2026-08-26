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
  const title = routeTitles[basePath] || 'CrimeIntel';

  return (
    <header
      className="texture-navbar fixed right-0 top-0 z-20 flex h-[60px] items-center bg-[#F8FAFC]/90 backdrop-blur-md border-b border-[#E2E8F0] transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      <div className="hazard-stripe absolute inset-x-0 top-0 h-[3px] opacity-60" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-[#E2E8F0]" />
      <div className="flex w-full items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <button onClick={onToggleSidebar} className="rounded-[6px] border border-[#E2E8F0] bg-white p-2 text-slate-500 hover:border-[#0EA5E9] hover:text-[#0EA5E9] transition-colors lg:hidden">
            <Menu size={18} />
          </button>
          {basePath !== '/' && <BackButton iconOnly fallbackTo="/" />}
          <div>
            <h2 className="font-mono-industrial text-[13px] font-bold tracking-[0.14em] text-[#0F172A] flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse" />
              {title.toUpperCase()}
              <span className="hidden sm:inline font-mono-industrial text-[10px] font-normal tracking-widest text-slate-400">• SECTOR {basePath || '/'}</span>
            </h2>
            <div className="mt-0.5 h-[2px] w-12 rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#F59E0B]" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-[6px] border border-[#E2E8F0] bg-white px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono-industrial text-[11px] text-slate-600">SYS ONLINE</span>
            <span className="font-mono-industrial text-[10px] text-slate-400">12:42 IST</span>
          </div>
          <button className="group relative rounded-[8px] border border-[#E2E8F0] bg-white p-2 text-slate-500 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-colors">
            <Bell size={18} />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-mono-industrial font-bold text-white border border-white shadow-sm">3</span>
          </button>
          <div className="hidden md:flex items-center gap-2.5 rounded-[8px] border border-[#E2E8F0] bg-white px-2.5 py-1.5 shadow-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#0F172A] border border-[#1E293B] text-[11px] font-mono-industrial font-bold text-amber-400">{user?.display_name?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div className="leading-none">
              <p className="text-[12px] font-semibold text-[#0F172A] leading-none">{user?.display_name || 'Operator'}</p>
              <p className="font-mono-industrial text-[10px] text-amber-600 leading-none">{(user?.role || 'OFFICER').toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
