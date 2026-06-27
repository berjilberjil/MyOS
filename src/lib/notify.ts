// Lightweight browser notifications: opt-in, used for the daily journal nudge.
const KEY = 'notify';

export function notifySupported(): boolean {
	return typeof Notification !== 'undefined';
}

export function notifyEnabled(): boolean {
	return (
		notifySupported() &&
		Notification.permission === 'granted' &&
		typeof localStorage !== 'undefined' &&
		localStorage.getItem(KEY) === 'on'
	);
}

export async function enableNotifications(): Promise<boolean> {
	if (!notifySupported()) return false;
	const perm = await Notification.requestPermission();
	const ok = perm === 'granted';
	localStorage.setItem(KEY, ok ? 'on' : 'off');
	return ok;
}

export function disableNotifications(): void {
	localStorage.setItem(KEY, 'off');
}

export function notify(title: string, body: string): void {
	if (!notifyEnabled()) return;
	try {
		new Notification(title, { body });
	} catch {
		/* ignore */
	}
}
