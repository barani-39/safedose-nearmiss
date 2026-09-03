import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Filter, ArrowUpDown, FlaskConical } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { NearMissReport } from '@/types';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/States';
import { STATUSES, PRIORITIES, WARDS, INCIDENT_TYPES } from '@/lib/constants';

type SortField = 'created_at' | 'operational_priority' | 'status';
type SortDir = 'asc' | 'desc';

const PRIORITY_RANK: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const STATUS_RANK: Record<string, number> = {
  Submitted: 0,
  'Under Review': 1,
  'Action Required': 2,
  Closed: 3,
};

export function ReviewQueue() {
  const [reports, setReports] = useState<NearMissReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [filterIncident, setFilterIncident] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('near_miss_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError('Could not load reports.');
        setLoading(false);
        return;
      }
      setReports((data || []) as NearMissReport[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = [...reports];
    if (filterStatus) result = result.filter((r) => r.status === filterStatus);
    if (filterPriority) result = result.filter((r) => r.operational_priority === filterPriority);
    if (filterWard) result = result.filter((r) => r.ward === filterWard);
    if (filterIncident) result = result.filter((r) => r.incident_type === filterIncident);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'created_at') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === 'operational_priority') {
        cmp = PRIORITY_RANK[a.operational_priority] - PRIORITY_RANK[b.operational_priority];
      } else if (sortField === 'status') {
        cmp = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [reports, filterStatus, filterPriority, filterWard, filterIncident, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  if (loading) return <LoadingSpinner label="Loading review queue..." />;
  if (error) return <ErrorState message={error} />;

  const hasFilters = filterStatus || filterPriority || filterWard || filterIncident;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Review Queue</h1>
        <p className="mt-1 text-sm text-slate-600">
          Review submitted near-miss reports. Click any report to inspect details and add reviewer notes.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700">
          <Filter className="w-4 h-4" aria-hidden="true" />
          Filters
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            aria-label="Filter by priority"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={filterWard}
            onChange={(e) => setFilterWard(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            aria-label="Filter by ward"
          >
            <option value="">All Wards</option>
            {WARDS.filter((w) => w !== 'Other').map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
          <select
            value={filterIncident}
            onChange={(e) => setFilterIncident(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            aria-label="Filter by incident type"
          >
            <option value="">All Incident Types</option>
            {INCIDENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={() => {
              setFilterStatus('');
              setFilterPriority('');
              setFilterWard('');
              setFilterIncident('');
            }}
            className="mt-3 text-xs text-teal-600 hover:text-teal-700 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <ArrowUpDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
        <span className="text-slate-500">Sort by:</span>
        {(['created_at', 'operational_priority', 'status'] as SortField[]).map((field) => (
          <button
            key={field}
            onClick={() => toggleSort(field)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              sortField === field
                ? 'bg-teal-100 text-teal-700'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {field === 'created_at' ? 'Date' : field === 'operational_priority' ? 'Priority' : 'Status'}
            {sortField === field && (sortDir === 'asc' ? ' ↑' : ' ↓')}
          </button>
        ))}
      </div>

      {/* Report list */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No reports found"
          description={
            hasFilters
              ? 'No reports match the current filters. Try clearing them.'
              : 'No reports currently awaiting review.'
          }
          action={
            <Link
              to="/report"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700"
            >
              Submit a Report
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => {
            const isHigh = report.operational_priority === 'HIGH';
            return (
              <Link
                key={report.id}
                to={`/review/${report.id}`}
                className={`block bg-white rounded-xl border p-4 hover:shadow-md transition-shadow ${
                  isHigh ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-slate-500">
                        SDNM-{report.id.substring(0, 8).toUpperCase()}
                      </span>
                      {report.is_synthetic && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          <FlaskConical className="w-3 h-3" />
                          Demo
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-900 font-medium truncate">
                      {report.ward === 'Other' ? report.custom_ward || 'Other' : report.ward}
                      {' \u00B7 '}
                      {report.medicine_category}
                      {' \u00B7 '}
                      {report.incident_type}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(report.created_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <PriorityBadge priority={report.operational_priority} />
                    <StatusBadge status={report.status} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
