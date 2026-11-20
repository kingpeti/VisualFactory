import { describe, expect, it } from 'vitest';
import { nestedScroll, pastScrollThreshold, SCROLL_THRESHOLD_PX, sidewaysDrag, touchScrollLines } from './termTouch';

describe('pastScrollThreshold', () => {
  it('is false right at the threshold, true just past it', () => {
    expect(pastScrollThreshold(0, SCROLL_THRESHOLD_PX)).toBe(false);
    expect(pastScrollThreshold(0, SCROLL_THRESHOLD_PX + 0.01)).toBe(true);
  });

  it('counts a diagonal move by its total distance', () => {
    expect(pastScrollThreshold(6, 6)).toBe(true); // hypot ≈ 8.49
    expect(pastScrollThreshold(1, 1)).toBe(false);
  });
});

describe('sidewaysDrag', () => {
  it('is true for a sideways drag and false for a vertical one, either way round', () => {
    expect(sidewaysDrag(20, 0)).toBe(true);
    expect(sidewaysDrag(-20, 3)).toBe(true);
    expect(sidewaysDrag(0, 20)).toBe(false);
    expect(sidewaysDrag(3, -20)).toBe(false);
  });

  it('leaves a 45-degree drag to the browser', () => {
    expect(sidewaysDrag(6, 6)).toBe(true);
    expect(sidewaysDrag(-6, 6)).toBe(true);
  });
});

describe('touchScrollLines', () => {
  it('turns a drag past one row into a line, carrying the remainder', () => {
    const a = touchScrollLines(25, 0, 20);
    expect(a).toEqual({ lines: 1, carryPx: 5 });
    const b = touchScrollLines(25, a.carryPx, 20);
    expect(b).toEqual({ lines: 1, carryPx: 10 });
  });

  it('accumulates small drags below one row until they cross it', () => {
    const a = touchScrollLines(6, 0, 20);
    expect(a).toEqual({ lines: 0, carryPx: 6 });
    const b = touchScrollLines(6, a.carryPx, 20);
    expect(b).toEqual({ lines: 0, carryPx: 12 });
    const c = touchScrollLines(6, b.carryPx, 20);
    expect(c).toEqual({ lines: 0, carryPx: 18 });
    const d = touchScrollLines(6, c.carryPx, 20);
    expect(d).toEqual({ lines: 1, carryPx: 4 });
  });

  it('scrolls the other way for an upward drag', () => {
    expect(touchScrollLines(-25, 0, 20)).toEqual({ lines: -1, carryPx: -5 });
  });

  it('does nothing with no usable line height', () => {
    expect(touchScrollLines(100, 0, 0)).toEqual({ lines: 0, carryPx: 0 });
    expect(touchScrollLines(100, 0, -5)).toEqual({ lines: 0, carryPx: 0 });
  });
});

describe('nestedScroll', () => {
  it('moves the box up to its top on a drag down, leaving the rest for the scrollback', () => {
    expect(nestedScroll(50, 30, 100)).toEqual({ scrollTop: 0, restPx: 20 });
  });

  it('moves the box down to its bottom on a drag up, leaving the rest', () => {
    expect(nestedScroll(-50, 80, 100)).toEqual({ scrollTop: 100, restPx: -30 });
  });

  it('keeps the whole drag in the box while it can move', () => {
    expect(nestedScroll(10, 30, 100)).toEqual({ scrollTop: 20, restPx: 0 });
    expect(nestedScroll(-10, 30, 100)).toEqual({ scrollTop: 40, restPx: 0 });
  });

  it('passes the whole drag on when the box does not overflow', () => {
    expect(nestedScroll(40, 0, 0)).toEqual({ scrollTop: 0, restPx: 40 });
    expect(nestedScroll(-40, 0, -3)).toEqual({ scrollTop: 0, restPx: -40 });
  });

  it('clamps a scrollTop outside the box first', () => {
    expect(nestedScroll(10, 150, 100)).toEqual({ scrollTop: 90, restPx: 0 });
    expect(nestedScroll(10, -5, 100)).toEqual({ scrollTop: 0, restPx: 10 });
  });
});
