import { NavLink, Link } from 'react-router-dom';
import { ShieldPlus, Menu, X, ClipboardList } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/report', label: 'Report Near Miss' },
  { to: '/review', label: 'Review Queue' },
  { to: '/dashboard', label: 'Safety Dashboard' },
  { to: '/journeys', label: 'Patient Journeys' },
  { to: '/validation', label: 'Validation' },
  { to: '/evaluation', label: 'Evaluation' },
  { to: '/about', label: 'About & Safety' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Top Notification / Clinical Context Banner */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs text-center border-b border-slate-800 flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-medium text-slate-200">SafeDose NearMiss v2.4</span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-300">Psychologically safe medication near-miss reporting & learning prototype</span>
        <span className="text-slate-500">•</span>
        <span className="text-amber-300/90 font-medium">Non-Clinical Educational Demonstration</span>
      </div>

      {/* Main Sticky Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 text-slate-900 font-extrabold text-lg tracking-tight group"
              onClick={() => setMobileOpen(false)}
            >
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs group-hover:bg-teal-700 transition">
                <ShieldPlus className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="leading-tight font-bold text-slate-900 flex items-center gap-1.5">
                  SafeDose <span className="text-teal-700 font-semibold text-xs px-1.5 py-0.2 rounded bg-teal-50 border border-teal-200">NearMiss</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-normal">Operational Healthcare Safety</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'text-teal-900 bg-teal-50/90 border border-teal-200/60 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Quick Action Button & Mobile Toggle */}
            <div className="flex items-center gap-2">
              <Link
                to="/report"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition shadow-xs"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Report Event
              </Link>

              <button
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive
                      ? 'text-teal-900 bg-teal-50 border border-teal-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* Premium Healthcare SaaS Footer */}
      <footer className="bg-white border-t border-slate-200/80 mt-16 text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-100 text-xs">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldPlus className="w-4 h-4 text-teal-600" />
                SafeDose NearMiss
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Psychologically safe medication incident reporting designed to eliminate blame, detect latent workflow hazards, and prevent clinical harm.
              </p>
            </div>

            <div>
              <div className="font-semibold text-slate-900 uppercase tracking-wider text-[10px] mb-2.5">Clinical Workflows</div>
              <ul className="space-y-1.5 text-[11px]">
                <li><Link to="/report" className="hover:text-teal-700 transition">Rapid 60-Second Report</Link></li>
                <li><Link to="/review" className="hover:text-teal-700 transition">Clinical Review Queue</Link></li>
                <li><Link to="/dashboard" className="hover:text-teal-700 transition">Safety & Trend Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-slate-900 uppercase tracking-wider text-[10px] mb-2.5">Evidence & Evaluation</div>
              <ul className="space-y-1.5 text-[11px]">
                <li><Link to="/journeys" className="hover:text-teal-700 transition">Patient Safety Journeys</Link></li>
                <li><Link to="/evaluation" className="hover:text-teal-700 transition">Empirical Baseline Comparison</Link></li>
                <li><Link to="/validation" className="hover:text-teal-700 transition">Stakeholder Usability Validation</Link></li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-slate-900 uppercase tracking-wider text-[10px] mb-2.5">Safety & Compliance</div>
              <ul className="space-y-1.5 text-[11px]">
                <li><Link to="/privacy" className="hover:text-teal-700 transition font-medium text-teal-800">Privacy & Psychological Safety</Link></li>
                <li><Link to="/about" className="hover:text-teal-700 transition">Zero-Harm Incident Pathway</Link></li>
                <li><span className="text-slate-500">Default Reporter Anonymity</span></li>
                <li><span className="text-slate-500">Deterministic Boundary Interception</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <p>
              SafeDose NearMiss — Educational Prototype. Operational safety support only. Not medical advice. Not certified for clinical use.
            </p>
            <p className="font-mono text-[10px] text-slate-400">
              Built with React 18 • TypeScript • Tailwind CSS • Supabase
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
