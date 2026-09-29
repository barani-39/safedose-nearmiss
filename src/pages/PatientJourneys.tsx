import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  ArrowRight,
  ChevronRight,
  Activity,
  HeartPulse,
  Syringe,
  Sparkles,
} from 'lucide-react';
import { DisclaimerBar } from '@/components/Alert';
import { MEDICAL_DISCLAIMER } from '@/lib/constants';

interface JourneyStep {
  title: string;
  stage: string;
  time: string;
  description: string;
  actor: string;
  isIntervention?: boolean;
}

interface PatientJourney {
  id: string;
  title: string;
  subtitle: string;
  urgency: 'HIGH' | 'MEDIUM';
  urgencyLabel: string;
  urgencyColor: string;
  patientProfile: {
    age: string;
    setting: string;
    admissionReason: string;
    primaryRisk: string;
  };
  initialSituation: string;
  clinicalWorkflowContext: string;
  nearMissTrigger: string;
  safedoseInterventionPoint: string;
  howDisasterWasAverted: string;
  organizationalLearningAction: string;
  associatedMedicine: string;
  workflowStage: string;
  steps: JourneyStep[];
}

const JOURNEYS: PatientJourney[] = [
  {
    id: 'journey-icu-insulin',
    title: 'Journey 1: Critical Concentrated Insulin Look-Alike Interception',
    subtitle: 'Preventing severe hypoglycemic brain injury through rapid dual-check and storage segregation',
    urgency: 'HIGH',
    urgencyLabel: 'HIGH URGENCY (Immediate Harm Threat)',
    urgencyColor: 'bg-rose-50 text-rose-700 border-rose-200',
    associatedMedicine: 'Regular Insulin vs U-500 Concentrated Insulin',
    workflowStage: 'Preparation & Dispensing',
    patientProfile: {
      age: '58-year-old male',
      setting: 'Intensive Care Unit (Bed 4)',
      admissionReason: 'Severe sepsis secondary to community-acquired pneumonia with stress hyperglycemia',
      primaryRisk: 'Rapid hypoglycemic coma, irreversible encephalopathy, or fatal ventricular arrhythmia',
    },
    initialSituation:
      'A critically ill patient in the ICU had fluctuating blood glucose (18.4 mmol/L) requiring a subcutaneous sliding-scale dose of 6 units Regular Insulin (100 units/mL). It was 03:20 on a high-census night shift with multiple simultaneous mechanical ventilator alarms.',
    clinicalWorkflowContext:
      'The ward drug refrigerator had recently received stock from the central hospital pharmacy. A newly ordered vial of U-500 concentrated insulin (500 units/mL, five times normal concentration) was accidentally placed in the standard insulin drawer directly adjacent to standard U-100 Regular Insulin because both vials featured similar purple flip-off caps.',
    nearMissTrigger:
      'Fatigued by continuous bed alarms and urgent cross-coverage, the bedside ICU nurse opened the refrigerator, grasped the vial with the purple cap, and drew up 6 units on a standard U-100 insulin syringe—unwittingly preparing a 5x concentrated 30-unit actual dose of insulin.',
    safedoseInterventionPoint:
      'Hospital policy mandates independent dual-checking for all high-alert intravenous and insulin medications. The secondary checker, using the SafeDose bedside double-check verification prompt on a handheld ward tablet, compared the physical vial label against the electronic medication administration record (eMAR). The checker caught the minute "500 units/mL" print before the syringe needle was introduced into the patient’s injection port.',
    howDisasterWasAverted:
      'The secondary checker halted administration immediately. The prepared syringe was locked in the disposal sharps safe. Zero units reached the patient. A new dose was drawn from verified U-100 stock with the second checker witnessing. The patient maintained stable glycemic control with zero clinical harm.',
    organizationalLearningAction:
      'Within 60 seconds, the ICU nurse submitted an anonymous SafeDose Near-Miss report highlighting "Look-Alike Packaging" and "Storage Layout". Within 12 hours, the Pharmacy Safety Committee isolated all U-500 insulin into a locked, auxiliary-labelled red cautionary bin, requiring dual-pharmacist biometric authorization prior to ward dispatch.',
    steps: [
      {
        title: 'Bedside Glycemic Spike',
        stage: 'Clinical Indication',
        time: '03:10',
        actor: 'ICU Staff Nurse',
        description: 'Capillary blood glucose reads 18.4 mmol/L. Sliding-scale protocol indicates 6 units Regular Insulin subcutaneous.',
      },
      {
        title: 'Medication Selection Under Fatigue',
        stage: 'Storage & Dispensing',
        time: '03:15',
        actor: 'Primary Nurse',
        description: 'In the refrigerator, U-500 concentrated insulin vial is inadvertently retrieved due to identical purple cap and adjacent placement to U-100.',
      },
      {
        title: '5x Dose Prepared',
        stage: 'Preparation',
        time: '03:18',
        actor: 'Primary Nurse',
        description: '6 marks drawn on U-100 syringe containing 30 actual units of insulin. Syringe brought to Bed 4 bedside table.',
      },
      {
        title: 'SafeDose Dual-Check Interception',
        stage: 'Verification Safeguard',
        time: '03:21',
        actor: 'Secondary Checker Nurse',
        isIntervention: true,
        description: 'Secondary checker cross-checks vial label against tablet checklist. Notices "500 units/mL" warning. Administration aborted before patient contact.',
      },
      {
        title: 'Immediate Remediation & Rapid Report',
        stage: 'Reporting & Prevention',
        time: '03:25',
        actor: 'ICU Care Team',
        description: 'Correct dose prepared and safely given. SafeDose anonymous report submitted in 52 seconds without fear of punitive reprisal.',
      },
    ],
  },
  {
    id: 'journey-paediatric-paracetamol',
    title: 'Journey 2: Paediatric Weight-Based Paracetamol Timing & Handover Latency',
    subtitle: 'Preventing acute accidental acetaminophen redosing during postoperative care handover',
    urgency: 'MEDIUM',
    urgencyLabel: 'MEDIUM URGENCY (Workflow & Latency Risk)',
    urgencyColor: 'bg-amber-50 text-amber-800 border-amber-200',
    associatedMedicine: 'Intravenous Paracetamol (Acetaminophen) 10 mg/mL Infusion',
    workflowStage: 'Prescribing & Administration Timing',
    patientProfile: {
      age: '6-year-old female (21 kg)',
      setting: 'Paediatric Post-Surgical Ward (Room 12B)',
      admissionReason: 'Emergency laparoscopic appendectomy, day 1 postoperative analgesia',
      primaryRisk: 'Acute acetaminophen hepatotoxicity caused by repeated dosing within safe 4-6 hour window',
    },
    initialSituation:
      'A 6-year-old child returned from theatre to the surgical ward at 14:15. In the Post-Anaesthetic Care Unit (PACU), the anaesthetist administered 315 mg IV paracetamol at 13:45 for acute emergence pain. However, PACU paper emergency charts had not yet synchronized with the inpatient electronic health record (EHR).',
    clinicalWorkflowContext:
      'At 14:30, the ward junior doctor completed standard post-op admission orders. Not seeing any recorded analgesia in the active EHR digital chart, the doctor ordered 315 mg IV paracetamol scheduled for immediate administration at 15:00.',
    nearMissTrigger:
      'The ward nurse, responding to the child’s complaint of mild surgical discomfort, prepared the IV paracetamol infusion bottle at 14:50 and connected the infusion line to the volumetric pump, preparing to start the infusion 65 minutes after the recovery dose.',
    safedoseInterventionPoint:
      'During the SafeDose bedside structured verification checklist, the nurse reached the mandatory prompt: "Verify Transfer & Handover Documentation from PACU / Theatre". The nurse paused, opened the paper physical recovery folder in the child’s bedside crib, and saw the anaesthetic signature indicating 315 mg administered at 13:45.',
    howDisasterWasAverted:
      'The nurse recognized that administering an additional 315 mg would violate the strict 4-to-6 hour minimum dosing interval for paediatric patients. The infusion pump was paused and powered down. The nurse informed the paediatric surgical registrar, who adjusted the next scheduled analgesia to 19:45 and ordered alternative non-pharmacological comfort measures. Zero hepatic overdose occurred.',
    organizationalLearningAction:
      'The nurse logged a SafeDose report categorized under "Wrong Timing / Duplicate Order" with contributing factors "Handover" and "Communication". The Hospital Information Technology team updated the EHR gateway to enforce an automatic 4-hour electronic lock on paracetamol prescriptions upon patient transfer from PACU.',
    steps: [
      {
        title: 'Recovery Administration in PACU',
        stage: 'Theatre Transfer',
        time: '13:45',
        actor: 'PACU Anaesthetist',
        description: '315 mg IV paracetamol administered in recovery; recorded on paper theatre chart during transport.',
      },
      {
        title: 'Delayed EHR Chart Synchronization',
        stage: 'Electronic Charting',
        time: '14:20',
        actor: 'Ward Junior Doctor',
        description: 'Doctor enters postoperative orders; digital chart shows no active paracetamol on record. Prescribes 315 mg IV for 15:00.',
      },
      {
        title: 'Infusion Prepared at Bedside',
        stage: 'Preparation',
        time: '14:48',
        actor: 'Paediatric Ward Nurse',
        description: 'IV bottle spiked and line primed on infusion pump. Ready to connect to peripheral cannula.',
      },
      {
        title: 'SafeDose Handover Checklist Trigger',
        stage: 'Bedside Intervention',
        time: '14:52',
        actor: 'Paediatric Ward Nurse',
        isIntervention: true,
        description: 'Checklist requires physical audit of recovery folder. Anaesthetist signature found: dose given at 13:45. Infusion immediately halted.',
      },
      {
        title: 'EHR Gateway Hard-Stop Enhancement',
        stage: 'Systemic Learning',
        time: '15:10',
        actor: 'Pharmacy & IT Committee',
        description: 'SafeDose report submitted in 45 seconds. IT implements automated PACU transfer interlock preventing premature ward orders.',
      },
    ],
  },
];

export function PatientJourneys() {
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>(JOURNEYS[0].id);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const activeJourney = JOURNEYS.find((j) => j.id === selectedJourneyId) || JOURNEYS[0];

  function handleSelectJourney(id: string) {
    setSelectedJourneyId(id);
    setCurrentStepIndex(0);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
            Clinical Safety Case Studies & Walkthroughs
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
            Simulated Hospital Inpatient Scenarios
          </span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Patient Safety Journeys</h1>
        <p className="mt-1 text-sm text-slate-600 max-w-3xl">
          Detailed clinical journeys illustrating how SafeDose intercepts life-threatening errors across varying urgency levels before reaching the patient, transforming potential tragedies into systemic learning.
        </p>
      </div>

      <DisclaimerBar text={MEDICAL_DISCLAIMER} className="rounded-xl shadow-sm" />

      {/* Journey Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {JOURNEYS.map((j) => {
          const isSelected = j.id === selectedJourneyId;
          return (
            <button
              key={j.id}
              onClick={() => handleSelectJourney(j.id)}
              className={`text-left p-5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${j.urgencyColor}`}>
                  {j.urgencyLabel}
                </span>
                <span className="text-xs font-medium text-slate-400">{j.workflowStage}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 line-clamp-1">{j.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{j.subtitle}</p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>{j.patientProfile.setting}</span>
                <span className="font-semibold text-teal-700 flex items-center gap-1">
                  View Timeline <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Journey Detail Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Journey Banner */}
        <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${activeJourney.urgencyColor}`}>
                {activeJourney.urgencyLabel}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {activeJourney.id}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{activeJourney.title}</h2>
            <p className="text-xs text-slate-300 mt-1">{activeJourney.subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-500 transition shadow-sm"
            >
              <Syringe className="w-4 h-4" /> Simulate Report
            </Link>
          </div>
        </div>

        {/* Patient Clinical Profile Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50/70 text-xs">
          <div className="p-3.5">
            <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">Patient Profile</span>
            <span className="font-semibold text-slate-800">{activeJourney.patientProfile.age}</span>
          </div>
          <div className="p-3.5">
            <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">Clinical Location</span>
            <span className="font-semibold text-slate-800">{activeJourney.patientProfile.setting}</span>
          </div>
          <div className="p-3.5">
            <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">Medicine Involved</span>
            <span className="font-semibold text-teal-800">{activeJourney.associatedMedicine}</span>
          </div>
          <div className="p-3.5">
            <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">Averted Harm Potential</span>
            <span className="font-semibold text-rose-700">{activeJourney.patientProfile.primaryRisk}</span>
          </div>
        </div>

        {/* Journey Interactive Timeline Stepper */}
        <div className="p-6 border-b border-slate-200/80 bg-slate-50/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Step-by-Step Clinical Sequence</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click any step or step forward to inspect the interception dynamics.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentStepIndex === 0}
                className="px-2.5 py-1 text-xs rounded border border-slate-200 bg-white disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentStepIndex((prev) => Math.min(activeJourney.steps.length - 1, prev + 1))}
                disabled={currentStepIndex === activeJourney.steps.length - 1}
                className="px-2.5 py-1 text-xs rounded bg-teal-600 text-white font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          {/* Stepper pills */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {activeJourney.steps.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;
              return (
                <button
                  key={step.title}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`p-3 rounded-lg border text-left transition ${
                    isActive
                      ? step.isIntervention
                        ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20'
                        : 'bg-slate-100 border-slate-400'
                      : isPast
                      ? 'bg-white border-slate-200 opacity-90'
                      : 'bg-white/60 border-slate-200/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono text-slate-400">{step.time}</span>
                    {step.isIntervention && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-600 text-white">
                        INTERCEPT
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-xs text-slate-800 line-clamp-1">{step.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{step.stage}</div>
                </button>
              );
            })}
          </div>

          {/* Selected step details box */}
          <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                activeJourney.steps[currentStepIndex].isIntervention
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {activeJourney.steps[currentStepIndex].isIntervention ? (
                <ShieldAlert className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Step {currentStepIndex + 1}: {activeJourney.steps[currentStepIndex].title} ({activeJourney.steps[currentStepIndex].time})
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  Actor: {activeJourney.steps[currentStepIndex].actor}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                {activeJourney.steps[currentStepIndex].description}
              </p>
            </div>
          </div>
        </div>

        {/* Narrative Deep Dive Breakdown */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Box 1: Initial Situation & Clinical Context */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                <Activity className="w-4 h-4 text-slate-500" />
                1. Initial Situation
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{activeJourney.initialSituation}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                2. Clinical & Workflow Context
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{activeJourney.clinicalWorkflowContext}</p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800 mb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                3. Near-Miss Trigger
              </div>
              <p className="text-xs text-rose-900 leading-relaxed">{activeJourney.nearMissTrigger}</p>
            </div>
          </div>

          {/* Box 2: SafeDose Intervention & Organisational Learning */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-900 mb-2">
                <ShieldAlert className="w-4 h-4 text-teal-700" />
                4. SafeDose Intervention Point
              </div>
              <p className="text-xs text-teal-900 leading-relaxed">{activeJourney.safedoseInterventionPoint}</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                5. How Disaster Was Averted
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">{activeJourney.howDisasterWasAverted}</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 mb-2">
                <Sparkles className="w-4 h-4 text-blue-700" />
                6. Organisational Learning Action
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">{activeJourney.organizationalLearningAction}</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            Psychologically safe near-miss reporting enables hospital systems to fix hazardous latent failures before harm occurs.
          </span>
          <div className="flex items-center gap-2">
            <Link
              to="/review"
              className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900"
            >
              Inspect Active Review Queue <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
