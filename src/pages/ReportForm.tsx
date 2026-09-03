import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2 as WardIcon,
  Pill,
  Workflow,
  AlertTriangle,
  Tag,
  ClipboardList,
  CheckCircle,
  Send,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  WARDS,
  MEDICINE_CATEGORIES,
  WORKFLOW_STAGES,
  INCIDENT_TYPES,
  PRIORITIES,
  CONTRIBUTING_FACTORS,
  HARM_STATUSES,
  ADMINISTERED_OPTIONS,
  MEDICAL_DISCLAIMER,
  MEDICAL_ADVICE_RESPONSE,
} from '@/lib/constants';
import {
  detectMedicalAdviceRequest,
  detectIdentifyingInformation,
  detectHarmContradiction,
  isVagueDescription,
  classifyReport,
  calculateCompletenessScore,
} from '@/lib/safety';
import type {
  OperationalPriority,
  PatientHarmStatus,
  AdministeredStatus,
  ReportInsert,
} from '@/types';
import { Alert, DisclaimerBar } from '@/components/Alert';

export function ReportForm() {
  const navigate = useNavigate();
  const startTimeRef = useRef<number>(Date.now());

  const [ward, setWard] = useState('');
  const [customWard, setCustomWard] = useState('');
  const [medicineCategory, setMedicineCategory] = useState('');
  const [workflowStage, setWorkflowStage] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [operationalPriority, setOperationalPriority] = useState<OperationalPriority | ''>('');
  const [contributingFactors, setContributingFactors] = useState<string[]>([]);
  const [shortDescription, setShortDescription] = useState('');
  const [immediateAction, setImmediateAction] = useState('');
  const [medicationAdministered, setMedicationAdministered] = useState<AdministeredStatus | ''>('');
  const [patientHarmStatus, setPatientHarmStatus] = useState<PatientHarmStatus>('No');
  const [anonymous, setAnonymous] = useState(true);
  const [reporterIdentifier, setReporterIdentifier] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [descriptionTouched, setDescriptionTouched] = useState(false);

  const medicalAdviceDetected = useMemo(
    () => detectMedicalAdviceRequest(shortDescription) || detectMedicalAdviceRequest(immediateAction),
    [shortDescription, immediateAction],
  );

  const identifyingInfo = useMemo(
    () => detectIdentifyingInformation(shortDescription),
    [shortDescription],
  );

  const harmContradiction = useMemo(
    () => detectHarmContradiction(shortDescription, patientHarmStatus),
    [shortDescription, patientHarmStatus],
  );

  const isVague = useMemo(
    () => descriptionTouched && shortDescription.trim().length > 0 && isVagueDescription(shortDescription),
    [shortDescription, descriptionTouched],
  );

  const harmWarning = patientHarmStatus === 'Yes';

  const showWardError = descriptionTouched && !ward;
  const showCustomWardError = descriptionTouched && ward === 'Other' && !customWard.trim();
  const showDescError = descriptionTouched && shortDescription.trim().length < 20 && !isVague;

  const isFormValid =
    ward &&
    (ward !== 'Other' || customWard.trim()) &&
    medicineCategory &&
    workflowStage &&
    incidentType &&
    operationalPriority &&
    shortDescription.trim().length >= 20 &&
    !isVagueDescription(shortDescription) &&
    medicationAdministered &&
    patientHarmStatus &&
    !medicalAdviceDetected;

  function toggleFactor(factor: string) {
    setContributingFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) {
      setDescriptionTouched(true);
      return;
    }

    if (harmWarning) return;

    setSubmitting(true);
    setSubmitError('');

    const suggestion = classifyReport(shortDescription);

    const payload: ReportInsert = {
      ward: ward === 'Other' ? 'Other' : ward,
      custom_ward: ward === 'Other' ? customWard.trim() : null,
      medicine_category: medicineCategory,
      workflow_stage: workflowStage,
      incident_type: incidentType,
      operational_priority: operationalPriority as OperationalPriority,
      contributing_factors: contributingFactors,
      short_description: shortDescription.trim(),
      immediate_action: immediateAction.trim() || null,
      medication_administered: medicationAdministered as AdministeredStatus,
      patient_harm_status: patientHarmStatus as PatientHarmStatus,
      anonymous,
      reporter_identifier: anonymous ? null : (reporterIdentifier.trim() || null),
      suggested_category: suggestion.suggestedCategory,
      suggestion_confidence: suggestion.confidence,
    };

    const { data, error } = await supabase
      .from('near_miss_reports')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      setSubmitting(false);
      setSubmitError('There was a problem submitting your report. Please try again.');
      return;
    }

    // Record SAFEDOSE evaluation session (non-blocking for report durability)
    try {
      const elapsedSeconds = Math.max(8, Math.round((Date.now() - startTimeRef.current) / 1000));
      const completeness = calculateCompletenessScore({
        ward: payload.ward,
        medicine_category: payload.medicine_category,
        workflow_stage: payload.workflow_stage,
        incident_type: payload.incident_type,
        contributing_factors: payload.contributing_factors,
        short_description: payload.short_description,
        operational_priority: payload.operational_priority,
      });
      const usable =
        payload.short_description.trim().length >= 20 &&
        (payload.contributing_factors.length > 0 || !!payload.workflow_stage);

      await supabase.from('evaluation_sessions').insert({
        reporting_method: 'SAFEDOSE',
        completion_seconds: elapsedSeconds,
        completeness_score: completeness,
        usable_report: usable,
        satisfaction_score: 5,
        ward: payload.ward === 'Other' ? (payload.custom_ward || 'Other') : payload.ward,
        description: payload.short_description,
        notes: `SafeDose Report ID: ${data.id} | Priority: ${payload.operational_priority} | Stage: ${payload.workflow_stage}`,
      });
    } catch (evalErr) {
      console.warn('Evaluation session recording warning (non-fatal):', evalErr);
    }

    setSubmitting(false);
    navigate(`/report/confirmation/${data.id}`);
  }

  const sectionTitle = 'text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Report a Near Miss</h1>
        <p className="mt-1 text-sm text-slate-600">
          Complete the structured fields below. Most reports can be submitted in about 60 seconds.
        </p>
      </div>

      <DisclaimerBar text={MEDICAL_DISCLAIMER} className="mb-6 rounded-lg" />

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-amber-800 flex items-start gap-2">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Avoid entering patient names, hospital numbers, phone numbers, addresses, or other
            unnecessary identifying information.
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ward */}
        <fieldset className="bg-white rounded-xl border border-slate-200 p-5">
          <legend className={sectionTitle}>
            <WardIcon className="w-4 h-4 text-teal-600" aria-hidden="true" />
            Ward / Area <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {WARDS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWard(w)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  ward === w
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
          {ward === 'Other' && (
            <input
              type="text"
              value={customWard}
              onChange={(e) => setCustomWard(e.target.value)}
              placeholder="Enter ward / area name"
              className="mt-3 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              aria-label="Custom ward name"
            />
          )}
          {showWardError && <p className="mt-2 text-xs text-red-600">Please select a ward or area.</p>}
          {showCustomWardError && <p className="mt-2 text-xs text-red-600">Please enter a ward name.</p>}
        </fieldset>

        {/* Medicine Category */}
        <fieldset className="bg-white rounded-xl border border-slate-200 p-5">
          <legend className={sectionTitle}>
            <Pill className="w-4 h-4 text-teal-600" aria-hidden="true" />
            Medicine Category <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MEDICINE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setMedicineCategory(cat)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  medicineCategory === cat
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Workflow Stage */}
        <fieldset className="bg-white rounded-xl border border-slate-200 p-5">
          <legend className={sectionTitle}>
            <Workflow className="w-4 h-4 text-teal-600" aria-hidden="true" />
            Workflow Stage <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {WORKFLOW_STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setWorkflowStage(stage)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  workflowStage === stage
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Incident Type */}
        <fieldset className="bg-white rounded-xl border border-slate-200 p-5">
          <legend className={sectionTitle}>
            <AlertTriangle className="w-4 h-4 text-teal-600" aria-hidden="true" />
            Incident Type <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {INCIDENT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setIncidentType(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  incidentType === type
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Operational Priority */}
        <fieldset className="bg-white rounded-xl border border-slate-200 p-5">
          <legend className={sectionTitle}>
            <Tag className="w-4 h-4 text-teal-600" aria-hidden="true" />
            Operational Priority <span className="text-red-500">*</span>
          </legend>
          <p className="text-xs text-slate-500 mb-3">
            This represents operational review priority, not clinical diagnosis or severity.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setOperationalPriority(p)}
                className={`px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${
                  operationalPriority === p
                    ? p === 'HIGH'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : p === 'MEDIUM'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Contributing Factors */}
        <fieldset className="bg-white rounded-xl border border-slate-200 p-5">
          <legend className={sectionTitle}>
            <ClipboardList className="w-4 h-4 text-teal-600" aria-hidden="true" />
            Contributing Factors
          </legend>
          <p className="text-xs text-slate-500 mb-3">Select all that apply.</p>
          <div className="flex flex-wrap gap-2">
            {CONTRIBUTING_FACTORS.map((factor) => (
              <button
                key={factor}
                type="button"
                onClick={() => toggleFactor(factor)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  contributingFactors.includes(factor)
                    ? 'bg-teal-100 text-teal-800 border-teal-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                }`}
                aria-pressed={contributingFactors.includes(factor)}
              >
                {factor}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Description */}
        <fieldset className="bg-white rounded-xl border border-slate-200 p-5">
          <legend className={sectionTitle}>
            <ClipboardList className="w-4 h-4 text-teal-600" aria-hidden="true" />
            What happened? <span className="text-red-500">*</span>
          </legend>
          <p className="text-xs text-slate-500 mb-3">
            Briefly describe the near miss without including unnecessary patient-identifying information.
          </p>
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            onBlur={() => setDescriptionTouched(true)}
            rows={4}
            minLength={20}
            maxLength={1000}
            placeholder="Describe the near miss event..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
            aria-label="Description of what happened"
          />
          <p className="mt-1 text-xs text-slate-400 text-right">
            {shortDescription.length}/1000
          </p>

          {isVague && (
            <Alert variant="warning" className="mt-3">
              Please provide a little more operational context so the safety team can understand the near miss.
            </Alert>
          )}
          {showDescError && (
            <p className="mt-2 text-xs text-red-600">
              Please enter at least 20 characters describing the event.
            </p>
          )}
          {medicalAdviceDetected && (
            <Alert variant="error" className="mt-3">
              {MEDICAL_ADVICE_RESPONSE}
              <p className="mt-1">Please remove any medical-advice requests to submit the operational report.</p>
            </Alert>
          )}
          {identifyingInfo.length > 0 && (
            <Alert variant="warning" className="mt-3">
              <strong>Possible identifying information detected:</strong> {identifyingInfo.join(', ')}.
              Please review the description before submitting.
            </Alert>
          )}
        </fieldset>

        {/* Immediate Action */}
        <fieldset className="bg-white rounded-xl border border-slate-200 p-5">
          <legend className={sectionTitle}>
            <CheckCircle className="w-4 h-4 text-teal-600" aria-hidden="true" />
            What was done immediately? <span className="text-slate-400 font-normal">(optional)</span>
          </legend>
          <textarea
            value={immediateAction}
            onChange={(e) => setImmediateAction(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Describe what was done immediately (optional)..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
            aria-label="Immediate action taken"
          />
        </fieldset>

        {/* Medication Administered */}
        <fieldset className="bg-white rounded-xl border border-slate-200 p-5">
          <legend className={sectionTitle}>
            <Pill className="w-4 h-4 text-teal-600" aria-hidden="true" />
            Was the medication administered before the issue was identified? <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {ADMINISTERED_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setMedicationAdministered(opt)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  medicationAdministered === opt
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Patient Harm */}
        <fieldset className="bg-white rounded-xl border border-slate-200 p-5">
          <legend className={sectionTitle}>
            <ShieldAlert className="w-4 h-4 text-teal-600" aria-hidden="true" />
            Did this event result in known patient harm? <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {HARM_STATUSES.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setPatientHarmStatus(opt)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  patientHarmStatus === opt
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {harmWarning && (
            <Alert variant="error" className="mt-3">
              SafeDose NearMiss is intended for events where no known patient harm occurred. Please use
              your organisation&rsquo;s approved incident reporting and clinical escalation pathways for
              events involving patient harm.
            </Alert>
          )}
          {patientHarmStatus === 'Unsure' && (
            <Alert variant="info" className="mt-3">
              This report will be flagged for human review. No medical advice will be provided.
            </Alert>
          )}
          {harmContradiction && (
            <Alert variant="warning" className="mt-3">
              Information may be inconsistent &mdash; the description mentions harm but patient harm is set
              to &ldquo;No&rdquo;. This report will be flagged for human review.
            </Alert>
          )}
        </fieldset>

        {/* Anonymous */}
        <fieldset className="bg-white rounded-xl border border-slate-200 p-5">
          <legend className={sectionTitle}>
            <Eye className="w-4 h-4 text-teal-600" aria-hidden="true" />
            Submit Anonymously
          </legend>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-slate-700">
              Submit anonymously. Anonymous reporting can help support psychologically safe learning.
            </span>
          </label>
          {!anonymous && (
            <input
              type="text"
              value={reporterIdentifier}
              onChange={(e) => setReporterIdentifier(e.target.value)}
              placeholder="Optional fictional staff identifier for demonstration"
              className="mt-3 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              aria-label="Reporter identifier"
            />
          )}
        </fieldset>

        {submitError && (
          <Alert variant="error">{submitError}</Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="submit"
            disabled={submitting || !isFormValid || harmWarning}
            className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {submitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Report
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
