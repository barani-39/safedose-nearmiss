import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FlaskConical, AlertTriangle, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { NearMissReport, ReportStatus, OperationalPriority } from '@/types';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/States';
import { Alert } from '@/components/Alert';
import { STATUSES, PRIORITIES, INCIDENT_TYPES } from '@/lib/constants';
import { useAuth } from '@/contexts';
import { recordAuditEvent } from '@/lib/audit';

export function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, isReviewerOrAdmin, user } = useAuth();

  const [report, setReport] = useState<NearMissReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reviewerNotes, setReviewerNotes] = useState('');
  const [status, setStatus] = useState<ReportStatus>('Submitted');
  const [humanVerifiedCategory, setHumanVerifiedCategory] = useState('');
  const [editedPriority, setEditedPriority] = useState<OperationalPriority>('LOW');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedAt, setSavedAt] = useState('');

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
        setError('Could not load the report.');
        setLoading(false);
        return;
      }
      if (!data) {
        setLoading(false);
        return;
      }
      const r = data as NearMissReport;
      setReport(r);
      setReviewerNotes(r.reviewer_notes || '');
      setStatus(r.status);
      setHumanVerifiedCategory(r.human_verified_category || r.incident_type);
      setEditedPriority(r.operational_priority);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSaveReview() {
    if (!report) return;
    setSaving(true);
    setSaveError('');

    const { error } = await supabase
      .from('near_miss_reports')
      .update({
        reviewer_notes: reviewerNotes.trim() || null,
        status,
        human_verified_category: humanVerifiedCategory,
        operational_priority: editedPriority,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', report.id);

    if (error) {
      setSaveError('Could not save the review. Please try again.');
      setSaving(false);
      return;
    }

    recordAuditEvent({
      action: 'REVIEW_NOTES_UPDATED',
      resource_type: 'REPORT',
      resource_id: report.id,
      user_id: user?.id,
      user_role: role,
      details: {
        new_status: status,
        operational_priority: editedPriority,
        verified_category: humanVerifiedCategory,
        notes_length: reviewerNotes.trim().length,
      },
    });

    setSaving(false);
    setSavedAt(new Date().toLocaleTimeString('en-GB'));
    setReport({
      ...report,
      reviewer_notes: reviewerNotes.trim() || null,
      status,
      human_verified_category: humanVerifiedCategory,
      operational_priority: editedPriority,
      reviewed_at: new Date().toISOString(),
    });
  }

  if (loading) return <LoadingSpinner label="Loading report..." />;
  if (error) return <ErrorState message={error} />;
  if (!report) return (
    <EmptyState
      title="Report not found"
      description="This report may have been removed."
      action={<Link to="/review" className="text-teal-600 font-medium">Back to Review Queue</Link>}
    />
  );

  const submittedDate = new Date(report.created_at).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const reviewedDate = report.reviewed_at
    ? new Date(report.reviewed_at).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const wardDisplay = report.ward === 'Other' ? report.custom_ward || 'Other' : report.ward;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/review"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Review Queue
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Report SDNM-{report.id.substring(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Submitted {submittedDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={report.operational_priority} />
          <StatusBadge status={report.status} />
        </div>
      </div>

      {report.is_synthetic && (
        <div className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
          <FlaskConical className="w-3.5 h-3.5" />
          Synthetic demonstration data
        </div>
      )}

      {/* Overview */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Report Overview</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Ward / Area</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{wardDisplay}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Medicine Category</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{report.medicine_category}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Workflow Stage</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{report.workflow_stage}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Incident Type</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{report.incident_type}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Medication Administered</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{report.medication_administered}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Patient Harm</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{report.patient_harm_status}</dd>
          </div>
        </dl>
      </section>

      {/* Description */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Description</h2>
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
          {report.short_description}
        </p>
      </section>

      {/* Contributing Factors */}
      {report.contributing_factors.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Contributing Factors</h2>
          <div className="flex flex-wrap gap-2">
            {report.contributing_factors.map((factor) => (
              <span
                key={factor}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200"
              >
                {factor}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Immediate Action */}
      {report.immediate_action && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Immediate Action</h2>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {report.immediate_action}
          </p>
        </section>
      )}

      {/* Automated Suggestion */}
      {report.suggested_category && (
        <section className="bg-blue-50 rounded-xl border border-blue-200 p-5 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-blue-900">Automated Operational Suggestion</h2>
              <p className="text-xs text-blue-700 mt-1">
                Suggested classification &mdash; requires human confirmation. This is not a clinical decision.
              </p>
              <div className="mt-3 flex items-center gap-3 text-sm">
                <span className="font-medium text-blue-900">
                  Suggested: {report.suggested_category}
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Confidence: {report.suggestion_confidence}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Human Review */}
      <section className="bg-white rounded-xl border-2 border-teal-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Human Review</h2>
        <p className="text-xs text-slate-500 mb-4">
          All automated suggestions require human review. Confirm or change the classification below.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirm / Edit Classification
            </label>
            <select
              value={humanVerifiedCategory}
              onChange={(e) => setHumanVerifiedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            >
              {INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Operational Priority
            </label>
            <select
              value={editedPriority}
              onChange={(e) => setEditedPriority(e.target.value as OperationalPriority)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReportStatus)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reviewer Notes
            </label>
            <textarea
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Add reviewer notes..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-y"
            />
          </div>

          {saveError && <Alert variant="error">{saveError}</Alert>}
          {savedAt && (
            <Alert variant="success">
              Review saved at {savedAt}. Changes have been persisted.
            </Alert>
          )}

          {!isReviewerOrAdmin && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                You are currently in <strong>{role}</strong> mode. Saving clinical reviews requires Reviewer or Admin role.
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveReview}
              disabled={saving || !isReviewerOrAdmin}
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Review'}
            </button>
            <button
              onClick={() => navigate('/review')}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Back to Queue
            </button>
          </div>

          {reviewedDate && (
            <p className="text-xs text-slate-400">
              Last reviewed: {reviewedDate}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
