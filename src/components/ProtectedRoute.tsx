import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, ClipboardList, Info } from 'lucide-react';
import { useAuth } from '@/contexts';
import type { UserRole } from '@/types';
import { LoadingSpinner } from '@/components/States';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { role, isDemoMode, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner label="Verifying clinical authorization..." />;
  }

  if (allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            HTTP 403 Forbidden
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Restricted Clinical Area
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            This module requires verified <span className="font-semibold text-slate-800">{allowedRoles.join(' or ')}</span> privileges.
            Your current effective role is <span className="font-bold text-teal-800 uppercase px-1.5 py-0.5 rounded bg-slate-100">{role}</span>.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1.5">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            Backend Authorization Boundary
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            SafeDose enforces backend-authoritative access control. Unauthenticated and standard reporter sessions cannot view or modify confidential clinical review queues or institutional audit logs.
          </p>
        </div>

        {isDemoMode && (
          <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
            <span className="font-bold text-[10px] uppercase text-amber-800 tracking-wider block">
              Demo Simulation Mode Active
            </span>
            <p className="text-[11px] text-amber-800">
              For testing and demonstration, you can switch your active perspective to <strong>Reviewer</strong> or <strong>Admin</strong> using the role selector in the top navigation bar.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Link
            to="/"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return Home
          </Link>
          <Link
            to="/report"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Report Near Miss
          </Link>
        </div>
      </div>
    </div>
  );
}
