import type { CDPSession, Page } from '@playwright/test';
import { expect, test } from './helpers';

// A swipe on an agent's live terminal (LiveTerminal.tsx): xterm 6's viewport only answers the mouse wheel, so
// without this the scrollback is stuck on the last screenful on a phone. Driven by real emulated touch (CDP
// Input.dispatchTouchEvent, as touch.spec.ts does), not synthetic events, so the browser's own touch-to-gesture
// plumbing is exercised the way a finger goes through it.
//
// Reached through the 2D dashboard (what a phone gets by default): its terminals view shows one read-only grid tile
// on a phone, and the tile's name opens the agent's drawer, whose LiveTerminal takes keys, as the 3D office's agent
// panel does (ui/TerminalView.tsx renders it either way), without paying for three.js.

type Pt = { x: number; y: number; id: number };

async function touchStart(cdp: CDPSession, points: Pt[]) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points });
}
async function touchMove(cdp: CDPSession, points: Pt[]) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points });
}
async function touchEnd(cdp: CDPSession, points: Pt[] = []) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: points });
}

/** A straight vertical drag at `x`, from `fromY` to `toY`, in a few steps (so it reads as a drag, not a jump). */
async function dragY(cdp: CDPSession, id: number, x: number, fromY: number, toY: number, steps = 8) {
  await touchStart(cdp, [{ x, y: fromY, id }]);
  for (let i = 1; i <= steps; i++) await touchMove(cdp, [{ x, y: fromY + ((toY - fromY) * i) / steps, id }]);
  await touchEnd(cdp);
}

// The device the sibling bug (#21/#19) was reported on.
const S23 = { deviceScaleFactor: 3, hasTouch: true, isMobile: true };

const TILE = '.dash-tile';
const DRAWER = '.dash-drawer';

/** The dashboard's terminals view; a selector for the first read-only tile there with a terminal, whatever its agent
 * is doing (a long-lived demo office runs out of working agents; shownTokens doesn't care). */
async function openTile(page: Page): Promise<string> {
  await page.goto('/?office=2d&tab=team');
  const first = page.locator(TILE).filter({ has: page.locator('.live-term-screen') }).first();
  await expect(first.locator('.xterm-rows')).toBeVisible({ timeout: 30_000 });
  return `${TILE}[aria-label="${await first.getAttribute('aria-label')}"]`;
}

/** That tile's agent in the drawer, whose terminal takes keys; returns the tile's selector. */
async function openAgentTerminal(page: Page): Promise<string> {
  const tile = await openTile(page);
  await page.locator(`${tile} .dash-tile-name`).click();
  await expect(page.locator(`${DRAWER} .live-term-screen`)).toBeVisible();
  await expect(page.locator(`${DRAWER} .xterm-rows`)).toBeVisible();
  return tile;
}

/** The part of `selector`'s box that is on screen: a landscape phone shows only some of the drawer's terminal. */
async function visibleBox(page: Page, selector: string) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  const box = await element.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error(`${selector} is not on screen`);
  const top = Math.max(box.y, 0);
  const bottom = Math.min(box.y + box.height, viewport.height);
  return { x: box.x, y: top, width: box.width, height: bottom - top };
}

/** Enough printable, space-separated tokens to overflow any phone-sized terminal many times over (no `\r`/`\n`:
 * the demo's fake CLI only treats a literal `\r` as Enter, so plain text just wraps into many rows). Each is `n<i>`,
 * so the ones on screen tell how far the terminal is scrolled, whatever the agent prints meanwhile. */
const TOKENS = 2000;
const OVERFLOW_TEXT = Array.from({ length: TOKENS }, (_, i) => `n${i}`).join(' ');

async function allRowsText(page: Page, scope = DRAWER) {
  return (await page.locator(`${scope} .xterm-rows > div`).allTextContents()).join('');
}

/** The typed tokens on screen in `scope`'s terminal, lowest and highest (Infinity / -Infinity when none is). The
 * agent's own output can push them up but never brings an earlier one back: only scrolling up does. */
async function shownTokens(page: Page, scope = DRAWER) {
  const numbers = [...(await allRowsText(page, scope)).matchAll(/\bn(\d+)\b/g)].map((match) => Number(match[1]));
  return { lowest: Math.min(...numbers), highest: Math.max(...numbers) };
}

/** Types the overflow into the drawer's terminal and waits for most of it to be echoed into `scope` (a working agent
 * prints on below it, so its very last token may already be pushed out of a short terminal). */
async function typeOverflow(page: Page, scope = DRAWER) {
  await page.locator(`${DRAWER} .live-term-screen`).click(); // focus, so the text goes into the terminal
  await page.keyboard.insertText(OVERFLOW_TEXT);
  await expect.poll(async () => (await shownTokens(page, scope)).highest).toBeGreaterThan(TOKENS / 2);
}

/** What the page sends on every /ws/term socket from now on, read with `termSends`. */
async function recordTermSends(page: Page) {
  await page.addInitScript(() => {
    const sent: string[] = [];
    (window as unknown as { __termSends: string[] }).__termSends = sent;
    const send = WebSocket.prototype.send;
    WebSocket.prototype.send = function (this: WebSocket, data: Parameters<WebSocket['send']>[0]) {
      if (this.url.includes('/ws/term')) sent.push(String(data));
      return send.call(this, data);
    };
  });
}
const termSends = (page: Page) => page.evaluate(() => (window as unknown as { __termSends: string[] }).__termSends.splice(0));

test.describe('touch on a real phone', () => {
  test.use(S23);

  for (const [name, viewport] of [
    ['portrait', { width: 360, height: 780 }],
    ['landscape', { width: 780, height: 360 }],
  ] as const) {
    test.describe(name, () => {
      test.use({ viewport });

      test('a tap with no movement focuses the terminal for typing', async ({ page }) => {
        await openAgentTerminal(page);
        const cdp = await page.context().newCDPSession(page);
        const box = await visibleBox(page, `${DRAWER} .live-term-screen`);
        const pt = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 };
        await touchStart(cdp, [pt]);
        await touchEnd(cdp);
        await expect.poll(() => page.evaluate(() => document.activeElement?.classList.contains('xterm-helper-textarea'))).toBe(true);
      });

      test('a one-finger swipe scrolls the scrollback, both directions', async ({ page }) => {
        test.setTimeout(60_000);
        await openAgentTerminal(page);
        await typeOverflow(page);

        const cdp = await page.context().newCDPSession(page);
        const box = await visibleBox(page, `${DRAWER} .live-term-screen`);
        const x = box.x + box.width / 2;
        const topY = box.y + box.height * 0.3;
        const botY = box.y + box.height * 0.8;

        // Swipe down: the finger moves down, earlier output scrolls into view.
        const before = (await shownTokens(page)).lowest;
        await dragY(cdp, 2, x, topY, botY);
        await expect.poll(async () => (await shownTokens(page)).lowest).toBeLessThan(before);

        // Swipe up, repeatedly (one drag only covers the panel's own height in lines): later output comes back.
        const scrolled = (await shownTokens(page)).lowest;
        for (let i = 0; i < 8; i++) await dragY(cdp, 3 + i, x, botY, topY);
        await expect.poll(async () => (await shownTokens(page)).lowest).toBeGreaterThan(scrolled);
      });

      test('a read-only grid tile scrolls on a swipe, and sends neither keys nor a resize', async ({ page }) => {
        test.setTimeout(60_000);
        await recordTermSends(page);
        const tile = await openAgentTerminal(page);
        await typeOverflow(page, tile);
        await page.locator(DRAWER).getByRole('button', { name: 'Close (Esc)' }).click();
        await expect(page.locator(DRAWER)).toHaveCount(0);
        await termSends(page); // the drawer's keys and size, not the tile's

        const cdp = await page.context().newCDPSession(page);
        const box = await visibleBox(page, `${tile} .live-term-screen`);
        const x = box.x + box.width / 2;
        await touchStart(cdp, [{ x, y: box.y + box.height / 2, id: 20 }]); // a tap
        await touchEnd(cdp);
        const before = (await shownTokens(page, tile)).lowest;
        await dragY(cdp, 21, x, box.y + box.height * 0.3, box.y + box.height * 0.8);
        await expect.poll(async () => (await shownTokens(page, tile)).lowest).toBeLessThan(before);
        await page.keyboard.type('x');
        expect(await termSends(page)).toEqual([]);
      });
    });
  }
});

test('desktop: the mouse wheel still scrolls the terminal', async ({ page }) => {
  await openAgentTerminal(page);
  await typeOverflow(page);
  const box = await visibleBox(page, `${DRAWER} .live-term-screen`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const before = (await shownTokens(page)).lowest;
  // A wheel notch moves a few lines in the drawer's narrow terminal: keep turning it until earlier output shows.
  await expect
    .poll(async () => {
      await page.mouse.wheel(0, -600);
      return (await shownTokens(page)).lowest;
    })
    .toBeLessThan(before);
});
