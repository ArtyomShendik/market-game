import { Container, Graphics, Text } from 'pixi.js';
import { SpinButton, type SpinButtonColors } from './SpinButton';

export interface BetStepperOptions {
  colors: SpinButtonColors;
  onDecrease: () => void;
  onIncrease: () => void;
}

export class BetStepper {
  readonly view = new Container();
  readonly width: number;

  private readonly valueText: Text;
  private readonly plate: Container;
  private readonly minus: SpinButton;
  private readonly plus: SpinButton;
  private enabled = true;
  private decreaseEnabled = true;
  private increaseEnabled = true;

  constructor(options: BetStepperOptions) {
    const button = 64;
    const valueWidth = 148;
    const gap = 10;
    this.width = button + gap + valueWidth + gap + button;

    this.minus = new SpinButton({
      width: button,
      height: button,
      label: '−',
      colors: options.colors,
      onPress: options.onDecrease,
    });
    this.plus = new SpinButton({
      width: button,
      height: button,
      label: '+',
      colors: options.colors,
      onPress: options.onIncrease,
    });

    this.plate = new Container();
    const background = new Graphics()
      .roundRect(0, 0, valueWidth, button, 18)
      .fill(options.colors.fill)
      .roundRect(0, 0, valueWidth, button, 18)
      .stroke({ width: 4, color: options.colors.border });
    const caption = new Text({
      text: 'СТАВКА',
      style: {
        fill: options.colors.border,
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        letterSpacing: 1,
      },
    });
    caption.anchor.set(0.5, 0);
    caption.position.set(valueWidth / 2, 8);
    this.valueText = new Text({
      text: '0',
      style: {
        fill: options.colors.label,
        fontFamily: 'Georgia, serif',
        fontSize: 24,
      },
    });
    this.valueText.anchor.set(0.5, 0);
    this.valueText.position.set(valueWidth / 2, 30);
    this.plate.addChild(background);
    this.plate.addChild(caption);
    this.plate.addChild(this.valueText);

    this.minus.view.position.set(button / 2, button / 2);
    this.plate.position.set(button + gap, 0);
    this.plus.view.position.set(this.width - button / 2, button / 2);

    this.view.addChild(this.minus.view);
    this.view.addChild(this.plate);
    this.view.addChild(this.plus.view);
    this.view.pivot.set(this.width / 2, button / 2);
  }

  setValue(value: string): void {
    this.valueText.text = value;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.plate.alpha = enabled ? 1 : 0.45;
    this.applyButtons();
  }

  setDecreaseEnabled(enabled: boolean): void {
    this.decreaseEnabled = enabled;
    this.applyButtons();
  }

  setIncreaseEnabled(enabled: boolean): void {
    this.increaseEnabled = enabled;
    this.applyButtons();
  }

  private applyButtons(): void {
    this.minus.setEnabled(this.enabled && this.decreaseEnabled);
    this.plus.setEnabled(this.enabled && this.increaseEnabled);
  }
}
