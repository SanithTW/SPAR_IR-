const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

// GET /api/settings
router.get('/', authenticateToken, (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  rows.forEach(r => {
    settings[r.key] = r.value;
  });
  res.json(settings);
});

// POST /api/settings
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { overdue_day_of_month, company_name } = req.body;

  if (overdue_day_of_month !== undefined) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('overdue_day_of_month', String(overdue_day_of_month));
  }

  if (company_name !== undefined) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('company_name', String(company_name));
  }

  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  rows.forEach(r => {
    settings[r.key] = r.value;
  });

  res.json({ message: 'Settings saved successfully', settings });
});

module.exports = router;
