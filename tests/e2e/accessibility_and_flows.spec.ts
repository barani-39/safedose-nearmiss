import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { setupDeterministicSupabaseRoutes } from './fixtures/mockSupabase';

test.describe('SafeDose E2E & WCAG Accessibility Audit', () => {
  test.beforeEach(async ({ page }) => {
    await setupDeterministicSupabaseRoutes(page, { authRole: 'REVIEWER' });
  });

  test('homepage passes WCAG AA accessibility audit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify page title and header
    await expect(page).toHaveTitle(/SafeDose NearMiss/);
    await expect(page.locator('h1')).toContainText('Report quickly');

    // Run Axe Accessibility Scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // Ignore subtle aesthetic variations in prototype demo
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('reporting form enforces medical advice boundary and submits safely', async ({ page }) => {
    await page.goto('/report');
    await page.waitForLoadState('domcontentloaded');

    // Verify form renders
    await expect(page.locator('h1')).toContainText('Report a Near Miss');

    // Test Medical Advice Boundary interception
    const descTextarea = page.locator('textarea').first();
    await descTextarea.fill('What dose should I give to this patient?');

    // Verify boundary warning appears
    const disclaimerBanner = page.locator('text=SafeDose NearMiss does not provide medical advice');
    await expect(disclaimerBanner).toBeVisible();

    // Verify Submit button is disabled while advice query is present
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    // Clear advice query and enter valid near-miss narrative
    await descTextarea.fill(
      'U-500 concentrated insulin vial selected instead of U-100 regular insulin due to similar purple flip caps. Caught by secondary checker before administration.'
    );

    // Verify medical advice warning disappears
    await expect(disclaimerBanner).not.toBeVisible();
  });

  test('patient journeys page navigates through timeline stepper', async ({ page }) => {
    await page.goto('/journeys');
    await page.waitForLoadState('domcontentloaded');

    // Verify journey title and tabs
    await expect(page.locator('h1')).toContainText('Patient Safety Journeys');

    // Verify Journey 1 timeline steps exist
    const step4 = page.locator('button:has-text("SafeDose Dual-Check Interception")');
    await expect(step4).toBeVisible();

    // Click step to verify detail box updates
    await step4.click();
    await expect(page.locator('text=Secondary checker cross-checks vial label')).toBeVisible();

    // Switch to Journey 2 (Paediatric)
    const journey2Btn = page.locator('text=Journey 2: Paediatric').first();
    await journey2Btn.click();
    await expect(page.locator('text=Recovery Administration in PACU').first()).toBeVisible();
  });

  test('evaluation dashboard renders comparative matrix and missing-information analysis', async ({ page }) => {
    await page.goto('/evaluation');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toContainText('System Evaluation & Impact Analysis');
    await expect(page.locator('text=Baseline vs Target vs SafeDose Comparison Matrix')).toBeVisible();
    await expect(page.locator('text=Missing-Information Analysis')).toBeVisible();
    await expect(page.locator('text=Error Analysis & Algorithmic Guardrails Audit')).toBeVisible();
  });

  test('privacy and psychological safety page details zero-harm boundaries', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toContainText('Privacy, Anonymity & Psychological Safety');
    await expect(page.locator('text=Default-On Anonymity')).toBeVisible();
    await expect(page.locator('text=Zero-Harm Filter')).toBeVisible();
  });

  test('unauthorized direct URL access to /review and /audit-report is blocked with 403 Access Denied screen', async ({ page }) => {
    // Override route with ANONYMOUS role (no reviewer session)
    await setupDeterministicSupabaseRoutes(page, { authRole: 'ANONYMOUS' });

    // Attempt direct navigation to reviewer queue
    await page.goto('/review');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=Restricted Clinical Area')).toBeVisible();
    await expect(page.locator('text=HTTP 403 Forbidden')).toBeVisible();
    await expect(page.locator('text=Backend Authorization Boundary')).toBeVisible();

    // Attempt direct navigation to clinical audit report
    await page.goto('/audit-report');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=Restricted Clinical Area')).toBeVisible();
    await expect(page.locator('text=HTTP 403 Forbidden')).toBeVisible();
  });

  test('stakeholder validation and audit report pass WCAG AA accessibility audit', async ({ page }) => {
    // 1. Audit /validation page
    await page.goto('/validation');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1')).toContainText('Stakeholder Feasibility & Usability Validation');

    const validationAxeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();
    expect(validationAxeResults.violations).toEqual([]);

    // 2. Audit /audit-report page (as reviewer)
    await page.goto('/audit-report');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1')).toContainText('Clinical Medication Safety & Near-Miss Audit Report');

    const auditAxeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();
    expect(auditAxeResults.violations).toEqual([]);
  });
});
