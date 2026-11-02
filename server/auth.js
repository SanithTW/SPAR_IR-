const jwt = require('jsonwebtoken');
const { supabase, run } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'spar-savemor-posm-tracker-jwt-secret-key-2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      branch_id: user.branch_id
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  try {
    // Verify user exists and is active in DB
    const row = await run(
      supabase
        .from('users')
        .select('id, name, username, email, role, branch_id, active, branches(name, town)')
        .eq('id', decoded.id)
        .eq('active', 1)
        .maybeSingle()
    );

    if (!row) {
      return res.status(403).json({ error: 'User not found or deactivated' });
    }

    const { branches, ...user } = row;
    req.user = {
      ...user,
      branch_name: branches ? branches.name : null,
      branch_town: branches ? branches.town : null
    };
    next();
  } catch (err) {
    next(err);
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireAdminOrUser(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'user') {
    return res.status(403).json({ error: 'Admin or Marketing User access required' });
  }
  next();
}

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin,
  requireAdminOrUser,
  JWT_SECRET
};
