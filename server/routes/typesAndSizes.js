const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

// Item Types
router.get('/item-types', authenticateToken, (req, res) => {
  const types = db.prepare('SELECT * FROM item_types ORDER BY id ASC').all();
  res.json(types);
});

router.post('/item-types', authenticateToken, requireAdmin, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const info = db.prepare('INSERT INTO item_types (name, description, active) VALUES (?, ?, 1)').run(name.trim(), description || '');
    const newType = db.prepare('SELECT * FROM item_types WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newType);
  } catch (err) {
    res.status(400).json({ error: 'Item type name already exists' });
  }
});

router.put('/item-types/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, description, active } = req.body;

  db.prepare(`
    UPDATE item_types
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        active = COALESCE(?, active)
    WHERE id = ?
  `).run(
    name !== undefined ? name.trim() : null,
    description !== undefined ? description : null,
    active !== undefined ? (active ? 1 : 0) : null,
    id
  );

  const updated = db.prepare('SELECT * FROM item_types WHERE id = ?').get(id);
  res.json(updated);
});

// Hoarding Sizes Master
router.get('/hoarding-sizes', authenticateToken, (req, res) => {
  const sizes = db.prepare('SELECT * FROM hoarding_sizes ORDER BY id ASC').all();
  res.json(sizes);
});

router.post('/hoarding-sizes', authenticateToken, requireAdmin, (req, res) => {
  const { width, height, unit, orientation, sides } = req.body;
  if (!width || !height) return res.status(400).json({ error: 'Width and height are required' });

  const info = db.prepare(`
    INSERT INTO hoarding_sizes (width, height, unit, orientation, sides, active)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(
    parseFloat(width),
    parseFloat(height),
    unit || 'ft',
    orientation || 'Horizontal',
    parseInt(sides, 10) || 1
  );

  const newSize = db.prepare('SELECT * FROM hoarding_sizes WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(newSize);
});

router.put('/hoarding-sizes/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { width, height, unit, orientation, sides, active } = req.body;

  db.prepare(`
    UPDATE hoarding_sizes
    SET width = COALESCE(?, width),
        height = COALESCE(?, height),
        unit = COALESCE(?, unit),
        orientation = COALESCE(?, orientation),
        sides = COALESCE(?, sides),
        active = COALESCE(?, active)
    WHERE id = ?
  `).run(
    width !== undefined ? parseFloat(width) : null,
    height !== undefined ? parseFloat(height) : null,
    unit !== undefined ? unit : null,
    orientation !== undefined ? orientation : null,
    sides !== undefined ? parseInt(sides, 10) : null,
    active !== undefined ? (active ? 1 : 0) : null,
    id
  );

  const updated = db.prepare('SELECT * FROM hoarding_sizes WHERE id = ?').get(id);
  res.json(updated);
});

module.exports = router;
