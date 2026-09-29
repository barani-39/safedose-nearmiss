import { supabase } from './supabase';
import type { AuditEvent, UserRole } from '@/types';

export async function recordAuditEvent(params: {
  action: string;
  resource_type: 'REPORT' | 'EVALUATION' | 'AUTH' | 'EXPORT' | 'REVIEW';
  resource_id?: string | null;
  user_id?: string | null;
  user_role: UserRole;
  details?: Record<string, unknown>;
}): Promise<void> {
  const event: AuditEvent = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
    user_id: params.user_id || null,
    user_role: params.user_role,
    action: params.action,
    resource_type: params.resource_type,
    resource_id: params.resource_id || null,
    details: params.details || {},
  };

  // 1. Always append to local persistent log
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('safedose_audit_log');
      const existing: AuditEvent[] = raw ? JSON.parse(raw) : [];
      existing.unshift(event);
      // Keep last 200 events locally
      localStorage.setItem('safedose_audit_log', JSON.stringify(existing.slice(0, 200)));
    }
  } catch {
    // Ignore localStorage storage quota or privacy mode issues
  }

  // 2. Persist to Supabase audit_events if available
  try {
    await supabase.from('audit_events').insert({
      user_id: event.user_id,
      user_role: event.user_role,
      action: event.action,
      resource_type: event.resource_type,
      resource_id: event.resource_id,
      details: event.details,
    });
  } catch {
    // Non-blocking for primary application workflows
  }
}

export function getLocalAuditEvents(): AuditEvent[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('safedose_audit_log');
      return raw ? JSON.parse(raw) : [];
    }
    return [];
  } catch {
    return [];
  }
}
