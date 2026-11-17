import { describe, expect, it } from 'vitest';
import { createDemoBackend } from './demo.ts';
import { HttpError } from './httpError.ts';
import { Swarm } from './swarm.ts';
import { MESSAGE_MAX } from '../shared/message.ts';

// The manager's messages to the CEO and to agents (shared/message.ts): up to MESSAGE_MAX characters, sent whole; an
// empty or longer one is a 400 in the same words the client shows, never cut short.

type Internals = { ensureCeo(interrupted: unknown[]): void; state: { messages: { from: string; text: string }[] } };

async function office() {
  const swarm = new Swarm(createDemoBackend());
  const repo = await swarm.connectRepo('demo-co/pixel-todo'); // with its first agent
  const internals = swarm as unknown as Internals;
  internals.ensureCeo([]);
  const agent = swarm.snapshot().agents.find((a) => a.repoId === repo.id);
  if (!agent) throw new Error('the demo floor has no agent');
  return { swarm, internals, agent };
}

/** The HttpError a refused call throws. */
async function refusal(call: Promise<unknown>): Promise<HttpError> {
  const error = await call.then(
    () => null,
    (reason: unknown) => reason,
  );
  if (!(error instanceof HttpError)) throw new Error(`expected an HttpError, got ${String(error)}`);
  return error;
}

describe("the manager's messages", () => {
  it('reach the CEO whole at exactly the limit', async () => {
    const { swarm, internals } = await office();
    const text = 'x'.repeat(MESSAGE_MAX);
    await swarm.messageCeo(`  ${text}  `);
    expect(internals.state.messages.filter((m) => m.from === 'manager').at(-1)?.text).toBe(text);
  });

  it('are refused with a 400 one character over the limit, to the CEO or an agent', async () => {
    const { swarm, agent } = await office();
    const long = 'x'.repeat(MESSAGE_MAX + 1);
    for (const error of [await refusal(swarm.messageCeo(long)), await refusal(swarm.message(agent.id, long))]) {
      expect(error.status).toBe(400);
      expect(error.message).toBe('Message too long: 60,001 characters, the limit is 60,000');
    }
  });

  it('are refused with a 400 when empty', async () => {
    const { swarm, agent } = await office();
    expect((await refusal(swarm.messageCeo('   '))).message).toBe('Empty message');
    expect((await refusal(swarm.message(agent.id, ''))).status).toBe(400);
  });
});
