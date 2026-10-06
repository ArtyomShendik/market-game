import type { SpinWin } from '../rules/paytable';

export interface SessionResponse {
  balance: number;
  bets: number[];
  bet: number;
}

export interface SpinSuccess {
  ok: true;
  balance: number;
  bet: number;
  win: number;
  grid: string[][];
  lines: SpinWin[];
}

export interface SpinFailure {
  ok: false;
  error: 'insufficient_funds';
  balance: number;
}

export type SpinResult = SpinSuccess | SpinFailure;
