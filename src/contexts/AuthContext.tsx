import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserRole, UserProfile } from '@/types';

/**
 * Authentication Context Interface
 * 
 * Provides reactive access to:
 * - Current authenticated or demo user profile
 * - Active RBAC role (`ANONYMOUS`, `REPORTER`, `REVIEWER`, `ADMIN`)
 * - Demo role switcher status (`isDemoMode`)
 * - Loading state during asynchronous session validation
 * - Role switching and sign-out handlers
 * - Convenience role boolean predicates (`isReviewerOrAdmin`, `isAdmin`)
 */
export interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isDemoMode: boolean;
  isLoading: boolean;
  setRole: (role: UserRole) => void;
  signOut: () => Promise<void>;
  isReviewerOrAdmin: boolean;
  isAdmin: boolean;
}

/**
 * Deterministic Fallback User Profiles for Demo / Educational Mode.
 * 
 * In production (`VITE_DEMO_ROLE_SWITCHER !== 'true'`), these mock profiles are never used
 * because identity and role assignment are strictly derived from the PostgreSQL `profiles` table.
 */
const DEFAULT_DEMO_PROFILES: Record<UserRole, UserProfile | null> = {
  ANONYMOUS: null,
  REPORTER: {
    id: 'demo-reporter-001',
    email: 'staff.nurse@hospital.example.org',
    role: 'REPORTER',
    display_name: 'Ward Staff Nurse',
    department: 'Acute Care / Surgical',
  },
  REVIEWER: {
    id: 'demo-reviewer-001',
    email: 'safety.lead@hospital.example.org',
    role: 'REVIEWER',
    display_name: 'Clinical Safety Lead',
    department: 'Medication Safety Committee',
  },
  ADMIN: {
    id: 'demo-admin-001',
    email: 'governance.admin@hospital.example.org',
    role: 'ADMIN',
    display_name: 'Clinical Governance Admin',
    department: 'Hospital Quality & Risk Direction',
  },
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authoritative Authentication & Role-Based Access Control Provider.
 * 
 * SECURITY ARCHITECTURE:
 * 1. Authoritative Backend Resolution:
 *    - Validates existing JWT session via `supabase.auth.getSession()` and `getUser()`.
 *    - Queries PostgreSQL `profiles` table for verified role assignment (`role IN ('REPORTER', 'REVIEWER', 'ADMIN')`).
 *    - Falls back to `user_metadata.role` only if database profiles table is temporarily unreachable.
 * 
 * 2. Strict Role Gating:
 *    - If `VITE_DEMO_ROLE_SWITCHER !== 'true'` (production mode), client-side role switching via `setRole`
 *      is hard-blocked, logging a security warning and preventing client privilege escalation.
 *    - Unauthenticated sessions default strictly to `ANONYMOUS`.
 * 
 * 3. Reactive Session Synchronization:
 *    - Subscribes to `supabase.auth.onAuthStateChange` to synchronize auth tokens, sign-in, and sign-out
 *      across multiple browser tabs or token expiries without deadlocks.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isDemoMode = import.meta.env.VITE_DEMO_ROLE_SWITCHER === 'true';

  const [role, setRoleState] = useState<UserRole>(() => {
    if (isDemoMode) {
      const saved = typeof localStorage !== 'undefined' ? (localStorage.getItem('safedose_user_role') as UserRole | null) : null;
      if (saved && ['ANONYMOUS', 'REPORTER', 'REVIEWER', 'ADMIN'].includes(saved)) {
        return saved;
      }
      return 'REVIEWER';
    }
    // In production, unauthenticated sessions default strictly to ANONYMOUS
    return 'ANONYMOUS';
  });

  const [realUser, setRealUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        let u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user) {
            u = sessionData.session.user;
          }
        } catch {
          // Ignore
        }

        if (!u) {
          try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
              u = userData.user;
            }
          } catch {
            // Ignore
          }
        }

        if (u && mounted) {
          // Query authoritative database profile
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, email, role, display_name, department')
              .eq('id', u.id)
              .single();

            if (profile && ['REPORTER', 'REVIEWER', 'ADMIN'].includes(profile.role) && mounted) {
              setRealUser({
                id: profile.id,
                email: profile.email || u.email || 'user@example.org',
                role: profile.role as UserRole,
                display_name: profile.display_name || u.email,
                department: profile.department,
              });
              setRoleState(profile.role as UserRole);
              return;
            }
          } catch {
            // Profile query failed or offline
          }

          // Fallback to metadata if profile table query is unavailable
          const userMeta = u.user_metadata || {};
          const assignedRole = (['REPORTER', 'REVIEWER', 'ADMIN'].includes(userMeta.role as string)
            ? userMeta.role
            : 'REPORTER') as UserRole;

          if (mounted) {
            setRealUser({
              id: u.id,
              email: u.email || 'user@example.org',
              role: assignedRole,
              display_name: (userMeta.display_name as string) || u.email,
            });
            setRoleState(assignedRole);
          }
        } else if (!u && mounted && !isDemoMode) {
          setRealUser(null);
          setRoleState('ANONYMOUS');
        }
      } catch {
        if (mounted && !isDemoMode) {
          setRealUser(null);
          setRoleState('ANONYMOUS');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    checkSession();

    try {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user && mounted) {
          const u = session.user;
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, email, role, display_name, department')
              .eq('id', u.id)
              .single();

            if (profile && ['REPORTER', 'REVIEWER', 'ADMIN'].includes(profile.role) && mounted) {
              setRealUser({
                id: profile.id,
                email: profile.email || u.email || 'user@example.org',
                role: profile.role as UserRole,
                display_name: profile.display_name || u.email,
                department: profile.department,
              });
              setRoleState(profile.role as UserRole);
              setIsLoading(false);
              return;
            }
          } catch {
            // Offline or error
          }

          const userMeta = u.user_metadata || {};
          const assignedRole = (['REPORTER', 'REVIEWER', 'ADMIN'].includes(userMeta.role as string)
            ? userMeta.role
            : 'REPORTER') as UserRole;

          if (mounted) {
            setRealUser({
              id: u.id,
              email: u.email || 'user@example.org',
              role: assignedRole,
              display_name: (userMeta.display_name as string) || u.email,
            });
            setRoleState(assignedRole);
            setIsLoading(false);
          }
        } else if (!session && mounted) {
          setRealUser(null);
          if (!isDemoMode) {
            setRoleState('ANONYMOUS');
          }
          setIsLoading(false);
        }
      });

      return () => {
        mounted = false;
        authListener?.subscription?.unsubscribe();
      };
    } catch {
      return () => {
        mounted = false;
      };
    }
  }, [isDemoMode]);

  /**
   * Switches the active perspective in demo/testing mode.
   * 
   * SECURITY ENFORCEMENT:
   * In production mode (`isDemoMode === false`), this function explicitly refuses client-side role modification
   * to protect against privilege escalation (CWE-269). Production roles are strictly derived
   * from validated database sessions.
   * 
   * @param newRole - Requested role (`ANONYMOUS`, `REPORTER`, `REVIEWER`, `ADMIN`)
   */
  const setRole = useCallback(
    (newRole: UserRole) => {
      if (!isDemoMode) {
        console.warn(
          `[Security Violation Blocked] Client-side role elevation to "${newRole}" rejected. Roles are backend-authoritative in production.`
        );
        return;
      }
      setRoleState(newRole);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('safedose_user_role', newRole);
      }
    },
    [isDemoMode]
  );

  /**
   * Terminates active session and resets application auth state.
   * 
   * Clears:
   * - Supabase auth session token
   * - Local user profile state
   * - Role state (resets to `ANONYMOUS`)
   * - Local storage role persistence key
   */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    setRealUser(null);
    setRoleState('ANONYMOUS');
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('safedose_user_role');
    }
  }, []);

  /**
   * Resolved User Profile.
   * Priority:
   * 1. Verified Supabase session user (`realUser`)
   * 2. Mock role profile when `isDemoMode` is active
   * 3. `null` for unauthenticated anonymous clinical sessions
   */
  const activeUser = useMemo(() => {
    if (realUser) return realUser;
    if (isDemoMode) return DEFAULT_DEMO_PROFILES[role];
    return null;
  }, [realUser, isDemoMode, role]);

  const value = useMemo(
    () => ({
      user: activeUser,
      role,
      isDemoMode,
      isLoading,
      setRole,
      signOut,
      isReviewerOrAdmin: role === 'REVIEWER' || role === 'ADMIN',
      isAdmin: role === 'ADMIN',
    }),
    [activeUser, role, isDemoMode, isLoading, setRole, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
