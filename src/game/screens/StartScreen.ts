import { Container, Sprite, Text, type Texture } from 'pixi.js';
import { SpinButton, type ScreenSize } from '../../sdk';
import { buttonColors } from '../config/palette';
import { TEXT } from '../config/text';
import { THEME } from '../config/theme';
import { createTitle, SceneBackdrop } from '../view/decor';
import { readSafeArea } from '../view/safeArea';

export interface StartScreenOptions {
  background: Texture;
  emblem: Texture;
  onStart: () => void;
}

export class StartScreen {
  readonly view = new Container();

  private readonly backdrop: SceneBackdrop;
  private readonly emblem: Sprite;
  private readonly title: Text;
  private readonly subtitle: Text;
  private readonly start: SpinButton;

  constructor(options: StartScreenOptions) {
    this.backdrop = new SceneBackdrop(options.background, 0.64);

    this.emblem = new Sprite(options.emblem);
    this.emblem.anchor.set(0.5);

    this.title = createTitle(TEXT.title, 46);
    this.title.anchor.set(0.5);

    this.subtitle = new Text({
      text: TEXT.subtitle,
      style: {
        fill: THEME.label,
        fontFamily: 'Georgia, serif',
        fontSize: 16,
        letterSpacing: 4,
      },
    });
    this.subtitle.anchor.set(0.5);

    this.start = new SpinButton({
      width: 300,
      height: 76,
      label: TEXT.start,
      colors: buttonColors,
      onPress: options.onStart,
    });

    this.view.addChild(this.backdrop.view, this.emblem, this.title, this.subtitle, this.start.view);
  }

  layout(size: ScreenSize): void {
    const safe = readSafeArea();
    this.backdrop.resize(size.width, size.height);

    const compact = size.height < 520;
    const emblemSize = compact ? 120 : 200;
    const titleSize = compact ? 32 : 46;
    const buttonHeight = 76;
    const subtitleHeight = 20;
    const gap = compact ? 18 : 28;
    this.title.style.fontSize = titleSize;
    this.title.style.letterSpacing = compact ? 2 : 6;

    const stack = emblemSize + gap + titleSize + gap + subtitleHeight + gap + buttonHeight;
    const availableHeight = size.height - safe.top - safe.bottom - 24;
    const availableWidth = size.width - safe.left - safe.right - 32;
    const scale = Math.min(1, availableHeight / stack, availableWidth / 320);
    const centerX = size.width / 2;
    let top = (size.height - stack * scale) / 2;

    const emblemScale =
      (emblemSize / Math.max(this.emblem.texture.width, this.emblem.texture.height)) * scale;
    this.emblem.scale.set(emblemScale);
    this.emblem.position.set(centerX, top + (emblemSize * scale) / 2);
    top += (emblemSize + gap) * scale;

    const titleScale = Math.min(scale, availableWidth / Math.max(this.title.width, 1));
    this.title.scale.set(titleScale);
    this.title.position.set(centerX, top + (titleSize * scale) / 2);
    top += (titleSize + gap) * scale;

    this.subtitle.scale.set(scale);
    this.subtitle.position.set(centerX, top + (subtitleHeight * scale) / 2);
    top += (subtitleHeight + gap) * scale;

    this.start.view.scale.set(scale);
    this.start.view.position.set(centerX, top + (buttonHeight * scale) / 2);
  }
}
