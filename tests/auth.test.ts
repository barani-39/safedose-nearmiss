import { describe, it, expect } from 'vitest';
import type { UserRole } from '../src/types';

describe('Role-Based Access Control (RBAC) Logic', () => {
  function isReviewerOrAdmin(role: UserRole): boolean {
    return role === 'REVIEWER' || role === 'ADMIN';
  }

  function canSubmitReport(role: UserRole): boolean {
    // All roles, including anonymous, can submit near-miss reports
    return ['ANONYMOUS', 'REPORTER', 'REVIEWER', 'ADMIN'].includes(role);
  }

  function canEditReviews(role: UserRole): boolean {
    return role === 'REVIEWER' || role === 'ADMIN';
  }

  function canAccessAuditTrail(role: UserRole): boolean {
    return role === 'ADMIN';
  }

  it('permits anonymous and reporter users to submit reports', () => {
    expect(canSubmitReport('ANONYMOUS')).toBe(true);
    expect(canSubmitReport('REPORTER')).toBe(true);
  });

  it('restricts triage and reviewer notes editing to REVIEWER and ADMIN', () => {
    expect(canEditReviews('ANONYMOUS')).toBe(false);
    expect(canEditReviews('REPORTER')).toBe(false);
    expect(canEditReviews('REVIEWER')).toBe(true);
    expect(canEditReviews('ADMIN')).toBe(true);
  });

  it('correctly evaluates isReviewerOrAdmin helper', () => {
    expect(isReviewerOrAdmin('ANONYMOUS')).toBe(false);
    expect(isReviewerOrAdmin('REPORTER')).toBe(false);
    expect(isReviewerOrAdmin('REVIEWER')).toBe(true);
    expect(isReviewerOrAdmin('ADMIN')).toBe(true);
  });

  it('restricts administrative audit trail oversight to ADMIN', () => {
    expect(canAccessAuditTrail('ANONYMOUS')).toBe(false);
    expect(canAccessAuditTrail('REPORTER')).toBe(false);
    expect(canAccessAuditTrail('REVIEWER')).toBe(false);
    expect(canAccessAuditTrail('ADMIN')).toBe(true);
  });
});
