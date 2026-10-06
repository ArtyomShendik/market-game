import { BlurFilter, Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import { THEME } from '../config/theme';

export class SceneBackdrop {
  readonly view = new Container();

  private readonly image: Sprite;
  private readonly shade = new Graphics();
  private readonly shadeAlpha: number;

  constructor(texture: Texture, shadeAlpha = 0.48) {
    this.shadeAlpha = shadeAlpha;
    this.image = new Sprite(texture);
    this.view.addChild(this.image, this.shade);
  }

  resize(width: number, height: number): void {
    this.image.width = width;
    this.image.height = height;
    this.shade
      .clear()
      .rect(0, 0, width, height)
      .fill({ color: THEME.background, alpha: this.shadeAlpha });
  }
}

export function createFieldGlow(width: number, height: number): Graphics {
  const glow = new Graphics();
  glow.ellipse(width / 2, height / 2, width * 0.48, height * 0.62).fill({
    color: THEME.frame,
    alpha: 0.2,
  });
  glow.filters = [new BlurFilter({ strength: 48, quality: 3 })];
  return glow;
}

export function createFieldFrame(width: number, height: number): Graphics {
  const pad = 16;
  return new Graphics()
    .roundRect(-pad, -pad, width + pad * 2, height + pad * 2, 22)
    .fill(THEME.panel)
    .roundRect(-pad, -pad, width + pad * 2, height + pad * 2, 22)
    .stroke({ width: 4, color: THEME.frame });
}

export function createTitle(text: string, fontSize: number): Text {
  const title = new Text({
    text,
    style: {
      fill: THEME.title,
      fontFamily: 'Georgia, serif',
      fontSize,
      letterSpacing: 6,
    },
  });
  title.anchor.set(0.5, 1);
  return title;
}
