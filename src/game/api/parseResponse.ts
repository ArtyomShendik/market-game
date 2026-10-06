import { REEL_WINDOW } from '../config/theme';
import type { SpinWin } from '../rules/paytable';
import { symbolIds } from '../symbols/catalog';
import type { SessionResponse, SpinResult } from './types';

export function parseSession(data: unknown): SessionResponse {
  const record = asRecord(data, 'session');
  const balance = asNumber(record.balance, 'balance');
  const bet = asNumber(record.bet, 'bet');
  if (!Array.isArray(record.bets) || record.bets.length === 0) {
    throw new Error('Response bets are empty');
  }
  const bets = record.bets.map((value, index) => asNumber(value, `bets[${index}]`));
  if (!bets.includes(bet)) {
    throw new Error('Response bet is not in the bet list');
  }
  return { balance, bets, bet };
}

export function parseSpinResult(data: unknown): SpinResult {
  const record = asRecord(data, 'spin');
  if (record.error === 'insufficient_funds') {
    return { ok: false, error: 'insufficient_funds', balance: asNumber(record.balance, 'balance') };
  }

  return {
    ok: true,
    balance: asNumber(record.balance, 'balance'),
    bet: asNumber(record.bet, 'bet'),
    win: asNumber(record.win, 'win'),
    grid: asGrid(record.grid),
    lines: asLines(record.lines),
  };
}

function asGrid(value: unknown): string[][] {
  if (!Array.isArray(value) || value.length !== REEL_WINDOW.count) {
    throw new Error('Response grid has the wrong number of reels');
  }
  return value.map((column, reel) => {
    if (!Array.isArray(column) || column.length !== REEL_WINDOW.rows) {
      throw new Error(`Response reel ${reel} has the wrong height`);
    }
    return column.map((symbol, row) => {
      if (typeof symbol !== 'string' || !symbolIds.has(symbol)) {
        throw new Error(`Unknown symbol at ${reel},${row}`);
      }
      return symbol;
    });
  });
}

function asLines(value: unknown): SpinWin[] {
  if (!Array.isArray(value)) {
    throw new Error('Response lines are not a list');
  }
  return value.map((entry, index) => {
    const record = asRecord(entry, `lines[${index}]`);
    const rows = asRows(record.rows);
    const count = asNumber(record.count, 'count');
    const symbol = record.symbol;
    if (typeof symbol !== 'string' || !symbolIds.has(symbol)) {
      throw new Error('Response line symbol is unknown');
    }
    if (!Number.isInteger(count) || count < 3 || count > rows.length) {
      throw new Error('Response line count is invalid');
    }
    return { symbol, count, amount: asNumber(record.amount, 'amount'), rows };
  });
}

function asRows(value: unknown): number[] {
  if (!Array.isArray(value) || value.length !== REEL_WINDOW.count) {
    throw new Error('Response line rows have the wrong length');
  }
  return value.map((row) => {
    if (typeof row !== 'number' || !Number.isInteger(row) || row < 0 || row >= REEL_WINDOW.rows) {
      throw new Error('Response line row is outside the grid');
    }
    return row;
  });
}

function asRecord(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Response ${name} is not an object`);
  }
  return value as Record<string, unknown>;
}

function asNumber(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Response field ${name} is not a number`);
  }
  return value;
}
