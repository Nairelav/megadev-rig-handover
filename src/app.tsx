import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { readNight } from './digest/read.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';

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

  return app;
}
