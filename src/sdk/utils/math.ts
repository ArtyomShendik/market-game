export function positiveMod(value: number, length: number): number {
  return ((value % length) + length) % length;
}

export function travelToIndex(
  current: number,
  target: number,
  length: number,
  minDistance: number,
): number {
  let distance = positiveMod(target - current, length);

  if (distance < minDistance) {
    distance += Math.ceil((minDistance - distance) / length) * length;
  }

  return distance;
}
