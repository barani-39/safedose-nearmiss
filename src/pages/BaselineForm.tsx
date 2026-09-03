import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { WARDS } from '@/lib/constants';
import { calculateBaselineCompleteness } from '@/lib/safety';
import { Alert } from '@/components/Alert';

export function BaselineForm() {
  const startTimeRef = useRef<number>(Date.now());

  const [ward, setWard] = useState('');
  const [description, setDescription] = useState('');
  const [satisfaction, setSatisfaction] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ward || !description.trim()) {
      setError('Please select a ward and enter a description.');
      return;
    }

    setSubmitting(true);
    setError('');

    const completionSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    const completeness = calculateBaselineCompleteness({ ward, description });
    const usable = description.trim().length >= 20;

    const { error: insertError } = await supabase.from('evaluation_sessions').insert({
      reporting_method: 'BASELINE',
      completion_seconds: completionSeconds,
      completeness_score: completeness,
      usable_report: usable,
      satisfaction_score: satisfaction || null,
      ward,
      description: description.trim(),
    });

    if (insertError) {
      setSubmitting(false);
      setError('Could not save the evaluation session. Please try again.');
      return;
    }

    setSubmitting(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Baseline Session Complete</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your baseline reporting session has been recorded for evaluation.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/evaluation"
              className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700"
            >
              Back to Evaluation
            </Link>
            <Link
              to="/report"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50"
            >
              Try SafeDose Form
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/evaluation"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Evaluation
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Baseline Reporting Form</h1>
        <p className="mt-1 text-sm text-slate-600">
          This is a deliberately simple, unstructured reporting form for comparison with the SafeDose structured form.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-center gap-2 text-sm text-blue-700">
        <Clock className="w-4 h-4" aria-hidden="true" />
        Completion time is being recorded for evaluation purposes.
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="bg-white rounded-xl border border-slate-200 p-5">
          <label className="text-sm font-semibold text-slate-700 mb-3 block">
            Ward / Area <span className="text-red-500">*</span>
          </label>
          <select
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            aria-label="Select ward"
          >
            <option value="">Select a ward...</option>
            {WARDS.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </fieldset>

        <fieldset className="bg-white rounded-xl border border-slate-200 p-5">
          <label className="text-sm font-semibold text-slate-700 mb-3 block">
            Describe the near miss <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            maxLength={2000}
            placeholder="Describe the near miss event in your own words..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-y"
            aria-label="Description of the near miss"
          />
        </fieldset>

        <fieldset className="bg-white rounded-xl border border-slate-200 p-5">
          <label className="text-sm font-semibold text-slate-700 mb-3 block">
            Satisfaction (1 = poor, 5 = excellent) <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSatisfaction(n)}
                className={`w-12 h-12 rounded-lg text-sm font-bold border transition-colors ${
                  satisfaction === n
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>

        {error && <Alert variant="error">{error}</Alert>}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 w-full sm:w-auto"
        >
          {submitting ? 'Submitting...' : (
            <>
              <Send className="w-4 h-4" />
              Submit Baseline Report
            </>
          )}
        </button>
      </form>
    </div>
  );
}
