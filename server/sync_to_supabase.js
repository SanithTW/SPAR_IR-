const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const db = require('./db');
const { supabase } = require('./supabase');

async function syncTable(tableName, rows) {
  if (!rows || rows.length === 0) {
    console.log(`ℹ️ [${tableName}] No rows to sync.`);
    return;
  }

  console.log(`⏳ [${tableName}] Syncing ${rows.length} records to Supabase...`);
  const { data, error } = await supabase
    .from(tableName)
    .upsert(rows, { onConflict: tableName === 'settings' ? 'key' : 'id' });

  if (error) {
    console.error(`❌ [${tableName}] Sync failed:`, error.message);
  } else {
    console.log(`✅ [${tableName}] Successfully synced ${rows.length} records!`);
  }
}

async function runSync() {
  console.log('🚀 Starting sync from local SQLite to Supabase (' + process.env.SUPABASE_URL + ')...');

  try {
    // 1. Settings
    const settings = db.prepare('SELECT key, value FROM settings').all();
    await syncTable('settings', settings);

    // 2. Branches
    const branches = db.prepare('SELECT * FROM branches').all();
    await syncTable('branches', branches);

    // 3. Hoarding Slots
    const slots = db.prepare('SELECT * FROM hoarding_slots').all();
    await syncTable('hoarding_slots', slots);

    // 4. Item Types
    const itemTypes = db.prepare('SELECT * FROM item_types').all();
    await syncTable('item_types', itemTypes);

    // 5. Hoarding Sizes
    const sizes = db.prepare('SELECT * FROM hoarding_sizes').all();
    await syncTable('hoarding_sizes', sizes);

    // 6. Users
    const users = db.prepare('SELECT * FROM users').all();
    await syncTable('users', users);

    // 7. Issues
    const issues = db.prepare('SELECT * FROM issues').all();
    await syncTable('issues', issues);

    // 8. Issue Updates
    const updates = db.prepare('SELECT * FROM issue_updates').all();
    await syncTable('issue_updates', updates);

    // 9. Notifications
    const notifs = db.prepare('SELECT * FROM notifications').all();
    await syncTable('notifications', notifs);

    console.log('\n🎉 All tables synced to Supabase successfully!');
  } catch (err) {
    console.error('\n❌ Sync encountered an error:', err.message);
  }
}

runSync();
