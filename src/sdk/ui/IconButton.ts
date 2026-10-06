import { Container, Graphics, Rectangle, Sprite, Text, type Texture } from 'pixi.js';
import type { SpinButtonColors } from './SpinButton';

export interface IconButtonColors extends SpinButtonColors {
  active: number;
}

export interface IconButtonOptions {
  width: number;
  height: number;
  icon: Texture;
  iconSize: number;
  caption?: string;
  colors: IconButtonColors;
  onPress: () => void;
}

export class IconButton {
  readonly view = new Container();

  private readonly plate = new Graphics();
  private readonly captionText: Text | null = null;
  private readonly width: number;
  private readonly height: number;
  private readonly colors: IconButtonColors;
  private readonly onPress: () => void;
  private enabled = true;
  private pressed = false;
  private active = false;

  constructor(options: IconButtonOptions) {
    this.width = options.width;
    this.height = options.height;
    this.colors = options.colors;
    this.onPress = options.onPress;

    const hasCaption = options.caption !== undefined;
    const icon = new Sprite(options.icon);
    icon.anchor.set(0.5);
    icon.setSize(options.iconSize);
    icon.position.set(options.width / 2, hasCaption ? 26 : options.height / 2);

    this.view.addChild(this.plate);
    this.view.addChild(icon);

    if (hasCaption) {
      this.captionText = new Text({
        text: options.caption,
        style: {
          fill: options.colors.border,
          fontFamily: 'Georgia, serif',
          fontSize: 13,
          letterSpacing: 1,
        },
      });
      this.captionText.anchor.set(0.5);
      this.captionText.position.set(options.width / 2, options.height - 16);
      this.view.addChild(this.captionText);
    }

    this.view.pivot.set(options.width / 2, options.height / 2);
    this.view.eventMode = 'static';
    this.view.cursor = 'pointer';
    this.view.hitArea = new Rectangle(0, 0, options.width, options.height);

    this.view.on('pointerdown', () => this.setPressed(true));
    this.view.on('pointerup', () => this.setPressed(false));
    this.view.on('pointerupoutside', () => this.setPressed(false));
    this.view.on('pointertap', () => {
      if (!this.enabled) {
        return;
      }
      this.onPress();
    });

    this.redraw();
  }

  setCaption(text: string): void {
    if (!this.captionText) {
      return;
    }
    this.captionText.text = text;
  }

  setActive(active: boolean): void {
    if (this.active === active) {
      return;
    }
    this.active = active;
    this.redraw();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.view.eventMode = enabled ? 'static' : 'none';
    this.view.cursor = enabled ? 'pointer' : 'default';
    this.view.alpha = enabled ? 1 : 0.45;
    if (!enabled) {
      this.setPressed(false);
    }
  }

  private setPressed(pressed: boolean): void {
    if (!this.enabled || this.pressed === pressed) {
      return;
    }
    this.pressed = pressed;
    this.redraw();
  }

  private redraw(): void {
    const fill = this.pressed
      ? this.colors.pressed
      : this.active
        ? this.colors.active
        : this.colors.fill;

    this.plate.clear();
    this.plate.roundRect(0, 0, this.width, this.height, 18).fill(fill);
    this.plate.roundRect(0, 0, this.width, this.height, 18).stroke({
      width: this.active ? 5 : 4,
      color: this.colors.border,
    });
  }
}
