import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] animate-[float-orb_16s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-blue-600/40 via-indigo-600/25 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[34rem] w-[34rem] animate-[float-orb_20s_ease-in-out_infinite_reverse] rounded-full bg-gradient-to-tr from-violet-600/35 via-fuchsia-500/15 to-cyan-500/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-72 w-72 -translate-x-1/2 animate-pulse rounded-full bg-cyan-400/10 blur-3xl" />

      {/* Blueprint grid overlay */}
      <div className="bg-grid pointer-events-none absolute inset-0" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="animate-scale-in mb-8 text-center">
          <div className="relative mx-auto mb-5 h-20 w-20">
            <div className="absolute inset-0 animate-pulse rounded-[1.4rem] bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 opacity-60 blur-xl" />
            <div className="animate-pulse-glow relative flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 ring-1 ring-white/20 transition-transform duration-300 hover:scale-105 hover:rotate-3">
              <Shield className="h-9 w-9 text-white" strokeWidth={2.2} />
            </div>
          </div>
          <h1 className="text-gradient-light text-3xl font-bold tracking-tight">
            CrimeIntel AI
          </h1>
          <p className="mt-1.5 text-sm tracking-wide text-slate-400">
            Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div className="gradient-border gradient-border-animated glass-card animate-fade-up p-8 shadow-2xl shadow-indigo-950/60 backdrop-blur-xl">
          <h2 className="mb-6 text-center text-lg font-semibold text-white">
            Sign In
          </h2>

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

        <p className="animate-fade-in mt-6 text-center text-xs text-slate-500">
          Powered by Pixel Pirates | KSP Hackathon 2026
        </p>
      </div>
    </div>
  );
}
