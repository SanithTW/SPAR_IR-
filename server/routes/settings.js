const express = require('express');
const router = express.Router();
const { supabase, run } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

async function loadSettings() {
  const rows = await run(supabase.from('settings').select('*'));
  const settings = {};
  rows.forEach(r => {
    settings[r.key] = r.value;
  });
  return settings;
}

// GET /api/settings
router.get('/', authenticateToken, async (req, res) => {
  res.json(await loadSettings());
});

// POST /api/settings
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { overdue_day_of_month, company_name } = req.body;

  const updates = [];
  if (overdue_day_of_month !== undefined) {
    updates.push({ key: 'overdue_day_of_month', value: String(overdue_day_of_month) });
  }
  if (company_name !== undefined) {
    updates.push({ key: 'company_name', value: String(company_name) });
  }

  if (updates.length) {
    await run(supabase.from('settings').upsert(updates, { onConflict: 'key' }));
  }

  res.json({ message: 'Settings saved successfully', settings: await loadSettings() });
});

module.exports = router;
