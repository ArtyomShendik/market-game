export type VisibilityHandler = (visible: boolean) => void;

export class VisibilityWatcher {
  private readonly handlers = new Set<VisibilityHandler>();
  private visible = !document.hidden;

  constructor() {
    document.addEventListener('visibilitychange', () => this.update());
  }

  get isVisible(): boolean {
    return this.visible;
  }

  watch(handler: VisibilityHandler): void {
    this.handlers.add(handler);
  }

  private update(): void {
    const visible = !document.hidden;

    if (visible === this.visible) {
      return;
    }

    this.visible = visible;

    for (const handler of this.handlers) {
      handler(visible);
    }
  }
}
