import type { IconButtonColors, SpinButtonColors, StatReadoutColors } from '../../sdk';
import { THEME } from './theme';

export const buttonColors: SpinButtonColors = {
  fill: THEME.button,
  pressed: THEME.buttonPressed,
  border: THEME.frame,
  label: THEME.title,
};

export const iconColors: IconButtonColors = {
  ...buttonColors,
  active: THEME.buttonActive,
};

export const readoutColors: StatReadoutColors = {
  fill: THEME.button,
  border: THEME.frame,
  label: THEME.label,
  value: THEME.title,
};
