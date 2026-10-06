import {
  Assets,
  type AssetsBundle,
  type AssetsManifest,
  type Texture,
  type UnresolvedAsset,
} from 'pixi.js';
import type { AssetCache } from './AssetCache';

export type AssetPhase = 'preload' | 'game';
export type AssetProgress = (progress: number) => void;

interface BundleAsset {
  alias: string;
  src: string;
}

export class AssetManager {
  private readonly resources = new Map<string, unknown>();
  private readonly loadedPhases = new Set<AssetPhase>();
  private initialized = false;

  public constructor(
    private readonly manifest: AssetsManifest,
    private readonly cache: AssetCache,
  ) {}

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
    if (this.loadedPhases.has(phase)) {
      onProgress?.(1);
      return;
    }

    const assets = bundleAssets(this.manifest, phase);
    if (assets.length === 0) {
      this.loadedPhases.add(phase);
      onProgress?.(1);
      return;
    }

    let completed = 0;
    await Promise.all(
      assets.map(async ({ alias, src }) => {
        if (!this.resources.has(alias)) {
          this.resources.set(alias, await this.loadTexture(src));
        }
        completed += 1;
        onProgress?.(completed / assets.length);
      }),
    );
    this.loadedPhases.add(phase);
  }

  public get<T>(alias: string): T {
    if (!this.resources.has(alias)) {
      throw new Error(`Asset "${alias}" has not been loaded`);
    }
    return this.resources.get(alias) as T;
  }

  private async loadTexture(src: string): Promise<Texture> {
    const bytes = await this.cache.getBytes(src);
    const format = fileFormat(src);
    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType(format) }));
    try {
      // У blob-адреса нет расширения, поэтому парсер называем сами.
      // Иначе Assets.load не узнаёт файл и возвращает null.
      const texture = await Assets.load<Texture>({
        src: objectUrl,
        parser: format === 'svg' ? 'loadSVG' : 'loadTextures',
      });
      if (!texture) {
        throw new Error(`Unable to parse texture "${src}"`);
      }
      return texture;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

function bundleAssets(manifest: AssetsManifest, phase: string): BundleAsset[] {
  const bundle = manifest.bundles.find((item) => item.name === phase);
  if (!bundle) {
    throw new Error(`Unknown asset bundle "${phase}"`);
  }

  return listAssets(bundle.assets);
}

function listAssets(assets: AssetsBundle['assets']): BundleAsset[] {
  if (Array.isArray(assets)) {
    return assets.map((asset) => unresolvedAsset(asset));
  }

  return Object.entries(assets).map(([alias, asset]) => {
    if (typeof asset === 'string' || Array.isArray(asset)) {
      const src = firstString(asset);
      if (!src) {
        throw new Error(`Asset "${alias}" needs a src`);
      }
      return { alias, src };
    }
    return unresolvedAsset({ ...asset, alias: asset.alias ?? alias });
  });
}

function unresolvedAsset(asset: UnresolvedAsset): BundleAsset {
  const alias = firstString(asset.alias);
  const src = firstString(asset.src);
  if (!alias || !src) {
    throw new Error('Asset bundle entry needs an alias and a src');
  }
  return { alias, src };
}

function firstString(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }
  return null;
}

function fileFormat(src: string): string {
  const path = src.split('?')[0];
  const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  return extension === 'jpeg' ? 'jpg' : extension;
}

function mimeType(format: string): string {
  if (format === 'svg') {
    return 'image/svg+xml';
  }
  if (format === 'jpg') {
    return 'image/jpeg';
  }
  return `image/${format}`;
}
