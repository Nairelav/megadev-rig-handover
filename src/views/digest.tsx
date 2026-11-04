import type { DigestRow } from '../digest/types.js';

const dash = (v: string | null) => v ?? '—';

export function DigestPage(props: { night: string; rows: DigestRow[]; badLines: number }) {
  const { night, rows, badLines } = props;
  return (
    <>
      <h1>digest · {night}</h1>
      <p class={badLines > 0 ? 'warn' : 'mute'}>bad lines: {badLines}</p>
      {rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th><th>owner</th><th>runs</th><th>retries</th><th>last status</th>
              <th>last error</th><th>first</th><th>last</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const manyRetries = r.retries >= 3;
              const failed = r.lastStatus === 'fail';
              return (
                <tr class={manyRetries || failed ? 'flag' : undefined}>
                  <td>{r.job}</td>
                  <td>{dash(r.owner)}</td>
                  <td>{r.runs}</td>
                  <td class={manyRetries ? 'warn' : undefined}>{manyRetries ? `${r.retries} ⚠` : r.retries}</td>
                  <td class={failed ? 'warn' : undefined}>{failed ? 'fail ✗' : r.lastStatus}</td>
                  <td>{dash(r.lastError)}</td>
                  <td>{r.firstAt}</td>
                  <td>{r.lastAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
