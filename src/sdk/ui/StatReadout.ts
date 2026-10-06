import { Container, Graphics, Text } from 'pixi.js';

export interface StatReadoutColors {
  fill: number;
  border: number;
  label: number;
  value: number;
}

export interface StatReadoutOptions {
  label: string;
  width: number;
  height: number;
  colors: StatReadoutColors;
}

export class StatReadout {
  readonly view = new Container();

  private readonly plate = new Graphics();
  private readonly valueText: Text;
  private readonly width: number;
  private readonly height: number;
  private readonly colors: StatReadoutColors;

  constructor(options: StatReadoutOptions) {
    this.width = options.width;
    this.height = options.height;
    this.colors = options.colors;

    const caption = new Text({
      text: options.label,
      style: {
        fill: options.colors.label,
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        letterSpacing: 1,
      },
    });
    caption.anchor.set(0.5, 0);
    caption.position.set(options.width / 2, 10);

    this.valueText = new Text({
      text: '0',
      style: {
        fill: options.colors.value,
        fontFamily: 'Georgia, serif',
        fontSize: 26,
      },
    });
    this.valueText.anchor.set(0.5, 0);
    this.valueText.position.set(options.width / 2, 32);

    this.view.addChild(this.plate);
    this.view.addChild(caption);
    this.view.addChild(this.valueText);
    this.view.pivot.set(options.width / 2, options.height / 2);
    this.redraw();
  }

  setValue(value: string, color?: number): void {
    this.valueText.text = value;
    this.valueText.style.fill = color ?? this.colors.value;
  }

  private redraw(): void {
    this.plate.clear();
    this.plate.roundRect(0, 0, this.width, this.height, 18).fill(this.colors.fill);
    this.plate.roundRect(0, 0, this.width, this.height, 18).stroke({
      width: 3,
      color: this.colors.border,
    });
  }
}
