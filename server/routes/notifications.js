const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../auth');

// GET /api/notifications
router.get('/', authenticateToken, (req, res) => {
  const { role, branch_id, id: userId } = req.user;

  let query = `
    SELECT * FROM notifications
    WHERE (
      (target_role = ? OR target_role IS NULL)
      AND (branch_id IS NULL OR branch_id = ?)
      AND (user_id IS NULL OR user_id = ?)
    )
    ORDER BY created_at DESC
    LIMIT 30
  `;

  const notifications = db.prepare(query).all(role, branch_id || null, userId);
  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  res.json({
    notifications,
    unread_count: unreadCount
  });
});

// POST /api/notifications/:id/read
router.post('/:id/read', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  res.json({ message: 'Marked as read' });
});

// POST /api/notifications/read-all
router.post('/read-all', authenticateToken, (req, res) => {
  const { role, branch_id, id: userId } = req.user;

  db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE (
      (target_role = ? OR target_role IS NULL)
      AND (branch_id IS NULL OR branch_id = ?)
      AND (user_id IS NULL OR user_id = ?)
    )
  `).run(role, branch_id || null, userId);

  res.json({ message: 'All marked as read' });
});

module.exports = router;
