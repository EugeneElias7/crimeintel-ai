import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  // Esc key navigates back (unless already handled, e.g. closing a modal)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const idx = window.history.state?.idx;
      if (typeof idx === 'number' && idx > 0) {
        navigate(-1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  return (
    <div className="texture-app relative flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/60">
      {/* motive texture overlays sit behind content via .texture-app ::before/::after */}
      <div className="pointer-events-none absolute -top-32 right-[15%] z-0 h-96 w-96 rounded-full bg-gradient-to-br from-blue-300/30 to-indigo-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-[20%] z-0 h-80 w-80 rounded-full bg-gradient-to-tr from-cyan-200/25 to-violet-200/20 blur-3xl" />
      {/* faint forensic rule line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-indigo-200/50 to-transparent" />
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`relative z-10 flex flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} sidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 overflow-y-auto pt-16">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
