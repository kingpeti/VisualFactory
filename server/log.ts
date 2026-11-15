// Verbose debug logging, off unless SWARM_DEBUG names the scope: `SWARM_DEBUG=1` (or `*`) prints every scope,
// `SWARM_DEBUG=holds,merge` only those. Plain console.log, like the rest of the server.

/** Which scopes `value` (the SWARM_DEBUG setting) turns on. */
export function debugScopes(value: string | undefined): (scope: string) => boolean {
  const scopes = new Set((value ?? '').split(',').map((scope) => scope.trim().toLowerCase()).filter(Boolean));
  if (scopes.has('1') || scopes.has('*') || scopes.has('true')) return () => true;
  return (scope) => scopes.has(scope.toLowerCase());
}

/** `[scope] message {"key":"value"}`; data JSON cannot serialize (a cycle, a BigInt) prints as a string. */
export function formatDebug(scope: string, message: string, data?: unknown): string {
  if (data === undefined) return `[${scope}] ${message}`;
  let text: string;
  try {
    text = JSON.stringify(data) ?? String(data);
  } catch {
    text = String(data);
  }
  return `[${scope}] ${message} ${text}`;
}

/** Whether SWARM_DEBUG, read once at startup, turns `scope` on. */
export const debugEnabled = debugScopes(process.env.SWARM_DEBUG);

/** Prints `[scope] message {data}` when SWARM_DEBUG turns the scope on. Never log tokens, secrets or prompt bodies. */
export function debugLog(scope: string, message: string, data?: unknown): void {
  if (debugEnabled(scope)) console.log(formatDebug(scope, message, data));
}
