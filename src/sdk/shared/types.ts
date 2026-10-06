import { type REEL_PHASE } from './consts';

type ValueOf<T> = T[keyof T];

export type ReelPhase = ValueOf<typeof REEL_PHASE>;
