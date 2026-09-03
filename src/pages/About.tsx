import { ShieldPlus, CheckCircle, XCircle, Eye, Lock, AlertTriangle } from 'lucide-react';
import { MEDICAL_DISCLAIMER } from '@/lib/constants';
import { DisclaimerBar } from '@/components/Alert';

export function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <ShieldPlus className="w-12 h-12 text-teal-600 mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-slate-900">About SafeDose NearMiss</h1>
        <p className="mt-2 text-sm text-slate-600">
          A medication near-miss reporting and organisational learning system.
        </p>
      </div>

      <DisclaimerBar text={MEDICAL_DISCLAIMER} className="mb-8 rounded-lg" />

      <div className="space-y-6">
        <Section title="What SafeDose Does" icon={CheckCircle} iconColor="text-emerald-600">
          <ul className="space-y-2 text-sm text-slate-700">
            <li>Collects structured near-miss reports from hospital staff quickly and efficiently.</li>
            <li>Supports anonymous reporting to encourage psychologically safe reporting.</li>
            <li>Provides a human review workflow for safety reviewers to classify and prioritise reports.</li>
            <li>Generates operational safety insights from aggregated report data.</li>
            <li>Supports academic evaluation of structured vs unstructured reporting.</li>
          </ul>
        </Section>

        <Section title="What SafeDose Does Not Do" icon={XCircle} iconColor="text-red-600">
          <ul className="space-y-2 text-sm text-slate-700">
            <li>Does not provide diagnoses.</li>
            <li>Does not provide prescribing recommendations.</li>
            <li>Does not provide dosage recommendations.</li>
            <li>Does not provide treatment recommendations.</li>
            <li>Does not make emergency clinical decisions.</li>
            <li>Does not replace approved clinical escalation procedures.</li>
          </ul>
        </Section>

        <Section title="Human Oversight" icon={Eye} iconColor="text-blue-600">
          <p className="text-sm text-slate-700">
            All automated suggestions require human review. The system uses a rule-based classifier
            to suggest an incident category, but every suggestion is clearly labelled as requiring
            human confirmation. A safety reviewer must confirm or change the classification before
            it becomes final. The workflow is:
          </p>
          <ol className="mt-3 space-y-1 text-sm text-slate-700 list-decimal list-inside">
            <li>Report Submitted</li>
            <li>Automated / Rule-Based Suggestion</li>
            <li>Confidence Assessment</li>
            <li>Human Review</li>
            <li>Reviewer Confirms or Changes Classification</li>
            <li>Final Classification</li>
          </ol>
        </Section>

        <Section title="Privacy" icon={Lock} iconColor="text-teal-600">
          <p className="text-sm text-slate-700">
            SafeDose NearMiss does not collect patient-identifying information. The reporting form
            warns users to avoid entering patient names, hospital numbers, phone numbers, addresses,
            or other unnecessary identifying details. Basic pattern detection checks for obvious
            identifiers such as email addresses and phone-number-like patterns. This detection is not
            perfect and should not be relied upon as a complete PHI/PII safeguard.
          </p>
        </Section>

        <Section title="Prototype Disclaimer" icon={AlertTriangle} iconColor="text-amber-600">
          <p className="text-sm text-slate-700">
            This is an educational prototype and is not certified for clinical deployment.
            It is designed for a university/college software project to demonstrate medication
            near-miss reporting workflows. All demonstration data is synthetic and clearly marked.
            No real patient data is used.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}
