import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserRole, UserProfile } from '@/types';

export interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  signOut: () => Promise<void>;
  isReviewerOrAdmin: boolean;
  isAdmin: boolean;
}

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('safedose_user_role') as UserRole | null;
    if (saved && ['ANONYMOUS', 'REPORTER', 'REVIEWER', 'ADMIN'].includes(saved)) {
      return saved;
    }
    return 'REVIEWER';
  });

  const [realUser, setRealUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user && mounted) {
          const u = data.session.user;
          const userMeta = u.user_metadata || {};
          const assignedRole = (userMeta.role as UserRole) || 'REPORTER';
          setRealUser({
            id: u.id,
            email: u.email || 'user@example.org',
            role: assignedRole,
            display_name: userMeta.display_name || u.email,
          });
          setRoleState(assignedRole);
        }
      } catch {
        // Fallback
      }
    }

    checkSession();

    try {
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user && mounted) {
          const u = session.user;
          const userMeta = u.user_metadata || {};
          const assignedRole = (userMeta.role as UserRole) || 'REPORTER';
          setRealUser({
            id: u.id,
            email: u.email || 'user@example.org',
            role: assignedRole,
            display_name: userMeta.display_name || u.email,
          });
          setRoleState(assignedRole);
        } else if (!session && mounted) {
          setRealUser(null);
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
  }, []);

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('safedose_user_role', newRole);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    setRealUser(null);
    setRoleState('ANONYMOUS');
    localStorage.setItem('safedose_user_role', 'ANONYMOUS');
  }, []);

  const activeUser = useMemo(() => {
    if (realUser) return realUser;
    return DEFAULT_DEMO_PROFILES[role];
  }, [realUser, role]);

  const value = useMemo(
    () => ({
      user: activeUser,
      role,
      setRole,
      signOut,
      isReviewerOrAdmin: role === 'REVIEWER' || role === 'ADMIN',
      isAdmin: role === 'ADMIN',
    }),
    [activeUser, role, setRole, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
