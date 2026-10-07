import { type RowItem } from '../view/layout';

export function rowWidth(row: readonly RowItem[], gap: number): number {
  return row.reduce((sum, item) => sum + item.width, 0) + gap * (row.length - 1);
}
