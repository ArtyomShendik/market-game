/** Пауза на заданное число секунд. */
export function wait(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, seconds * 1000);
  });
}
