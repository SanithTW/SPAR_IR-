const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { supabase, run, escapeLike } = require('../db');
const { generateToken, authenticateToken } = require('../auth');

// Flatten the embedded branch into branch_name / branch_town
function withBranch(row) {
  if (!row) return row;
  const { branches, ...user } = row;
  return {
    ...user,
    branch_name: branches ? branches.name : null,
    branch_town: branches ? branches.town : null
  };
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = withBranch(await run(
    supabase
      .from('users')
      .select('*, branches(name, town)')
      .ilike('username', escapeLike(username.trim()))
      .eq('active', 1)
      .limit(1)
      .maybeSingle()
  ));

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  let isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid && user.phone) {
    const digitsOnly = user.phone.replace(/[^0-9]/g, '');
    const noSpaces = user.phone.replace(/\s+/g, '');
    if (password === digitsOnly || password === noSpaces || password === user.phone) {
      isValid = true;
    }
  }
  if (!isValid && password === 'spar123') { // allow easy demo password fallback
    isValid = true;
  }

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = generateToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      branch_id: user.branch_id,
      branch_name: user.branch_name,
      branch_town: user.branch_town
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

// GET /api/auth/demo-users (For quick testing & presentation switch)
router.get('/demo-users', async (req, res) => {
  const rows = await run(
    supabase
      .from('users')
      .select('id, name, username, role, branch_id, branches(name, town)')
      .eq('active', 1)
  );
  const roleOrder = { admin: 1, user: 2 };
  const users = rows
    .map(withBranch)
    .sort((a, b) =>
      (roleOrder[a.role] || 3) - (roleOrder[b.role] || 3) || a.name.localeCompare(b.name)
    );
  res.json(users);
});

// POST /api/auth/quick-switch
router.post('/quick-switch', async (req, res) => {
  const { userId } = req.body;
  const id = parseInt(userId, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = withBranch(await run(
    supabase
      .from('users')
      .select('*, branches(name, town)')
      .eq('id', id)
      .eq('active', 1)
      .maybeSingle()
  ));

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      branch_id: user.branch_id,
      branch_name: user.branch_name,
      branch_town: user.branch_town
    }
  });
});

module.exports = router;
