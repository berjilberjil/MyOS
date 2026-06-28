import { describe, it, expect } from 'vitest';
import {
	targetForDelta,
	actionForRelease,
	shouldAbortPress,
	NOTE_DRAG_PX,
	CANCEL_RADIUS_PX,
	MOVE_ABORT_PX
} from '$lib/components/layout/navGesture';

describe('targetForDelta', () => {
	it('defaults to journal near the origin', () => {
		expect(targetForDelta(0, 0)).toBe('journal');
		expect(targetForDelta(NOTE_DRAG_PX - 1, 0)).toBe('journal');
	});
	it('switches to note when dragged right past the threshold', () => {
		expect(targetForDelta(NOTE_DRAG_PX, 0)).toBe('note');
		expect(targetForDelta(120, 5)).toBe('note');
	});
	it('cancels when dragged up and away', () => {
		expect(targetForDelta(0, -CANCEL_RADIUS_PX)).toBe('cancel');
		expect(targetForDelta(80, -100)).toBe('cancel'); // up beats right
	});
	it('cancels when dragged back to the left', () => {
		expect(targetForDelta(-NOTE_DRAG_PX, 0)).toBe('cancel');
	});
});

describe('actionForRelease', () => {
	it('maps targets to actions', () => {
		expect(actionForRelease('journal')).toBe('open-journal');
		expect(actionForRelease('note')).toBe('open-note');
		expect(actionForRelease('cancel')).toBe('none');
		expect(actionForRelease('idle')).toBe('none');
	});
});

describe('shouldAbortPress', () => {
	it('aborts only past the move threshold', () => {
		expect(shouldAbortPress(0, 0)).toBe(false);
		expect(shouldAbortPress(MOVE_ABORT_PX, 0)).toBe(false);
		expect(shouldAbortPress(MOVE_ABORT_PX + 1, 0)).toBe(true);
	});
});
