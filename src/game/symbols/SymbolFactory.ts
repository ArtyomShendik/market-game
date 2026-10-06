import type { Renderer, Texture } from 'pixi.js';
import type { AssetManager } from '../../sdk';
import { symbols, type SymbolArt } from './catalog';
import { SymbolCell } from './SymbolCell';

export class SymbolFactory {
  public constructor(
    private readonly renderer: Renderer,
    private readonly assets: AssetManager,
  ) {}

  public create(width: number, height: number): Map<string, Texture> {
    return new Map(symbols.map((symbol) => [symbol.id, this.bake(symbol, width, height)]));
  }

  private bake(symbol: SymbolArt, width: number, height: number): Texture {
    const cell = new SymbolCell({
      photo: this.assets.get<Texture>(symbol.asset),
      color: symbol.color,
      width,
      height,
    });

    const texture = this.renderer.generateTexture(cell.view);
    cell.view.destroy({ children: true });

    return texture;
  }
}
