import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, suffix, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div
              className={`pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 transition-colors duration-300 ${
                error ? 'text-[var(--color-red-400)]' : 'text-[var(--color-slate-400)] group-focus-within:text-[var(--color-accent-primary)]'
              }`}
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`input-field ${icon ? '!pl-10' : ''} ${suffix ? 'pr-10' : ''} ${error ? 'border-[var(--color-red-400)] focus:border-[var(--color-red-400)] focus:ring-[var(--color-red-400)]' : ''} ${className}`}
            {...props}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 z-10 flex items-center pr-3">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-[var(--color-red-600)]">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;