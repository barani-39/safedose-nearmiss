import { AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ReactNode } from 'react';

type Variant = 'info' | 'warning' | 'error' | 'success';

const STYLES: Record<Variant, { container: string; icon: ReactNode }> = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" aria-hidden="true" />,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" aria-hidden="true" />,
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" aria-hidden="true" />,
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" aria-hidden="true" />,
  },
};

export function Alert({
  variant,
  children,
  className = '',
}: {
  variant: Variant;
  children: ReactNode;
  className?: string;
}) {
  const style = STYLES[variant];
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${style.container} ${className}`}
    >
      {style.icon}
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function DisclaimerBar({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`bg-slate-800 text-slate-100 text-xs px-4 py-2 text-center ${className}`}>
      {text}
    </div>
  );
}
