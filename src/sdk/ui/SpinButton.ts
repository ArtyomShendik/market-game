import { Container, Graphics, Rectangle, Text } from 'pixi.js';

export interface SpinButtonColors {
  fill: number;
  pressed: number;
  border: number;
  label: number;
}

export interface SpinButtonOptions {
  width: number;
  height: number;
  label: string;
  colors: SpinButtonColors;
  onPress: () => void;
}

export class SpinButton {
  readonly view = new Container();

  private readonly plate = new Graphics();
  private readonly labelText: Text;
  private readonly width: number;
  private readonly height: number;
  private readonly colors: SpinButtonColors;
  private readonly onPress: () => void;
  private enabled = true;
  private pressed = false;

  constructor(options: SpinButtonOptions) {
    this.width = options.width;
    this.height = options.height;
    this.colors = options.colors;
    this.onPress = options.onPress;

    this.labelText = new Text({
      text: options.label,
      style: {
        fill: options.colors.label,
        fontFamily: 'Georgia, serif',
        fontSize: 28,
        letterSpacing: 3,
      },
    });
    this.labelText.anchor.set(0.5);
    this.labelText.position.set(options.width / 2, options.height / 2);

    this.view.addChild(this.plate);
    this.view.addChild(this.labelText);
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
    const fill = this.pressed ? this.colors.pressed : this.colors.fill;
    this.plate.clear();
    this.plate.roundRect(0, 0, this.width, this.height, 18).fill(fill);
    this.plate.roundRect(0, 0, this.width, this.height, 18).stroke({
      width: 4,
      color: this.colors.border,
    });
  }
}
