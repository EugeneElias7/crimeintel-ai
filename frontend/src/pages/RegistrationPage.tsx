import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { register as registerApi } from '../services/authService';
import PageTransition from '../components/ui/PageTransition';

const registerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  employee_id: z.string().min(1, 'Employee ID is required'),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setSuccess(null);
    try {
      const response = await registerApi(data);
      navigate('/verify-identity', { replace: true, state: { userId: response.user_id, message: response.message } });
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          status?: number;
          data?: { detail?: string };
        };
        message?: string;
        code?: string;
      };

      if (axiosError.response?.status === 409) {
        setError(axiosError.response.data?.detail || 'User already exists. Please sign in.');
      } else if (axiosError.response?.status === 400) {
        const detail = axiosError.response.data?.detail || '';
        if (detail.toLowerCase().includes('already exists') || detail.toLowerCase().includes('duplicate')) {
          setError('User already exists. Please sign in.');
        } else {
          setError('Registration failed. Please check your details.');
        }
      } else if (axiosError.message?.includes('Network Error') || axiosError.code === 'ECONNREFUSED') {
        setError('Unable to reach registration server. Please ensure the backend is running on port 8000.');
      } else if (axiosError.response?.status === 502 || axiosError.response?.status === 503 || axiosError.response?.status === 504) {
        setError('Backend server unavailable. Please start the backend server (port 8000).');
      } else if (axiosError.response?.status) {
        setError(`Registration failed (${axiosError.response.status}): ${axiosError.response.data?.detail || 'Please try again.'}`);
      } else {
        setError('Unable to register. Please check your connection and try again.');
      }
    }
  };

  const inputIcon = (icon: React.ReactNode) => (
    <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors duration-300 group-focus-within:text-(--color-accent-primary)">
      {icon}
    </div>
  );

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
            <h2 className="mb-1 text-center text-xl font-semibold text-white tracking-tight">Create an Authorized Account</h2>
            <p className="mb-1 text-center text-sm text-slate-400">Register for access to the CrimeIntel investigation platform</p>

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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Full Name
                </label>
                <div className="relative group">
                  {inputIcon(
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  )}
                  <input
                    id="full_name"
                    type="text"
                    autoComplete="name"
                    placeholder="Officer Arun Kumar"
                    {...register('full_name')}
                    className={`w-full rounded-lg border border-white bg-white px-4 py-3 pl-10 text-sm text-black placeholder-slate-500 focus:outline-none focus:border-(--color-accent-primary) focus:ring-2 focus:ring-(--color-accent-primary)/20 ${errors.full_name ? 'border-red-400/60' : ''}`}
                  />
                  {errors.full_name && <p className="mt-1.5 text-xs text-red-400">{errors.full_name.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Official Email Address
                </label>
                <div className="relative group">
                  {inputIcon(
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,12 2,12" /></svg>
                  )}
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@department.gov.in"
                    {...register('email')}
                    className={`w-full rounded-lg border border-white bg-white px-4 py-3 pl-10 text-sm text-black placeholder-slate-500 focus:outline-none focus:border-(--color-accent-primary) focus:ring-2 focus:ring-(--color-accent-primary)/20 ${errors.email ? 'border-red-400/60' : ''}`}
                  />
                  {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="employee_id" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Employee / Officer ID
                </label>
                <div className="relative group">
                  {inputIcon(
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M6 17h12" /><path d="M12 11v6" /></svg>
                  )}
                  <input
                    id="employee_id"
                    type="text"
                    autoComplete="username"
                    placeholder="KSP12345"
                    {...register('employee_id')}
                    className={`w-full rounded-lg border border-white bg-white px-4 py-3 pl-10 text-sm text-black placeholder-slate-500 focus:outline-none focus:border-(--color-accent-primary) focus:ring-2 focus:ring-(--color-accent-primary)/20 ${errors.employee_id ? 'border-red-400/60' : ''}`}
                  />
                  {errors.employee_id && <p className="mt-1.5 text-xs text-red-400">{errors.employee_id.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="department" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Department / Police Station
                </label>
                <div className="relative group">
                  {inputIcon(
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                  )}
                  <input
                    id="department"
                    type="text"
                    autoComplete="organization"
                    placeholder="Karnataka State Police"
                    {...register('department')}
                    className={`w-full rounded-lg border border-white bg-white px-4 py-3 pl-10 text-sm text-black placeholder-slate-500 focus:outline-none focus:border-(--color-accent-primary) focus:ring-2 focus:ring-(--color-accent-primary)/20 ${errors.department ? 'border-red-400/60' : ''}`}
                  />
                  {errors.department && <p className="mt-1.5 text-xs text-red-400">{errors.department.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="designation" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Designation
                </label>
                <div className="relative group">
                  {inputIcon(
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  )}
                  <input
                    id="designation"
                    type="text"
                    autoComplete="organization-title"
                    placeholder="Sub Inspector"
                    {...register('designation')}
                    className={`w-full rounded-lg border border-white bg-white px-4 py-3 pl-10 text-sm text-black placeholder-slate-500 focus:outline-none focus:border-(--color-accent-primary) focus:ring-2 focus:ring-(--color-accent-primary)/20 ${errors.designation ? 'border-red-400/60' : ''}`}
                  />
                  {errors.designation && <p className="mt-1.5 text-xs text-red-400">{errors.designation.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="relative group">
                  {inputIcon(
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  )}
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="off"
                    placeholder="Enter your password"
                    {...register('password')}
                    className={`w-full rounded-lg border border-white bg-white px-4 py-3 pl-10 pr-10 text-sm text-black placeholder-slate-500 focus:outline-none focus:border-(--color-accent-primary) focus:ring-2 focus:ring-(--color-accent-primary)/20 ${errors.password ? 'border-red-400/60' : ''}`}
                  />
                  {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm_password" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Confirm Password
                </label>
                <div className="relative group">
                  {inputIcon(
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  )}
                  <input
                    id="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="off"
                    placeholder="Confirm your password"
                    {...register('confirm_password')}
                    className={`w-full rounded-lg border border-white bg-white px-4 py-3 pl-10 pr-10 text-sm text-black placeholder-slate-500 focus:outline-none focus:border-(--color-accent-primary) focus:ring-2 focus:ring-(--color-accent-primary)/20 ${errors.confirm_password ? 'border-red-400/60' : ''}`}
                  />
                  {errors.confirm_password && <p className="mt-1.5 text-xs text-red-400">{errors.confirm_password.message}</p>}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0" />
                    </svg>
                    Registering...
                  </>
                ) : (
                  'Continue to Verification'
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-(--color-accent-primary) hover:underline hover:underline-offset-2">
                Sign in
              </Link>
            </p>

            <p className="mt-4 text-center text-xs text-slate-500">
              © 2026 CrimeIntel · Authorized Investigation Platform
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}