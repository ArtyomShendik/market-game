import { TEXT } from '../config/text';

export interface SymbolArt {
  id: string;
  name: string;
  color: number;
  frame: string;
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
  { id: SYMBOL.MANGO, name: TEXT.symbol.mango, color: 0xf0a030, frame: 'mango.png' },
  { id: SYMBOL.PINEAPPLE, name: TEXT.symbol.pineapple, color: 0xe8c56b, frame: 'pineapple.png' },
  { id: SYMBOL.WATERMELON, name: TEXT.symbol.watermelon, color: 0xd4534a, frame: 'watermelon.png' },
  { id: SYMBOL.GRAPE, name: TEXT.symbol.grape, color: 0x7a4ea3, frame: 'grape.png' },
  { id: SYMBOL.CHERRY, name: TEXT.symbol.cherry, color: 0xe24b5a, frame: 'cherry.png' },
  { id: SYMBOL.ORANGE, name: TEXT.symbol.orange, color: 0xf08a2a, frame: 'orange.png' },
  { id: SYMBOL.LEMON, name: TEXT.symbol.lemon, color: 0xf2d04a, frame: 'lemon.png' },
  { id: SYMBOL.PLUM, name: TEXT.symbol.plum, color: 0x8b6cc4, frame: 'plum.png' },
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
