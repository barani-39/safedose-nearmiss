import { describe, it, expect, beforeEach } from 'vitest';
import { recordAuditEvent, getLocalAuditEvents } from '../src/lib/audit';

describe('Audit Logging System', () => {
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
});
