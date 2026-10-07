import type { Texture } from 'pixi.js';
import {
  AssetCache,
  AssetManager,
  AudioManager,
  GameApp,
  LoadingScreen,
  VisibilityWatcher,
  wait,
} from '../sdk';
import { MockSlotApi } from './api/MockSlotApi';
import type { SessionResponse } from './api/types';
import { ASSET_ALIAS, ASSET_CACHE_NAME, ASSET_MANIFEST, GAME_AUDIO } from './config/assetManifest';
import { TEXT } from './config/text';
import { REEL_WINDOW, THEME } from './config/theme';
import { SlotController } from './play/SlotController';
import { SlotScreen } from './screens/SlotScreen';
import { StartScreen } from './screens/StartScreen';
import { SymbolFactory } from './symbols/SymbolFactory';

const MIN_LOADING_TIME = 0.65;
const IMAGE_PROGRESS_WEIGHT = 0.8;

export class NightMarketGame {
  private readonly assetCache = new AssetCache(ASSET_CACHE_NAME);
  private readonly assets = new AssetManager(ASSET_MANIFEST, this.assetCache);
  private readonly audio = new AudioManager(this.assetCache);
  private readonly api = new MockSlotApi();
  private readonly visibility = new VisibilityWatcher();
  private readonly app: GameApp;
  private loader?: LoadingScreen;
  private startScreen?: StartScreen;
  private slotScreen?: SlotScreen;

  private constructor(app: GameApp) {
    this.app = app;
    this.visibility.watch((visible) => this.setActive(visible));
    this.app.onResize((size) => {
      this.loader?.layout(size.width, size.height);
      this.startScreen?.layout(size);
      this.slotScreen?.layout(size);
    });
  }

  private setActive(visible: boolean): void {
    if (visible) {
      this.app.resume();
    } else {
      this.app.pause();
    }
    void this.audio.setMuted(!visible).catch(console.error);
  }

  static async launch(): Promise<void> {
    const app = await GameApp.create({ background: THEME.background });

    const game = new NightMarketGame(app);
    await game.run();
  }

  private async run(): Promise<void> {
    await this.assets.initialize();
    await this.assets.loadPhase('preload');

    const session = await this.loadGameContent();
    await this.waitForStart();
    this.openSlotScreen(session);
  }

  private async loadGameContent(): Promise<SessionResponse> {
    const { width, height } = this.app.size;
    const loader = new LoadingScreen({
      width,
      height,
      emblem: this.assets.get<Texture>(ASSET_ALIAS.loaderEmblem),
      title: TEXT.title,
      background: THEME.background,
      accent: THEME.frame,
      text: THEME.title,
    });
    this.loader = loader;
    this.app.add(loader.view);

    let images = 0;
    let sounds = 0;
    const report = (): void => {
      loader.setProgress(images * IMAGE_PROGRESS_WEIGHT + sounds * (1 - IMAGE_PROGRESS_WEIGHT));
    };

    const [, , session] = await Promise.all([
      this.assets.loadPhase('game', (progress) => {
        images = progress;
        report();
      }),
      this.audio.load(GAME_AUDIO, (progress) => {
        sounds = progress;
        report();
      }),
      this.api.session(),
      wait(MIN_LOADING_TIME),
    ]);

    loader.setProgress(1);
    this.loader = undefined;
    this.app.remove(loader.view);
    return session;
  }

  private waitForStart(): Promise<void> {
    return new Promise((resolve) => {
      const screen = new StartScreen({
        background: this.assets.get<Texture>(ASSET_ALIAS.background),
        emblem: this.assets.get<Texture>(ASSET_ALIAS.loaderEmblem),
        onStart: () => {
          this.startMusic();
          this.startScreen = undefined;
          this.app.remove(screen.view);
          resolve();
        },
      });
      this.startScreen = screen;
      screen.layout(this.app.size);
      this.app.add(screen.view);
    });
  }

  private startMusic(): void {
    this.audio.unlock();
    this.audio.playOnce(ASSET_ALIAS.audio.spinClick, 0.3);
    this.audio.playMusic(ASSET_ALIAS.audio.music);
  }

  private openSlotScreen(session: SessionResponse): void {
    const textures = new SymbolFactory(this.app.renderer, this.assets).create(
      REEL_WINDOW.symbolWidth,
      REEL_WINDOW.symbolHeight,
    );

    this.slotScreen = new SlotScreen({
      background: this.assets.get<Texture>(ASSET_ALIAS.background),
      speedIcon: this.assets.get<Texture>(ASSET_ALIAS.icon.speed),
      autoIcon: this.assets.get<Texture>(ASSET_ALIAS.icon.auto),
      textures,
      callbacks: {
        onSpin: () => void controller.spin(),
        onAuto: () => controller.toggleAuto(),
        onSpeed: () => controller.cycleSpeed(),
        onBet: (direction) => controller.changeBet(direction),
      },
    });
    const screen = this.slotScreen;
    const controller = new SlotController({
      screen,
      api: this.api,
      audio: this.audio,
      session,
    });

    screen.layout(this.app.size);
    this.app.add(screen.view);
    this.app.ticker.add((ticker) => screen.update(ticker.deltaMS / 1000));
  }
}
