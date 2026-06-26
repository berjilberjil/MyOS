import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
	await page.goto('/login');
	await page.getByPlaceholder('email').fill('owner@myos.local');
	await page.getByPlaceholder('password').fill('ChangeMe!myos1');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

test('log a workout and see it listed', async ({ page }) => {
	await login(page);
	await page.goto('/fitness');

	const activity = `Run ${Date.now()}`;
	await page.getByPlaceholder('Activity (e.g. Run)').fill(activity);
	await page.getByPlaceholder('Minutes').fill('30');
	await page.getByRole('button', { name: 'Add', exact: true }).click();

	await expect(page.getByText(activity).first()).toBeVisible();
});
