import { Assets, type AssetsManifest } from 'pixi.js';

export type AssetPhase = 'preload' | 'game';
export type AssetProgress = (progress: number) => void;

export class AssetManager {
  private readonly resources = new Map<string, unknown>();
  private initialized = false;

  public constructor(private readonly manifest: AssetsManifest) {}

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    await Assets.init({ manifest: this.manifest });
    this.initialized = true;
  }

  public async loadPhase(phase: AssetPhase, onProgress?: AssetProgress): Promise<void> {
    if (!this.initialized) {
      throw new Error('AssetManager must be initialized before loading');
    }

    const loaded = (await Assets.loadBundle(phase, onProgress)) as Record<string, unknown>;
    for (const [alias, resource] of Object.entries(loaded)) {
      this.resources.set(alias, resource);
    }
  }

  public get<T>(alias: string): T {
    if (!this.resources.has(alias)) {
      throw new Error(`Asset "${alias}" has not been loaded`);
    }
    return this.resources.get(alias) as T;
  }
}
