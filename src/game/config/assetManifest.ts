import type { AssetsManifest } from 'pixi.js';
import type { AudioAsset } from '../../sdk';
import music from '../assets/audio/music.wav';
import reelSpin from '../assets/audio/reel-spin.wav';
import spinClick from '../assets/audio/spin-click.wav';
import background from '../assets/backgrounds/night-market.jpg';
import autoIcon from '../assets/icons/auto.svg';
import speedIcon from '../assets/icons/speed.svg';
import emblem from '../assets/preload/emblem.jpg';
import symbolsAtlas from '../assets/symbols/symbols.png';

export const ASSET_ALIAS = {
  loaderEmblem: 'loader-emblem',
  background: 'game-background',
  audio: {
    music: 'music',
    reelSpin: 'reel-spin',
    spinClick: 'spin-click',
  },
  icon: {
    speed: 'icon-speed',
    auto: 'icon-auto',
  },
  symbols: 'symbols-atlas',
} as const;

export const ASSET_CACHE_NAME = 'night-market-assets-v2';

export const GAME_AUDIO: readonly AudioAsset[] = [
  { alias: ASSET_ALIAS.audio.music, src: music },
  { alias: ASSET_ALIAS.audio.reelSpin, src: reelSpin },
  { alias: ASSET_ALIAS.audio.spinClick, src: spinClick },
];

export const ASSET_MANIFEST: AssetsManifest = {
  bundles: [
    {
      name: 'preload',
      assets: [{ alias: ASSET_ALIAS.loaderEmblem, src: emblem }],
    },
    {
      name: 'game',
      assets: [
        { alias: ASSET_ALIAS.background, src: background },
        { alias: ASSET_ALIAS.icon.speed, src: speedIcon },
        { alias: ASSET_ALIAS.icon.auto, src: autoIcon },
        { alias: ASSET_ALIAS.symbols, src: symbolsAtlas },
      ],
    },
    // TODO: (A.S.): BONUS GAME ASSETS
  ],
};
