import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Home } from '@/pages/Home';
import { ReportForm } from '@/pages/ReportForm';
import { SubmissionConfirmation } from '@/pages/SubmissionConfirmation';
import { ReviewQueue } from '@/pages/ReviewQueue';
import { ReportDetail } from '@/pages/ReportDetail';
import { Dashboard } from '@/pages/Dashboard';
import { About } from '@/pages/About';
import { Evaluation } from '@/pages/Evaluation';
import { BaselineForm } from '@/pages/BaselineForm';
import { PatientJourneys } from '@/pages/PatientJourneys';
import { StakeholderValidation } from '@/pages/StakeholderValidation';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { AuditReport } from '@/pages/AuditReport';
import { NotFound } from '@/pages/NotFound';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<ReportForm />} />
            <Route path="/report/confirmation/:id" element={<SubmissionConfirmation />} />
            <Route
              path="/review"
              element={
                <ProtectedRoute allowedRoles={['REVIEWER', 'ADMIN']}>
                  <ReviewQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/review/:id"
              element={
                <ProtectedRoute allowedRoles={['REVIEWER', 'ADMIN']}>
                  <ReportDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/audit-report"
              element={
                <ProtectedRoute allowedRoles={['REVIEWER', 'ADMIN']}>
                  <AuditReport />
                </ProtectedRoute>
              }
            />
            <Route path="/journeys" element={<PatientJourneys />} />
            <Route path="/validation" element={<StakeholderValidation />} />
            <Route path="/evaluation" element={<Evaluation />} />
            <Route path="/evaluation/baseline" element={<BaselineForm />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
