import { ASSET_ALIAS } from '../config/assetManifest';

export interface SymbolArt {
  id: string;
  name: string;
  color: number;
  asset: string;
}

export const SYMBOL = {
  MANGO: 'mango',
  PINEAPPLE: 'pineapple',
  WATERMELON: 'watermelon',
  GRAPE: 'grape',
  CHERRY: 'cherry',
  ORANGE: 'orange',
  LEMON: 'lemon',
  PLUM: 'plum',
} as const;

export const symbols: readonly SymbolArt[] = [
  { id: SYMBOL.MANGO, name: 'Манго', color: 0xf0a030, asset: ASSET_ALIAS.symbol.mango },
  { id: SYMBOL.PINEAPPLE, name: 'Ананас', color: 0xe8c56b, asset: ASSET_ALIAS.symbol.pineapple },
  { id: SYMBOL.WATERMELON, name: 'Арбуз', color: 0xd4534a, asset: ASSET_ALIAS.symbol.watermelon },
  { id: SYMBOL.GRAPE, name: 'Виноград', color: 0x7a4ea3, asset: ASSET_ALIAS.symbol.grape },
  { id: SYMBOL.CHERRY, name: 'Вишня', color: 0xe24b5a, asset: ASSET_ALIAS.symbol.cherry },
  { id: SYMBOL.ORANGE, name: 'Апельсин', color: 0xf08a2a, asset: ASSET_ALIAS.symbol.orange },
  { id: SYMBOL.LEMON, name: 'Лимон', color: 0xf2d04a, asset: ASSET_ALIAS.symbol.lemon },
  { id: SYMBOL.PLUM, name: 'Слива', color: 0x8b6cc4, asset: ASSET_ALIAS.symbol.plum },
];

export const symbolIds: ReadonlySet<string> = new Set(symbols.map((symbol) => symbol.id));

export const symbolName: Readonly<Record<string, string>> = Object.fromEntries(
  symbols.map((symbol) => [symbol.id, symbol.name]),
);

export const REEL_STRIP: readonly string[] = [
  SYMBOL.CHERRY,
  SYMBOL.LEMON,
  SYMBOL.PINEAPPLE,
  SYMBOL.ORANGE,
  SYMBOL.GRAPE,
  SYMBOL.PLUM,
  SYMBOL.MANGO,
  SYMBOL.WATERMELON,
  SYMBOL.LEMON,
  SYMBOL.PINEAPPLE,
  SYMBOL.CHERRY,
  SYMBOL.ORANGE,
  SYMBOL.GRAPE,
  SYMBOL.WATERMELON,
  SYMBOL.PLUM,
  SYMBOL.MANGO,
];
