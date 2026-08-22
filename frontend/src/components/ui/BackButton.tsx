import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  /** Route to use when there is no history to go back to (e.g. direct link / refresh) */
  fallbackTo?: string;
  label?: string;
  iconOnly?: boolean;
  className?: string;
}

export default function BackButton({
  fallbackTo = '/',
  label = 'Back',
  iconOnly = false,
  className = '',
}: BackButtonProps) {
  const navigate = useNavigate();

  const goBack = () => {
    const idx = window.history.state?.idx;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackTo, { replace: true });
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      title="Back (Esc)"
      aria-label="Go back"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        iconOnly ? 'p-2' : 'px-3 py-1.5 text-sm'
      } ${className}`}
    >
      <ArrowLeft size={iconOnly ? 18 : 16} />
      {!iconOnly && label}
    </button>
  );
}
