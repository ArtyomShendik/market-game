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
