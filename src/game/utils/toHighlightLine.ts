import { type HighlightLine } from '../../sdk';
import type { SpinWin } from '../rules/paytable';
import { symbolName } from '../symbols/catalog';
import { formatCoins } from './formatCoins';

export function toHighlightLine(line: SpinWin): HighlightLine {
  return {
    positions: Array.from({ length: line.count }, (_, reel) => ({
      reel,
      row: line.rows[reel],
    })),
    label: `${symbolName[line.symbol] ?? line.symbol} ×${line.count} · ${formatCoins(line.amount)}`,
  };
}
