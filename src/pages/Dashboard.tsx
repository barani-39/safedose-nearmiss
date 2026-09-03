import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { FileText, Calendar, AlertOctagon, Clock, CheckCircle, Lightbulb } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { NearMissReport } from '@/types';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/States';

const PIE_COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

function countBy<T extends string>(items: T[]): { name: T; count: number }[] {
  const map = new Map<T, number>();
  for (const item of items) {
    map.set(item, (map.get(item) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function Dashboard() {
  const [reports, setReports] = useState<NearMissReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('near_miss_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError('Could not load dashboard data.');
        setLoading(false);
        return;
      }
      setReports((data || []) as NearMissReport[]);
      setLoading(false);
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      total: reports.length,
      thisMonth: reports.filter((r) => new Date(r.created_at) >= monthStart).length,
      highPriority: reports.filter((r) => r.operational_priority === 'HIGH').length,
      awaitingReview: reports.filter((r) => r.status === 'Submitted' || r.status === 'Under Review').length,
      closed: reports.filter((r) => r.status === 'Closed').length,
    };
  }, [reports]);

  const incidentTypeData = useMemo(
    () => countBy(reports.map((r) => r.incident_type)),
    [reports],
  );

  const priorityData = useMemo(
    () => countBy(reports.map((r) => r.operational_priority)),
    [reports],
  );

  const workflowStageData = useMemo(
    () => countBy(reports.map((r) => r.workflow_stage)),
    [reports],
  );

  const wardData = useMemo(
    () => countBy(reports.map((r) => (r.ward === 'Other' ? r.custom_ward || 'Other' : r.ward))),
    [reports],
  );

  const statusData = useMemo(
    () => countBy(reports.map((r) => r.status)),
    [reports],
  );

  const contributingFactorData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reports) {
      for (const f of r.contributing_factors) {
        map.set(f, (map.get(f) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [reports]);

  const insights = useMemo(() => {
    const result: string[] = [];

    if (contributingFactorData.length > 0) {
      const top = contributingFactorData[0];
      if (top.count >= 2) {
        result.push(
          `"${top.name}" is the most frequently reported contributing factor (${top.count} reports). This pattern may warrant operational review.`,
        );
      }
    }

    if (workflowStageData.length > 0) {
      const top = workflowStageData[0];
      if (top.count >= 2) {
        result.push(
          `"${top.name}" is currently the most commonly reported workflow stage (${top.count} reports).`,
        );
      }
    }

    if (incidentTypeData.length > 0) {
      const top = incidentTypeData[0];
      if (top.count >= 2) {
        result.push(
          `"${top.name}" is the most common incident type (${top.count} reports).`,
        );
      }
    }

    if (wardData.length > 0) {
      const top = wardData[0];
      if (top.count >= 3) {
        result.push(
          `"${top.name}" has the highest number of near-miss reports (${top.count} reports). This may indicate an area for targeted operational review.`,
        );
      }
    }

    if (stats.highPriority > 0) {
      result.push(
        `There are ${stats.highPriority} high-priority reports. Consider reviewing these first.`,
      );
    }

    return result;
  }, [contributingFactorData, workflowStageData, incidentTypeData, wardData, stats.highPriority]);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} />;

  if (reports.length === 0) {
    return (
      <EmptyState
        title="No reporting data available yet"
        description="Once near-miss reports are submitted, the dashboard will display analytics calculated from stored data."
        action={
          <Link
            to="/report"
            className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700"
          >
            Submit a Report
          </Link>
        }
      />
    );
  }

  const summaryCards = [
    { label: 'Total Reports', value: stats.total, icon: FileText, color: 'text-teal-600 bg-teal-50' },
    { label: 'Reports This Month', value: stats.thisMonth, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'High Priority', value: stats.highPriority, icon: AlertOctagon, color: 'text-orange-600 bg-orange-50' },
    { label: 'Awaiting Review', value: stats.awaitingReview, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Closed Reports', value: stats.closed, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Safety Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          All metrics are calculated from stored near-miss reports. No data is hard-coded.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="text-xs text-slate-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-600" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-amber-900">Operational Safety Insights</h2>
          </div>
          <ul className="space-y-2">
            {insights.map((insight, i) => (
              <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">&bull;</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-amber-600 italic">
            These insights are generated from deterministic aggregation. They do not constitute medical recommendations.
          </p>
        </section>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Incident Types">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incidentTypeData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Contributing Factors">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contributingFactorData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Operational Priority">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry.name}: ${entry.value}`}
              >
                {priorityData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Workflow Stage">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workflowStageData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Near Misses by Ward">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={wardData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Report Status">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry.name}: ${entry.value}`}
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}
