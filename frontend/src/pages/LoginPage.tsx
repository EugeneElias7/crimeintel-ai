import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import PageTransition from '../components/ui/PageTransition';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { fromRegistration?: boolean; message?: string } | null;
    if (state?.fromRegistration) {
      setSuccess(state.message || 'Account created successfully! Please sign in to continue.');
      setTimeout(() => setSuccess(null), 5000);
    }
  }, [location]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      await login(data.email, data.password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          status?: number;
          data?: { detail?: string | { message?: string; user_id?: number; account_status?: string } };
        };
        message?: string;
      };

      if (axiosError.response?.status === 401) {
        setError('Invalid credentials. Please check your email and password.');
      } else if (axiosError.response?.status === 403) {
        const detail = axiosError.response.data?.detail || '';
        // Handle new response format with user_id
        if (typeof detail === 'object' && detail.user_id) {
          if (detail.account_status === 'PENDING_DOCUMENT' || detail.account_status === 'PENDING_VERIFICATION') {
            navigate('/verify-identity', { replace: true, state: { userId: detail.user_id } });
            return;
          }
        }
        // Handle old string format
        const detailStr = typeof detail === 'string' ? detail : JSON.stringify(detail);
        if (detailStr.toLowerCase().includes('pending verification')) {
          // We need to get user_id from email - try to extract from error or redirect
          navigate('/verify-identity', { replace: true });
          return;
        }
        if (detailStr.toLowerCase().includes('pending document')) {
          navigate('/verify-identity', { replace: true });
          return;
        }
        setError('Access denied. Please contact your administrator.');
      } else if (axiosError.response?.status === 429) {
        setError('Too many login attempts. Please wait a moment and try again.');
      } else if (axiosError.message?.includes('Network Error') || axiosError.response?.status === 405) {
        setError('Unable to reach authentication server. Please try again later.');
      } else {
        setError('Unable to sign in. Please try again.');
      }
    }
  };

  return (
    <PageTransition className="texture-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-(--color-navy-950) px-4 py-10">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute -left-40 -top-40 z-0 h-120 w-120 animate-[float-orb_16s_ease-in-out_infinite] rounded-full bg-linear-to-br from-blue-600/40 via-indigo-600/25 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 z-0 h-136 w-136 animate-[float-orb_20s_ease-in-out_infinite_reverse] rounded-full bg-linear-to-tr from-violet-600/35 via-fuchsia-500/15 to-cyan-500/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/4 z-0 h-72 w-72 -translate-x-1/2 animate-pulse rounded-full bg-cyan-400/10 blur-3xl" />

      {/* Blueprint grid overlay + forensic watermark */}
      <div className="bg-grid pointer-events-none absolute inset-0 z-0" />

      <div className="relative w-full max-w-md">
        {/* Industrial steel login card – rivets + hazard stripe */}
        <div className="relative overflow-hidden rounded-lg border border-(--color-border-sidebar) bg-(--color-navy-900)/85 backdrop-blur-xl shadow-[0_16px_48px_rgba(2,6,23,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] animate-fade-up">
          <div className="rivet rivet-tl" /> <div className="rivet rivet-tr" /> <div className="rivet rivet-bl" /> <div className="rivet rivet-br" />
          <div className="hazard-stripe opacity-80" />
<div className="p-6">
            {/* Brand – clean and prominent - moved inside card */}
            <div className="animate-scale-in text-center mb-2">
              <img src="/Crime-Icon.png" alt="CrimeIntel" className="mx-auto w-40 drop-shadow-2xl" />
            </div>
            <h2 className="mb-1 text-center text-xl font-semibold text-white tracking-tight">Sign in to CrimeIntel</h2>
            <p className="mb-1 text-center text-sm text-slate-400">Sign in with your authorized account to continue</p>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2.5 text-sm text-red-300 backdrop-blur-sm">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2.5 text-sm text-emerald-300 backdrop-blur-sm animate-fade-in">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Official Email Address
                </label>
                <div className="relative group">
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors duration-300 group-focus-within:text-(--color-accent-primary)"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,12 2,12" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className={`w-full rounded-lg border border-white bg-white px-4 py-3 pl-10 text-sm text-black placeholder-slate-500 focus:outline-none focus:border-(--color-accent-primary) focus:ring-2 focus:ring-(--color-accent-primary)/20 ${errors.email ? 'border-red-400/60' : ''}`}
                    placeholder="name@department.gov.in"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="relative group">
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors duration-300 group-focus-within:text-(--color-accent-primary)"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                    className={`w-full rounded-lg border border-white bg-white px-4 py-3 pl-10 pr-10 text-sm text-black placeholder-slate-500 focus:outline-none focus:border-(--color-accent-primary) focus:ring-2 focus:ring-(--color-accent-primary)/20 ${errors.password ? 'border-red-400/60' : ''}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-(--color-accent-primary) py-3 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.4)] hover:bg-(--color-accent-primary-hover) transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-(--color-accent-primary) focus:ring-offset-2 focus:ring-offset-(--color-navy-900) disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0"
                      />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in to CrimeIntel'
                )}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-(--color-accent-primary) hover:underline hover:underline-offset-2"
              >
                Forgot Password?
              </Link>
              <Link
                to="/register"
                className="relative text-sm font-medium text-slate-400 hover:text-white transition-all duration-300"
              >
                Create an account
                <span className="absolute -top-1 -right-4 h-3 w-3 rounded-full bg-linear-to-br from-(--color-accent-primary) to-(--color-amber-500) opacity-0 translate-x-1 transition-all duration-300 hover:opacity-100 hover:translate-x-0" aria-hidden="true" />
              </Link>
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">
              © 2026 CrimeIntel · Authorized Investigation Platform
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}