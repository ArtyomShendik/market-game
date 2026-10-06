import type { SlotTiming } from '../../sdk';

export interface SpeedMode {
  /** Подпись на кнопке ускорения. */
  label: string;
  timing: SlotTiming;
}

/**
 * Три режима скорости. Тайминги подобраны так, чтобы пять барабанов
 * полностью вставали примерно за 3, 2 и 1 секунду: чем быстрее режим,
 * тем выше скорость ленты и короче разгон, эстафета и торможение.
 */
export const speedModes: readonly SpeedMode[] = [
  {
    label: '3 СЕК',
    timing: {
      spinDuration: 0.62,
      stopDelay: 0.26,
      reel: { speed: 16, accelTime: 0.4, brakeSymbols: 5, minExtraSymbols: 6 },
    },
  },
  {
    label: '2 СЕК',
    timing: {
      spinDuration: 0.52,
      stopDelay: 0.17,
      reel: { speed: 22, accelTime: 0.34, brakeSymbols: 4, minExtraSymbols: 5 },
    },
  },
  {
    label: '1 СЕК',
    timing: {
      spinDuration: 0.31,
      stopDelay: 0.08,
      reel: { speed: 34, accelTime: 0.22, brakeSymbols: 3, minExtraSymbols: 3 },
    },
  },
];
