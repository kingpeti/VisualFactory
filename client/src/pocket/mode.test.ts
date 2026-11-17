import { describe, expect, it } from 'vitest';
import { pickMode } from './mode';

describe('view mode', () => {
  const desktop = { office: null, pocket: null, saved: null, narrow: false, touch: false };
  const phone = { ...desktop, narrow: true, touch: true };

  it('opens the 3D office on a wide, non-touch screen', () => {
    expect(pickMode(desktop)).toBe('office');
  });

  it('opens the dashboard on a narrow or touch screen', () => {
    expect(pickMode(phone)).toBe('dashboard');
    expect(pickMode({ ...desktop, narrow: true })).toBe('dashboard');
    expect(pickMode({ ...desktop, touch: true })).toBe('dashboard');
  });

  it("follows this device's own choice over the screen", () => {
    expect(pickMode({ ...phone, saved: 'office' })).toBe('office');
    expect(pickMode({ ...desktop, saved: 'dashboard' })).toBe('dashboard');
    expect(pickMode({ ...desktop, saved: 'pocket' })).toBe('dashboard');
    expect(pickMode({ ...desktop, saved: 'nonsense' })).toBe('office');
    expect(pickMode({ ...phone, saved: 'nonsense' })).toBe('dashboard');
  });

  it('keeps ?pocket working over the saved choice', () => {
    expect(pickMode({ ...desktop, pocket: '' })).toBe('dashboard');
    expect(pickMode({ ...desktop, pocket: '1', saved: 'office' })).toBe('dashboard');
    expect(pickMode({ ...phone, pocket: '0' })).toBe('office');
    expect(pickMode({ ...phone, pocket: 'false' })).toBe('office');
  });

  it('lets ?office decide over everything else', () => {
    expect(pickMode({ ...phone, office: '3d' })).toBe('office');
    expect(pickMode({ ...phone, office: '3d', pocket: '1' })).toBe('office');
    expect(pickMode({ ...desktop, office: '2d', saved: 'office' })).toBe('dashboard');
    expect(pickMode({ ...desktop, office: 'x' })).toBe('office');
  });
});
