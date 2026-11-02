const express = require('express');
const router = express.Router();
const { supabase, run, insertOne } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

// Update only the provided fields, then return the row (or null if missing)
async function patchRow(table, id, patch) {
  const query = Object.keys(patch).length
    ? supabase.from(table).update(patch).eq('id', id).select('*').maybeSingle()
    : supabase.from(table).select('*').eq('id', id).maybeSingle();
  return run(query);
}

const isSet = (v) => v !== undefined && v !== null;

// Item Types
router.get('/item-types', authenticateToken, async (req, res) => {
  res.json(await run(supabase.from('item_types').select('*').order('id', { ascending: true })));
});

router.post('/item-types', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const newType = await insertOne('item_types', { name: name.trim(), description: description || '', active: 1 });
    res.status(201).json(newType);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Item type name already exists' });
    }
    throw err;
  }
});

router.put('/item-types/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, description, active } = req.body;

  const patch = {};
  if (isSet(name)) patch.name = name.trim();
  if (isSet(description)) patch.description = description;
  if (isSet(active)) patch.active = active ? 1 : 0;

  try {
    res.json(await patchRow('item_types', id, patch));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Item type name already exists' });
    }
    throw err;
  }
});

// Hoarding Sizes Master
router.get('/hoarding-sizes', authenticateToken, async (req, res) => {
  res.json(await run(supabase.from('hoarding_sizes').select('*').order('id', { ascending: true })));
});

router.post('/hoarding-sizes', authenticateToken, requireAdmin, async (req, res) => {
  const { width, height, unit, orientation, sides } = req.body;
  if (!width || !height) return res.status(400).json({ error: 'Width and height are required' });

  const newSize = await insertOne('hoarding_sizes', {
    width: parseFloat(width),
    height: parseFloat(height),
    unit: unit || 'ft',
    orientation: orientation || 'Horizontal',
    sides: parseInt(sides, 10) || 1,
    active: 1
  });

  res.status(201).json(newSize);
});

router.put('/hoarding-sizes/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { width, height, unit, orientation, sides, active } = req.body;

  const patch = {};
  if (isSet(width)) patch.width = parseFloat(width);
  if (isSet(height)) patch.height = parseFloat(height);
  if (isSet(unit)) patch.unit = unit;
  if (isSet(orientation)) patch.orientation = orientation;
  if (isSet(sides)) patch.sides = parseInt(sides, 10);
  if (isSet(active)) patch.active = active ? 1 : 0;

  res.json(await patchRow('hoarding_sizes', id, patch));
});

module.exports = router;
