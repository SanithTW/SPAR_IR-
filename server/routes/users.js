const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { supabase, run, insertOne, escapeLike } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

router.use(authenticateToken);
router.use(requireAdmin);

const PUBLIC_COLUMNS = 'id, name, username, email, phone, address, role, branch_id, active, created_at, branches(name, town)';

function withBranch(row) {
  if (!row) return row;
  const { branches, ...user } = row;
  return {
    ...user,
    branch_name: branches ? branches.name : null,
    branch_town: branches ? branches.town : null
  };
}

async function getPublicUser(id) {
  return withBranch(await run(supabase.from('users').select(PUBLIC_COLUMNS).eq('id', id).maybeSingle()));
}

async function usernameTaken(username, exceptId = null) {
  let q = supabase.from('users').select('id').ilike('username', escapeLike(username.trim()));
  if (exceptId !== null) q = q.neq('id', exceptId);
  const rows = await run(q.limit(1));
  return rows.length > 0;
}

// GET /api/users
router.get('/', async (req, res) => {
  const rows = await run(supabase.from('users').select(PUBLIC_COLUMNS).order('id', { ascending: true }));
  res.json(rows.map(withBranch));
});

// POST /api/users
router.post('/', async (req, res) => {
  const { name, username, email, phone, address, password, role, branch_id } = req.body;

  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'Name, username, password and role are required' });
  }

  if (role === 'branch' && !branch_id) {
    return res.status(400).json({ error: 'Branch assignment is required for branch role' });
  }

  if (await usernameTaken(username)) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  const created = await insertOne('users', {
    name: name.trim(),
    username: username.trim(),
    email: email || '',
    phone: phone || '',
    address: address || '',
    password_hash: bcrypt.hashSync(password, 8),
    role,
    branch_id: role === 'branch' ? branch_id : null,
    active: 1
  }, 'id');

  res.status(201).json(await getPublicUser(created.id));
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { name, username, email, phone, address, password, role, branch_id, active } = req.body;

  const user = isNaN(userId)
    ? null
    : await run(supabase.from('users').select('*').eq('id', userId).maybeSingle());
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
    if (await usernameTaken(username, userId)) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
  }

  const newRole = role !== undefined && role !== null ? role : user.role;
  const patch = {
    branch_id: newRole === 'branch' ? (branch_id !== undefined ? branch_id : user.branch_id) : null
  };
  if (name !== undefined && name !== null) patch.name = name.trim();
  if (username !== undefined && username !== null) patch.username = username.trim();
  if (email !== undefined && email !== null) patch.email = email.trim();
  if (phone !== undefined && phone !== null) patch.phone = phone.trim();
  if (address !== undefined && address !== null) patch.address = address.trim();
  if (role !== undefined && role !== null) patch.role = role;
  if (active !== undefined && active !== null) patch.active = active ? 1 : 0;
  if (password && password.trim()) patch.password_hash = bcrypt.hashSync(password.trim(), 8);

  await run(supabase.from('users').update(patch).eq('id', userId));

  res.json(await getPublicUser(userId));
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  // Safeguard: Prevent deleting own account
  if (req.user && req.user.id === userId) {
    return res.status(400).json({ error: 'You cannot delete your own logged-in account' });
  }

  const user = isNaN(userId)
    ? null
    : await run(supabase.from('users').select('id, name, username').eq('id', userId).maybeSingle());
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    // Clean up references in related tables
    await run(supabase.from('notifications').update({ user_id: null }).eq('user_id', userId));
    await run(supabase.from('issue_updates').update({ updated_by: null }).eq('updated_by', userId));
    await run(supabase.from('issues').update({ created_by: null }).eq('created_by', userId));
    await run(supabase.from('private_labels').update({ created_by: null }).eq('created_by', userId));
    await run(supabase.from('leaflets').update({ created_by: null }).eq('created_by', userId));

    await run(supabase.from('users').delete().eq('id', userId));

    res.json({ success: true, message: `User "${user.name}" (@${user.username}) deleted successfully` });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: err.message || 'Failed to delete user' });
  }
});

module.exports = router;
