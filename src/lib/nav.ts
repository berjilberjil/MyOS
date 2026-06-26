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
import SquareStack from '@lucide/svelte/icons/square-stack';

export interface NavItem {
	key: string;
	href: string;
	label: string;
	icon: Component;
	// Extra path prefixes that should also mark this item active (for grouped tabs).
	match?: string[];
}

// Single source of truth for navigation + map iconography, so the sidebar and
// the life map read as one system (same icon per module in both places).
// Journal / Notes / To-dos / Goals are grouped under one "Workspace" tab.
export const NAV: NavItem[] = [
	{ key: 'dashboard', href: '/', label: 'Dashboard', icon: LayoutDashboard },
	{ key: 'finance', href: '/finance', label: 'Finance', icon: Wallet },
	{
		key: 'workspace',
		href: '/journal',
		label: 'Workspace',
		icon: SquareStack,
		match: ['/journal', '/notes', '/todos', '/goals']
	},
	{ key: 'health', href: '/health', label: 'Health', icon: HeartPulse },
	{ key: 'fitness', href: '/fitness', label: 'Fitness', icon: Dumbbell },
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
