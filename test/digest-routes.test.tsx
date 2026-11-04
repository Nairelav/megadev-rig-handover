import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const base = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60 };
const line = (job: string, status: string, at: string) =>
  JSON.stringify({ at, job, status, owner: 'lane-07' });

let app: ReturnType<typeof createApp>;

beforeAll(() => {
  const dir = mkdtempSync(join(tmpdir(), 'rig-routes-'));
  writeFileSync(
    join(dir, '2026-02-01.jsonl'),
    [line('b/job', 'ok', '2026-02-01T23:00:00+01:00'), line('a/job', 'fail', '2026-02-02T01:00:00+01:00')].join('\n') + '\n',
  );
  writeFileSync(join(dir, '2026-02-02.jsonl'), '');
  writeFileSync(
    join(dir, '2026-02-03.jsonl'),
    [line('c/job', 'ok', '2026-02-03T23:00:00+01:00'), '{"at":"2026-02-04T00:00', line('d/job', 'retry', '2026-02-04T02:00:00+01:00')].join('\n') + '\n',
  );
  app = createApp({ ...base, runsDir: dir });
});

const json = async (night: string) => {
  const res = await app.request(`/api/digest/${night}`);
  return { status: res.status, body: (await res.json()) as any };
};
const page = async (night: string) => {
  const res = await app.request(`/digest/${night}`);
  return { status: res.status, html: await res.text() };
};

describe('digest routes (2a page, 2b JSON)', () => {
  it('200 for a normal night', async () => {
    const p = await page('2026-02-01');
    const j = await json('2026-02-01');
    expect(p.status).toBe(200);
    expect(j.status).toBe(200);
    expect(j.body.rows).toHaveLength(2);
    expect(j.body.badLines).toBe(0);
  });

  it('404 for a night with no file', async () => {
    expect((await page('2026-02-09')).status).toBe(404);
    expect((await json('2026-02-09')).status).toBe(404);
  });

  it('empty night: page says "nothing ran", JSON rows []', async () => {
    const p = await page('2026-02-02');
    const j = await json('2026-02-02');
    expect(p.status).toBe(200);
    expect(p.html).toContain('nothing ran');
    expect(j.status).toBe(200);
    expect(j.body.rows).toEqual([]);
  });

  it('bad line: counted, rows still render', async () => {
    const p = await page('2026-02-03');
    const j = await json('2026-02-03');
    expect(j.body.badLines).toBe(1);
    expect(j.body.rows.map((r: any) => r.job).sort()).toEqual(['c/job', 'd/job']);
    expect(p.status).toBe(200);
    expect(p.html).toContain('c/job');
    expect(p.html).toContain('d/job');
  });

  it('page and JSON list the same jobs in the same order', async () => {
    for (const night of ['2026-02-01', '2026-02-03']) {
      const p = await page(night);
      const jobs: string[] = (await json(night)).body.rows.map((r: any) => r.job);
      const pos = jobs.map((job) => p.html.indexOf(job));
      expect(pos.every((x) => x >= 0)).toBe(true);
      expect([...pos].sort((a, b) => a - b)).toEqual(pos);
    }
  });
});
