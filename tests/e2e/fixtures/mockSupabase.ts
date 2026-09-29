import type { Page, Route } from '@playwright/test';

export interface InMemoryState {
  reports: Array<Record<string, unknown>>;
  evaluationSessions: Array<Record<string, unknown>>;
}

/**
 * Sets up deterministic Supabase route interception in Playwright for CI/E2E testing.
 * This runs strictly in Playwright browser tests and never activates in production.
 */
export async function setupDeterministicSupabaseRoutes(page: Page, initialState?: Partial<InMemoryState>) {
  const state: InMemoryState = {
    reports: initialState?.reports || [
      {
        id: '11111111-1111-1111-1111-111111111111',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        ward: 'ICU',
        medicine_category: 'Insulin',
        workflow_stage: 'Preparation',
        incident_type: 'Wrong Dose',
        operational_priority: 'HIGH',
        contributing_factors: ['Interruption', 'Workload'],
        short_description: 'Pre-existing test near-miss: U-500 regular insulin double-check caught before administration.',
        immediate_action: 'Swapped vial with standard concentration.',
        medication_administered: 'No',
        patient_harm_status: 'No',
        anonymous: true,
        reporter_identifier: null,
        status: 'Submitted',
        reviewer_notes: null,
        suggested_category: 'Wrong Dose',
        suggestion_confidence: 'HIGH',
        human_verified_category: null,
        reviewed_at: null,
        is_synthetic: true,
      },
    ],
    evaluationSessions: initialState?.evaluationSessions || [
      {
        id: '22222222-2222-2222-2222-222222222222',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        reporting_method: 'SAFEDOSE',
        completion_seconds: 52,
        completeness_score: 95.0,
        usable_report: true,
        satisfaction_score: 5,
        ward: 'ICU',
        description: 'Pre-existing test evaluation session',
        notes: 'SafeDose Report ID: 11111111-1111-1111-1111-111111111111 | Priority: HIGH',
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        reporting_method: 'BASELINE',
        completion_seconds: 195,
        completeness_score: 28.0,
        usable_report: false,
        satisfaction_score: 2,
        ward: 'Emergency',
        description: 'Unstructured baseline entry',
        notes: 'Baseline benchmark record',
      },
    ],
  };

  await page.route('**/rest/v1/**', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;

    // Handle near_miss_reports table
    if (path.endsWith('/near_miss_reports')) {
      if (method === 'POST') {
        const body = request.postDataJSON() || {};
        const newReport = {
          id: body.id || `mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'Submitted',
          ...body,
        };
        state.reports.unshift(newReport);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          headers: { 'preference-applied': 'return=representation' },
          body: JSON.stringify(newReport),
        });
        return;
      }

      if (method === 'GET') {
        const selectParam = url.searchParams.get('select');
        const idFilter = url.searchParams.get('id');

        let result = [...state.reports];
        if (idFilter && idFilter.startsWith('eq.')) {
          const targetId = idFilter.replace('eq.', '');
          result = result.filter((r) => r.id === targetId);
          if (selectParam && !selectParam.includes('*') && result.length > 0) {
            // Return single or filtered fields
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(result[0]),
            });
            return;
          }
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'content-range': `0-${result.length}/${result.length}` },
          body: JSON.stringify(result),
        });
        return;
      }

      if (method === 'PATCH') {
        const body = request.postDataJSON() || {};
        const idFilter = url.searchParams.get('id');
        if (idFilter && idFilter.startsWith('eq.')) {
          const targetId = idFilter.replace('eq.', '');
          const idx = state.reports.findIndex((r) => r.id === targetId);
          if (idx !== -1) {
            state.reports[idx] = { ...state.reports[idx], ...body, updated_at: new Date().toISOString() };
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(state.reports[idx]),
            });
            return;
          }
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
        return;
      }
      if (method === 'HEAD') {
        await route.fulfill({
          status: 200,
          headers: {
            'content-range': `0-${state.reports.length}/${state.reports.length}`,
          },
        });
        return;
      }
    }

    // Handle evaluation_sessions table
    if (path.endsWith('/evaluation_sessions')) {
      if (method === 'POST') {
        const body = request.postDataJSON() || {};
        const newSession = {
          id: body.id || `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          created_at: new Date().toISOString(),
          ...body,
        };
        state.evaluationSessions.unshift(newSession);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newSession),
        });
        return;
      }

      if (method === 'GET' || method === 'HEAD') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'content-range': `0-${state.evaluationSessions.length}/${state.evaluationSessions.length}` },
          body: JSON.stringify(state.evaluationSessions),
        });
        return;
      }
    }

    // Default fulfill for any other Supabase rest queries to prevent unresolvable DNS errors in tests
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  return state;
}
