import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import PageTransition from '../components/ui/PageTransition';
import { confirmResetPassword } from '../services/authService';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
      setTokenValid(false);
    } else {
      setTokenValid(true);
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await confirmResetPassword(token, data.password, data.confirmPassword);
      setSuccess('Password has been reset successfully. Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { replace: true, state: { message: 'Password reset successful. Please sign in with your new password.' } });
      }, 2000);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          status?: number;
          data?: { detail?: string };
        };
        message?: string;
      };

      if (axiosError.response?.status === 400) {
        setError(axiosError.response.data?.detail || 'Invalid or expired reset token');
      } else if (axiosError.message?.includes('Network Error')) {
        setError('Unable to reach authentication server. Please try again later.');
      } else {
        setError('Unable to reset password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tokenValid) {
    return (
      <PageTransition className="texture-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-(--color-navy-950) px-4 py-10">
        <div className="pointer-events-none absolute -left-40 -top-40 z-0 h-120 w-120 animate-[float-orb_16s_ease-in-out_infinite] rounded-full bg-linear-to-br from-blue-600/40 via-indigo-600/25 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -right-32 z-0 h-136 w-136 animate-[float-orb_20s_ease-in-out_infinite_reverse] rounded-full bg-linear-to-tr from-violet-600/35 via-fuchsia-500/15 to-cyan-500/25 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/4 z-0 h-72 w-72 -translate-x-1/2 animate-pulse rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="bg-grid pointer-events-none absolute inset-0 z-0" />

        <div className="relative w-full max-w-md">
          <div className="relative overflow-hidden rounded-lg border border-(--color-border-sidebar) bg-(--color-navy-900)/85 backdrop-blur-xl shadow-[0_16px_48px_rgba(2,6,23,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] animate-fade-up">
            <div className="rivet rivet-tl" /> <div className="rivet rivet-tr" /> <div className="rivet rivet-bl" /> <div className="rivet rivet-br" />
            <div className="hazard-stripe opacity-80" />
            <div className="p-6 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h2 className="mb-2 text-xl font-semibold text-white">Invalid Reset Link</h2>
              <p className="mb-6 text-sm text-slate-400">{error || 'This password reset link is invalid or has expired.'}</p>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-2 text-sm font-medium text-(--color-accent-primary) hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Request New Reset Link
              </Link>
              <p className="mt-4 text-center text-xs text-slate-500">
                © 2026 CrimeIntel · Authorized Investigation Platform
              </p>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="texture-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-(--color-navy-950) px-4 py-10">
      <div className="pointer-events-none absolute -left-40 -top-40 z-0 h-120 w-120 animate-[float-orb_16s_ease-in-out_infinite] rounded-full bg-linear-to-br from-blue-600/40 via-indigo-600/25 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 z-0 h-136 w-136 animate-[float-orb_20s_ease-in-out_infinite_reverse] rounded-full bg-linear-to-tr from-violet-600/35 via-fuchsia-500/15 to-cyan-500/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/4 z-0 h-72 w-72 -translate-x-1/2 animate-pulse rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="bg-grid pointer-events-none absolute inset-0 z-0" />

      <div className="relative w-full max-w-md">
        <div className="relative overflow-hidden rounded-lg border border-(--color-border-sidebar) bg-(--color-navy-900)/85 backdrop-blur-xl shadow-[0_16px_48px_rgba(2,6,23,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] animate-fade-up">
          <div className="rivet rivet-tl" /> <div className="rivet rivet-tr" /> <div className="rivet rivet-bl" /> <div className="rivet rivet-br" />
          <div className="hazard-stripe opacity-80" />
          <div className="p-6">
            <div className="animate-scale-in text-center mb-2">
              <img src="/Crime-Icon.png" alt="CrimeIntel" className="mx-auto w-40 drop-shadow-2xl" />
            </div>
            <h2 className="mb-1 text-center text-xl font-semibold text-white tracking-tight">Set New Password</h2>
            <p className="mb-6 text-center text-sm text-slate-400">Enter your new password below</p>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2.5 text-sm text-red-300 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
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
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                  New Password
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
                    autoComplete="new-password"
                    {...register('password')}
                    className={`w-full rounded-lg border border-white bg-white px-4 py-3 pl-10 pr-10 text-sm text-black placeholder-slate-500 focus:outline-none focus:border-(--color-accent-primary) focus:ring-2 focus:ring-(--color-accent-primary)/20 ${errors.password ? 'border-red-400/60' : ''}`}
                    placeholder="Enter new password (min 8 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div className="mt-4">
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Confirm New Password
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
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    className={`w-full rounded-lg border border-white bg-white px-4 py-3 pl-10 pr-10 text-sm text-black placeholder-slate-500 focus:outline-none focus:border-(--color-accent-primary) focus:ring-2 focus:ring-(--color-accent-primary)/20 ${errors.confirmPassword ? 'border-red-400/60' : ''}`}
                    placeholder="Confirm new password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-(--color-accent-primary) py-3 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.4)] hover:bg-(--color-accent-primary-hover) transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-(--color-accent-primary) focus:ring-offset-2 focus:ring-offset-(--color-navy-900) disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm font-medium text-(--color-accent-primary) hover:underline hover:underline-offset-2"
              >
                Back to Login
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