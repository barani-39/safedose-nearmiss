import { supabase } from './supabase';
import type { AuditEvent, UserRole } from '@/types';

/**
 * Append-only server audit trail with best-effort offline buffering.
 * 
 * DESIGN PRINCIPLES:
 * 1. Authoritative Audit: Stored in PostgreSQL `audit_events` table protected by RLS.
 *    Append-only: users and reviewers cannot alter or delete recorded events.
 * 2. Offline Buffer (Non-authoritative): When the network or Supabase backend is unreachable,
 *    events are buffered locally in browser storage with `server_persisted = false` and
 *    `is_buffered_offline = true`. Buffered events are non-authoritative pending synchronization.
 * 3. Data Minimization: Free-text descriptions and sensitive credentials are never stored
 *    in the local offline buffer.
 * 4. Bounded Persistence: Offline buffer is capped at 100 entries with automatic 7-day expiration.
 */

const LOCAL_BUFFER_KEY = 'safedose_audit_log';
const MAX_LOCAL_ENTRIES = 100;
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function sanitizeAuditDetails(details: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const forbiddenKeys = ['password', 'token', 'secret', 'auth', 'short_description', 'immediate_action'];

  for (const [key, value] of Object.entries(details)) {
    if (forbiddenKeys.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED_FOR_PRIVACY]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeAuditDetails(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function recordAuditEvent(params: {
  action: string;
  resource_type: 'REPORT' | 'EVALUATION' | 'AUTH' | 'EXPORT' | 'REVIEW';
  resource_id?: string | null;
  user_id?: string | null;
  user_role: UserRole;
  details?: Record<string, unknown>;
}): Promise<{ id: string; server_persisted: boolean }> {
  const eventId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();
  const safeDetails = sanitizeAuditDetails(params.details || {});

  const event: AuditEvent = {
    id: eventId,
    created_at: now,
    user_id: params.user_id || null,
    user_role: params.user_role,
    action: params.action,
    resource_type: params.resource_type,
    resource_id: params.resource_id || null,
    details: safeDetails,
    server_persisted: false,
    is_buffered_offline: true,
  };

  // 1. Append to local buffer (best-effort)
  try {
    if (typeof localStorage !== 'undefined') {
      const existing = getLocalAuditEvents();
      existing.unshift(event);

      // Clean up expired items & cap size
      const cutoff = Date.now() - RETENTION_MS;
      const filtered = existing
        .filter((e) => new Date(e.created_at).getTime() >= cutoff)
        .slice(0, MAX_LOCAL_ENTRIES);

      localStorage.setItem(LOCAL_BUFFER_KEY, JSON.stringify(filtered));
    }
  } catch {
    // Local storage full or private browsing mode - non-blocking
  }

  // 2. Persist to authoritative Supabase audit_events table
  let serverPersisted = false;
  try {
    const { error } = await supabase.from('audit_events').insert({
      id: event.id,
      user_id: event.user_id,
      user_role: event.user_role,
      action: event.action,
      resource_type: event.resource_type,
      resource_id: event.resource_id,
      details: event.details,
    });

    if (!error) {
      serverPersisted = true;
      markEventAsServerPersisted(event.id);
    }
  } catch {
    // Offline or server unreachable; remains in local buffer as pending
  }

  return { id: eventId, server_persisted: serverPersisted };
}

function markEventAsServerPersisted(eventId: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const existing = getLocalAuditEvents();
    const idx = existing.findIndex((e) => e.id === eventId);
    if (idx !== -1) {
      existing[idx].server_persisted = true;
      existing[idx].is_buffered_offline = false;
      localStorage.setItem(LOCAL_BUFFER_KEY, JSON.stringify(existing));
    }
  } catch {
    // Ignore
  }
}

export function getLocalAuditEvents(): AuditEvent[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_BUFFER_KEY);
      return raw ? JSON.parse(raw) : [];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Attempts to flush unpersisted offline events to the server once online.
 */
export async function flushBufferedAuditEvents(): Promise<{ flushedCount: number; remainingCount: number }> {
  const events = getLocalAuditEvents();
  const unpersisted = events.filter((e) => !e.server_persisted);
  let flushedCount = 0;

  for (const ev of unpersisted) {
    try {
      const { error } = await supabase.from('audit_events').insert({
        id: ev.id,
        user_id: ev.user_id,
        user_role: ev.user_role,
        action: ev.action,
        resource_type: ev.resource_type,
        resource_id: ev.resource_id,
        details: ev.details,
      });

      if (!error) {
        markEventAsServerPersisted(ev.id);
        flushedCount++;
      }
    } catch {
      // Break on network error to prevent tight loops
      break;
    }
  }

  const updatedEvents = getLocalAuditEvents();
  const remainingCount = updatedEvents.filter((e) => !e.server_persisted).length;
  return { flushedCount, remainingCount };
}

export function getAuditTrailSummary(): { totalLocal: number; serverPersisted: number; pendingBuffer: number } {
  const events = getLocalAuditEvents();
  const serverPersisted = events.filter((e) => e.server_persisted).length;
  const pendingBuffer = events.filter((e) => !e.server_persisted).length;
  return {
    totalLocal: events.length,
    serverPersisted,
    pendingBuffer,
  };
}
