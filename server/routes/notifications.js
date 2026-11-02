const express = require('express');
const router = express.Router();
const { supabase, run } = require('../db');
const { authenticateToken } = require('../auth');

// Applies the visibility rule for the current user:
//   (target_role = role OR target_role IS NULL)
//   AND (branch_id IS NULL OR branch_id = user's branch)
//   AND (user_id IS NULL OR user_id = user's id)
function forUser(query, { role, branch_id, id: userId }) {
  query = query.or(`target_role.eq.${role},target_role.is.null`);
  query = branch_id
    ? query.or(`branch_id.is.null,branch_id.eq.${parseInt(branch_id, 10)}`)
    : query.is('branch_id', null);
  query = query.or(`user_id.is.null,user_id.eq.${parseInt(userId, 10)}`);
  return query;
}

// GET /api/notifications
router.get('/', authenticateToken, async (req, res) => {
  const notifications = await run(
    forUser(supabase.from('notifications').select('*'), req.user)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(30)
  );
  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  res.json({
    notifications,
    unread_count: unreadCount
  });
});

// POST /api/notifications/read-all
router.post('/read-all', authenticateToken, async (req, res) => {
  await run(forUser(supabase.from('notifications').update({ is_read: 1 }), req.user).eq('is_read', 0));
  res.json({ message: 'All marked as read' });
});

// POST /api/notifications/:id/read
router.post('/:id/read', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!isNaN(id)) {
    await run(supabase.from('notifications').update({ is_read: 1 }).eq('id', id));
  }
  res.json({ message: 'Marked as read' });
});

module.exports = router;
