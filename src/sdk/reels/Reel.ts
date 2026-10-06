import { BlurFilter, Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { easeInOutCubic, easeOutCubic, easeOutCubicSlope } from '../utils/ease';
import { positiveMod, travelToIndex } from '../utils/math';
import { REEL_PHASE, type ReelPhase } from '../shared';

/** Темп вращения. Меняя его, игра переключает режимы скорости. */
export interface ReelTiming {
  /** Скорость на полном ходу, в символах за секунду. */
  speed: number;
  /** Разгон до полной скорости, секунды. */
  accelTime: number;
  /** Длина торможения в символах. */
  brakeSymbols: number;
  /** Путь на полной скорости до начала торможения, в символах. */
  minExtraSymbols: number;
}

export interface ReelOptions {
  strip: readonly string[];
  rows: number;
  symbolWidth: number;
  symbolHeight: number;
  textures: ReadonlyMap<string, Texture>;
  timing?: Partial<ReelTiming>;
}

const defaultTiming: ReelTiming = {
  speed: 14,
  accelTime: 0.4,
  brakeSymbols: 5,
  minExtraSymbols: 6,
};

/**
 * Один барабан.
 *
 * `spin` — на сколько символов лента уехала вниз.
 * Целая часть сдвигает ленту на целые клетки, дробная — положение внутри клетки.
 * Символы идут по кругу: после последнего снова рисуется первый.
 *
 * Остановка считается заранее. Stop не выбирает новый результат,
 * а только доводит ленту до уже известного индекса.
 */
export class Reel {
  readonly view = new Container();

  private readonly strip: string[];
  private readonly rows: number;
  private readonly symbolHeight: number;
  private readonly textures: ReadonlyMap<string, Texture>;
  private timing: ReelTiming = { ...defaultTiming };
  private readonly symbols = new Container();
  private readonly sprites: Sprite[] = [];
  private readonly blur = new BlurFilter({ strengthX: 0, strengthY: 0, quality: 2 });
  private blurEnabled = false;

  private phase: ReelPhase = REEL_PHASE.IDLE;
  private spin = 0;
  private accelElapsed = 0;
  private pendingTarget: number | null = null;
  private pendingSymbols: string[] | null = null;
  private landing = 0;
  private brakeFrom = 0;
  private brakeTo = 0;
  private brakeElapsed = 0;
  private brakeDuration = 1;

  constructor(options: ReelOptions) {
    this.strip = [...options.strip];
    this.rows = options.rows;
    this.symbolHeight = options.symbolHeight;
    this.textures = options.textures;
    this.setTiming(options.timing ?? {});

    if (this.strip.length === 0) {
      throw new Error('Reel strip is empty');
    }
    for (const id of this.strip) {
      if (!this.textures.has(id)) {
        throw new Error(`Missing texture for symbol "${id}"`);
      }
    }

    const windowHeight = options.symbolHeight * options.rows;
    const mask = new Graphics().rect(0, 0, options.symbolWidth, windowHeight).fill(0xffffff);
    const backing = new Graphics().rect(0, 0, options.symbolWidth, windowHeight).fill(0x241830);
    const window = new Container();

    for (let i = 0; i < options.rows + 2; i += 1) {
      const sprite = new Sprite();
      this.symbols.addChild(sprite);
      this.sprites.push(sprite);
    }

    window.addChild(this.symbols);
    window.mask = mask;
    this.view.addChild(backing);
    this.view.addChild(mask);
    this.view.addChild(window);
    this.draw();
  }

  get currentPhase(): ReelPhase {
    return this.phase;
  }

  get stripLength(): number {
    return this.strip.length;
  }

  setTiming(timing: Partial<ReelTiming>): void {
    const next = { ...this.timing, ...timing };

    if (next.speed <= 0 || next.accelTime <= 0) {
      throw new Error('Reel timing needs positive speed and accelTime');
    }

    this.timing = next;
  }

  visibleSymbols(): string[] {
    const top = this.topIndex();
    return Array.from({ length: this.rows }, (_, row) => {
      return this.strip[positiveMod(top + row, this.strip.length)];
    });
  }

  start(): void {
    if (this.phase !== REEL_PHASE.IDLE) {
      return;
    }

    this.phase = REEL_PHASE.ACCELERATING;
    this.accelElapsed = 0;
    this.pendingTarget = null;
    this.pendingSymbols = null;
  }

  stopWith(visible: readonly string[]): void {
    if (visible.length !== this.rows) {
      throw new Error(`Expected ${this.rows} symbols, got ${visible.length}`);
    }

    for (const id of visible) {
      if (!this.textures.has(id)) {
        throw new Error(`Missing texture for symbol "${id}"`);
      }
    }

    if (this.phase === REEL_PHASE.ACCELERATING) {
      this.pendingSymbols = [...visible];
      return;
    }

    if (this.phase !== REEL_PHASE.SPINNING) {
      return;
    }

    this.landSymbols(visible);
  }

  stopAt(targetIndex: number): void {
    if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= this.strip.length) {
      throw new Error(`Reel stop index ${targetIndex} is outside the strip`);
    }
    if (this.phase === REEL_PHASE.ACCELERATING) {
      this.pendingTarget = targetIndex;
      return;
    }
    if (this.phase !== REEL_PHASE.SPINNING) {
      return;
    }
    this.beginStop(targetIndex);
  }

  update(dt: number): void {
    const step = Math.min(Math.max(dt, 0), 0.05);
    if (this.phase === REEL_PHASE.ACCELERATING) {
      this.advanceAccel(step);
    } else if (this.phase === REEL_PHASE.SPINNING) {
      this.spin += this.timing.speed * step;
    } else if (this.phase === REEL_PHASE.STOPPING) {
      this.advanceStopping(step);
    } else if (this.phase === REEL_PHASE.BRAKING) {
      this.advanceBraking(step);
    }

    this.draw();
    this.updateBlur();
  }

  private beginStop(targetIndex: number): void {
    const length = this.strip.length;
    const current = positiveMod(this.spin, length);
    const desired = positiveMod(-targetIndex, length);
    const distance = travelToIndex(current, desired, length, this.minStopDistance());
    this.landing = this.spin + distance;
    this.pendingTarget = null;
    this.phase = REEL_PHASE.STOPPING;
  }

  private minStopDistance(): number {
    return this.timing.brakeSymbols + this.timing.minExtraSymbols;
  }

  private advanceAccel(dt: number): void {
    this.accelElapsed += dt;
    const t = Math.min(1, this.accelElapsed / this.timing.accelTime);
    this.spin += this.timing.speed * easeInOutCubic(t) * dt;
    if (t < 1) {
      return;
    }

    this.phase = REEL_PHASE.SPINNING;
    if (this.pendingSymbols) {
      const symbols = this.pendingSymbols;
      this.pendingSymbols = null;
      this.landSymbols(symbols);
      return;
    }
    if (this.pendingTarget !== null) {
      this.beginStop(this.pendingTarget);
    }
  }

  private landSymbols(visible: readonly string[]): void {
    const length = this.strip.length;
    const minDistance = this.minStopDistance();
    const current = positiveMod(this.spin, length);
    const target = positiveMod(-Math.ceil(current + minDistance), length);

    for (let row = 0; row < visible.length; row += 1) {
      this.strip[positiveMod(target + row, length)] = visible[row];
    }
    this.beginStop(target);
  }

  private advanceStopping(dt: number): void {
    const brakeAt = this.landing - this.timing.brakeSymbols;
    const room = brakeAt - this.spin;
    const step = this.timing.speed * dt;

    if (room <= 0) {
      this.startBrake();
      this.advanceBraking(dt);
      return;
    }

    if (step < room) {
      this.spin += step;
      return;
    }

    this.spin = brakeAt;
    this.startBrake();
    this.advanceBraking((step - room) / this.timing.speed);
  }

  private startBrake(): void {
    this.phase = REEL_PHASE.BRAKING;
    this.brakeFrom = this.spin;
    this.brakeTo = this.landing;
    this.brakeElapsed = 0;
    const distance = Math.max(this.brakeTo - this.brakeFrom, 0.001);
    this.brakeDuration = (3 * distance) / this.timing.speed;
  }

  private advanceBraking(dt: number): void {
    this.brakeElapsed += dt;
    const t = Math.min(1, this.brakeElapsed / this.brakeDuration);
    this.spin = this.brakeFrom + (this.brakeTo - this.brakeFrom) * easeOutCubic(t);
    if (t < 1) {
      return;
    }

    this.spin = positiveMod(this.brakeTo, this.strip.length);
    this.phase = REEL_PHASE.IDLE;
  }

  private topIndex(): number {
    return positiveMod(-Math.floor(this.spin), this.strip.length);
  }

  private draw(): void {
    const fraction = this.spin - Math.floor(this.spin);
    const top = this.topIndex();

    this.sprites.forEach((sprite, index) => {
      const row = index - 1;
      const symbolId = this.strip[positiveMod(top + row, this.strip.length)];
      sprite.texture = this.textures.get(symbolId)!;
      sprite.y = (row + fraction) * this.symbolHeight;
    });
  }

  private updateBlur(): void {
    const speed = this.currentSpeed();
    if (speed < 0.8) {
      if (!this.blurEnabled) {
        return;
      }
      this.symbols.filters = null;
      this.blurEnabled = false;
      return;
    }

    this.blur.strengthY = Math.min(3, speed * 0.2);
    if (this.blurEnabled) {
      return;
    }
    this.symbols.filters = [this.blur];
    this.blurEnabled = true;
  }

  private currentSpeed(): number {
    if (this.phase === REEL_PHASE.IDLE) {
      return 0;
    }
    if (this.phase === REEL_PHASE.ACCELERATING) {
      const t = Math.min(1, this.accelElapsed / this.timing.accelTime);
      return this.timing.speed * easeInOutCubic(t);
    }
    if (this.phase === REEL_PHASE.BRAKING) {
      const t = Math.min(1, this.brakeElapsed / this.brakeDuration);
      const distance = this.brakeTo - this.brakeFrom;
      return (distance / this.brakeDuration) * easeOutCubicSlope(t);
    }
    return this.timing.speed;
  }
}
