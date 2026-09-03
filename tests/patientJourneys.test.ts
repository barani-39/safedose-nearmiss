import { describe, it, expect } from 'vitest';
import { SYNTHETIC_STAKEHOLDER_FEEDBACK } from '../src/lib/stakeholderFeedback';

describe('Patient Safety Journeys & Clinical Validation Standards', () => {
  it('validates that stakeholder feedback contains required clinical roles and transparency flags', () => {
    expect(SYNTHETIC_STAKEHOLDER_FEEDBACK.length).toBeGreaterThanOrEqual(4);

    for (const item of SYNTHETIC_STAKEHOLDER_FEEDBACK) {
      expect(item.id).toBeDefined();
      expect(item.role).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.hospitalTrust).toBeDefined();
      expect(item.rating).toBeGreaterThanOrEqual(1);
      expect(item.rating).toBeLessThanOrEqual(5);
      expect(item.psychologicalSafetyScore).toBeGreaterThanOrEqual(4);
      expect(item.isSyntheticDemo).toBe(true);
      expect(item.quote.length).toBeGreaterThan(30);
      expect(item.keyBenefit.length).toBeGreaterThan(10);
    }
  });

  it('validates evaluation improvement calculations', () => {
    const baselineTime = 195.0;
    const safedoseTime = 54.0;
    const timeReduction = ((baselineTime - safedoseTime) / baselineTime) * 100;
    expect(timeReduction).toBeGreaterThan(70); // > 70% faster

    const baselineQuality = 28.0;
    const safedoseQuality = 96.0;
    const qualityIncrease = ((safedoseQuality - baselineQuality) / baselineQuality) * 100;
    expect(qualityIncrease).toBeGreaterThan(200); // > 200% improvement
  });
});
