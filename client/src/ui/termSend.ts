// What a live terminal may send the office. An agent has one pseudo-terminal however many tabs watch it: the last
// viewer's resize wins and every keystroke reaches the CLI (Esc interrupts it). So a read-only terminal, like the
// dashboard's grid tiles, sends nothing at all; the full terminal view and the drawer stay interactive.
import type { TermClientMessage } from '../../../shared/types';

/** The message to send, or null when this terminal must not send it. */
export function termMessage(message: TermClientMessage, interactive: boolean): TermClientMessage | null {
  return interactive ? message : null;
}
