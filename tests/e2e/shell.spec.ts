import { test, expect } from '@playwright/test';

test('shell renders and the theme toggle cycles + applies classes', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('MyOS', { exact: true })).toBeVisible();

	const toggle = page.getByTestId('theme-toggle');
	await expect(toggle).toContainText('system');

	await toggle.click(); // system -> light
	await expect(toggle).toContainText('light');

	await toggle.click(); // light -> dark
	await expect(toggle).toContainText('dark');
	await expect(page.locator('html')).toHaveClass(/dark/);

	await toggle.click(); // dark -> tui
	await expect(toggle).toContainText('tui');
	await expect(page.locator('html')).toHaveClass(/tui/);
});
