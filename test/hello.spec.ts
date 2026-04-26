import { test, expect } from '@playwright/test';


test('shows Hello World', async ({ page }) => {
  await page.goto("./");
  const content = await page.textContent('#app');
  expect(content).toContain('Hello World');
});
