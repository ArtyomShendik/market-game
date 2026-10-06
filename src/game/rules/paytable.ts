/** Манго заменяет любой символ. Само по себе тоже платит, если линия из одного манго. */
export const WILD = 'mango';

/**
 * Множитель ставки за 3, 4 и 5 одинаковых символов слева направо.
 * Индекс 0 — тройка, 1 — четвёрка, 2 — пятёрка.
 */
export const paytable: Readonly<Record<string, readonly [number, number, number]>> = {
  plum: [1, 2, 5],
  lemon: [1, 3, 8],
  orange: [2, 4, 10],
  cherry: [2, 5, 15],
  grape: [3, 8, 20],
  watermelon: [5, 12, 30],
  pineapple: [8, 20, 50],
  mango: [10, 25, 60],
};

/** Пять линий. Число — ряд на барабане: 0 сверху, 1 середина, 2 снизу. */
export const paylines: readonly (readonly number[])[] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
];

export interface SpinWin {
  symbol: string;
  count: number;
  amount: number;
  rows: number[];
}
