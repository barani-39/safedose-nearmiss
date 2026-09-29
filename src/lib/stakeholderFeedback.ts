export interface StakeholderFeedback {
  id: string;
  role: string;
  name: string;
  hospitalTrust: string;
  department: string;
  avatarInitials: string;
  rating: number; // 1-5
  psychologicalSafetyScore: number; // 1-5
  timeSavedPercent: number;
  quote: string;
  keyBenefit: string;
  isSyntheticDemo: boolean;
  dateSubmitted: string;
  verificationStatus?: 'Verified' | 'Pending Verification';
  consentGiven?: boolean;
  appVersion?: string;
}

export const SYNTHETIC_STAKEHOLDER_FEEDBACK: StakeholderFeedback[] = [
  {
    id: 'fb-001',
    role: 'Lead Clinical Nurse Specialist - ICU',
    name: 'Sister Rachel Henderson, RN',
    hospitalTrust: 'St. Jude Academic Medical Centre',
    department: 'Intensive Care Unit (Critical Care)',
    avatarInitials: 'RH',
    rating: 5,
    psychologicalSafetyScore: 5,
    timeSavedPercent: 74,
    quote:
      'In a busy ICU with continuous alarms, standard incident systems take 20 minutes of tedious essay-writing that nobody has time for during a 12-hour shift. SafeDose lets our nurses log a near-miss on the ward iPad in under 55 seconds. Default anonymity removed the fear of blame completely.',
    keyBenefit: '60-second shift-friendly workflow & zero-blame anonymous culture',
    isSyntheticDemo: true,
    dateSubmitted: '2026-08-15',
  },
  {
    id: 'fb-002',
    role: 'Consultant Clinical Pharmacist & Medication Safety Officer',
    name: 'Dr. Marcus Vance, PharmD',
    hospitalTrust: 'Greater Western University Hospitals NHS Foundation Trust',
    department: 'Pharmacy Safety & Governance',
    avatarInitials: 'MV',
    rating: 5,
    psychologicalSafetyScore: 4.9,
    timeSavedPercent: 68,
    quote:
      'Because SafeDose requires structured fields like workflow stage and contributing factors, our safety committee doesn’t have to waste days deciphering vague free text. We identified a storage packaging mix-up between two concentrated electrolyte vials within 48 hours and resolved it hospital-wide before an actual patient incident occurred.',
    keyBenefit: 'Structured systemic categorization & actionable root-cause cluster analytics',
    isSyntheticDemo: true,
    dateSubmitted: '2026-08-19',
  },
  {
    id: 'fb-003',
    role: 'Paediatric Inpatient Ward Sister',
    name: 'Eleanor Thorne, RCN',
    hospitalTrust: 'Metropolitan Children’s Hospital',
    department: 'Paediatric Surgical Inpatients',
    avatarInitials: 'ET',
    rating: 4.8,
    psychologicalSafetyScore: 5,
    timeSavedPercent: 76,
    quote:
      'Paediatric weight-based dose calculations are prone to near-misses. Staff used to keep silent when they caught a math error during an independent double-check because they worried it would be used against them in appraisals. SafeDose reframed near-misses as organizational successes—reporting doubled in 3 weeks.',
    keyBenefit: 'Reframing interceptions as proactive safety successes rather than personal failures',
    isSyntheticDemo: true,
    dateSubmitted: '2026-08-22',
  },
  {
    id: 'fb-004',
    role: 'Director of Clinical Governance & Patient Safety',
    name: 'Prof. Alistair Sterling, MD, FRCP',
    hospitalTrust: 'Kingfisher Regional Healthcare Trust',
    department: 'Clinical Governance & Risk Management',
    avatarInitials: 'AS',
    rating: 4.9,
    psychologicalSafetyScore: 4.8,
    timeSavedPercent: 70,
    quote:
      'The strict safety guardrails in SafeDose are exemplary. The boundary detection that refuses medical advice and forces genuine patient harm into official serious-incident pathways gives our legal and clinical executive board absolute assurance regarding regulatory compliance.',
    keyBenefit: 'Guaranteed clinical boundaries, zero medical advice liability, and strict harm routing',
    isSyntheticDemo: true,
    dateSubmitted: '2026-08-27',
  },
];
