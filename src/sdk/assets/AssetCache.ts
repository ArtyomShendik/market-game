export class AssetCache {
  private readonly memory = new Map<string, ArrayBuffer>();
  private readonly pending = new Map<string, Promise<ArrayBuffer>>();
  private ready: Promise<void> | null = null;

  public constructor(private readonly name: string) {}

  public async getBytes(url: string): Promise<ArrayBuffer> {
    const key = this.key(url);
    const stored = this.memory.get(key);
    if (stored) {
      return stored.slice(0);
    }

    const inflight = this.pending.get(key);
    if (inflight) {
      return (await inflight).slice(0);
    }

    const request = this.load(key);
    this.pending.set(key, request);
    try {
      const bytes = await request;
      this.memory.set(key, bytes);
      return bytes.slice(0);
    } finally {
      this.pending.delete(key);
    }
  }

  private async load(key: string): Promise<ArrayBuffer> {
    await this.prepare();
    const storage = await this.storage();
    const hit = storage ? await storage.match(key) : undefined;
    if (hit) {
      return hit.arrayBuffer();
    }

    const response = await fetch(key);
    if (!response.ok) {
      throw new Error(`Unable to fetch asset "${key}": ${response.status}`);
    }
    if (storage) {
      await storage.put(key, response.clone());
    }
    return response.arrayBuffer();
  }

  private prepare(): Promise<void> {
    this.ready ??= this.dropOldVersions();
    return this.ready;
  }

  private async dropOldVersions(): Promise<void> {
    if (!('caches' in globalThis)) {
      return;
    }

    const prefix = this.name.replace(/-v\d+$/, '');
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(prefix) && key !== this.name)
        .map((key) => caches.delete(key)),
    );
  }

  private async storage(): Promise<Cache | null> {
    if (!('caches' in globalThis)) {
      return null;
    }
    try {
      return await caches.open(this.name);
    } catch {
      return null;
    }
  }

  private key(url: string): string {
    return new URL(url, window.location.href).href;
  }
}
