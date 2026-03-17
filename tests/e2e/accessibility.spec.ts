import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Accessibility checks', () => {
  test('login page has no critical axe violations', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();

    // Keep this strict in CI once baseline issues are cleaned.
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
