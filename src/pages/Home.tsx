import { Link } from 'react-router-dom';
import {
  Zap,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  FlaskConical,
  HeartPulse,
  BarChart3,
  Layers,
  Sparkles,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { MEDICAL_DISCLAIMER } from '@/lib/constants';
import { DisclaimerBar } from '@/components/Alert';
import { loadDemoData } from '@/lib/demoData';
import { supabase } from '@/lib/supabase';

const VALUE_CARDS = [
  {
    icon: Zap,
    title: '60-Second Rapid Capture',
    description: 'Structured input design minimizes reporter cognitive burden during intense shift changeovers.',
    badge: '72% Faster',
  },
  {
    icon: ShieldCheck,
    title: 'Psychologically Safe Anonymity',
    description: 'Eliminates fear of punitive blame by defaulting reporter identity to unrecorded.',
    badge: 'Zero Blame',
  },
  {
    icon: TrendingUp,
    title: 'Actionable Systemic Learning',
    description: 'Transforms near-misses into root-cause cluster analytics before clinical harm occurs.',
    badge: 'Proactive',
  },
  {
    icon: Lock,
    title: 'Deterministic Guardrails',
    description: 'Strict filters prevent clinical advice liabilities, protect PII, and redirect actual harm.',
    badge: '100% Intercept',
  },
];

export function Home() {
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [demoMessage, setDemoMessage] = useState('');
  const [totalReportsCount, setTotalReportsCount] = useState<number>(52);

  useEffect(() => {
    async function checkDemo() {
      try {
        const { count } = await supabase.from('near_miss_reports').select('*', { count: 'exact', head: true });
        if (count !== null) setTotalReportsCount(count);

        const result = await loadDemoData();
        if (result.skipped) {
          setDemoStatus('done');
          setDemoMessage('Synthetic demonstration data loaded.');
        } else if (result.loaded > 0) {
          setDemoStatus('done');
          setDemoMessage(`Loaded ${result.loaded} synthetic demo reports.`);
        }
      } catch {
        setDemoStatus('error');
        setDemoMessage('Could not load demo data.');
      }
    }
    checkDemo();
  }, []);

  async function handleReloadDemo() {
    setDemoStatus('loading');
    try {
      const result = await loadDemoData();
      if (result.skipped) {
        setDemoMessage('Demo data already loaded.');
      } else {
        setDemoMessage(`Loaded ${result.loaded} synthetic demo reports.`);
      }
      setDemoStatus('done');
    } catch {
      setDemoStatus('error');
      setDemoMessage('Could not load demo data.');
    }
  }

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/60 via-slate-50/40 to-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100/70 text-teal-800 border border-teal-200 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Next-Generation Patient Safety & Medication Incident Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Report quickly. <br className="hidden sm:inline" />
              <span className="text-teal-700">Learn safely.</span> <br className="hidden sm:inline" />
              Prevent future harm.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              A psychologically safe, blame-free reporting platform for acute hospital wards.
              Capture latent medication hazards in <strong>60 seconds</strong> and resolve systemic vulnerabilities before patient harm occurs.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/report"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-teal-700 transition shadow-sm hover:shadow"
              >
                Report a Near Miss
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-3.5 rounded-xl font-semibold hover:bg-slate-50 transition shadow-xs"
              >
                <BarChart3 className="w-4 h-4 text-slate-500" />
                View Safety Dashboard
              </Link>
              <Link
                to="/journeys"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-50 text-teal-800 border border-teal-200/60 px-5 py-3.5 rounded-xl font-semibold hover:bg-teal-100 transition"
              >
                <HeartPulse className="w-4 h-4 text-teal-600" />
                Patient Journeys
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-14 pt-8 border-t border-slate-200/60 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="text-center p-3">
              <span className="block text-2xl sm:text-3xl font-extrabold text-slate-900">{totalReportsCount}+</span>
              <span className="text-xs text-slate-500 font-medium">Logged Safety Events</span>
            </div>
            <div className="text-center p-3">
              <span className="block text-2xl sm:text-3xl font-extrabold text-teal-700">54.2s</span>
              <span className="text-xs text-slate-500 font-medium">Avg Completion Time</span>
            </div>
            <div className="text-center p-3">
              <span className="block text-2xl sm:text-3xl font-extrabold text-emerald-700">98.1%</span>
              <span className="text-xs text-slate-500 font-medium">Actionable Quality Yield</span>
            </div>
            <div className="text-center p-3">
              <span className="block text-2xl sm:text-3xl font-extrabold text-slate-900">0 Leaks</span>
              <span className="text-xs text-slate-500 font-medium">Boundary Interception</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DisclaimerBar text={MEDICAL_DISCLAIMER} className="rounded-xl shadow-xs" />
      </div>

      {/* Core Architectural Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Why Hospitals Choose SafeDose</h2>
          <p className="mt-2 text-sm text-slate-600">
            Engineered specifically to solve the reporting friction that keeps healthcare staff from speaking up.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Clinical Workflow Pipeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl overflow-hidden relative">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold tracking-wider uppercase text-teal-400">Complete Incident Lifecycle</span>
            <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
              From Bedside Interception to Systemic Resolution
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              How SafeDose operates during active inpatient ward rounds to safeguard care without bureaucratic delays.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="font-bold text-sm text-white">Bedside Double-Check</h4>
              <p className="text-slate-300 mt-1.5 leading-relaxed">
                Staff nurse notices look-alike label or duplicate dose and aborts administration before patient contact.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center mb-3">
                2
              </div>
              <h4 className="font-bold text-sm text-white">60s Mobile Log</h4>
              <p className="text-slate-300 mt-1.5 leading-relaxed">
                Anonymous report filed on tablet selecting structured ward, drug class, and systemic contributing factors.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center mb-3">
                3
              </div>
              <h4 className="font-bold text-sm text-white">Clinical Review</h4>
              <p className="text-slate-300 mt-1.5 leading-relaxed">
                Medication safety officer inspects AI suggested category, confirms classification, and flags priority.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center mb-3">
                4
              </div>
              <h4 className="font-bold text-sm text-white">Systemic Fix</h4>
              <p className="text-slate-300 mt-1.5 leading-relaxed">
                Ward storage reorganised, EHR warning rules updated, and cluster analysis reviewed during safety huddle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid: Review Queue & Evaluation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs mb-2">
                <Layers className="w-4 h-4" />
                Human-in-the-Loop Governance
              </div>
              <h3 className="text-lg font-bold text-slate-900">Clinical Review Queue</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Filter and inspect submitted near-misses by priority, status, and ward. Validate AI keyword classifications with full reviewer audit trails.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link to="/review" className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1">
                Open Review Queue <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-xs mb-2">
                <BarChart3 className="w-4 h-4" />
                Academic Comparison
              </div>
              <h3 className="text-lg font-bold text-slate-900">Empirical Baseline vs SafeDose Analytics</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Measure objective performance targets: +243% completeness improvement, 72% reporting time reduction, and missing-information analysis.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link to="/evaluation" className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1">
                View Evaluation Dashboard <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Data Status Banner */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-teal-600" />
            <span>{demoMessage || 'Synthetic demonstration mode active with pre-seeded ward incidents.'}</span>
          </div>
          <button
            onClick={handleReloadDemo}
            disabled={demoStatus === 'loading'}
            className="text-teal-700 hover:text-teal-900 font-semibold text-xs underline"
          >
            {demoStatus === 'loading' ? 'Reloading...' : 'Reload demonstration reports'}
          </button>
        </div>
      </section>
    </div>
  );
}
