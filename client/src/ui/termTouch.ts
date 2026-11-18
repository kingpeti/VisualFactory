// Pure maths for touch-scrolling LiveTerminal's xterm viewport: xterm 6's viewport only answers the mouse wheel
// (node_modules/@xterm/xterm/src/browser/Viewport.ts), so LiveTerminal.tsx turns a finger drag into whole-line
// jumps using this instead.

/** Past this many px of movement, a touch is a drag (scroll), not the tap that would otherwise just focus the
 * terminal for typing. */
export const SCROLL_THRESHOLD_PX = 8;

export interface LineScroll {
  /** Whole lines of movement for this call. Same sign as `deltaY`; negate it for `term.scrollLines` (dragging
   * down, deltaY > 0, shows earlier output, i.e. scrolls up). */
  lines: number;
  /** The leftover under one line, to pass back in as `carryPx` on the next call. */
  carryPx: number;
}

/** `deltaY` (px the finger moved since the last call) plus the carried remainder, turned into whole lines at
 * `lineHeightPx` px per row. The remainder is carried forward so a slow drag still adds up to the right place. */
export function touchScrollLines(deltaY: number, carryPx: number, lineHeightPx: number): LineScroll {
  if (!(lineHeightPx > 0)) return { lines: 0, carryPx: 0 };
  const px = deltaY + carryPx;
  const lines = Math.trunc(px / lineHeightPx);
  return { lines, carryPx: px - lines * lineHeightPx };
}

/** Whether a touch has moved far enough from where it started to count as a drag rather than a tap. */
export function pastScrollThreshold(dx: number, dy: number, thresholdPx = SCROLL_THRESHOLD_PX): boolean {
  return Math.hypot(dx, dy) > thresholdPx;
}

export interface NestedScroll {
  /** Where the box's `scrollTop` goes. */
  scrollTop: number;
  /** The part of `deltaY` the box couldn't take, left for the terminal's scrollback (`touchScrollLines`). */
  restPx: number;
}

/** A read-only tile's vertical drag of `deltaY` px: its box, which can be shorter than the agent's screen, moves first
 * while it can (dragging down shows its top, like a page), and only the rest reaches the scrollback. `scrollTop` is
 * clamped to [0, maxScrollTop] first, since layout rounding can leave it a fraction outside. */
export function nestedScroll(deltaY: number, scrollTop: number, maxScrollTop: number): NestedScroll {
  const clamp = (value: number) => Math.min(Math.max(value, 0), Math.max(maxScrollTop, 0));
  const top = clamp(scrollTop);
  const next = clamp(top - deltaY);
  return { scrollTop: next, restPx: deltaY - (top - next) };
}
