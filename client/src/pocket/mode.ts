// Which office this device gets: the 2D dashboard (client/src/dashboard/, which is also pocket mode on a phone;
// docs/pocket.md) or the 3D one. A wide, non-touch screen opens the 3D office; a narrow or touch screen the dashboard.
// ?office=3d / ?office=2d (or the old ?pocket=0 / ?pocket=1) decide for one visit; a choice made in the app is
// remembered on this device, and a device that remembered "pocket" gets the dashboard.
import { create } from 'zustand';

export type ViewMode = 'dashboard' | 'office';

const KEY = 'cubefarm:mode';

/** The mode to start in: the URL's say (?office, then ?pocket), then this device's last choice, then the screen. */
export function pickMode(hints: { office: string | null; pocket: string | null; saved: string | null; narrow: boolean; touch: boolean }): ViewMode {
  if (hints.office === '3d') return 'office';
  if (hints.office === '2d') return 'dashboard';
  if (hints.pocket !== null) return hints.pocket === '0' || hints.pocket === 'false' ? 'office' : 'dashboard';
  if (hints.saved === 'office') return 'office';
  if (hints.saved === 'dashboard' || hints.saved === 'pocket') return 'dashboard';
  return hints.narrow || hints.touch ? 'dashboard' : 'office';
}

function startMode(): ViewMode {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    // no storage: decide from the screen
  }
  const query = new URLSearchParams(location.search);
  const hints = {
    office: query.get('office'),
    pocket: query.get('pocket'),
    saved,
    narrow: matchMedia('(max-width: 760px)').matches,
    touch: matchMedia('(hover: none) and (pointer: coarse)').matches,
  };
  const mode = pickMode(hints);
  console.debug('[mode] picked', { mode, ...hints });
  return mode;
}

export const useMode = create<{ mode: ViewMode }>(() => ({ mode: typeof window === 'undefined' ? 'office' : startMode() }));

/** Switches this device to `mode` and remembers it ('pocket' is the dashboard's old name). */
export function setMode(mode: ViewMode | 'pocket') {
  const m: ViewMode = mode === 'pocket' ? 'dashboard' : mode;
  try {
    localStorage.setItem(KEY, m);
  } catch {
    // remembered for this visit only
  }
  useMode.setState({ mode: m });
}
