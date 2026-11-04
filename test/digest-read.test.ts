import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';
import type { DigestRow } from '../src/digest/types.js';

function read(night: string): { rows: DigestRow[]; badLines: number } {
  const n = readNight('runs', night);
  if (n.kind !== 'read') throw new Error(`expected ${night} on disk`);
  return n;
}

describe('readNight on runs/2026-10-28.jsonl', () => {
  it('gives one row per job (5) and counts the bad line (1)', () => {
    const n = read('2026-10-28');
    expect(n.badLines).toBe(1);
    expect(n.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
  });

  it('folds each job exactly', () => {
    expect(read('2026-10-28').rows).toEqual([
      { job: 'digest/render', owner: null, runs: 1, retries: 0, lastStatus: 'ok', lastError: null, firstAt: '2026-10-29T05:41:09+01:00', lastAt: '2026-10-29T05:41:09+01:00' },
      { job: 'fixtures/refresh', owner: 'rook', runs: 4, retries: 3, lastStatus: 'ok', lastError: 'upstream 503', firstAt: '2026-10-29T01:30:00+01:00', lastAt: '2026-10-29T01:37:00+01:00' },
      { job: 'lane/sync', owner: 'rook', runs: 8, retries: 1, lastStatus: 'ok', lastError: 'lock held', firstAt: '2026-10-28T23:00:06+01:00', lastAt: '2026-10-29T05:00:04+01:00' },
      { job: 'notes/backup', owner: 'lane-07', runs: 1, retries: 0, lastStatus: 'fail', lastError: 'quota exceeded', firstAt: '2026-10-29T04:00:01+01:00', lastAt: '2026-10-29T04:00:01+01:00' },
      { job: 'rig/rotate-logs', owner: 'lane-07', runs: 1, retries: 0, lastStatus: 'ok', lastError: null, firstAt: '2026-10-28T23:00:02+01:00', lastAt: '2026-10-28T23:00:02+01:00' },
    ]);
  });

  it('reads the other night with no bad lines', () => {
    const n = read('2026-10-27');
    expect(n.badLines).toBe(0);
    expect(n.rows).toHaveLength(4);
  });
});

describe('readNight edges', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  writeFileSync(join(dir, '2026-01-01.jsonl'), '');
  writeFileSync(
    join(dir, '2026-01-02.jsonl'),
    [
      '{"at":"2026-01-02T23:00:00+01:00","job":"a","status":"ok","owner":"x"}',
      '{"at":"2026-01-02T23:00:00+01:00","job":"a","status":"maybe","owner":"x"}',
      '{"at":"2026-01-02T23:00:00+01:00","job":"a","status":"ok"}',
      '[1,2]',
      'not json',
      '',
    ].join('\n'),
  );

  it('signals a night with no file as missing', () => {
    expect(readNight(dir, '2026-01-09')).toEqual({ kind: 'missing', night: '2026-01-09' });
  });

  it('treats a name that is not a night as missing', () => {
    expect(readNight(dir, '../etc/passwd').kind).toBe('missing');
  });

  it('reads an empty file as zero rows', () => {
    expect(readNight(dir, '2026-01-01')).toEqual({ kind: 'read', night: '2026-01-01', rows: [], badLines: 0 });
  });

  it('counts off-shape lines and never throws', () => {
    const n = readNight(dir, '2026-01-02');
    expect(n).toMatchObject({ kind: 'read', badLines: 4 });
    if (n.kind === 'read') expect(n.rows).toHaveLength(1);
  });
});
