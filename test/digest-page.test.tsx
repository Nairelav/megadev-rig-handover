import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const base = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60 };

describe('digest page', () => {
  it('renders 2026-10-28 with the banner', async () => {
    process.env.LANE_MARKER = 'TEST-MARKER';
    const res = await createApp({ ...base, runsDir: 'runs' }).request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('TEST-MARKER');
    expect(html).toContain('<table>');
  });

  it('404 for a missing night, "nothing ran" for an empty one', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-'));
    writeFileSync(join(dir, '2026-01-01.jsonl'), '');
    const app = createApp({ ...base, runsDir: dir });
    expect((await app.request('/digest/2026-01-02')).status).toBe(404);
    expect(await (await app.request('/digest/2026-01-01')).text()).toContain('nothing ran');
  });
});
