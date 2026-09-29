import { test, expect } from '@playwright/test';
import { setupDeterministicSupabaseRoutes } from './fixtures/mockSupabase';

test('End-to-End Manual Smoke Test & Submission Verification', async ({ page }) => {
  const consoleErrors: string[] = [];
  const networkFailures: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[Console Error]: ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(`[Page Exception]: ${err.message}`);
  });

  page.on('requestfailed', (req) => {
    // Ignore aborted background requests or non-critical preloads
    const failure = req.failure()?.errorText || '';
    if (!failure.includes('ERR_ABORTED')) {
      networkFailures.push(`[Network Error]: ${req.method()} ${req.url()} (${failure})`);
    }
  });

  const dbState = await setupDeterministicSupabaseRoutes(page);

  // 1. Homepage loads correctly
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('h1')).toContainText('Report quickly');
  await expect(page.locator('text=60-Second Rapid Capture')).toBeVisible();

  // 2. /report opens correctly
  await page.goto('/report');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('h1')).toContainText('Report a Near Miss');

  // 3. Anonymous reporting is enabled and works
  const anonymousCheckbox = page.locator('input[type="checkbox"]').first();
  await expect(anonymousCheckbox).toBeChecked();
  const reporterIdentifierInput = page.locator('input[placeholder*="Staff"]');
  await expect(reporterIdentifierInput).not.toBeVisible();

  // 4. Medical-advice requests are blocked by the safety guardrail
  const descTextarea = page.locator('textarea').first();
  await descTextarea.fill('What dose should I give to this patient?');
  const adviceBanner = page.locator('text=SafeDose NearMiss does not provide medical advice');
  await expect(adviceBanner).toBeVisible();
  const submitBtn = page.locator('button[type="submit"]');
  await expect(submitBtn).toBeDisabled();

  // 5. Submit one new test near-miss report
  await descTextarea.fill(
    'Smoke Test Run: Nurse intercepted syringe filled with 50 units insulin instead of 5 units during independent dual-check before injection.'
  );
  await expect(adviceBanner).not.toBeVisible();

  // Fill required form fields using explicit fieldset scoping
  await page.locator('fieldset:has-text("Ward / Area") button:has-text("ICU")').click();
  await page.locator('fieldset:has-text("Medicine Category") button:has-text("Insulin")').click();
  await page.locator('fieldset:has-text("Workflow Stage") button:has-text("Preparation")').click();
  await page.locator('fieldset:has-text("Incident Type") button:has-text("Wrong Dose")').click();
  await page.locator('fieldset:has-text("Operational Priority") button:has-text("HIGH")').click();
  await page.locator('fieldset:has-text("Was the medication administered") button:has-text("No")').click();
  await page.locator('fieldset:has-text("patient harm") button:has-text("No")').click();
  await page.locator('button:has-text("Interruption")').click();

  // Submit report
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  // 6. Confirm report is successfully stored
  await page.waitForURL(/.*\/report\/confirmation\/.+/);
  const confUrl = page.url();
  const newReportId = confUrl.split('/').pop()!;
  expect(newReportId).toBeDefined();
  await expect(page.locator('h1')).toContainText('Report Submitted');

  // 7. Confirm matching SAFEDOSE evaluation session is created for that report
  // Verify in intercepted database state
  const dbReport = dbState.reports.find((r) => r.id === newReportId);
  expect(dbReport).toBeDefined();
  expect(dbReport?.ward).toBe('ICU');
  expect(dbReport?.anonymous).toBe(true);
  expect(dbReport?.reporter_identifier).toBeNull();

  const dbSessions = dbState.evaluationSessions.filter(
    (s) => s.notes && s.notes.includes(newReportId)
  );

  expect(dbSessions.length).toBe(1); // EXACTLY ONE session, zero duplicates!
  expect(dbSessions[0].reporting_method).toBe('SAFEDOSE');
  expect(dbSessions[0].completion_seconds).toBeGreaterThan(0);
  expect(dbSessions[0].completeness_score).toBeGreaterThan(80);
  expect(dbSessions[0].usable_report).toBe(true);

  // 8 & 9. Open /review and confirm new report appears in queue
  await page.goto('/review');
  await page.waitForLoadState('domcontentloaded');
  const reportLink = page.locator(`a[href*="${newReportId}"]`);
  await expect(reportLink).toBeVisible();

  // 10. Update reviewer status/notes and confirm persistence
  await reportLink.click();
  await page.waitForURL(new RegExp(`.*\\/review\\/${newReportId}`));

  const notesArea = page.locator('textarea[placeholder*="Add reviewer notes"]');
  await notesArea.fill('Clinical reviewer: Smoke test verification pass confirmed.');
  const statusSelect = page.locator('select:has-text("Submitted")').first();
  await statusSelect.selectOption('Under Review');
  await page.locator('button:has-text("Save Review")').click();
  await expect(page.locator('text=Review saved at')).toBeVisible();

  // Confirm in database state
  const updatedReport = dbState.reports.find((r) => r.id === newReportId);
  expect(updatedReport?.status).toBe('Under Review');
  expect(updatedReport?.reviewer_notes).toContain('Smoke test verification pass');

  // 11 & 12. Open /journeys and verify both patient journeys & timeline
  await page.goto('/journeys');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('h1')).toContainText('Patient Safety Journeys');
  const step4 = page.locator('button:has-text("SafeDose Dual-Check Interception")');
  await step4.click();
  await expect(page.locator('text=Secondary checker cross-checks vial label')).toBeVisible();

  const journey2Btn = page.locator('button:has-text("Journey 2: Paediatric")');
  await journey2Btn.click();
  await expect(page.locator('text=Recovery Administration in PACU').first()).toBeVisible();

  // 13 & 14. Open /evaluation and verify matrix, provenance labels, charts, formulas
  await page.goto('/evaluation');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('h1')).toContainText('System Evaluation & Impact Analysis');
  await expect(page.locator('text=Data Provenance, Ground Truth & Mathematical Formulas')).toBeVisible();
  await expect(page.locator('text=Baseline vs Target vs SafeDose Comparison Matrix')).toBeVisible();
  await expect(page.locator('text=Missing-Information Analysis')).toBeVisible();
  await expect(page.locator('text=Error Analysis & Algorithmic Guardrails Audit')).toBeVisible();

  // 15 & 16. Open /privacy and verify content
  await page.goto('/privacy');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('h1')).toContainText('Privacy, Anonymity & Psychological Safety');
  await expect(page.locator('text=Default-On Anonymity')).toBeVisible();
  await expect(page.locator('text=Zero-Harm Filter')).toBeVisible();

  // 17 & 18. Open /validation and test stakeholder feedback form
  await page.goto('/validation');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('h1')).toContainText('Stakeholder Feasibility & Usability Validation');
  await expect(page.locator('text=Synthetic Archetype').first()).toBeVisible();

  // Submit live review
  await page.locator('input[placeholder*="Dr. Sarah Jenkins"]').fill('Nurse Evaluator Mark');
  await page.locator('input[placeholder*="Ward Sister"]').fill('Quality Assurance Officer');
  await page.locator('textarea[placeholder*="Provide clinical"]').fill(
    'Smoke test assessment: Flawless end-to-end integration and psychological safety transparency.'
  );
  await page.locator('input[type="checkbox"]').check();
  await page.locator('button:has-text("Submit Evaluator Review")').click();
  await expect(page.locator('text=Your evaluation feedback has been recorded')).toBeVisible();

  // Responsive Layout Audits
  // Tablet Viewport
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('h1')).toBeVisible();

  // Mobile Viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const mobileMenuBtn = page.locator('button[aria-label="Toggle navigation menu"]');
  await expect(mobileMenuBtn).toBeVisible();
  await mobileMenuBtn.click();
  await expect(page.locator('nav[aria-label="Mobile navigation"]')).toBeVisible();

  // Verify Zero Console Errors & Zero Failed Network Requests
  expect(consoleErrors).toEqual([]);
  expect(networkFailures).toEqual([]);
});
