import type { Component } from 'svelte';
import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import Wallet from '@lucide/svelte/icons/wallet';
import NotebookPen from '@lucide/svelte/icons/notebook-pen';
import ListChecks from '@lucide/svelte/icons/list-checks';
import Target from '@lucide/svelte/icons/target';
import HeartPulse from '@lucide/svelte/icons/heart-pulse';
import Dumbbell from '@lucide/svelte/icons/dumbbell';
import StickyNote from '@lucide/svelte/icons/sticky-note';
import Waypoints from '@lucide/svelte/icons/waypoints';

export interface NavItem {
	key: string;
	href: string;
	label: string;
	icon: Component;
}

// Single source of truth for navigation + map iconography, so the sidebar and
// the life map read as one system (same icon per module in both places).
export const NAV: NavItem[] = [
	{ key: 'dashboard', href: '/', label: 'Dashboard', icon: LayoutDashboard },
	{ key: 'finance', href: '/finance', label: 'Finance', icon: Wallet },
	{ key: 'journal', href: '/journal', label: 'Journal', icon: NotebookPen },
	{ key: 'todos', href: '/todos', label: 'To-dos', icon: ListChecks },
	{ key: 'goals', href: '/goals', label: 'Goals', icon: Target },
	{ key: 'health', href: '/health', label: 'Health', icon: HeartPulse },
	{ key: 'fitness', href: '/fitness', label: 'Fitness', icon: Dumbbell },
	{ key: 'notes', href: '/notes', label: 'Notes', icon: StickyNote },
	{ key: 'mindmap', href: '/mindmap', label: 'Life map', icon: Waypoints }
];

// Icon per mindmap module key (graph.ts MODULES keys).
export const MODULE_ICONS: Record<string, Component> = {
	finance: Wallet,
	journal: NotebookPen,
	todos: ListChecks,
	goals: Target,
	health: HeartPulse,
	fitness: Dumbbell,
	notes: StickyNote
};
