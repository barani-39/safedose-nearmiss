import { describe, it, expect, beforeEach } from 'vitest';
import { recordAuditEvent, getLocalAuditEvents, getAuditTrailSummary } from '../src/lib/audit';

describe('Append-only Audit Trail & Offline Buffering System', () => {
  // Mock localStorage for test environment
  const store: Record<string, string> = {};
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    globalThis.localStorage = {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => delete store[k],
      clear: () => Object.keys(store).forEach((k) => delete store[k]),
      length: 0,
      key: () => null,
    } as unknown as Storage;
  });

  it('records an audit event with timestamps, roles, and action metadata', async () => {
    await recordAuditEvent({
      action: 'REPORT_SUBMITTED',
      resource_type: 'REPORT',
      resource_id: 'test-rep-001',
      user_id: 'usr-123',
      user_role: 'REPORTER',
      details: { ward: 'ICU', priority: 'HIGH' },
    });

    const events = getLocalAuditEvents();
    expect(events.length).toBe(1);
    expect(events[0].action).toBe('REPORT_SUBMITTED');
    expect(events[0].resource_type).toBe('REPORT');
    expect(events[0].resource_id).toBe('test-rep-001');
    expect(events[0].user_role).toBe('REPORTER');
    expect(events[0].details).toEqual({ ward: 'ICU', priority: 'HIGH' });
    expect(new Date(events[0].created_at).getTime()).toBeGreaterThan(0);
  });

  it('orders audit events in reverse chronological order', async () => {
    await recordAuditEvent({
      action: 'ACTION_FIRST',
      resource_type: 'REPORT',
      user_role: 'REVIEWER',
    });

    await recordAuditEvent({
      action: 'ACTION_SECOND',
      resource_type: 'EXPORT',
      user_role: 'ADMIN',
    });

    const events = getLocalAuditEvents();
    expect(events.length).toBe(2);
    expect(events[0].action).toBe('ACTION_SECOND');
    expect(events[1].action).toBe('ACTION_FIRST');
  });

  it('sanitizes sensitive data and narrative text before saving to offline buffer', async () => {
    await recordAuditEvent({
      action: 'REPORT_SUBMITTED',
      resource_type: 'REPORT',
      resource_id: 'rep-456',
      user_role: 'REPORTER',
      details: {
        ward: 'Emergency',
        password: 'sensitive-password-123',
        token: 'jwt-auth-bearer-token',
        short_description: 'Patient John Doe received extra insulin',
        count: 1,
      },
    });

    const events = getLocalAuditEvents();
    expect(events.length).toBe(1);
    const details = events[0].details;
    expect(details.ward).toBe('Emergency');
    expect(details.count).toBe(1);
    expect(details.password).toBe('[REDACTED_FOR_PRIVACY]');
    expect(details.token).toBe('[REDACTED_FOR_PRIVACY]');
    expect(details.short_description).toBe('[REDACTED_FOR_PRIVACY]');
  });

  it('tracks offline buffered status and returns correct audit summary', async () => {
    await recordAuditEvent({
      action: 'EXPORT_GENERATED',
      resource_type: 'EXPORT',
      user_role: 'ADMIN',
      details: { format: 'CSV' },
    });

    const summary = getAuditTrailSummary();
    expect(summary.totalLocal).toBe(1);
    // In test environment without a real remote Supabase response, event is buffered offline
    expect(summary.pendingBuffer).toBe(1);
  });
});
