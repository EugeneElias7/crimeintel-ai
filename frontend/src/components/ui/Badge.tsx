import type { ReactNode } from 'react';

type BadgeVariant =
  | 'open'
  | 'closed'
  | 'under_investigation'
  | 'filed'
  | 'critical'
  | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

const colorMap: Record<BadgeVariant, string> = {
  open: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 ring-1 ring-inset ring-blue-200',
  closed:
    'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  under_investigation:
    'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  filed: 'bg-gradient-to-r from-slate-100 to-gray-100 text-gray-600 ring-1 ring-inset ring-slate-200',
  critical:
    'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 ring-1 ring-inset ring-red-200 shadow-sm shadow-red-200/50',
  default: 'bg-gradient-to-r from-slate-100 to-gray-100 text-gray-600 ring-1 ring-inset ring-slate-200',
};

export default function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[variant]}`}
    >
      {children}
    </span>
  );
}
