// Pure logic for the Workspace long-press quick-create gesture.
// The component owns timers + pointer events; these helpers decide the target
// and the resulting action so they can be unit-tested in isolation.

export const LONG_PRESS_MS = 350;
export const NOTE_DRAG_PX = 40;
export const CANCEL_RADIUS_PX = 64;
/** Movement (px) before the long-press engages that is treated as a scroll → abort. */
export const MOVE_ABORT_PX = 10;

export type GestureTarget = 'idle' | 'journal' | 'note' | 'cancel';
export type GestureAction = 'none' | 'open-journal' | 'open-note';

/**
 * Once the long-press has engaged, map the drag delta from the press origin to a
 * target: drag right → note, drag up/back → cancel, otherwise the default journal.
 */
export function targetForDelta(dx: number, dy: number): GestureTarget {
	if (dy <= -CANCEL_RADIUS_PX) return 'cancel'; // dragged up and away
	if (dx >= NOTE_DRAG_PX) return 'note';
	if (dx <= -NOTE_DRAG_PX) return 'cancel'; // dragged back to the left
	return 'journal';
}

/** What releasing on a given target should do. */
export function actionForRelease(target: GestureTarget): GestureAction {
	if (target === 'journal') return 'open-journal';
	if (target === 'note') return 'open-note';
	return 'none';
}

/** True if movement before engagement is large enough to abort the long-press. */
export function shouldAbortPress(dx: number, dy: number): boolean {
	return Math.hypot(dx, dy) > MOVE_ABORT_PX;
}
