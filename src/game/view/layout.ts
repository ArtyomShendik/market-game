import type { Container } from 'pixi.js';

export interface RowItem {
  view: Container;
  width: number;
}

export interface RowOptions {
  centerX: number;
  y: number;
  gap: number;
}

export function placeRow(parent: Container, items: readonly RowItem[], options: RowOptions): void {
  const total = items.reduce((sum, item) => sum + item.width, 0) + options.gap * (items.length - 1);
  let x = options.centerX - total / 2;

  for (const item of items) {
    item.view.position.set(x + item.width / 2, options.y);
    parent.addChild(item.view);
    x += item.width + options.gap;
  }
}
