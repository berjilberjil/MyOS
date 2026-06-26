import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/e2e',
	use: { baseURL: 'http://localhost:5177' },
	webServer: {
		command: 'bun run dev',
		port: 5177,
		reuseExistingServer: true,
		timeout: 60_000
	}
});
