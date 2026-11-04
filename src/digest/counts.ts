// Plan morning-digest § 2c. Lines per status for one night, for the status board.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isNight, parseLine } from './read.js';
import type { RunStatus } from './types.js';

export type NightCounts = Record<RunStatus, number>;

// Pure: count parsed lines by status. Bad lines are skipped (readNight counts them).
export function countByStatus(text: string): NightCounts {
  const counts: NightCounts = { ok: 0, retry: 0, fail: 0 };
  for (const raw of text.split('\n')) {
    if (raw.trim() === '') continue;
    const line = parseLine(raw);
    if (line) counts[line.status] += 1;
  }
  return counts;
}

// null when the night can't be read; the board renders it as `—`.
export function nightCounts(runsDir: string, night: string): NightCounts | null {
  if (!isNight(night)) return null;
  try {
    return countByStatus(readFileSync(join(runsDir, `${night}.jsonl`), 'utf8'));
  } catch {
    return null;
  }
}
