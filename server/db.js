// Supabase (PostgreSQL) data-access helpers.
// Supabase is the single source of truth for all app data.
const { supabase } = require('./supabase');

const TIMESTAMP_FIELDS = ['created_at', 'updated_at', 'received_at', 'problem_at'];
const PAGE_SIZE = 1000; // PostgREST default max rows per request

// Postgres returns "2026-10-26T09:30:00+00:00"; the client expects the
// SQLite-style "2026-10-26 09:30:00" (UTC), so normalise on the way out.
function formatTimestamp(value) {
  if (!value || typeof value !== 'string' || !value.includes('T')) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function normalizeRow(row) {
  if (!row || typeof row !== 'object') return row;
  for (const f of TIMESTAMP_FIELDS) {
    if (f in row) row[f] = formatTimestamp(row[f]);
  }
  return row;
}

function normalize(data) {
  if (Array.isArray(data)) return data.map(normalizeRow);
  return normalizeRow(data);
}

class DbError extends Error {
  constructor(error) {
    super(error.message || 'Database error');
    this.code = error.code;
    this.details = error.details;
  }
}

// Unwrap a supabase-js response, throwing on error.
async function run(query) {
  const { data, error } = await query;
  if (error) throw new DbError(error);
  return normalize(data);
}

// Fetch every row of a query, paging past the 1000-row API limit.
// `build` must return a fresh query builder each call (with ordering applied).
async function fetchAll(build) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = await run(build().range(from, from + PAGE_SIZE - 1));
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

function isPkeyConflict(error) {
  return error && error.code === '23505' && /_pkey/.test(error.message || '');
}

// Insert one or more rows and return them. If the table's id sequence lags
// behind rows imported with explicit ids, each failed attempt still advances
// the sequence, so retrying resolves the conflict on its own.
async function insert(table, rows, select = '*') {
  for (let attempt = 0; attempt < 200; attempt++) {
    const { data, error } = await supabase.from(table).insert(rows).select(select);
    if (!error) return normalize(data);
    if (!isPkeyConflict(error)) throw new DbError(error);
  }
  throw new Error(`Could not allocate a new id in table "${table}"`);
}

async function insertOne(table, row, select = '*') {
  const [created] = await insert(table, row, select);
  return created;
}

// Escape LIKE wildcards so a value can be used for an exact, case-insensitive match.
function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (c) => '\\' + c);
}

// Strip characters that would break a PostgREST or()/ilike filter expression.
function sanitizeFilterTerm(value) {
  return String(value).replace(/[,()*\\%_"]/g, ' ').trim();
}

module.exports = {
  supabase,
  run,
  fetchAll,
  insert,
  insertOne,
  normalize,
  escapeLike,
  sanitizeFilterTerm,
  formatTimestamp
};
