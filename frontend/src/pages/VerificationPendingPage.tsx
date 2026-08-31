import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { CheckCircle, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import PageTransition from '../components/ui/PageTransition';

type Step = {
  icon: React.ReactNode;
  label: string;
  status: 'complete' | 'current' | 'pending';
};

const steps: Step[] = [
  { icon: <CheckCircle className="h-5 w-5" />, label: 'Account Created', status: 'complete' },
  { icon: <FileText className="h-5 w-5" />, label: 'Document Submitted', status: 'complete' },
  { icon: <Shield className="h-5 w-5" />, label: 'Verification Under Review', status: 'current' },
  { icon: <CheckCircle className="h-5 w-5" />, label: 'Account Approved', status: 'pending' },
];

function FileText({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

export default function VerificationPendingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isVerified = user?.account_status === 'APPROVED';

  useEffect(() => {
    if (isAdmin || isVerified) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, isVerified, navigate]);

  if (isAdmin || isVerified) return null;

  return (
    <PageTransition className="texture-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-navy-950)] px-4 py-10">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute -left-40 -top-40 z-0 h-[30rem] w-[30rem] animate-[float-orb_16s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-blue-600/40 via-indigo-600/25 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 z-0 h-[34rem] w-[34rem] animate-[float-orb_20s_ease-in-out_infinite_reverse] rounded-full bg-gradient-to-tr from-violet-600/35 via-fuchsia-500/15 to-cyan-500/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/4 z-0 h-72 w-72 -translate-x-1/2 animate-pulse rounded-full bg-cyan-400/10 blur-3xl" />

      {/* Blueprint grid overlay + forensic watermark */}
      <div className="bg-grid pointer-events-none absolute inset-0 z-0" />

      <div className="relative w-full max-w-md">
        {/* Brand – clean and prominent */}
        <div className="animate-scale-in text-center">
          <img src="/Crime-Icon.png" alt="CrimeIntel" className="mx-auto h-48 w-48 object-contain" />
        </div>

        {/* Industrial steel login card – rivets + hazard stripe */}
        <div className="relative overflow-hidden rounded-[12px] border border-[var(--color-border-sidebar)] bg-[var(--color-navy-900)]/85 backdrop-blur-xl shadow-[0_16px_48px_rgba(2,6,23,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] animate-fade-up">
          <div className="rivet rivet-tl" /> <div className="rivet rivet-tr" /> <div className="rivet rivet-bl" /> <div className="rivet rivet-br" />
          <div className="hazard-stripe opacity-80" />
          <div className="p-8">
            <div className="mb-6 text-center">
              <div className="mb-3 flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
              <h2 className="mb-2 text-center text-xl font-semibold text-white tracking-tight">Verification Submitted</h2>
              <p className="text-center text-sm text-slate-400">Your registration and identity document have been submitted successfully.</p>
            </div>

            <div className="mb-6 p-4 rounded-lg bg-[var(--color-navy-950)]/50 border border-[var(--color-border-sidebar)]">
              <p className="mb-3 text-sm text-slate-300">
                Your account will be reviewed by an authorized administrator. Access to CrimeIntel will be granted once your account has been approved.
              </p>
              <p className="text-xs text-slate-500">
                This process typically takes 1-3 business days. You will receive an email notification once a decision has been made.
              </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8 space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300">
                    {step.status === 'complete' ? (
                      <>
                        <div className="absolute inset-0 rounded-full bg-emerald-500/20" />
                        <span className="relative text-emerald-400">{step.icon}</span>
                      </>
                    ) : step.status === 'current' ? (
                      <>
                        <div className="absolute inset-0 rounded-full bg-[var(--color-accent-primary)]/20 animate-pulse" />
                        <span className="relative text-[var(--color-accent-primary)]">{step.icon}</span>
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 rounded-full bg-[var(--color-navy-800)]" />
                        <span className="relative text-slate-500">{step.icon}</span>
                      </>
                    )}
                    {index < steps.length - 1 && (
                      <div className="absolute left-1/2 top-10 w-0.5 h-[calc(100%-1.5rem)] -translate-x-1/2" style={{ background: index < 1 ? 'var(--color-emerald-500)' : 'var(--color-navy-700)' }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      step.status === 'complete' ? 'text-emerald-400' :
                      step.status === 'current' ? 'text-[var(--color-accent-primary)]' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </p>
                    {step.status === 'current' && (
                      <p className="text-xs text-slate-500">An administrator is reviewing your submission</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full rounded-lg bg-[var(--color-accent-primary)] py-3 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.4)] hover:bg-[var(--color-accent-primary-hover)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-navy-900)]"
            >
              Return to Sign In
            </button>

            <p className="mt-6 text-center text-xs text-slate-500">
              © 2026 CrimeIntel · Authorized Investigation Platform
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}