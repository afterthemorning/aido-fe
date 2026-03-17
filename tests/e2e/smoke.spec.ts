import { expect, test } from '@playwright/test';

test.describe('Application smoke checks', () => {
  test('loads app shell and renders a document title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('basic UI interaction example', async ({ page }) => {
    await page.goto('/login');
    const firstTextbox = page.getByRole('textbox').first();

    if ((await firstTextbox.count()) > 0) {
      await firstTextbox.fill('demo@example.com');
      await expect(firstTextbox).toHaveValue('demo@example.com');
    }
  });
});
