// Downloadable file library router, shared by Private Labels and Leaflets.
// Admins upload/edit/delete; every logged-in user can view and download.
const express = require('express');
const { supabase, run, insertOne } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

function createLibraryRouter(table, singular) {
  const router = express.Router();
  const lower = singular.toLowerCase();

  const LABEL_SELECT = '*, users(name)';

  function flatten(row) {
    if (!row) return row;
    const { users, ...label } = row;
    return { ...label, created_by_name: users ? users.name : null };
  }

  async function getLabel(id) {
    return flatten(await run(supabase.from(table).select(LABEL_SELECT).eq('id', id).maybeSingle()));
  }

  function containsCI(value, term) {
    return (value || '').toLowerCase().includes(term);
  }

  // GET / - list all items (any authenticated user)
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const { category, search } = req.query;

      let q = supabase.from(table).select(LABEL_SELECT);
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
      console.error(`Error fetching ${table}:`, err);
      res.status(500).json({ error: `Failed to retrieve ${lower}s` });
    }
  });

  // GET /:id - single item
  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const item = isNaN(id) ? null : await getLabel(id);

      if (!item) {
        return res.status(404).json({ error: `${singular} not found` });
      }

      res.json(item);
    } catch (err) {
      res.status(500).json({ error: `Failed to retrieve ${lower}` });
    }
  });

  // POST / - admin creates an item
  router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { title, category, description, file_url, file_name, file_type, file_size } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: `${singular} name / title is required` });
      }
      if (!file_url || !file_url.trim()) {
        return res.status(400).json({ error: 'A file attachment (JPG, PNG, or PDF) is required' });
      }

      const created = await insertOne(table, {
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
      console.error(`Error creating ${lower}:`, err);
      res.status(500).json({ error: `Failed to create ${lower}` });
    }
  });

  // PUT /:id - admin updates an item
  router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = isNaN(id)
        ? null
        : await run(supabase.from(table).select('id').eq('id', id).maybeSingle());

      if (!existing) {
        return res.status(404).json({ error: `${singular} not found` });
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

      await run(supabase.from(table).update(patch).eq('id', id));

      res.json(await getLabel(id));
    } catch (err) {
      console.error(`Error updating ${lower}:`, err);
      res.status(500).json({ error: `Failed to update ${lower}` });
    }
  });

  // DELETE /:id - admin deletes an item
  router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = isNaN(id)
        ? null
        : await run(supabase.from(table).select('id').eq('id', id).maybeSingle());

      if (!existing) {
        return res.status(404).json({ error: `${singular} not found` });
      }

      await run(supabase.from(table).delete().eq('id', id));

      res.json({ success: true, message: `${singular} deleted successfully` });
    } catch (err) {
      console.error(`Error deleting ${lower}:`, err);
      res.status(500).json({ error: `Failed to delete ${lower}` });
    }
  });

  return router;
}

module.exports = { createLibraryRouter };
