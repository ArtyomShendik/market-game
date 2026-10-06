import { wait, type AudioManager } from '../../sdk';
import type { MockSlotApi } from '../api/MockSlotApi';
import type { SessionResponse } from '../api/types';
import { ASSET_ALIAS } from '../config/assetManifest';
import { speedModes } from '../config/speedModes';
import type { SlotScreen } from '../screens/SlotScreen';
import { fallbackGrid, toHighlightLine } from '../utils';
import { formatCoins } from '../utils/formatCoins';

export interface SlotControllerOptions {
  screen: SlotScreen;
  api: MockSlotApi;
  audio: AudioManager;
  session: SessionResponse;
}

const AUTO_PAUSE_WITH_WIN = 0.9;
const AUTO_PAUSE = 0.35;

export class SlotController {
  private readonly screen: SlotScreen;
  private readonly api: MockSlotApi;
  private readonly audio: AudioManager;
  private readonly bets: readonly number[];

  private betIndex: number;
  private balance: number;
  private win = 0;
  private speedIndex = 0;
  private busy = false;
  private auto = false;
  private autoRunning = false;

  constructor(options: SlotControllerOptions) {
    this.screen = options.screen;
    this.api = options.api;
    this.audio = options.audio;
    this.bets = options.session.bets;
    this.betIndex = Math.max(0, this.bets.indexOf(options.session.bet));
    this.balance = options.session.balance;

    this.screen.field.setTiming(speedModes[this.speedIndex].timing);
    this.render();
  }

  changeBet(direction: -1 | 1): void {
    if (this.busy || this.auto) {
      return;
    }
    const next = this.betIndex + direction;
    if (next < 0 || next >= this.bets.length) {
      return;
    }
    this.betIndex = next;
    this.render();
  }

  cycleSpeed(): void {
    if (this.busy) {
      return;
    }
    this.speedIndex = (this.speedIndex + 1) % speedModes.length;
    this.screen.field.setTiming(speedModes[this.speedIndex].timing);
    this.audio.playOnce(ASSET_ALIAS.audio.spinClick, 0.25);
    this.render();
  }

  toggleAuto(): void {
    this.auto = !this.auto;
    this.audio.playOnce(ASSET_ALIAS.audio.spinClick, 0.25);
    this.render();
    if (this.auto) {
      void this.runAuto();
    }
  }

  async spin(): Promise<void> {
    if (this.busy || this.balance < this.currentBet()) {
      return;
    }

    void this.audio.unlock();
    this.audio.playOnce(ASSET_ALIAS.audio.spinClick, 0.35);
    const stopReelSound = this.audio.playLoop(ASSET_ALIAS.audio.reelSpin, 0.26);

    this.busy = true;
    this.win = 0;
    this.screen.field.clearWins();
    this.render();

    const settled = this.screen.field.spin();

    try {
      const result = await this.api.spin(this.currentBet());
      if (!result.ok) {
        this.screen.field.land(fallbackGrid());
        await settled;
        this.balance = result.balance;
        return;
      }

      this.balance = result.balance - result.win;
      this.render();

      this.screen.field.land(result.grid);
      await settled;

      this.balance = result.balance;
      this.win = result.win;
      this.screen.field.showWins(result.lines.map(toHighlightLine));
    } catch (error) {
      console.error(error);
      if (!this.screen.field.isIdle) {
        this.screen.field.land(fallbackGrid());
        await settled;
      }
    } finally {
      stopReelSound();
      this.busy = false;
      this.render();
    }
  }

  private async runAuto(): Promise<void> {
    if (this.autoRunning) {
      return;
    }

    this.autoRunning = true;

    try {
      while (this.auto && this.balance >= this.currentBet()) {
        await this.spin();
        if (!this.auto) {
          break;
        }
        await wait(this.win > 0 ? AUTO_PAUSE_WITH_WIN : AUTO_PAUSE);
      }
    } finally {
      this.autoRunning = false;
      this.auto = false;
      this.render();
    }
  }

  private currentBet(): number {
    return this.bets[this.betIndex] ?? this.bets[0];
  }

  private render(): void {
    const bet = this.currentBet();
    const locked = this.busy || this.auto;

    this.screen.hud.render({
      balance: formatCoins(this.balance),
      win: formatCoins(this.win),
      winHighlighted: this.win > 0,
      bet: formatCoins(bet),
      speedLabel: speedModes[this.speedIndex].label,
      autoActive: this.auto,
      canSpin: !locked && this.balance >= bet,
      canChangeBet: !locked,
      canDecreaseBet: this.betIndex > 0,
      canIncreaseBet: this.betIndex < this.bets.length - 1,
      canChangeSpeed: !this.busy,
      canToggleAuto: this.auto || this.balance >= bet,
    });
  }
}
