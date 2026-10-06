export interface AudioAsset {
  alias: string;
  src: string;
}

export type StopAudio = () => void;

export class AudioManager {
  private readonly context = new AudioContext();
  private readonly buffers = new Map<string, AudioBuffer>();
  private music?: AudioBufferSourceNode;
  private unlocked = false;

  public async load(
    entries: readonly AudioAsset[],
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    let completed = 0;
    await Promise.all(
      entries.map(async ({ alias, src }) => {
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`Unable to load audio "${alias}": ${response.status}`);
        }
        const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
        this.buffers.set(alias, buffer);
        completed += 1;
        onProgress?.(completed / entries.length);
      }),
    );
  }

  public async unlock(): Promise<void> {
    if (this.context.state !== 'running') {
      await this.context.resume();
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
