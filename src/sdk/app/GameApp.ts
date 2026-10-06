import { Application, Container, type Renderer, type Ticker } from 'pixi.js';

export interface GameAppOptions {
  background: number;
}

export interface ScreenSize {
  width: number;
  height: number;
}

type ResizeHandler = (size: ScreenSize) => void;

export class GameApp {
  readonly scene = new Container();

  private readonly app: Application;
  private readonly resizeHandlers = new Set<ResizeHandler>();

  private constructor(app: Application) {
    this.app = app;

    this.app.canvas.style.touchAction = 'none';
    document.body.appendChild(this.app.canvas);
    this.app.stage.addChild(this.scene);

    this.publishSize();
    this.app.renderer.on('resize', () => this.publishSize());
    window.visualViewport?.addEventListener('resize', () => this.app.resize());
  }

  static async create(options: GameAppOptions): Promise<GameApp> {
    const app = new Application();
    await app.init({
      background: options.background,
      resizeTo: window,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    });

    return new GameApp(app);
  }

  get size(): ScreenSize {
    return { width: this.app.screen.width, height: this.app.screen.height };
  }

  get renderer(): Renderer {
    return this.app.renderer;
  }

  get ticker(): Ticker {
    return this.app.ticker;
  }

  pause(): void {
    this.app.ticker.stop();
  }

  resume(): void {
    this.app.ticker.start();
  }

  onResize(handler: ResizeHandler): void {
    this.resizeHandlers.add(handler);
    handler(this.size);
  }

  add(view: Container): void {
    this.scene.addChild(view);
  }

  remove(view: Container): void {
    this.scene.removeChild(view);
    view.destroy({ children: true });
  }

  private publishSize(): void {
    const size = this.size;
    for (const handler of this.resizeHandlers) {
      handler(size);
    }
  }
}
