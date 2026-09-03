export type OperationalPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type ReportStatus = 'Submitted' | 'Under Review' | 'Action Required' | 'Closed';

export type PatientHarmStatus = 'No' | 'Yes' | 'Unsure';

export type AdministeredStatus = 'Yes' | 'No' | 'Unsure';

export type ReportingMethod = 'BASELINE' | 'SAFEDOSE';

export interface NearMissReport {
  id: string;
  created_at: string;
  updated_at: string;
  ward: string;
  custom_ward: string | null;
  medicine_category: string;
  workflow_stage: string;
  incident_type: string;
  operational_priority: OperationalPriority;
  contributing_factors: string[];
  short_description: string;
  immediate_action: string | null;
  medication_administered: AdministeredStatus;
  patient_harm_status: PatientHarmStatus;
  anonymous: boolean;
  reporter_identifier: string | null;
  status: ReportStatus;
  reviewer_notes: string | null;
  suggested_category: string | null;
  suggestion_confidence: string | null;
  human_verified_category: string | null;
  reviewed_at: string | null;
  is_synthetic: boolean;
}

export interface ReportInsert {
  ward: string;
  custom_ward?: string | null;
  medicine_category: string;
  workflow_stage: string;
  incident_type: string;
  operational_priority: OperationalPriority;
  contributing_factors: string[];
  short_description: string;
  immediate_action?: string | null;
  medication_administered: AdministeredStatus;
  patient_harm_status: PatientHarmStatus;
  anonymous: boolean;
  reporter_identifier?: string | null;
  status?: ReportStatus;
  suggested_category?: string | null;
  suggestion_confidence?: string | null;
  is_synthetic?: boolean;
}

export interface ReportUpdate {
  status?: ReportStatus;
  reviewer_notes?: string | null;
  human_verified_category?: string | null;
  reviewed_at?: string | null;
  ward?: string;
  medicine_category?: string;
  workflow_stage?: string;
  incident_type?: string;
  operational_priority?: OperationalPriority;
}

export interface EvaluationSession {
  id: string;
  created_at: string;
  reporting_method: ReportingMethod;
  completion_seconds: number | null;
  completeness_score: number | null;
  usable_report: boolean | null;
  satisfaction_score: number | null;
  ward: string | null;
  description: string | null;
  notes: string | null;
}

export interface ClassificationSuggestion {
  suggestedCategory: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  matchedKeywords: string[];
}
