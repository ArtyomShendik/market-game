import { REEL_WINDOW } from '../config/theme';
import { SYMBOL } from '../symbols/catalog';

export function fallbackGrid(): string[][] {
  return Array.from({ length: REEL_WINDOW.count }, () => {
    return Array.from({ length: REEL_WINDOW.rows }, () => SYMBOL.PLUM);
  });
}
