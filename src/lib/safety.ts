import type { ClassificationSuggestion } from '@/types';

const MEDICAL_ADVICE_PATTERNS = [
  /what dose should i give/i,
  /should i (stop|start|give|administer) (this )?medic(ine|ation)/i,
  /what medication should/i,
  /is this treatment correct/i,
  /what should i prescribe/i,
  /correct dose/i,
  /how much should i (give|administer)/i,
  /should i increase|decrease the dose/i,
  /is this dose safe/i,
  /what do i give the patient/i,
];

const PHONE_PATTERN = /(\b\d[\d\s-]{8,}\d\b)|(\b0\d{10,11}\b)/;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const HOSPITAL_NUMBER_PATTERN = /\b(MRN|hospital number|NHS|patient ID|URN)\s*[:#]?\s*\w+\b/i;
const NAME_PATTERN = /\b(patient name|patient called)\s*[:#]?\s*[A-Za-z]+\b/i;

const HARM_KEYWORDS = [
  'seriously harmed',
  'patient was harmed',
  'patient died',
  'cardiac arrest',
  'patient injury',
  'harm occurred',
  'patient deteriorated',
  'adverse outcome',
  'patient was injured',
];

const VAGUE_PATTERNS = [
  /^something (happened|went wrong|occurred)\.?\s*$/i,
  /^error\.?\s*$/i,
  /^mistake\.?\s*$/i,
  /^not sure\.?\s*$/i,
  /^don'?t know\.?\s*$/i,
  /^nothing\.?\s*$/i,
  /^problem\.?\s*$/i,
];

const KEYWORD_MAP: Record<string, string[]> = {
  'Wrong Dose': ['dose', 'dosage', 'wrong dose', 'too much', 'too little', 'overdose', 'underdose', 'mg', 'ml', 'units'],
  'Wrong Medication': ['wrong medication', 'wrong medicine', 'wrong drug', 'incorrect medication', 'incorrect drug', 'wrong patient'],
  'Duplicate Order': ['duplicate', 'double order', 'already ordered', 'repeated order', 'second order'],
  'Wrong Route': ['route', 'wrong route', 'iv instead', 'oral instead', 'intravenous', 'incorrect route'],
  'Wrong Timing': ['timing', 'wrong time', 'late', 'early', 'delayed', 'scheduled time'],
  'Storage Error': ['storage', 'stored', 'fridge', 'wrong location', 'incorrect location', 'shelf'],
  'Labelling Error': ['label', 'labelling', 'labeling', 'mislabelled', 'mislabeled', 'wrong label'],
  'Communication Error': ['communication', 'miscommunication', 'not informed', 'unclear', 'misunderstanding', 'verbal'],
  'Prescribing Error': ['prescribing', 'prescribed', 'prescription', 'prescription error', 'order entry', 'e-prescribing'],
};

export function detectMedicalAdviceRequest(text: string): boolean {
  return MEDICAL_ADVICE_PATTERNS.some((p) => p.test(text));
}

export function detectIdentifyingInformation(text: string): string[] {
  const detected: string[] = [];
  if (EMAIL_PATTERN.test(text)) detected.push('email address');
  if (PHONE_PATTERN.test(text)) detected.push('phone number');
  if (HOSPITAL_NUMBER_PATTERN.test(text)) detected.push('hospital/MRN number');
  if (NAME_PATTERN.test(text)) detected.push('patient name reference');
  return detected;
}

export function detectHarmContradiction(text: string, harmStatus: string): boolean {
  if (harmStatus === 'No') {
    const lower = text.toLowerCase();
    return HARM_KEYWORDS.some((kw) => lower.includes(kw));
  }
  return false;
}

export function isVagueDescription(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 15) return true;
  return VAGUE_PATTERNS.some((p) => p.test(trimmed));
}

export function classifyReport(text: string): ClassificationSuggestion {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  const matched: string[] = [];

  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += 1;
        if (!matched.includes(kw)) matched.push(kw);
      }
    }
    if (score > 0) scores[category] = score;
  }

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return {
      suggestedCategory: 'Other',
      confidence: 'LOW',
      matchedKeywords: [],
    };
  }

  const [bestCategory, bestScore] = entries[0];
  let confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  if (bestScore >= 3) confidence = 'HIGH';
  else if (bestScore >= 2) confidence = 'MEDIUM';
  else confidence = 'LOW';

  return {
    suggestedCategory: bestCategory,
    confidence,
    matchedKeywords: matched,
  };
}

export function calculateCompletenessScore(report: {
  ward: string;
  medicine_category: string;
  workflow_stage: string;
  incident_type: string;
  contributing_factors: string[];
  short_description: string;
  operational_priority: string;
}): number {
  const fields = [
    !!report.ward && report.ward.trim().length > 0,
    !!report.medicine_category && report.medicine_category.trim().length > 0,
    !!report.workflow_stage && report.workflow_stage.trim().length > 0,
    !!report.incident_type && report.incident_type.trim().length > 0,
    report.contributing_factors.length > 0,
    report.short_description.trim().length >= 20,
    !!report.operational_priority && report.operational_priority.trim().length > 0,
  ];

  const present = fields.filter(Boolean).length;
  return Math.round((present / fields.length) * 100);
}

export function calculateBaselineCompleteness(report: {
  ward: string;
  description: string;
}): number {
  const fields = [
    !!report.ward && report.ward.trim().length > 0,
    report.description.trim().length >= 20,
  ];
  const present = fields.filter(Boolean).length;
  return Math.round((present / fields.length) * 100);
}
