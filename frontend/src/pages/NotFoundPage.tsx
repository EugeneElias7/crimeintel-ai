import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import BackButton from '../components/ui/BackButton';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
          <Shield className="h-10 w-10 text-gray-400" />
        </div>
        <h1 className="text-7xl font-bold text-gray-300">404</h1>
        <p className="mt-4 text-xl font-semibold text-gray-700">
          Page Not Found
        </p>
        <p className="mt-2 text-sm text-gray-500">
          The page you are looking for does not exist.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <BackButton fallbackTo="/" />
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
