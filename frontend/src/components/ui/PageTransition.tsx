import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const location = useLocation();
  const [isExiting, setIsExiting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setIsExiting(true);
    const timer = setTimeout(() => {
      setKey(k => k + 1);
      setIsExiting(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [location.pathname, mounted]);

  return (
    <div className={className}>
      <div
        key={key}
        className={`animate-fade-in ${isExiting ? 'animate-fade-out' : ''}`}
      >
        {children}
      </div>
    </div>
  );
}