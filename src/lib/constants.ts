export const WARDS = [
  'ICU',
  'Emergency',
  'Medical Ward',
  'Surgical Ward',
  'Paediatrics',
  'Other',
] as const;

export const MEDICINE_CATEGORIES = [
  'Insulin',
  'Anticoagulant',
  'Opioid',
  'Chemotherapy',
  'Concentrated Electrolyte',
  'Sedative',
  'Other High-Risk Medicine',
  'Other',
] as const;

export const WORKFLOW_STAGES = [
  'Prescribing',
  'Transcription',
  'Dispensing',
  'Storage',
  'Preparation',
  'Administration',
  'Monitoring',
  'Handover',
  'Other',
] as const;

export const INCIDENT_TYPES = [
  'Wrong Dose',
  'Wrong Medication',
  'Duplicate Order',
  'Wrong Route',
  'Wrong Timing',
  'Storage Error',
  'Labelling Error',
  'Communication Error',
  'Prescribing Error',
  'Other',
] as const;

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export const CONTRIBUTING_FACTORS = [
  'Workload',
  'Interruption',
  'Staffing',
  'Communication',
  'Handover',
  'Similar Packaging',
  'Storage Layout',
  'Labelling',
  'Electronic System',
  'Training',
  'Environment',
  'Other',
] as const;

export const STATUSES = [
  'Submitted',
  'Under Review',
  'Action Required',
  'Closed',
] as const;

export const HARM_STATUSES = ['No', 'Yes', 'Unsure'] as const;

export const ADMINISTERED_OPTIONS = ['Yes', 'No', 'Unsure'] as const;

export const MEDICAL_DISCLAIMER =
  'SafeDose NearMiss provides operational safety support only. It does not provide medical advice or replace approved clinical escalation procedures.';

export const MEDICAL_ADVICE_RESPONSE =
  'SafeDose NearMiss does not provide medical advice. Please follow your organisation\u2019s approved clinical escalation and medication safety procedures.';
