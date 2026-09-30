import type { Page, Route } from '@playwright/test';

export interface InMemoryState {
  reports: Array<Record<string, unknown>>;
  evaluationSessions: Array<Record<string, unknown>>;
}

export interface MockSupabaseOptions {
  initialState?: Partial<InMemoryState>;
  authRole?: 'ANONYMOUS' | 'REPORTER' | 'REVIEWER' | 'ADMIN';
}

/**
 * Sets up deterministic Supabase route interception in Playwright for CI/E2E testing.
 * This runs strictly in Playwright browser tests and never activates in production.
 */
export async function setupDeterministicSupabaseRoutes(
  page: Page,
  options?: MockSupabaseOptions
) {
  const authRole = options?.authRole ?? 'REVIEWER';
  const initialState = options?.initialState;

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

  // Pre-seed Supabase localStorage session token for authenticated test roles
  if (authRole !== 'ANONYMOUS') {
    const exp = Math.floor(Date.now() / 1000) + 7200;
    const b64Header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const b64Payload = Buffer.from(
      JSON.stringify({
        sub: `mock-user-${authRole.toLowerCase()}-001`,
        aud: 'authenticated',
        role: 'authenticated',
        exp,
      })
    ).toString('base64url');
    const validJwt = `${b64Header}.${b64Payload}.mock_signature`;

    const mockUser = {
      id: `mock-user-${authRole.toLowerCase()}-001`,
      email: `${authRole.toLowerCase()}@hospital.example.org`,
      aud: 'authenticated',
      role: 'authenticated',
      user_metadata: {
        role: authRole,
        display_name: `Lead ${authRole}`,
      },
    };

    const mockSession = {
      access_token: validJwt,
      token_type: 'bearer',
      expires_in: 7200,
      expires_at: exp,
      refresh_token: 'mock-refresh-token',
      user: mockUser,
    };

    await page.addInitScript((session) => {
      try {
        window.localStorage.setItem('sb-vivdcdvblbfrowlbfwng-auth-token', JSON.stringify(session));
      } catch {
        // ignore
      }
    }, mockSession);
  } else {
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem('sb-vivdcdvblbfrowlbfwng-auth-token');
      } catch {
        // ignore
      }
    });
  }

  const corsHeaders: Record<string, string> = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
    'access-control-allow-headers': '*',
    'access-control-expose-headers': '*',
  };

  // 1. Intercept Supabase Auth endpoints
  await page.route('**/auth/v1/**', async (route: Route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    if (authRole === 'ANONYMOUS') {
      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeaders,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ session: null, user: null }),
      });
      return;
    }

    const exp = Math.floor(Date.now() / 1000) + 7200;
    const b64Header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const b64Payload = Buffer.from(
      JSON.stringify({
        sub: `mock-user-${authRole.toLowerCase()}-001`,
        aud: 'authenticated',
        role: 'authenticated',
        exp,
      })
    ).toString('base64url');
    const validJwt = `${b64Header}.${b64Payload}.mock_signature`;

    const mockUser = {
      id: `mock-user-${authRole.toLowerCase()}-001`,
      email: `${authRole.toLowerCase()}@hospital.example.org`,
      aud: 'authenticated',
      role: 'authenticated',
      user_metadata: {
        role: authRole,
        display_name: `Lead ${authRole}`,
      },
    };

    if (url.pathname.endsWith('/user')) {
      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeaders,
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockUser),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      headers: {
        ...corsHeaders,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        access_token: validJwt,
        token_type: 'bearer',
        expires_in: 7200,
        expires_at: exp,
        refresh_token: 'mock-refresh-token',
        user: mockUser,
        session: {
          access_token: validJwt,
          token_type: 'bearer',
          expires_in: 7200,
          expires_at: exp,
          user: mockUser,
        },
      }),
    });
  });

  // 2. Intercept Supabase REST queries
  await page.route('**/rest/v1/**', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    // Handle profiles table
    if (path.includes('/profiles')) {
      if (authRole === 'ANONYMOUS') {
        await route.fulfill({
          status: 404,
          headers: {
            ...corsHeaders,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ message: 'No profile found for anonymous session' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeaders,
          'content-type': 'application/vnd.pgrst.object+json',
        },
        body: JSON.stringify({
          id: `mock-user-${authRole.toLowerCase()}-001`,
          email: `${authRole.toLowerCase()}@hospital.example.org`,
          role: authRole,
          display_name: `Lead ${authRole}`,
          department: 'Medication Safety Committee',
        }),
      });
      return;
    }

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
          headers: {
            ...corsHeaders,
            'content-type': 'application/json',
            'preference-applied': 'return=representation',
          },
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
            await route.fulfill({
              status: 200,
              headers: {
                ...corsHeaders,
                'content-type': 'application/json',
              },
              body: JSON.stringify(result[0]),
            });
            return;
          }
        }

        await route.fulfill({
          status: 200,
          headers: {
            ...corsHeaders,
            'content-type': 'application/json',
            'content-range': `0-${result.length}/${result.length}`,
          },
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
              headers: {
                ...corsHeaders,
                'content-type': 'application/json',
              },
              body: JSON.stringify(state.reports[idx]),
            });
            return;
          }
        }
        await route.fulfill({
          status: 200,
          headers: {
            ...corsHeaders,
            'content-type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        return;
      }

      if (method === 'HEAD') {
        await route.fulfill({
          status: 200,
          headers: {
            ...corsHeaders,
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
          headers: {
            ...corsHeaders,
            'content-type': 'application/json',
          },
          body: JSON.stringify(newSession),
        });
        return;
      }

      if (method === 'GET' || method === 'HEAD') {
        await route.fulfill({
          status: 200,
          headers: {
            ...corsHeaders,
            'content-type': 'application/json',
            'content-range': `0-${state.evaluationSessions.length}/${state.evaluationSessions.length}`,
          },
          body: JSON.stringify(state.evaluationSessions),
        });
        return;
      }
    }

    // Default fulfill for any other Supabase rest queries (audit_events, stakeholder_feedback, etc.)
    await route.fulfill({
      status: 200,
      headers: {
        ...corsHeaders,
        'content-type': 'application/json',
      },
      body: JSON.stringify([]),
    });
  });

  return state;
}
