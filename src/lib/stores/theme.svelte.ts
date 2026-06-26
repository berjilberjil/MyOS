export type Theme = 'light' | 'dark' | 'system' | 'tui';

const STORAGE_KEY = 'theme';

function prefersDark(): boolean {
	return (
		typeof window !== 'undefined' &&
		!!window.matchMedia?.('(prefers-color-scheme: dark)').matches
	);
}

export function getStoredTheme(): Theme {
	if (typeof localStorage === 'undefined') return 'system';
	return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'system';
}

export function applyTheme(theme: Theme): void {
	const root = document.documentElement;
	const dark = theme === 'dark' || (theme === 'system' && prefersDark());
	root.classList.toggle('tui', theme === 'tui');
	root.classList.toggle('dark', dark || theme === 'tui');
}

export function setTheme(theme: Theme): void {
	localStorage.setItem(STORAGE_KEY, theme);
	applyTheme(theme);
}

export const themeState = $state<{ current: Theme }>({ current: 'system' });

export function initTheme(): void {
	themeState.current = getStoredTheme();
	applyTheme(themeState.current);
}
