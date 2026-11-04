// Plan morning-digest § 1. The contract every part of § 2 builds against.
// The reader itself lives in `./read.ts`:
//
//   export function readNight(runsDir: string, night: string): Night
//
// It reads `<runsDir>/<night>.jsonl` and never throws on the file's content.

export type RunStatus = 'ok' | 'retry' | 'fail';

// One line of the run log, once parsed. Times keep the log's offset (styleguide).
export type RunLine = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

// One row per job for the night.
export type DigestRow = {
  job: string;
  // null when the log never names one; views render it as `—`.
  owner: string | null;
  // Lines logged for this job (every attempt, retries included).
  runs: number;
  // Lines with status `retry`.
  retries: number;
  // Status of the job's latest line.
  lastStatus: RunStatus;
  // Latest `error` the job logged, even if a later attempt succeeded; null if none.
  lastError: string | null;
  // `at` of the job's earliest and latest line, as written in the log (offset kept).
  firstAt: string;
  lastAt: string;
};

// What readNight returns.
// - `missing`: no file for that night (or not a YYYY-MM-DD night): the route answers 404.
// - `read`: the file exists. An empty file gives `rows: []` ("nothing ran").
//   Rows are sorted by job. `badLines` counts lines that didn't parse; they are skipped, never thrown.
export type Night =
  | { kind: 'missing'; night: string }
  | { kind: 'read'; night: string; rows: DigestRow[]; badLines: number };

export type ReadNight = (runsDir: string, night: string) => Night;
