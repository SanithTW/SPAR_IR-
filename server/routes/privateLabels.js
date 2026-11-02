const express = require('express');
const router = express.Router();
const { supabase, run, insertOne } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

const LABEL_SELECT = '*, users(name)';

function flatten(row) {
  if (!row) return row;
  const { users, ...label } = row;
  return { ...label, created_by_name: users ? users.name : null };
}

async function getLabel(id) {
  return flatten(await run(supabase.from('private_labels').select(LABEL_SELECT).eq('id', id).maybeSingle()));
}

function containsCI(value, term) {
  return (value || '').toLowerCase().includes(term);
}

// GET /api/private-labels - View all private label assets (Available to all authenticated users)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, search } = req.query;

    let q = supabase.from('private_labels').select(LABEL_SELECT);
    if (category && category !== 'All') q = q.eq('category', category);

    let records = (await run(q.order('id', { ascending: false }))).map(flatten);

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      records = records.filter((r) =>
        containsCI(r.title, term) || containsCI(r.description, term) || containsCI(r.file_name, term)
      );
    }

    res.json(records);
  } catch (err) {
    console.error('Error fetching private labels:', err);
    res.status(500).json({ error: 'Failed to retrieve private labels' });
  }
});

// GET /api/private-labels/:id - Get single private label
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = isNaN(id) ? null : await getLabel(id);

    if (!item) {
      return res.status(404).json({ error: 'Private label asset not found' });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve private label' });
  }
});

// POST /api/private-labels - Admin only creates new private label asset
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, category, description, file_url, file_name, file_type, file_size } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Private label name / title is required' });
    }
    if (!file_url || !file_url.trim()) {
      return res.status(400).json({ error: 'A file attachment (JPG, PNG, or PDF) is required' });
    }

    const created = await insertOne('private_labels', {
      title: title.trim(),
      category: category && category.trim() ? category.trim() : 'General',
      description: description ? description.trim() : null,
      file_url: file_url.trim(),
      file_name: file_name || null,
      file_type: file_type || null,
      file_size: file_size || null,
      created_by: req.user.id || null
    }, 'id');

    res.status(201).json(await getLabel(created.id));
  } catch (err) {
    console.error('Error creating private label:', err);
    res.status(500).json({ error: 'Failed to create private label asset' });
  }
});

// PUT /api/private-labels/:id - Admin only updates existing private label
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = isNaN(id)
      ? null
      : await run(supabase.from('private_labels').select('id').eq('id', id).maybeSingle());

    if (!existing) {
      return res.status(404).json({ error: 'Private label asset not found' });
    }

    const { title, category, description, file_url, file_name, file_type, file_size } = req.body;

    const patch = { updated_at: new Date().toISOString() };
    if (title !== undefined) patch.title = title.trim();
    if (category !== undefined) patch.category = category.trim();
    if (description !== undefined) patch.description = description;
    if (file_url !== undefined) patch.file_url = file_url.trim();
    if (file_name !== undefined) patch.file_name = file_name;
    if (file_type !== undefined) patch.file_type = file_type;
    if (file_size !== undefined) patch.file_size = file_size;

    await run(supabase.from('private_labels').update(patch).eq('id', id));

    res.json(await getLabel(id));
  } catch (err) {
    console.error('Error updating private label:', err);
    res.status(500).json({ error: 'Failed to update private label asset' });
  }
});

// DELETE /api/private-labels/:id - Admin only deletes private label
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = isNaN(id)
      ? null
      : await run(supabase.from('private_labels').select('id').eq('id', id).maybeSingle());

    if (!existing) {
      return res.status(404).json({ error: 'Private label asset not found' });
    }

    await run(supabase.from('private_labels').delete().eq('id', id));

    res.json({ success: true, message: 'Private label asset deleted successfully' });
  } catch (err) {
    console.error('Error deleting private label:', err);
    res.status(500).json({ error: 'Failed to delete private label asset' });
  }
});

module.exports = router;
