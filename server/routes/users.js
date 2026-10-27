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
    SELECT u.id, u.name, u.username, u.email, u.role, u.branch_id, u.active, u.created_at,
           b.name as branch_name, b.town as branch_town
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    ORDER BY u.id ASC
  `).all();

  res.json(users);
});

// POST /api/users
router.post('/', (req, res) => {
  const { name, username, email, password, role, branch_id } = req.body;

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
    INSERT INTO users (name, username, email, password_hash, role, branch_id, active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(name.trim(), username.trim(), email || '', passwordHash, role, role === 'branch' ? branch_id : null);

  const newUser = db.prepare(`
    SELECT u.id, u.name, u.username, u.email, u.role, u.branch_id, u.active,
           b.name as branch_name
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.id = ?
  `).get(info.lastInsertRowid);

  res.status(201).json(newUser);
});

// PUT /api/users/:id
router.put('/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { name, email, password, role, branch_id, active } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let passwordHash = user.password_hash;
  if (password && password.trim()) {
    passwordHash = bcrypt.hashSync(password.trim(), 8);
  }

  db.prepare(`
    UPDATE users
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        password_hash = ?,
        role = COALESCE(?, role),
        branch_id = ?,
        active = COALESCE(?, active)
    WHERE id = ?
  `).run(
    name !== undefined ? name.trim() : null,
    email !== undefined ? email.trim() : null,
    passwordHash,
    role !== undefined ? role : null,
    role === 'branch' ? (branch_id || user.branch_id) : null,
    active !== undefined ? (active ? 1 : 0) : null,
    userId
  );

  const updated = db.prepare(`
    SELECT u.id, u.name, u.username, u.email, u.role, u.branch_id, u.active,
           b.name as branch_name
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.id = ?
  `).get(userId);

  res.json(updated);
});

module.exports = router;
