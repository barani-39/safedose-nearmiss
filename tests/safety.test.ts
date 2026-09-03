import { describe, it, expect } from 'vitest';
import {
  detectMedicalAdviceRequest,
  detectIdentifyingInformation,
  detectHarmContradiction,
  isVagueDescription,
  classifyReport,
  calculateCompletenessScore,
  calculateBaselineCompleteness,
} from '../src/lib/safety';

describe('Safety & Clinical Boundary Validation', () => {
  it('detects medical advice requests and clinical queries', () => {
    expect(detectMedicalAdviceRequest('What dose should I give to this patient?')).toBe(true);
    expect(detectMedicalAdviceRequest('Should I stop this medication immediately?')).toBe(true);
    expect(detectMedicalAdviceRequest('How much should I administer for pediatric sepsis?')).toBe(true);
    expect(detectMedicalAdviceRequest('Is this dose safe for renal impairment?')).toBe(true);

    // Legitimate near-miss narratives should NOT trigger false positives
    expect(detectMedicalAdviceRequest('Vial had similar packaging to heparin and was almost drawn up.')).toBe(false);
    expect(detectMedicalAdviceRequest('Infusion rate was set to 100ml instead of 10ml by mistake.')).toBe(false);
  });

  it('detects identifying information (PII, hospital numbers, phones, emails)', () => {
    expect(detectIdentifyingInformation('Contact me at nurse.jones@hospital.org')).toContain('email address');
    expect(detectIdentifyingInformation('Call ward on 07123456789')).toContain('phone number');
    expect(detectIdentifyingInformation('Patient MRN: 98765432 was in bed 2')).toContain('hospital/MRN number');
    expect(detectIdentifyingInformation('Patient called Smith was transferred')).toContain('patient name reference');

    // Safe operational narrative with no PII
    expect(detectIdentifyingInformation('Syringe was prepared with 10 units instead of 5 units.')).toEqual([]);
  });

  it('detects harm contradictions when harmStatus is No but narrative contains harm keywords', () => {
    expect(detectHarmContradiction('Patient was seriously harmed by the overdose', 'No')).toBe(true);
    expect(detectHarmContradiction('Patient died shortly after administration', 'No')).toBe(true);
    expect(detectHarmContradiction('Harm occurred during the infusion', 'No')).toBe(true);

    // Proper near miss with zero harm
    expect(detectHarmContradiction('Error caught during independent double check before patient contact', 'No')).toBe(false);
  });

  it('detects vague or uninformative descriptions', () => {
    expect(isVagueDescription('error')).toBe(true);
    expect(isVagueDescription('something went wrong')).toBe(true);
    expect(isVagueDescription('mistake')).toBe(true);
    expect(isVagueDescription('short')).toBe(true);

    // Informative detailed description
    expect(
      isVagueDescription('Look-alike insulin vial retrieved from fridge during night shift emergency.')
    ).toBe(false);
  });

  it('classifies reports deterministically based on keywords', () => {
    const wrongDose = classifyReport('Nurse drew up 10 units of insulin instead of 1 unit dose error.');
    expect(wrongDose.suggestedCategory).toBe('Wrong Dose');
    expect(['HIGH', 'MEDIUM']).toContain(wrongDose.confidence);

    const wrongMed = classifyReport('Wrong medication vial selected due to similar packaging labels.');
    expect(['Wrong Medication', 'Labelling Error']).toContain(wrongMed.suggestedCategory);

    const duplicate = classifyReport('Duplicate order for medication that was already ordered.');
    expect(duplicate.suggestedCategory).toBe('Duplicate Order');
  });

  it('calculates deterministic completeness scores correctly', () => {
    const fullReport = {
      ward: 'ICU',
      medicine_category: 'Insulin',
      workflow_stage: 'Preparation',
      incident_type: 'Wrong Dose',
      contributing_factors: ['Workload', 'Distraction'],
      short_description: 'Vial of U-500 was retrieved instead of U-100 but caught during double check.',
      operational_priority: 'HIGH',
    };
    expect(calculateCompletenessScore(fullReport)).toBe(100);

    const incompleteReport = {
      ward: 'ICU',
      medicine_category: '',
      workflow_stage: '',
      incident_type: '',
      contributing_factors: [],
      short_description: 'Too short',
      operational_priority: '',
    };
    expect(calculateCompletenessScore(incompleteReport)).toBe(14); // only ward present
  });

  it('calculates baseline completeness score accurately', () => {
    const baselineFull = {
      ward: 'ICU',
      description: 'Nurse gave insulin without checking blood sugar levels first.',
    };
    expect(calculateBaselineCompleteness(baselineFull)).toBe(100);

    const baselineEmpty = {
      ward: '',
      description: 'short',
    };
    expect(calculateBaselineCompleteness(baselineEmpty)).toBe(0);
  });
});
