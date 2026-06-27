// Section sub-tabs that a route can publish into the global top bar (desktop).
export interface HeaderTab {
	href: string;
	label: string;
}

export const headerTabs = $state<{ tabs: HeaderTab[] }>({ tabs: [] });

export function setHeaderTabs(tabs: HeaderTab[]): void {
	headerTabs.tabs = tabs;
}
export function clearHeaderTabs(): void {
	headerTabs.tabs = [];
}
