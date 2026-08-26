import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Invalid credentials. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="texture-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      {/* forensic motive texture: grain + shield watermark via .texture-dark ::before/::after */}
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute -left-40 -top-40 z-0 h-[30rem] w-[30rem] animate-[float-orb_16s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-blue-600/40 via-indigo-600/25 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 z-0 h-[34rem] w-[34rem] animate-[float-orb_20s_ease-in-out_infinite_reverse] rounded-full bg-gradient-to-tr from-violet-600/35 via-fuchsia-500/15 to-cyan-500/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/4 z-0 h-72 w-72 -translate-x-1/2 animate-pulse rounded-full bg-cyan-400/10 blur-3xl" />

      {/* Blueprint grid overlay + forensic watermark */}
      <div className="bg-grid pointer-events-none absolute inset-0 z-0" />

      <div className="relative w-full max-w-md">
        {/* Brand – industrial badge, highly noticeable */}
        <div className="animate-scale-in mb-8 text-center">
          <div className="relative mx-auto mb-3 flex h-[84px] w-[84px] items-center justify-center rounded-[14px] bg-[#0F172A] border border-[#1E293B] shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="rivet rivet-tl !w-1.5 !h-1.5" /> <div className="rivet rivet-tr !w-1.5 !h-1.5" /> <div className="rivet rivet-bl !w-1.5 !h-1.5" /> <div className="rivet rivet-br !w-1.5 !h-1.5" />
            <img src="/logo-icon.svg" alt="CrimeIntel AI Logo" className="h-[64px] w-[64px] object-contain drop-shadow-[0_4px_12px_rgba(6,182,214,0.4)]" />
            <div className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#020617] shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
          </div>
          <img src="/logo.svg" alt="CrimeIntel AI" className="mx-auto mt-3 h-10 w-auto object-contain brightness-125 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]" />
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#1E293B] bg-[#0F172A]/80 px-3 py-1 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono-industrial text-[11px] tracking-[0.12em] text-slate-300">KARNATAKA STATE POLICE • SECURE ACCESS</span>
          </div>
        </div>

        {/* Industrial steel login card – rivets + hazard */}
        <div className="relative overflow-hidden rounded-[12px] border border-[#1E293B] bg-[#0F172A]/85 backdrop-blur-xl shadow-[0_16px_48px_rgba(2,6,23,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] animate-fade-up">
          <div className="rivet rivet-tl" /> <div className="rivet rivet-tr" /> <div className="rivet rivet-bl" /> <div className="rivet rivet-br" />
          <div className="hazard-stripe opacity-80" />
          <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-mono-industrial text-[13px] font-bold tracking-[0.16em] text-white">SECURE LOGIN</h2>
              <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 font-mono-industrial text-[10px] font-bold tracking-widest text-amber-400">CLASSIFIED</span>
            </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-300 backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-200">
                Email
              </label>
              <div className="relative group">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-500 transition-colors duration-300 group-focus-within:text-indigo-400"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={`input-dark pl-10 ${errors.email ? 'border-red-400/60' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-200">
                Password
              </label>
              <div className="relative group">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-500 transition-colors duration-300 group-focus-within:text-indigo-400"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`input-dark pl-10 pr-10 ${errors.password ? 'border-red-400/60' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400 bg-clip-text text-sm font-medium text-transparent transition-all hover:from-sky-300 hover:to-violet-300 hover:underline hover:underline-offset-4"
              >
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" isLoading={isSubmitting} className="w-full !py-2.5">
              Sign In
              {!isSubmitting && <ArrowRight size={16} />}
            </Button>
          </form>
        </div>
      </div>

        <p className="animate-fade-in mt-6 text-center text-xs text-slate-500">
          Powered by Pixel Pirates | KSP Hackathon 2026
        </p>
      </div>
    </div>
  );
}
