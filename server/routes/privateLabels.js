const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

// Optional Supabase integration
let supabase = null;
try {
  const sbModule = require('../supabase');
  supabase = sbModule.supabase;
} catch (e) {
  // Supabase not available in this instance
}

// GET /api/private-labels - View all private label assets (Available to all authenticated users)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { category, search } = req.query;
    let query = `
      SELECT pl.*, u.name as created_by_name
      FROM private_labels pl
      LEFT JOIN users u ON pl.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'All') {
      query += ` AND pl.category = ?`;
      params.push(category);
    }

    if (search && search.trim()) {
      query += ` AND (pl.title LIKE ? OR pl.description LIKE ? OR pl.file_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY pl.id DESC`;

    const records = db.prepare(query).all(...params);
    res.json(records);
  } catch (err) {
    console.error('Error fetching private labels:', err);
    res.status(500).json({ error: 'Failed to retrieve private labels' });
  }
});

// GET /api/private-labels/:id - Get single private label
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = db.prepare(`
      SELECT pl.*, u.name as created_by_name
      FROM private_labels pl
      LEFT JOIN users u ON pl.created_by = u.id
      WHERE pl.id = ?
    `).get(id);

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

    const created_by = req.user.id || null;
    const cat = category && category.trim() ? category.trim() : 'General';

    const stmt = db.prepare(`
      INSERT INTO private_labels (title, category, description, file_url, file_name, file_type, file_size, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      title.trim(),
      cat,
      description ? description.trim() : null,
      file_url.trim(),
      file_name || null,
      file_type || null,
      file_size || null,
      created_by
    );

    const newItem = db.prepare(`
      SELECT pl.*, u.name as created_by_name
      FROM private_labels pl
      LEFT JOIN users u ON pl.created_by = u.id
      WHERE pl.id = ?
    `).get(info.lastInsertRowid);

    // Sync to Supabase if available
    if (supabase && (process.env.USE_SUPABASE === 'true' || process.env.SUPABASE_URL)) {
      try {
        await supabase.from('private_labels').upsert({
          id: newItem.id,
          title: newItem.title,
          category: newItem.category,
          description: newItem.description,
          file_url: newItem.file_url,
          file_name: newItem.file_name,
          file_type: newItem.file_type,
          file_size: newItem.file_size,
          created_by: newItem.created_by,
          created_at: newItem.created_at,
          updated_at: newItem.updated_at
        }, { onConflict: 'id' });
      } catch (sbErr) {
        console.warn('Supabase private label upsert notice:', sbErr.message);
      }
    }

    res.status(201).json(newItem);
  } catch (err) {
    console.error('Error creating private label:', err);
    res.status(500).json({ error: 'Failed to create private label asset' });
  }
});

// PUT /api/private-labels/:id - Admin only updates existing private label
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.prepare('SELECT * FROM private_labels WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Private label asset not found' });
    }

    const { title, category, description, file_url, file_name, file_type, file_size } = req.body;

    const newTitle = title !== undefined ? title.trim() : existing.title;
    const newCategory = category !== undefined ? category.trim() : existing.category;
    const newDescription = description !== undefined ? description : existing.description;
    const newFileUrl = file_url !== undefined ? file_url.trim() : existing.file_url;
    const newFileName = file_name !== undefined ? file_name : existing.file_name;
    const newFileType = file_type !== undefined ? file_type : existing.file_type;
    const newFileSize = file_size !== undefined ? file_size : existing.file_size;

    db.prepare(`
      UPDATE private_labels
      SET title = ?,
          category = ?,
          description = ?,
          file_url = ?,
          file_name = ?,
          file_type = ?,
          file_size = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      newTitle,
      newCategory,
      newDescription,
      newFileUrl,
      newFileName,
      newFileType,
      newFileSize,
      id
    );

    const updatedItem = db.prepare(`
      SELECT pl.*, u.name as created_by_name
      FROM private_labels pl
      LEFT JOIN users u ON pl.created_by = u.id
      WHERE pl.id = ?
    `).get(id);

    // Sync to Supabase if available
    if (supabase && (process.env.USE_SUPABASE === 'true' || process.env.SUPABASE_URL)) {
      try {
        await supabase.from('private_labels').upsert({
          id: updatedItem.id,
          title: updatedItem.title,
          category: updatedItem.category,
          description: updatedItem.description,
          file_url: updatedItem.file_url,
          file_name: updatedItem.file_name,
          file_type: updatedItem.file_type,
          file_size: updatedItem.file_size,
          created_by: updatedItem.created_by,
          created_at: updatedItem.created_at,
          updated_at: updatedItem.updated_at
        }, { onConflict: 'id' });
      } catch (sbErr) {
        console.warn('Supabase private label update notice:', sbErr.message);
      }
    }

    res.json(updatedItem);
  } catch (err) {
    console.error('Error updating private label:', err);
    res.status(500).json({ error: 'Failed to update private label asset' });
  }
});

// DELETE /api/private-labels/:id - Admin only deletes private label
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.prepare('SELECT * FROM private_labels WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Private label asset not found' });
    }

    db.prepare('DELETE FROM private_labels WHERE id = ?').run(id);

    // Sync to Supabase if active
    if (supabase && (process.env.USE_SUPABASE === 'true' || process.env.SUPABASE_URL)) {
      try {
        await supabase.from('private_labels').delete().eq('id', id);
      } catch (sbErr) {
        console.warn('Supabase private label delete notice:', sbErr.message);
      }
    }

    res.json({ success: true, message: 'Private label asset deleted successfully' });
  } catch (err) {
    console.error('Error deleting private label:', err);
    res.status(500).json({ error: 'Failed to delete private label asset' });
  }
});

module.exports = router;
