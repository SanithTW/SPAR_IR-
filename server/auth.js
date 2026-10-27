const jwt = require('jsonwebtoken');
const db = require('./db');

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

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Verify user exists and is active in DB
    const user = db.prepare(`
      SELECT u.id, u.name, u.username, u.email, u.role, u.branch_id, u.active,
             b.name as branch_name, b.town as branch_town
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.id = ? AND u.active = 1
    `).get(decoded.id);

    if (!user) {
      return res.status(403).json({ error: 'User not found or deactivated' });
    }

    req.user = user;
    next();
  });
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
