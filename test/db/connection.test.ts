// Parallel processes opening one database can lose the switch to WAL mode. That
// made Tests: server fail at random with `database is locked`, so losing it must
// leave a working connection, and only that failure may be swallowed.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The module opens a connection on import, so point it somewhere disposable first.
const dir = mkdtempSync(join(tmpdir(), 'connection-'));
process.env.DATABASE_URL = `file:${join(dir, 'test.db')}`;

let tune: typeof import('../../db/connection.server.ts').tune;
before(async () => {
  ({ tune } = await import('../../db/connection.server.ts'));
});
after(() => rmSync(dir, { recursive: true, force: true }));

function client(walError?: Error) {
  const statements: string[] = [];
  return {
    statements,
    exec(sql: string) {
      statements.push(sql);
      if (walError && sql.includes('journal_mode')) throw walError;
    },
  };
}

test('sets the wait before switching to WAL, so the switch can wait too', () => {
  const fake = client();
  assert.equal(tune(fake), fake);
  assert.deepEqual(fake.statements, ['PRAGMA busy_timeout = 5000', 'PRAGMA journal_mode = WAL']);
});

test('losing the WAL switch to another process leaves a usable connection', () => {
  const fake = client(new Error('database is locked'));
  assert.equal(tune(fake), fake);
});

test('any other failure while switching to WAL still throws', () => {
  for (const message of ['disk I/O error', 'attempt to write a readonly database', 'database is locked, somehow']) {
    assert.throws(() => tune(client(new Error(message))), { message });
  }
});
