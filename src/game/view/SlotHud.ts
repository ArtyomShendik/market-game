import { Container, type Texture } from 'pixi.js';
import { BetStepper, IconButton, SpinButton, StatReadout } from '../../sdk';
import { buttonColors, iconColors, readoutColors } from '../config/palette';
import { TEXT } from '../config/text';
import { LAYOUT, THEME } from '../config/theme';
import { placeRow, rowWidth } from '../utils';

export interface SlotHudCallbacks {
  onSpin: () => void;
  onAuto: () => void;
  onSpeed: () => void;
  onBet: (direction: -1 | 1) => void;
}

export interface SlotHudOptions {
  speedIcon: Texture;
  autoIcon: Texture;
  callbacks: SlotHudCallbacks;
}

export interface SlotHudState {
  balance: string;
  win: string;
  winHighlighted: boolean;
  bet: string;
  speedLabel: string;
  autoActive: boolean;
  canSpin: boolean;
  canChangeBet: boolean;
  canDecreaseBet: boolean;
  canIncreaseBet: boolean;
  canChangeSpeed: boolean;
  canToggleAuto: boolean;
}

export class SlotHud {
  readonly view = new Container();

  private readonly balanceView: StatReadout;
  private readonly winView: StatReadout;
  private readonly stepper: BetStepper;
  private readonly spinButton: SpinButton;
  private readonly speedButton: IconButton;
  private readonly autoButton: IconButton;

  constructor(options: SlotHudOptions) {
    const { callbacks } = options;

    this.balanceView = new StatReadout({
      label: TEXT.balance,
      width: LAYOUT.statWidth,
      height: LAYOUT.controlHeight,
      colors: readoutColors,
    });
    this.winView = new StatReadout({
      label: TEXT.win,
      width: LAYOUT.statWidth,
      height: LAYOUT.controlHeight,
      colors: readoutColors,
    });
    this.stepper = new BetStepper({
      label: TEXT.bet,
      colors: buttonColors,
      onDecrease: () => callbacks.onBet(-1),
      onIncrease: () => callbacks.onBet(1),
    });
    this.spinButton = new SpinButton({
      width: LAYOUT.spinWidth,
      height: LAYOUT.controlHeight,
      label: TEXT.spin,
      colors: buttonColors,
      onPress: callbacks.onSpin,
    });
    this.speedButton = new IconButton({
      width: LAYOUT.iconWidth,
      height: LAYOUT.controlHeight,
      icon: options.speedIcon,
      iconSize: LAYOUT.iconSize,
      caption: '',
      colors: iconColors,
      onPress: callbacks.onSpeed,
    });
    this.autoButton = new IconButton({
      width: LAYOUT.iconWidth,
      height: LAYOUT.controlHeight,
      icon: options.autoIcon,
      iconSize: LAYOUT.iconSize,
      caption: TEXT.auto,
      colors: iconColors,
      onPress: callbacks.onAuto,
    });

    this.view.addChild(
      this.balanceView.view,
      this.stepper.view,
      this.speedButton.view,
      this.spinButton.view,
      this.autoButton.view,
      this.winView.view,
    );
  }

  layout(maxWidth: number): number {
    const gap = LAYOUT.hudGap;
    const height = LAYOUT.controlHeight;
    const balance = { view: this.balanceView.view, width: LAYOUT.statWidth };
    const win = { view: this.winView.view, width: LAYOUT.statWidth };
    const bet = { view: this.stepper.view, width: this.stepper.width };
    const speed = { view: this.speedButton.view, width: LAYOUT.iconWidth };
    const spin = { view: this.spinButton.view, width: LAYOUT.spinWidth };
    const auto = { view: this.autoButton.view, width: LAYOUT.iconWidth };

    const oneRow = [balance, bet, speed, spin, auto, win];
    const twoRows = [
      [balance, bet, win],
      [speed, spin, auto],
    ];
    const threeRows = [[balance, win], [bet], [speed, spin, auto]];

    const rows =
      maxWidth / rowWidth(oneRow, gap) >= 0.68
        ? [oneRow]
        : maxWidth / Math.max(...twoRows.map((row) => rowWidth(row, gap))) >= 0.72
          ? twoRows
          : threeRows;

    const widest = Math.max(...rows.map((row) => rowWidth(row, gap)));
    const scale = Math.min(1, maxWidth / widest);
    this.view.scale.set(scale);

    const rowGap = 16;
    rows.forEach((row, index) => {
      placeRow(this.view, row, {
        centerX: 0,
        y: height / 2 + index * (height + rowGap),
        gap,
      });
    });

    const blockHeight = rows.length * height + (rows.length - 1) * rowGap;
    this.view.pivot.set(0, blockHeight / 2);
    return blockHeight * scale;
  }

  render(state: SlotHudState): void {
    this.balanceView.setValue(state.balance);
    this.winView.setValue(state.win, state.winHighlighted ? THEME.frame : THEME.title);
    this.stepper.setValue(state.bet);
    this.stepper.setEnabled(state.canChangeBet);
    this.stepper.setDecreaseEnabled(state.canDecreaseBet);
    this.stepper.setIncreaseEnabled(state.canIncreaseBet);
    this.spinButton.setEnabled(state.canSpin);
    this.speedButton.setCaption(state.speedLabel);
    this.speedButton.setEnabled(state.canChangeSpeed);
    this.autoButton.setActive(state.autoActive);
    this.autoButton.setEnabled(state.canToggleAuto);
  }
}
