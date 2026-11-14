import { afterEach, describe, expect, it, vi } from 'vitest';
import { debugLog, debugScopes, formatDebug } from './log.ts';

describe('debugScopes', () => {
  it('turns nothing on when SWARM_DEBUG is unset, empty or 0', () => {
    for (const value of [undefined, '', ' ', '0']) expect(debugScopes(value)('merge')).toBe(false);
  });

  it('turns every scope on for 1, * or true', () => {
    for (const value of ['1', '*', 'true', ' * ']) expect(debugScopes(value)('anything')).toBe(true);
  });

  it('turns on only the listed scopes, ignoring case and spaces', () => {
    const enabled = debugScopes('holds, Merge,,');
    expect(enabled('holds')).toBe(true);
    expect(enabled('merge')).toBe(true);
    expect(enabled('MERGE')).toBe(true);
    expect(enabled('workspace')).toBe(false);
  });
});

describe('formatDebug', () => {
  it('prints the scope and message alone without data', () => {
    expect(formatDebug('merge', 'requeued')).toBe('[merge] requeued');
  });

  it('appends compact JSON data', () => {
    expect(formatDebug('merge', 'requeued', { pr: 12, sha: 'abc' })).toBe('[merge] requeued {"pr":12,"sha":"abc"}');
  });

  it('falls back to a string for data JSON cannot serialize', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(formatDebug('merge', 'odd', cyclic)).toBe('[merge] odd [object Object]');
    expect(formatDebug('merge', 'big', 10n)).toBe('[merge] big 10');
  });
});

describe('debugLog', () => {
  afterEach(() => vi.restoreAllMocks());

  it('prints nothing while SWARM_DEBUG is unset (as under npm test)', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    debugLog('merge', 'requeued', { pr: 1 });
    expect(log).not.toHaveBeenCalled();
  });
});
