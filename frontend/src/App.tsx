import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Spinner from './components/ui/Spinner';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CRIMAIChatPage = lazy(() => import('./pages/CRIMAIChatPage'));
const CaseListPage = lazy(() => import('./pages/CaseListPage'));
const CaseDetailPage = lazy(() => import('./pages/CaseDetailPage'));
const EvidencePage = lazy(() => import('./pages/EvidencePage'));
const EvidenceGalleryPage = lazy(() => import('./pages/EvidenceGalleryPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const HeatMapPage = lazy(() => import('./pages/HeatMapPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminAuditPage = lazy(() => import('./pages/AdminAuditPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner size="lg" text="Loading..." />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="crima" element={<CRIMAIChatPage />} />
                  <Route path="cases" element={<CaseListPage />} />
                  <Route path="cases/:id" element={<CaseDetailPage />} />
                  <Route path="evidence" element={<EvidencePage />} />
                  <Route path="evidence/:caseId" element={<EvidenceGalleryPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="heatmap" element={<HeatMapPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route element={<ProtectedRoute requiredRole="admin" />}>
                    <Route path="admin/users" element={<AdminUsersPage />} />
                    <Route path="admin/audit" element={<AdminAuditPage />} />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
