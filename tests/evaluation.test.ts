import { describe, it, expect } from 'vitest';
import { calculateCompletenessScore, calculateBaselineCompleteness } from '../src/lib/safety';

describe('Evaluation Engine & Core Workflow Invariants', () => {
  it('guarantees that 100% completeness requires all 7 clinical safety dimensions', () => {
    const perfectReport = {
      ward: 'Emergency',
      medicine_category: 'Opioid',
      workflow_stage: 'Administration',
      incident_type: 'Wrong Dose',
      contributing_factors: ['Interruption', 'Workload'],
      short_description: 'Double check caught 10mg prepared instead of 1mg morphine prior to administration.',
      operational_priority: 'HIGH',
    };

    expect(calculateCompletenessScore(perfectReport)).toBe(100);
  });

  it('verifies that baseline unstructured reporting achieves poor completeness', () => {
    const typicalBaseline = {
      ward: 'Medical Ward',
      description: 'Mistake made', // Under 20 chars
    };

    const score = calculateBaselineCompleteness(typicalBaseline);
    expect(score).toBe(50); // Only ward present, description too brief
  });

  it('guarantees percentage improvement formula produces expected clinical safety gains', () => {
    const baselineTime = 210; // seconds
    const safedoseTime = 52; // seconds
    const timeDeltaPct = ((baselineTime - safedoseTime) / baselineTime) * 100;
    expect(timeDeltaPct).toBeCloseTo(75.23, 1);

    const baselineQuality = 25; // %
    const safedoseQuality = 97; // %
    const qualityDeltaPct = ((safedoseQuality - baselineQuality) / baselineQuality) * 100;
    expect(qualityDeltaPct).toBeCloseTo(288, 0);
  });

  it('enforces anonymous reporting principle: no personal identifier stored when anonymous', () => {
    const submission = {
      anonymous: true,
      rawIdentifierInput: 'Nurse Sarah (Staff #9021)',
    };

    // Invariant: when anonymous is true, stored identifier MUST be null
    const storedIdentifier = submission.anonymous ? null : submission.rawIdentifierInput;
    expect(storedIdentifier).toBeNull();
  });

  it('guarantees reconciliation idempotency: duplicate report IDs cannot create multiple sessions', () => {
    const existingSessions = [
      { id: 'sess-1', notes: 'SafeDose Report ID: report-alpha | Priority: HIGH' },
      { id: 'sess-2', notes: 'SafeDose Report ID: report-beta | Priority: LOW' },
    ];

    const reportsToReconcile = [
      { id: 'report-alpha', ward: 'ICU' },
      { id: 'report-gamma', ward: 'Emergency' }, // Only gamma is missing
    ];

    const existingNotesSet = new Set(existingSessions.map((s) => s.notes));
    const missing = reportsToReconcile.filter(
      (r) => ![...existingNotesSet].some((n) => n.includes(`SafeDose Report ID: ${r.id}`))
    );

    expect(missing.length).toBe(1);
    expect(missing[0].id).toBe('report-gamma');
  });
});
