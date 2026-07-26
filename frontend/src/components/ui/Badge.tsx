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
  open: 'bg-blue-100 text-blue-800',
  closed: 'bg-green-100 text-green-800',
  under_investigation: 'bg-amber-100 text-amber-800',
  filed: 'bg-gray-100 text-gray-800',
  critical: 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-800',
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
