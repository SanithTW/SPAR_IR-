// One-time migration: copy all data from the local SQLite file (posm.db) into Supabase.
// Supabase rows with the same id are overwritten. Supabase rows that do not exist
// locally are kept unless --prune is passed, which deletes them.
//
// Prerequisite: run supabase_migration_001.sql in the Supabase SQL editor first.
// Usage: node server/migrate_sqlite_to_supabase.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const Database = require('better-sqlite3');
const { supabase } = require('./supabase');

const PRUNE = process.argv.includes('--prune');
const sqlite = new Database(path.join(__dirname, 'posm.db'), { readonly: true });

// Parents before children (insert order); reversed for deletes
const TABLES = [
  'settings',
  'branches',
  'item_types',
  'hoarding_sizes',
  'hoarding_slots',
  'users',
  'issues',
  'issue_updates',
  'notifications',
  'private_labels'
];
const TIMESTAMP_COLUMNS = ['created_at', 'updated_at', 'received_at', 'problem_at'];

// SQLite CURRENT_TIMESTAMP values are UTC without a zone marker
function toTimestamptz(value) {
  if (!value || typeof value !== 'string') return value;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return value.replace(' ', 'T') + 'Z';
  return value;
}

function localRows(table) {
  return sqlite.prepare(`SELECT * FROM ${table}`).all().map((row) => {
    for (const c of TIMESTAMP_COLUMNS) if (c in row) row[c] = toTimestamptz(row[c]);
    return row;
  });
}

async function check(label, promise) {
  const { error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
}

async function migrate() {
  console.log(`🚀 Migrating posm.db -> ${process.env.SUPABASE_URL}`);
  const data = Object.fromEntries(TABLES.map((t) => [t, localRows(t)]));

  // 1. With --prune: delete Supabase rows that are not in the local DB (children first)
  for (const table of PRUNE ? [...TABLES].reverse() : []) {
    const key = table === 'settings' ? 'key' : 'id';
    const keep = data[table].map((r) => r[key]);
    let q = supabase.from(table).delete();
    q = keep.length
      ? q.not(key, 'in', `(${keep.map((k) => (key === 'key' ? `"${k}"` : k)).join(',')})`)
      : q.not(key, 'is', null);
    await check(`delete stale ${table}`, q);
  }

  // Free usernames held by rows whose id is about to change hands
  const localUsernames = new Map(data.users.map((u) => [u.username.toLowerCase(), u.id]));
  const { data: remoteUsers, error } = await supabase.from('users').select('id, username');
  if (error) throw new Error(`read users: ${error.message}`);
  for (const ru of remoteUsers) {
    const owner = localUsernames.get(ru.username.toLowerCase());
    if (owner !== undefined && owner !== ru.id) {
      await check('rename clashing user', supabase.from('users')
        .update({ username: `__migrating_${ru.id}` }).eq('id', ru.id));
    }
  }

  // 2. Upsert local rows (parents first)
  for (const table of TABLES) {
    const rows = data[table];
    if (!rows.length) {
      console.log(`ℹ️  ${table}: 0 rows`);
      continue;
    }
    const onConflict = table === 'settings' ? 'key' : 'id';
    for (let i = 0; i < rows.length; i += 500) {
      await check(`upsert ${table}`, supabase.from(table).upsert(rows.slice(i, i + 500), { onConflict }));
    }
    console.log(`✅ ${table}: ${rows.length} rows`);
  }

  // 3. Verify counts match
  let ok = true;
  for (const table of TABLES) {
    const { count, error: e } = await supabase.from(table).select('*', { count: 'exact', head: true });
    const match = !e && count === data[table].length;
    ok = ok && match;
    console.log(`${match ? '✔' : '✘'} ${table.padEnd(15)} local ${data[table].length}  supabase ${e ? e.message : count}`);
  }

  if (!ok) throw new Error('Row counts do not match after migration');
  console.log('\n🎉 Migration complete. Supabase now holds all app data.');
}

migrate().catch((err) => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
