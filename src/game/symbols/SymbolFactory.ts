import { Spritesheet, type Renderer, type Texture } from 'pixi.js';
import type { AssetManager } from '../../sdk';
import { ASSET_ALIAS } from '../config/assetManifest';
import atlasData from '../assets/symbols/symbols.json';
import { symbols, type SymbolArt } from './catalog';
import { SymbolCell } from './SymbolCell';

/** Собирает клетки из кадров атласа symbols.png / symbols.json. */
export class SymbolFactory {
  public constructor(
    private readonly renderer: Renderer,
    private readonly assets: AssetManager,
  ) {}

  public create(width: number, height: number): Map<string, Texture> {
    const frames = this.parseAtlas();
    return new Map(symbols.map((symbol) => [symbol.id, this.bake(symbol, frames, width, height)]));
  }

  private parseAtlas(): Record<string, Texture> {
    const atlas = this.assets.get<Texture>(ASSET_ALIAS.symbols);
    const sheet = new Spritesheet(atlas, atlasData);
    return sheet.parseSync();
  }

  private bake(
    symbol: SymbolArt,
    frames: Record<string, Texture>,
    width: number,
    height: number,
  ): Texture {
    const photo = frames[symbol.frame];
    if (!photo) {
      throw new Error(`Atlas is missing frame "${symbol.frame}"`);
    }

    const cell = new SymbolCell({
      photo,
      color: symbol.color,
      width,
      height,
    });

    const texture = this.renderer.generateTexture(cell.view);
    cell.view.destroy({ children: true });

    return texture;
  }
}
