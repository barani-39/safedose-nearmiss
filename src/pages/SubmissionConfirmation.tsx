import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { NearMissReport } from '@/types';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import { LoadingSpinner, ErrorState } from '@/components/States';

export function SubmissionConfirmation() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<NearMissReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!id) {
        setError('Report ID not found.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('near_miss_reports')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        setError('Could not retrieve the report.');
        setLoading(false);
        return;
      }
      if (!data) {
        setError('Report not found.');
        setLoading(false);
        return;
      }
      setReport(data as NearMissReport);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <LoadingSpinner label="Loading report..." />;
  if (error) return <ErrorState message={error} />;
  if (!report) return <ErrorState message="Report not found." />;

  const submittedDate = new Date(report.created_at).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const shortId = report.id.substring(0, 8).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Report Submitted</h1>
        <p className="mt-2 text-slate-600">Thank you for contributing to medication safety.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Report ID</p>
            <p className="text-sm font-mono font-semibold text-slate-900 mt-1">SDNM-{shortId}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Submitted</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{submittedDate}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Operational Priority</p>
            <div className="mt-1">
              <PriorityBadge priority={report.operational_priority} />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Current Status</p>
            <div className="mt-1">
              <StatusBadge status={report.status} />
            </div>
          </div>
        </div>

        {report.is_synthetic && (
          <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-3">
            Synthetic demonstration data.
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/report"
          className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
        >
          Submit Another Report
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
        >
          <Home className="w-4 h-4" />
          Return Home
        </Link>
      </div>
    </div>
  );
}
