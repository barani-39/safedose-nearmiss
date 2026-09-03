import type { OperationalPriority, ReportStatus } from '@/types';

const PRIORITY_STYLES: Record<OperationalPriority, string> = {
  LOW: 'bg-blue-50 text-blue-700 border border-blue-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border border-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 border border-orange-200',
};

const STATUS_STYLES: Record<ReportStatus, string> = {
  Submitted: 'bg-slate-100 text-slate-700 border border-slate-200',
  'Under Review': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Action Required': 'bg-amber-50 text-amber-700 border border-amber-200',
  Closed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

export function PriorityBadge({ priority }: { priority: OperationalPriority }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_STYLES[priority]}`}
      aria-label={`Priority: ${priority}`}
    >
      {priority} Priority
    </span>
  );
}

export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status]}`}
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  );
}
