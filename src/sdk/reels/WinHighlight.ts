import { Container, Graphics } from 'pixi.js';

export interface HighlightCell {
  reel: number;
  row: number;
}

export interface HighlightLine {
  positions: readonly HighlightCell[];
  label: string;
}

export interface WinHighlightOptions {
  symbolWidth: number;
  symbolHeight: number;
  gap: number;
  color: number;
}

export class WinHighlight {
  readonly view = new Container();

  private readonly graphics = new Graphics();
  private readonly symbolWidth: number;
  private readonly symbolHeight: number;
  private readonly gap: number;
  private readonly color: number;
  private lines: readonly HighlightLine[] = [];
  private active = 0;
  private pulse = 0;
  private cycle = 0;

  constructor(options: WinHighlightOptions) {
    this.symbolWidth = options.symbolWidth;
    this.symbolHeight = options.symbolHeight;
    this.gap = options.gap;
    this.color = options.color;
    this.view.addChild(this.graphics);
    this.view.eventMode = 'none';
    this.view.visible = false;
  }

  get caption(): string {
    return this.lines[this.active]?.label ?? '';
  }

  show(lines: readonly HighlightLine[]): void {
    this.lines = lines.filter((line) => line.positions.length > 0);
    this.active = 0;
    this.pulse = 0;
    this.cycle = 0;
    this.view.visible = this.lines.length > 0;
    this.redraw();
  }

  clear(): void {
    this.lines = [];
    this.view.visible = false;
    this.graphics.clear();
  }

  update(dt: number): void {
    if (this.lines.length === 0) {
      return;
    }
    this.pulse += dt;
    this.cycle += dt;
    if (this.lines.length > 1 && this.cycle >= 1.6) {
      this.cycle = 0;
      this.active = (this.active + 1) % this.lines.length;
    }
    this.redraw();
  }

  private redraw(): void {
    const line = this.lines[this.active];
    const alpha = 0.55 + 0.45 * Math.sin(this.pulse * 5);
    this.graphics.clear();
    if (!line) {
      return;
    }

    this.drawPath(line, alpha);
    for (const cell of line.positions) {
      this.drawCell(cell, alpha);
    }
  }

  private drawPath(line: HighlightLine, alpha: number): void {
    const first = line.positions[0];
    if (!first) {
      return;
    }
    const start = this.center(first);
    this.graphics.moveTo(start.x, start.y);
    for (let index = 1; index < line.positions.length; index += 1) {
      const point = this.center(line.positions[index]);
      this.graphics.lineTo(point.x, point.y);
    }
    this.graphics.stroke({ width: 6, color: this.color, alpha, cap: 'round', join: 'round' });
  }

  private drawCell(cell: HighlightCell, alpha: number): void {
    const x = cell.reel * (this.symbolWidth + this.gap) + 7;
    const y = cell.row * this.symbolHeight + 7;
    const width = this.symbolWidth - 14;
    const height = this.symbolHeight - 14;
    this.graphics.roundRect(x, y, width, height, 16).fill({ color: this.color, alpha: 0.16 });
    this.graphics.roundRect(x, y, width, height, 16).stroke({ width: 4, color: this.color, alpha });
  }

  private center(cell: HighlightCell): { x: number; y: number } {
    return {
      x: cell.reel * (this.symbolWidth + this.gap) + this.symbolWidth / 2,
      y: cell.row * this.symbolHeight + this.symbolHeight / 2,
    };
  }
}
