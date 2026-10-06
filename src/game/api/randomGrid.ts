import { REEL_WINDOW } from '../config/theme';
import { paylines, paytable } from '../rules/paytable';

const FORCED_WIN_RATE = 0.7;

export function randomGrid(): string[][] {
  const ids = Object.keys(paytable);
  const grid = Array.from({ length: REEL_WINDOW.count }, () => {
    return Array.from({ length: REEL_WINDOW.rows }, () => pick(ids));
  });

  if (Math.random() > FORCED_WIN_RATE) {
    return grid;
  }

  const line = paylines[Math.floor(Math.random() * paylines.length)];
  const symbol = pick(ids);
  const count = 3 + Math.floor(Math.random() * 3);
  for (let reel = 0; reel < count; reel += 1) {
    grid[reel][line[reel]] = symbol;
  }
  return grid;
}

function pick(ids: readonly string[]): string {
  return ids[Math.floor(Math.random() * ids.length)];
}
