import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { readNight } from './digest/read.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';
import { DigestPage } from './views/digest.js';

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/', (c) =>
    c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={readStatus(config)} />
      </Layout>,
    ),
  );

  // Plan § 2b. Same readNight call as the page, no extra sorting or filtering (ADR 0001).
  app.get('/api/digest/:night', (c) => {
    const n = readNight(config.runsDir, c.req.param('night'));
    if (n.kind === 'missing') return c.json({ error: 'no run log for that night', night: n.night }, 404);
    return c.json({ night: n.night, rows: n.rows, badLines: n.badLines });
  });

  app.get('/digest/:night', (c) => {
    const night = readNight(config.runsDir, c.req.param('night'));
    if (night.kind === 'missing') return c.text(`no run log for ${night.night}`, 404);
    return c.html(
      <Layout title={`digest ${night.night}`} lane={lane()}>
        <DigestPage night={night.night} rows={night.rows} badLines={night.badLines} />
      </Layout>,
    );
  });

  return app;
}
