import type { SlotTiming } from '../../sdk';

export interface SpeedMode {
  timing: SlotTiming;
}

export const speedModes: readonly SpeedMode[] = [
  {
    timing: {
      spinDuration: 0.62,
      stopDelay: 0.26,
      reel: { speed: 16, accelTime: 0.4, brakeSymbols: 5, minExtraSymbols: 6 },
    },
  },
  {
    timing: {
      spinDuration: 0.52,
      stopDelay: 0.17,
      reel: { speed: 22, accelTime: 0.34, brakeSymbols: 4, minExtraSymbols: 5 },
    },
  },
  {
    timing: {
      spinDuration: 0.31,
      stopDelay: 0.08,
      reel: { speed: 34, accelTime: 0.22, brakeSymbols: 3, minExtraSymbols: 3 },
    },
  },
];
