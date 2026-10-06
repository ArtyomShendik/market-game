/** Плавный разгон: медленно в начале и в конце. */
export function easeInOutCubic(t: number): number {
  if (t < 0.5) {
    return 4 * t * t * t;
  }
  const x = -2 * t + 2;
  return 1 - (x * x * x) / 2;
}

/** Торможение: быстро в начале, мягко к остановке. */
export function easeOutCubic(t: number): number {
  const x = 1 - t;
  return 1 - x * x * x;
}

/** Производная easeOutCubic. На t = 0 равна 3, на t = 1 равна 0. */
export function easeOutCubicSlope(t: number): number {
  const x = 1 - t;
  return 3 * x * x;
}
