import type { SlotTiming } from '../../sdk';
import { TEXT } from './text';

export interface SpeedMode {
  label: string;
  timing: SlotTiming;
}

export const speedModes: readonly SpeedMode[] = [
  {
    label: TEXT.speed.seconds3,
    timing: {
      spinDuration: 0.62,
      stopDelay: 0.26,
      reel: { speed: 16, accelTime: 0.4, brakeSymbols: 5, minExtraSymbols: 6 },
    },
  },
  {
    label: TEXT.speed.seconds2,
    timing: {
      spinDuration: 0.52,
      stopDelay: 0.17,
      reel: { speed: 22, accelTime: 0.34, brakeSymbols: 4, minExtraSymbols: 5 },
    },
  },
  {
    label: TEXT.speed.seconds1,
    timing: {
      spinDuration: 0.31,
      stopDelay: 0.08,
      reel: { speed: 34, accelTime: 0.22, brakeSymbols: 3, minExtraSymbols: 3 },
    },
  },
];
