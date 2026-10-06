export function formatCoins(value: number): string {
  return Math.round(value).toLocaleString('ru-RU');
}
