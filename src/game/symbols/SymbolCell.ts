import { Container, Graphics, Sprite, type Texture } from 'pixi.js';

export interface SymbolCellOptions {
  photo: Texture;
  color: number;
  width: number;
  height: number;
}

export class SymbolCell {
  readonly view = new Container();

  public constructor(options: SymbolCellOptions) {
    const { photo, color, width, height } = options;

    const mask = new Graphics().roundRect(0, 0, width, height, 18).fill(0xffffff);
    const sprite = new Sprite(photo);
    const cover = Math.max(width / photo.width, height / photo.height);
    sprite.anchor.set(0.5);
    sprite.scale.set(cover);
    sprite.position.set(width / 2, height / 2);
    sprite.mask = mask;

    const frame = new Graphics()
      .roundRect(3, 3, width - 6, height - 6, 16)
      .stroke({ width: 3, color, alpha: 0.95 });

    this.view.addChild(mask, sprite, frame);
  }
}
