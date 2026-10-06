import { wait } from '../../sdk';
import { evaluateGrid } from '../rules/evaluateGrid';
import { parseSession, parseSpinResult } from './parseResponse';
import { randomGrid } from './randomGrid';
import type { SessionResponse, SpinResult } from './types';

const SESSION_DELAY = 0.08;
const SPIN_DELAY = 0.2;

export class MockSlotApi {
  private balance = 1000;
  private readonly bets = [10, 20, 50, 100, 200];

  session(): Promise<SessionResponse> {
    const body = { balance: this.balance, bets: this.bets, bet: 20 };
    return this.deliver(body, parseSession, SESSION_DELAY);
  }

  spin(bet: number): Promise<SpinResult> {
    return this.deliver(this.play(bet), parseSpinResult, SPIN_DELAY);
  }

  private play(bet: number): unknown {
    if (!this.bets.includes(bet)) {
      throw new Error(`Bet ${bet} is not allowed`);
    }
    if (bet > this.balance) {
      return { error: 'insufficient_funds', balance: this.balance };
    }

    this.balance -= bet;
    const grid = randomGrid();
    const lines = evaluateGrid(grid, bet);
    const win = lines.reduce((sum, line) => sum + line.amount, 0);
    this.balance += win;

    return { balance: this.balance, bet, win, grid, lines };
  }

  private deliver<T>(body: unknown, parse: (data: unknown) => T, delay: number): Promise<T> {
    const raw = JSON.stringify(body);
    return wait(delay).then(() => parse(JSON.parse(raw) as unknown));
  }
}
