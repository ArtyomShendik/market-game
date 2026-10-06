import { Container } from 'pixi.js';
import type { Reel, ReelTiming } from './Reel';
import { type ReelPhase, REEL_PHASE } from '../shared';

/** Темп одного спина: когда встаёт первый барабан и как идёт эстафета. */
export interface SlotTiming {
  /** Сколько секунд все барабаны крутятся до остановки первого. */
  spinDuration: number;
  /** Пауза между остановками соседних барабанов. */
  stopDelay: number;
  /** Темп самих барабанов. */
  reel?: Partial<ReelTiming>;
}

export interface SlotMachineOptions {
  reels: readonly Reel[];
  symbolWidth: number;
  symbolHeight: number;
  rows: number;
  gap?: number;
  /** Сколько секунд все барабаны крутятся до остановки первого. */
  spinDuration?: number;
  /** Пауза между остановками соседних барабанов. */
  stopDelay?: number;
}

export class SlotMachine {
  readonly view = new Container();

  private readonly reels: readonly Reel[];
  private readonly symbolWidth: number;
  private readonly symbolHeight: number;
  private readonly rows: number;
  private readonly gap: number;
  private spinDuration: number;
  private stopDelay: number;

  private phase: Extract<ReelPhase, 'idle' | 'spinning'> = REEL_PHASE.IDLE;

  private grid: readonly (readonly string[])[] | null = null;
  private elapsed = 0;
  private nextReel = 0;
  private resolveSpin: (() => void) | null = null;
  private currentSpin: Promise<void> = Promise.resolve();

  constructor(options: SlotMachineOptions) {
    if (options.reels.length === 0) {
      throw new Error('Slot machine needs at least one reel');
    }

    this.reels = options.reels;
    this.symbolWidth = options.symbolWidth;
    this.symbolHeight = options.symbolHeight;
    this.rows = options.rows;
    this.gap = options.gap ?? 0;
    this.spinDuration = options.spinDuration ?? 1.1;
    this.stopDelay = options.stopDelay ?? 0.32;

    this.reels.forEach((reel, index) => {
      reel.view.position.set(index * (this.symbolWidth + this.gap), 0);
      this.view.addChild(reel.view);
    });
  }

  get width(): number {
    return this.reels.length * this.symbolWidth + (this.reels.length - 1) * this.gap;
  }

  get height(): number {
    return this.rows * this.symbolHeight;
  }

  get isIdle(): boolean {
    return this.phase === REEL_PHASE.IDLE;
  }

  setTiming(timing: SlotTiming): void {
    this.spinDuration = timing.spinDuration;
    this.stopDelay = timing.stopDelay;
    if (!timing.reel) {
      return;
    }
    for (const reel of this.reels) {
      reel.setTiming(timing.reel);
    }
  }

  start(): Promise<void> {
    if (this.phase !== REEL_PHASE.IDLE) {
      return this.currentSpin;
    }

    this.phase = REEL_PHASE.SPINNING;
    this.grid = null;
    this.elapsed = 0;
    this.nextReel = 0;
    for (const reel of this.reels) {
      reel.start();
    }

    this.currentSpin = new Promise((resolve) => {
      this.resolveSpin = resolve;
    });
    return this.currentSpin;
  }

  land(grid: readonly (readonly string[])[]): void {
    if (this.phase !== REEL_PHASE.SPINNING || this.grid) {
      return;
    }
    this.assertGrid(grid);
    this.grid = grid;
  }

  update(dt: number): void {
    const step = Math.min(Math.max(dt, 0), 0.05);
    this.stopDueReels(step);
    for (const reel of this.reels) {
      reel.update(step);
    }
    this.finishIfSettled();
  }

  private assertGrid(grid: readonly (readonly string[])[]): void {
    if (grid.length !== this.reels.length) {
      throw new Error(`Expected ${this.reels.length} reels, got ${grid.length}`);
    }
    for (const column of grid) {
      if (column.length !== this.rows) {
        throw new Error(`Expected ${this.rows} rows, got ${column.length}`);
      }
    }
  }

  private stopDueReels(dt: number): void {
    if (this.phase !== REEL_PHASE.SPINNING) {
      return;
    }
    this.elapsed += dt;
    if (!this.grid) {
      return;
    }

    while (this.nextReel < this.reels.length) {
      const dueAt = this.spinDuration + this.nextReel * this.stopDelay;
      if (this.elapsed < dueAt) {
        return;
      }
      this.reels[this.nextReel].stopWith(this.grid[this.nextReel]);
      this.nextReel += 1;
    }
  }

  private finishIfSettled(): void {
    if (this.phase !== REEL_PHASE.SPINNING || this.nextReel < this.reels.length) {
      return;
    }
    if (this.reels.some((reel) => reel.currentPhase !== REEL_PHASE.IDLE)) {
      return;
    }

    this.phase = REEL_PHASE.IDLE;
    this.grid = null;
    const resolve = this.resolveSpin;
    this.resolveSpin = null;
    resolve?.();
  }
}
