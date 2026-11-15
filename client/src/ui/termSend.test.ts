import { describe, expect, it } from 'vitest';
import type { TermClientMessage } from '../../../shared/types';
import { termMessage } from './termSend';

const MESSAGES: TermClientMessage[] = [
  { t: 'input', data: '\u001b' },
  { t: 'input', data: 'ls\r' },
  { t: 'resize', cols: 40, rows: 12 },
];

describe('termMessage', () => {
  it('sends keystrokes and resizes from an interactive terminal', () => {
    for (const message of MESSAGES) expect(termMessage(message, true)).toEqual(message);
  });

  it('sends nothing from a read-only terminal: no Esc, no typing, no resize of the shared screen', () => {
    for (const message of MESSAGES) expect(termMessage(message, false)).toBeNull();
  });
});
