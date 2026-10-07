import type { AssetCache } from '../assets/AssetCache';

export interface AudioAsset {
  alias: string;
  src: string;
}

export type StopAudio = () => void;

export class AudioManager {
  private readonly context = createContext();
  private readonly buffers = new Map<string, AudioBuffer>();
  private music?: AudioBufferSourceNode;
  private unlocked = false;

  public constructor(private readonly cache: AssetCache) {}

  public async load(
    entries: readonly AudioAsset[],
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    let completed = 0;
    await Promise.all(
      entries.map(async ({ alias, src }) => {
        if (!this.buffers.has(alias)) {
          const bytes = await this.cache.getBytes(src);
          const buffer = await this.decode(bytes);
          this.buffers.set(alias, buffer);
        }
        completed += 1;
        onProgress?.(completed / entries.length);
      }),
    );
  }

  /**
   * Снимает блокировку Safari. Вызывать синхронно из жеста:
   * после await iOS уже не считает запуск звука действием пользователя.
   */
  public unlock(): void {
    if (this.context.state !== 'running') {
      void this.context.resume();
    }
    if (!this.unlocked) {
      this.playSilence();
    }
    this.unlocked = true;
  }

  public async setMuted(muted: boolean): Promise<void> {
    if (!this.unlocked) {
      return;
    }
    if (muted && this.context.state === 'running') {
      await this.context.suspend();
      return;
    }
    if (!muted && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  public playMusic(alias: string, volume = 0.12): void {
    if (this.music) {
      return;
    }
    this.music = this.createSource(alias, volume, true).source;
    this.music.start();
  }

  public playOnce(alias: string, volume = 0.3): void {
    const { source } = this.createSource(alias, volume, false);
    source.start();
  }

  public playLoop(alias: string, volume = 0.25): StopAudio {
    const { source, gain } = this.createSource(alias, volume, true);
    source.start();

    let stopped = false;
    return () => {
      if (stopped) {
        return;
      }
      stopped = true;
      const now = this.context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.12);
      source.stop(now + 0.13);
    };
  }

  private decode(bytes: ArrayBuffer): Promise<AudioBuffer> {
    const copy = bytes.slice(0);
    return new Promise((resolve, reject) => {
      const result = this.context.decodeAudioData(copy, resolve, reject);
      if (result instanceof Promise) {
        void result.then(resolve, reject);
      }
    });
  }

  /** Короткий буфер в том же жесте, иначе iOS не открывает аудиосессию. */
  private playSilence(): void {
    const buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.start();
  }

  private createSource(
    alias: string,
    volume: number,
    loop: boolean,
  ): { source: AudioBufferSourceNode; gain: GainNode } {
    const buffer = this.buffers.get(alias);
    if (!buffer) {
      throw new Error(`Audio "${alias}" has not been loaded`);
    }

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = loop;
    gain.gain.value = volume;
    source.connect(gain).connect(this.context.destination);
    return { source, gain };
  }
}

function createContext(): AudioContext {
  const scope = window as Window & { webkitAudioContext?: typeof AudioContext };
  const AudioCtx = window.AudioContext ?? scope.webkitAudioContext;
  if (!AudioCtx) {
    throw new Error('Web Audio is not supported');
  }
  return new AudioCtx();
}
