import { Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';

export interface LoadingScreenOptions {
  width: number;
  height: number;
  emblem: Texture;
  title: string;
  background: number;
  accent: number;
  text: number;
}

export class LoadingScreen {
  public readonly view = new Container();

  private readonly backdrop = new Graphics();
  private readonly emblem: Sprite;
  private readonly title: Text;
  private readonly bar = new Graphics();
  private readonly percent: Text;
  private width: number;
  private height: number;
  private progress = 0;

  public constructor(private readonly options: LoadingScreenOptions) {
    this.width = options.width;
    this.height = options.height;

    this.emblem = new Sprite(options.emblem);
    this.emblem.anchor.set(0.5);

    this.title = new Text({
      text: options.title,
      style: {
        fill: options.text,
        fontFamily: 'Georgia, serif',
        fontSize: 34,
        letterSpacing: 6,
      },
    });
    this.title.anchor.set(0.5);

    this.percent = new Text({
      text: '0%',
      style: {
        fill: options.text,
        fontFamily: 'Arial, sans-serif',
        fontSize: 18,
      },
    });
    this.percent.anchor.set(0.5);

    this.view.addChild(this.backdrop, this.emblem, this.title, this.bar, this.percent);
    this.layout(options.width, options.height);
  }

  public layout(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.backdrop.clear().rect(0, 0, width, height).fill(this.options.background);

    const compact = height < 520 || width < 480;
    const emblemSize = compact ? 120 : 190;
    this.emblem.width = emblemSize;
    this.emblem.height = emblemSize;
    this.emblem.position.set(width / 2, height / 2 - (compact ? 70 : 90));
    this.fitTitle(Math.max(120, width - 48), compact ? 26 : 34, compact ? 2 : 6);
    this.title.position.set(width / 2, height / 2 + (compact ? 24 : 42));
    this.percent.position.set(width / 2, height / 2 + (compact ? 110 : 136));
    this.drawBar();
  }

  private fitTitle(maxWidth: number, fontSize: number, tracking: number): void {
    this.title.scale.set(1);
    this.title.style.fontSize = fontSize;
    this.title.style.letterSpacing = tracking;

    while (fontSize > 16 && this.title.width > maxWidth) {
      fontSize -= 1;
      tracking = Math.max(0, tracking - 0.25);
      this.title.style.fontSize = fontSize;
      this.title.style.letterSpacing = tracking;
    }

    if (this.title.width > maxWidth) {
      this.title.scale.set(maxWidth / this.title.width);
    }
  }

  public setProgress(value: number): void {
    this.progress = Math.max(0, Math.min(1, value));
    this.percent.text = `${Math.round(this.progress * 100)}%`;
    this.drawBar();
  }

  private drawBar(): void {
    const barWidth = Math.max(120, Math.min(420, this.width - 48));
    const x = (this.width - barWidth) / 2;
    const y = this.height / 2 + (this.height < 520 ? 72 : 92);
    this.bar
      .clear()
      .roundRect(x, y, barWidth, 18, 9)
      .fill({ color: 0x0b0710, alpha: 0.9 })
      .roundRect(x, y, barWidth, 18, 9)
      .stroke({ width: 2, color: this.options.accent, alpha: 0.75 });

    const fillWidth = Math.max(0, (barWidth - 6) * this.progress);
    if (fillWidth > 0) {
      this.bar.roundRect(x + 3, y + 3, fillWidth, 12, 6).fill(this.options.accent);
    }
  }
}
