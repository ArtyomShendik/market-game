import { Container, type Text, type Texture } from 'pixi.js';
import type { ScreenSize } from '../../sdk';
import { TEXT } from '../config/text';
import { createTitle, SceneBackdrop } from '../view/decor';
import { ReelField } from '../view/ReelField';
import { readSafeArea } from '../view/safeArea';
import { SlotHud, type SlotHudCallbacks } from '../view/SlotHud';

export interface SlotScreenOptions {
  background: Texture;
  speedIcon: Texture;
  autoIcon: Texture;
  textures: ReadonlyMap<string, Texture>;
  callbacks: SlotHudCallbacks;
}

const FRAME_PAD = 16;
const CAPTION_HEIGHT = 40;

export class SlotScreen {
  readonly view = new Container();
  readonly field: ReelField;
  readonly hud: SlotHud;

  private readonly backdrop: SceneBackdrop;
  private readonly title: Text;

  constructor(options: SlotScreenOptions) {
    this.backdrop = new SceneBackdrop(options.background);
    this.field = new ReelField({ textures: options.textures });
    this.hud = new SlotHud({
      speedIcon: options.speedIcon,
      autoIcon: options.autoIcon,
      callbacks: options.callbacks,
    });
    this.title = createTitle(TEXT.title, 40);

    this.view.addChild(this.backdrop.view, this.title, this.field.view, this.hud.view);
  }

  layout(size: ScreenSize): void {
    const safe = readSafeArea();
    const margin = 12;
    this.backdrop.resize(size.width, size.height);

    const titleSize = size.width < 600 ? 26 : 40;
    this.title.style.fontSize = titleSize;

    const contentWidth = size.width - safe.left - safe.right - margin * 2;
    const hudHeight = this.hud.layout(contentWidth);
    const top = safe.top + margin + titleSize + 8;
    const bottom = size.height - safe.bottom - margin;
    const boxHeight = Math.max(80, bottom - hudHeight - 12 - top);
    const naturalWidth = this.field.width + FRAME_PAD * 2;
    const naturalHeight = this.field.height + FRAME_PAD + CAPTION_HEIGHT;
    const scale = Math.min(contentWidth / naturalWidth, boxHeight / naturalHeight);

    this.field.view.scale.set(scale);
    const visualHeight = naturalHeight * scale;
    const fieldTop = top + Math.max(0, (boxHeight - visualHeight) / 2);
    this.field.view.position.set(
      safe.left + margin + (contentWidth - this.field.width * scale) / 2,
      fieldTop + FRAME_PAD * scale,
    );
    this.title.position.set(size.width / 2, fieldTop - 8);
    this.hud.view.position.set(size.width / 2, bottom - hudHeight / 2);
  }

  update(dt: number): void {
    this.field.update(dt);
  }
}
