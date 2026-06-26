import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyTheme, setTheme, getStoredTheme } from '$lib/stores/theme.svelte';

beforeEach(() => {
	localStorage.clear();
	document.documentElement.className = '';
	vi.restoreAllMocks();
});

describe('theme store', () => {
	it('applies dark class for dark theme', () => {
		applyTheme('dark');
		expect(document.documentElement.classList.contains('dark')).toBe(true);
		expect(document.documentElement.classList.contains('tui')).toBe(false);
	});

	it('applies tui (Tokyo Night) class', () => {
		applyTheme('tui');
		expect(document.documentElement.classList.contains('tui')).toBe(true);
	});

	it('light theme clears dark and tui', () => {
		applyTheme('dark');
		applyTheme('light');
		expect(document.documentElement.classList.contains('dark')).toBe(false);
		expect(document.documentElement.classList.contains('tui')).toBe(false);
	});

	it('setTheme persists to localStorage', () => {
		setTheme('tui');
		expect(localStorage.getItem('theme')).toBe('tui');
		expect(getStoredTheme()).toBe('tui');
	});

	it('getStoredTheme defaults to system', () => {
		expect(getStoredTheme()).toBe('system');
	});
});
