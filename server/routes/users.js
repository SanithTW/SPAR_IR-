const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/users
router.get('/', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.name, u.username, u.email, u.phone, u.address, u.role, u.branch_id, u.active, u.created_at,
           b.name as branch_name, b.town as branch_town
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    ORDER BY u.id ASC
  `).all();

  res.json(users);
});

// POST /api/users
router.post('/', (req, res) => {
  const { name, username, email, phone, address, password, role, branch_id } = req.body;

  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'Name, username, password and role are required' });
  }

  if (role === 'branch' && !branch_id) {
    return res.status(400).json({ error: 'Branch assignment is required for branch role' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(username.trim());
  if (existing) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  const passwordHash = bcrypt.hashSync(password, 8);

  const info = db.prepare(`
    INSERT INTO users (name, username, email, phone, address, password_hash, role, branch_id, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(name.trim(), username.trim(), email || '', phone || '', address || '', passwordHash, role, role === 'branch' ? branch_id : null);

  const newUser = db.prepare(`
    SELECT u.id, u.name, u.username, u.email, u.phone, u.address, u.role, u.branch_id, u.active,
           b.name as branch_name
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.id = ?
  `).get(info.lastInsertRowid);

  res.status(201).json(newUser);
});

// Optional Supabase integration
let supabase = null;
try {
  const sbModule = require('../supabase');
  supabase = sbModule.supabase;
} catch (e) {
  // Supabase not available in this instance
}

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { name, username, email, phone, address, password, role, branch_id, active } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?').get(username.trim(), userId);
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
  }

  let passwordHash = user.password_hash;
  if (password && password.trim()) {
    passwordHash = bcrypt.hashSync(password.trim(), 8);
  }

  const newRole = role !== undefined ? role : user.role;
  const newBranchId = newRole === 'branch' ? (branch_id !== undefined ? branch_id : user.branch_id) : null;

  db.prepare(`
    UPDATE users
    SET name = COALESCE(?, name),
        username = COALESCE(?, username),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        password_hash = ?,
        role = COALESCE(?, role),
        branch_id = ?,
        active = COALESCE(?, active)
    WHERE id = ?
  `).run(
    name !== undefined ? name.trim() : null,
    username !== undefined ? username.trim() : null,
    email !== undefined ? email.trim() : null,
    phone !== undefined ? phone.trim() : null,
    address !== undefined ? address.trim() : null,
    passwordHash,
    role !== undefined ? role : null,
    newBranchId,
    active !== undefined ? (active ? 1 : 0) : null,
    userId
  );

  const updated = db.prepare(`
    SELECT u.id, u.name, u.username, u.email, u.phone, u.address, u.role, u.branch_id, u.active,
           b.name as branch_name
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.id = ?
  `).get(userId);

  // Sync to Supabase if configured
  if (supabase && (process.env.USE_SUPABASE === 'true' || process.env.SUPABASE_URL)) {
    try {
      const fullUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      await supabase.from('users').upsert(fullUser, { onConflict: 'id' });
    } catch (sbErr) {
      console.warn('Supabase user update notice:', sbErr.message);
    }
  }

  res.json(updated);
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  // Safeguard: Prevent deleting own account
  if (req.user && req.user.id === userId) {
    return res.status(400).json({ error: 'You cannot delete your own logged-in account' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    // Clean up foreign key references in related tables
    db.prepare('UPDATE notifications SET user_id = NULL WHERE user_id = ?').run(userId);
    db.prepare('UPDATE issue_updates SET updated_by = NULL WHERE updated_by = ?').run(userId);
    db.prepare('UPDATE issues SET created_by = NULL WHERE created_by = ?').run(userId);

    // Delete user from SQLite
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    // Sync deletion to Supabase if active
    if (supabase && (process.env.USE_SUPABASE === 'true' || process.env.SUPABASE_URL)) {
      try {
        await supabase.from('users').delete().eq('id', userId);
      } catch (sbErr) {
        console.warn('Supabase user delete notice:', sbErr.message);
      }
    }

    res.json({ success: true, message: `User "${user.name}" (@${user.username}) deleted successfully` });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: err.message || 'Failed to delete user' });
  }
});

module.exports = router;

