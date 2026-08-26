import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, subtitle, actions, children, className = '' }: CardProps) {
  return (
    <div className={`texture-card gradient-border evidence-tag rounded-xl bg-white shadow-[0_1px_2px_rgba(11,18,32,0.05),0_4px_16px_rgba(11,18,32,0.06)] transition-shadow duration-300 hover:shadow-[0_4px_12px_rgba(11,18,32,0.06),0_16px_40px_-12px_rgba(79,70,229,0.22)] ${className}`}>
      {(title || subtitle || actions) && (
        <>
          <div className="flex items-start justify-between px-5 py-4">
            <div>
              {title && <h3 className="relative text-base font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
          <div className="gradient-line" />
        </>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
