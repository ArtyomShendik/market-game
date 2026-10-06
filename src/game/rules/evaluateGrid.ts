import { paylines, paytable, WILD, type SpinWin } from './paytable';

export function evaluateGrid(grid: readonly (readonly string[])[], bet: number): SpinWin[] {
  const wins: SpinWin[] = [];
  for (const rows of paylines) {
    const win = evaluateLine(grid, rows, bet);
    if (win) {
      wins.push(win);
    }
  }
  wins.sort((a, b) => b.amount - a.amount);
  return wins;
}

function evaluateLine(
  grid: readonly (readonly string[])[],
  rows: readonly number[],
  bet: number,
): SpinWin | null {
  let symbol = grid[0][rows[0]];
  let count = 1;

  for (let reel = 1; reel < rows.length; reel += 1) {
    const current = grid[reel][rows[reel]];
    const matches = current === symbol || current === WILD || symbol === WILD;
    if (!matches) {
      break;
    }
    if (symbol === WILD && current !== WILD) {
      symbol = current;
    }
    count += 1;
  }

  if (count < 3) {
    return null;
  }
  const multiplier = paytable[symbol]?.[count - 3];
  if (!multiplier) {
    return null;
  }

  return {
    symbol,
    count,
    amount: multiplier * bet,
    rows: [...rows],
  };
}
