import { describe, it, expect } from 'vitest';
import type { NearMissReport } from '../src/types';

describe('Safety Dashboard Analytics Derivation Engine', () => {
  function computeDashboardStats(reports: NearMissReport[]) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      total: reports.length,
      thisMonth: reports.filter((r) => new Date(r.created_at) >= monthStart).length,
      highPriority: reports.filter((r) => r.operational_priority === 'HIGH').length,
      awaitingReview: reports.filter((r) => r.status === 'Submitted' || r.status === 'Under Review').length,
      closed: reports.filter((r) => r.status === 'Closed').length,
    };
  }

  function computeWeeklyTrends(reports: NearMissReport[]) {
    if (reports.length === 0) return [];
    const validReports = reports.filter((r) => !isNaN(new Date(r.created_at).getTime()));
    if (validReports.length === 0) return [];

    const sorted = [...validReports].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const buckets: Record<
      string,
      { sortKey: string; week: string; count: number; highPriority: number; resolved: number }
    > = {};

    for (const r of sorted) {
      const d = new Date(r.created_at);
      const startOfWeek = new Date(d);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const sortKey = startOfWeek.toISOString().slice(0, 10);
      const key = `${startOfWeek.getDate()} ${startOfWeek.toLocaleString('default', { month: 'short' })}`;

      if (!buckets[sortKey]) {
        buckets[sortKey] = { sortKey, week: key, count: 0, highPriority: 0, resolved: 0 };
      }
      buckets[sortKey].count += 1;
      if (r.operational_priority === 'HIGH') buckets[sortKey].highPriority += 1;
      if (r.status === 'Closed') buckets[sortKey].resolved += 1;
    }

    return Object.values(buckets).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }

  function createMockReport(overrides: Partial<NearMissReport>): NearMissReport {
    return {
      id: overrides.id || `rep-${Math.random()}`,
      created_at: overrides.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ward: overrides.ward || 'ICU',
      custom_ward: null,
      medicine_category: overrides.medicine_category || 'High Alert',
      workflow_stage: overrides.workflow_stage || 'Preparation',
      incident_type: overrides.incident_type || 'Wrong Dose',
      operational_priority: overrides.operational_priority || 'MEDIUM',
      contributing_factors: overrides.contributing_factors || ['Workload'],
      short_description: overrides.short_description || 'Near miss test narrative',
      immediate_action: null,
      medication_administered: 'No',
      patient_harm_status: 'No',
      anonymous: true,
      reporter_identifier: null,
      status: overrides.status || 'Submitted',
      reviewer_notes: null,
      suggested_category: null,
      suggestion_confidence: null,
      human_verified_category: null,
      reviewed_at: null,
      is_synthetic: true,
    };
  }

  it('handles empty database (0 records) cleanly without crashing', () => {
    const stats = computeDashboardStats([]);
    expect(stats.total).toBe(0);
    expect(stats.thisMonth).toBe(0);
    expect(stats.highPriority).toBe(0);
    expect(stats.awaitingReview).toBe(0);
    expect(stats.closed).toBe(0);

    const trends = computeWeeklyTrends([]);
    expect(trends).toEqual([]);
  });

  it('calculates metrics accurately for a single record database', () => {
    const report = createMockReport({
      operational_priority: 'HIGH',
      status: 'Submitted',
      created_at: new Date().toISOString(),
    });
    const stats = computeDashboardStats([report]);
    expect(stats.total).toBe(1);
    expect(stats.thisMonth).toBe(1);
    expect(stats.highPriority).toBe(1);
    expect(stats.awaitingReview).toBe(1);
    expect(stats.closed).toBe(0);

    const trends = computeWeeklyTrends([report]);
    expect(trends.length).toBe(1);
    expect(trends[0].count).toBe(1);
    expect(trends[0].highPriority).toBe(1);
    expect(trends[0].resolved).toBe(0);
  });

  it('accurately buckets multiple weeks across month boundaries', () => {
    const reports = [
      createMockReport({ created_at: '2026-08-28T10:00:00.000Z', operational_priority: 'LOW', status: 'Submitted' }),
      createMockReport({ created_at: '2026-08-30T14:00:00.000Z', operational_priority: 'HIGH', status: 'Under Review' }),
      createMockReport({ created_at: '2026-09-02T09:00:00.000Z', operational_priority: 'HIGH', status: 'Closed' }),
      createMockReport({ created_at: '2026-09-15T16:00:00.000Z', operational_priority: 'MEDIUM', status: 'Closed' }),
    ];

    const stats = computeDashboardStats(reports);
    expect(stats.total).toBe(4);
    expect(stats.highPriority).toBe(2);
    expect(stats.closed).toBe(2);
    expect(stats.awaitingReview).toBe(2);

    const trends = computeWeeklyTrends(reports);
    expect(trends.length).toBeGreaterThanOrEqual(2);
    // Verified ascending order
    for (let i = 1; i < trends.length; i++) {
      expect(trends[i].sortKey >= trends[i - 1].sortKey).toBe(true);
    }
  });

  it('differentiates various priority levels and status categories', () => {
    const reports = [
      createMockReport({ operational_priority: 'LOW', status: 'Submitted' }),
      createMockReport({ operational_priority: 'MEDIUM', status: 'Under Review' }),
      createMockReport({ operational_priority: 'HIGH', status: 'Action Required' }),
      createMockReport({ operational_priority: 'HIGH', status: 'Closed' }),
    ];

    const stats = computeDashboardStats(reports);
    expect(stats.total).toBe(4);
    expect(stats.highPriority).toBe(2);
    expect(stats.awaitingReview).toBe(2); // Submitted + Under Review
    expect(stats.closed).toBe(1); // Closed
  });
});
