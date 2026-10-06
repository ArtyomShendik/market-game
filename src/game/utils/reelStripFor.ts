import { REEL_STRIP } from '../symbols/catalog';

export function reelStripFor(index: number): string[] {
  const shift = (index * 3) % REEL_STRIP.length;
  return [...REEL_STRIP.slice(shift), ...REEL_STRIP.slice(0, shift)];
}
