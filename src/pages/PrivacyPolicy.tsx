import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  AlertTriangle,
  HeartHandshake,
  Scale,
  Building2,
} from 'lucide-react';
import { DisclaimerBar } from '@/components/Alert';
import { MEDICAL_DISCLAIMER } from '@/lib/constants';

export function PrivacyPolicy() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-6 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60 mb-3">
          <Lock className="w-3.5 h-3.5 text-teal-600" />
          Data Governance & Psychological Safety Framework
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Privacy, Anonymity & Psychological Safety</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">
          Detailed specification of SafeDose’s architectural guarantees regarding reporter anonymity, zero-retention of Personal Identifiable Information (PII/PHI), and the elimination of blame in medication safety reporting.
        </p>
      </div>

      <DisclaimerBar text={MEDICAL_DISCLAIMER} className="rounded-xl" />

      {/* Core Tenets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 mb-4">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Default-On Anonymity</h3>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            The reporting form initializes with Anonymous Reporting set to <strong className="text-slate-800">true</strong>. When anonymous, the client does not capture usernames, staff badge numbers, IP addresses, or browser footprints.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Blame-Free Culture</h3>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Near-miss reports focus strictly on <em className="text-slate-800">what happened</em>, <em className="text-slate-800">systemic contributing factors</em>, and <em className="text-slate-800">storage layout</em> rather than individual culpability.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Deterministic PII Filters</h3>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Client-side regex filters intercept NHS numbers, medical record numbers (MRNs), telephone numbers, and email addresses, prompting reporters to remove them prior to submission.
          </p>
        </div>
      </div>

      {/* Detailed Technical Policies */}
      <div className="space-y-6">
        {/* Section 1 */}
        <section className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            1. Technical Anonymity Invariant
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            SafeDose implements a strict database invariant: if <code className="font-mono text-slate-800">anonymous = true</code>, any accidental or legacy string present in the reporter identifier field is nullified before transmission and write:
          </p>
          <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto">
            <code>reporter_identifier: anonymous ? null : (reporterIdentifier.trim() || null)</code>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Verified by automated test suite: <code className="font-mono text-slate-700">tests/evaluation.test.ts</code> asserts that personal identifiers cannot be persisted when anonymity is selected.
          </p>
        </section>

        {/* Section 2 */}
        <section className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            2. Separation of Near-Miss Reporting from Serious Incident Investigations
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Near-miss systems function effectively only when staff trust that submissions will not be used in disciplinary tribunals. To maintain this trust:
          </p>
          <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside leading-relaxed">
            <li>
              <strong>Zero-Harm Filter:</strong> SafeDose is strictly for events where <em>no patient harm occurred</em>. If a clinician marks "Patient Harm = Yes", submission is rejected with instructions directing them to the hospital’s statutory incident pathway (e.g. Datix, Ulysses, or NHS Serious Incident Framework).
            </li>
            <li>
              <strong>No Fingerprinting:</strong> No session cookies, analytics trackers, or third-party marketing pixels are embedded in this prototype.
            </li>
            <li>
              <strong>No Disciplinary Access:</strong> SafeDose analytics aggregate data at the ward and systemic level (e.g. "Storage Error frequency in ICU"), never at an individual nurse or doctor level.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            3. Regulatory & Educational Prototype Scope
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            This software is an <strong>educational proof-of-concept and research evaluation prototype</strong>. It is not certified as Software as a Medical Device (SaMD) under UK MDR 2002 or EU MDR 2017/745.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-4">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block mb-1">What Data is Stored</span>
              <span className="text-slate-600">Ward name, broad drug category, workflow stage, contributing factor tags, operational narrative, and time-to-complete.</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block mb-1">What Data is NEVER Stored</span>
              <span className="text-slate-600">Patient names, MRN / NHS numbers, birth dates, diagnoses, dosages prescribed to specific individuals, or IP addresses.</span>
            </div>
          </div>
        </section>
      </div>

      {/* Action CTA */}
      <div className="p-6 rounded-xl bg-teal-50/70 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div>
          <h3 className="font-bold text-teal-950 text-sm">Ready to explore psychological safety in action?</h3>
          <p className="text-teal-800 mt-0.5">Test submitting an anonymous report with live privacy guardrails.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/report"
            className="px-4 py-2 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 transition"
          >
            Open Report Form
          </Link>
          <Link
            to="/validation"
            className="px-4 py-2 rounded-lg bg-white border border-teal-200 text-teal-800 font-semibold hover:bg-teal-100/50 transition"
          >
            View Stakeholder Reviews
          </Link>
        </div>
      </div>
    </div>
  );
}
