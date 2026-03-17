import { expect, test } from '@playwright/test';

test.describe('Visual regression template', () => {
  test.skip('homepage visual snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});
