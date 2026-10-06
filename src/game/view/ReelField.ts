import { Container, Text, type Texture } from 'pixi.js';
import { Reel, SlotMachine, WinHighlight, type HighlightLine, type SlotTiming } from '../../sdk';
import { REEL_WINDOW, THEME } from '../config/theme';
import { createFieldFrame, createFieldGlow } from './decor';
import { reelStripFor } from '../utils/reelStripFor';

export interface ReelFieldOptions {
  textures: ReadonlyMap<string, Texture>;
}

export class ReelField {
  readonly view = new Container();

  private readonly machine: SlotMachine;
  private readonly highlight: WinHighlight;
  private readonly caption: Text;

  constructor(options: ReelFieldOptions) {
    const reels = Array.from({ length: REEL_WINDOW.count }, (_, index) => {
      return new Reel({
        strip: reelStripFor(index),
        rows: REEL_WINDOW.rows,
        symbolWidth: REEL_WINDOW.symbolWidth,
        symbolHeight: REEL_WINDOW.symbolHeight,
        textures: options.textures,
      });
    });

    this.machine = new SlotMachine({
      reels,
      symbolWidth: REEL_WINDOW.symbolWidth,
      symbolHeight: REEL_WINDOW.symbolHeight,
      rows: REEL_WINDOW.rows,
      gap: REEL_WINDOW.gap,
    });
    this.highlight = new WinHighlight({
      symbolWidth: REEL_WINDOW.symbolWidth,
      symbolHeight: REEL_WINDOW.symbolHeight,
      gap: REEL_WINDOW.gap,
      color: THEME.frame,
    });
    this.caption = new Text({
      text: '',
      style: {
        fill: THEME.frame,
        fontFamily: 'Georgia, serif',
        fontSize: 22,
      },
    });
    this.caption.anchor.set(0.5, 0);
    this.caption.position.set(this.machine.width / 2, this.machine.height + 16);

    this.view.addChild(
      createFieldGlow(this.machine.width, this.machine.height),
      createFieldFrame(this.machine.width, this.machine.height),
      this.machine.view,
      this.highlight.view,
      this.caption,
    );
  }

  get width(): number {
    return this.machine.width;
  }

  get height(): number {
    return this.machine.height;
  }

  get isIdle(): boolean {
    return this.machine.isIdle;
  }

  setTiming(timing: SlotTiming): void {
    this.machine.setTiming(timing);
  }

  spin(): Promise<void> {
    return this.machine.start();
  }

  land(grid: readonly (readonly string[])[]): void {
    this.machine.land(grid);
  }

  showWins(lines: readonly HighlightLine[]): void {
    this.highlight.show(lines);
  }

  clearWins(): void {
    this.highlight.clear();
    this.caption.text = '';
  }

  update(dt: number): void {
    this.machine.update(dt);
    this.highlight.update(dt);
    this.caption.text = this.highlight.caption;
  }
}
