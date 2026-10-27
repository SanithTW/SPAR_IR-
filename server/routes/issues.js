const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');
const { computeIssueDisplay } = require('../utils');

// GET /api/issues
router.get('/', authenticateToken, (req, res) => {
  const { role, branch_id: userBranchId } = req.user;
  let { branch_id, item_type_id, status, campaign, month, search } = req.query;

  // Server security enforcement: Branch user can only ever see their own branch items!
  if (role === 'branch') {
    branch_id = userBranchId;
  }

  let query = `
    SELECT i.*,
           b.name as branch_name, b.town as branch_town,
           t.name as item_type_name,
           s.width as slot_width, s.height as slot_height, s.unit as slot_unit,
           s.orientation as slot_orientation,
           u.name as creator_name
    FROM issues i
    JOIN branches b ON i.branch_id = b.id
    JOIN item_types t ON i.item_type_id = t.id
    LEFT JOIN hoarding_slots s ON i.slot_id = s.id
    LEFT JOIN users u ON i.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (branch_id) {
    query += ' AND i.branch_id = ?';
    params.push(parseInt(branch_id, 10));
  }

  if (item_type_id) {
    query += ' AND i.item_type_id = ?';
    params.push(parseInt(item_type_id, 10));
  }

  if (campaign) {
    query += ' AND i.campaign LIKE ?';
    params.push(`%${campaign}%`);
  }

  if (month) {
    // YYYY-MM
    query += ' AND i.issue_date LIKE ?';
    params.push(`${month}%`);
  }

  if (search) {
    query += ' AND (i.campaign LIKE ? OR i.note LIKE ? OR b.name LIKE ? OR b.town LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  query += ' ORDER BY i.issue_date DESC, i.id DESC';

  const rawIssues = db.prepare(query).all(...params);
  let issues = rawIssues.map(computeIssueDisplay);

  if (status) {
    if (status === 'Overdue') {
      issues = issues.filter(iss => iss.is_overdue === 1);
    } else {
      issues = issues.filter(iss => iss.status === status);
    }
  }

  res.json(issues);
});

// GET /api/issues/summary (KPI numbers for dashboard strip)
router.get('/summary', authenticateToken, (req, res) => {
  const { role, branch_id: userBranchId } = req.user;
  const targetBranchId = role === 'branch' ? userBranchId : (req.query.branch_id ? parseInt(req.query.branch_id, 10) : null);

  let query = `
    SELECT i.*, b.name as branch_name
    FROM issues i
    JOIN branches b ON i.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (targetBranchId) {
    query += ' AND i.branch_id = ?';
    params.push(targetBranchId);
  }

  const rawIssues = db.prepare(query).all(...params);
  const issues = rawIssues.map(computeIssueDisplay);

  const total = issues.length;
  const received = issues.filter(i => i.status === 'Received').length;
  const pending = issues.filter(i => i.status === 'Pending').length;
  const problem = issues.filter(i => i.status === 'Problem').length;
  const overdue = issues.filter(i => i.is_overdue === 1 && i.status === 'Issued').length;
  const waitingIssued = issues.filter(i => i.status === 'Issued' && !i.is_overdue).length;

  res.json({
    total,
    received,
    pending,
    problem,
    overdue,
    waitingIssued,
    completionRate: total > 0 ? Math.round((received / total) * 100) : 0
  });
});

// GET /api/issues/:id
router.get('/:id', authenticateToken, (req, res) => {
  const issueId = parseInt(req.params.id, 10);
  const { role, branch_id: userBranchId } = req.user;

  const raw = db.prepare(`
    SELECT i.*,
           b.name as branch_name, b.town as branch_town, b.address as branch_address, b.phone as branch_phone,
           t.name as item_type_name,
           s.width as slot_width, s.height as slot_height, s.unit as slot_unit,
           s.orientation as slot_orientation, s.notes as slot_notes,
           u.name as creator_name
    FROM issues i
    JOIN branches b ON i.branch_id = b.id
    JOIN item_types t ON i.item_type_id = t.id
    LEFT JOIN hoarding_slots s ON i.slot_id = s.id
    LEFT JOIN users u ON i.created_by = u.id
    WHERE i.id = ?
  `).get(issueId);

  if (!raw) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  // Branch security enforcement
  if (role === 'branch' && raw.branch_id !== userBranchId) {
    return res.status(403).json({ error: 'Access denied: You cannot view this issue' });
  }

  const updates = db.prepare(`
    SELECT * FROM issue_updates WHERE issue_id = ? ORDER BY id DESC
  `).all(issueId);

  const issue = {
    ...computeIssueDisplay(raw),
    history: updates
  };

  res.json(issue);
});

// POST /api/issues (Admin only: single or bulk issue)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const {
    branch_ids, // array of branch IDs, OR pass all_branches: true
    all_branches,
    item_type_id,
    slot_id,
    campaign,
    qty,
    issue_date,
    note,
    attachment_url,
    status
  } = req.body;

  if (!item_type_id || !campaign || !issue_date) {
    return res.status(400).json({ error: 'Item type, campaign name, and issue date are required' });
  }

  let targetBranchIds = [];
  if (all_branches) {
    const all = db.prepare('SELECT id FROM branches WHERE active = 1').all();
    targetBranchIds = all.map(b => b.id);
  } else if (Array.isArray(branch_ids) && branch_ids.length > 0) {
    targetBranchIds = branch_ids.map(id => parseInt(id, 10));
  } else if (req.body.branch_id) {
    targetBranchIds = [parseInt(req.body.branch_id, 10)];
  }

  if (targetBranchIds.length === 0) {
    return res.status(400).json({ error: 'Please select at least one branch' });
  }

  const initialStatus = status === 'Pending' ? 'Pending' : 'Issued';
  const itemType = db.prepare('SELECT name FROM item_types WHERE id = ?').get(item_type_id);

  const insertIssue = db.prepare(`
    INSERT INTO issues (branch_id, item_type_id, slot_id, campaign, qty, issue_date, status, note, attachment_url, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertUpdate = db.prepare(`
    INSERT INTO issue_updates (issue_id, status, comment, updated_by, updated_by_name)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertNotif = db.prepare(`
    INSERT INTO notifications (target_role, branch_id, title, message, issue_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  const createdIds = [];

  // Execute in transaction for atomicity
  const transaction = db.transaction(() => {
    for (const bId of targetBranchIds) {
      // If hoarding and only 1 branch, allow slot_id, otherwise null for bulk
      const targetSlotId = targetBranchIds.length === 1 ? (slot_id || null) : null;
      const quantity = parseInt(qty, 10) || 1;

      const info = insertIssue.run(
        bId,
        item_type_id,
        targetSlotId,
        campaign.trim(),
        quantity,
        issue_date,
        initialStatus,
        note || '',
        attachment_url || null,
        req.user.id
      );

      const newIssueId = info.lastInsertRowid;
      createdIds.push(newIssueId);

      // Audit history
      insertUpdate.run(
        newIssueId,
        initialStatus,
        initialStatus === 'Issued' ? 'Item issued by Marketing' : 'Planned in calendar',
        req.user.id,
        req.user.name
      );

      // In-app notification to branch
      insertNotif.run(
        'branch',
        bId,
        'New POSM Issued',
        `${itemType ? itemType.name : 'Item'} for "${campaign}" (${quantity} pcs) scheduled for ${issue_date}`,
        newIssueId
      );
    }

    // Also notify admins if bulk issued
    if (targetBranchIds.length > 1) {
      insertNotif.run(
        'admin',
        null,
        'Bulk POSM Issued',
        `"${campaign}" issued to ${targetBranchIds.length} branches by ${req.user.name}`,
        createdIds[0]
      );
    }
  });

  transaction();

  res.status(201).json({
    message: `Successfully issued item to ${createdIds.length} branch(es)`,
    count: createdIds.length,
    created_ids: createdIds
  });
});

// PUT /api/issues/:id/status (Admin change status: e.g. Pending -> Issued, or Cancelled)
router.put('/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const issueId = parseInt(req.params.id, 10);
  const { status, note } = req.body;

  if (!['Pending', 'Issued', 'Cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Pending, Issued, or Cancelled' });
  }

  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  db.prepare('UPDATE issues SET status = ? WHERE id = ?').run(status, issueId);

  // Log update
  db.prepare(`
    INSERT INTO issue_updates (issue_id, status, comment, updated_by, updated_by_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(issueId, status, note || `Status changed to ${status} by Admin`, req.user.id, req.user.name);

  // If moved to Issued, notify branch
  if (status === 'Issued') {
    db.prepare(`
      INSERT INTO notifications (target_role, branch_id, title, message, issue_id)
      VALUES (?, ?, ?, ?, ?)
    `).run('branch', issue.branch_id, 'Item Dispatched', `Item for "${issue.campaign}" has now been Issued.`, issueId);
  }

  res.json({ message: `Status updated to ${status}` });
});

// POST /api/issues/:id/receive (Branch confirms receipt)
router.post('/:id/receive', authenticateToken, (req, res) => {
  const issueId = parseInt(req.params.id, 10);
  const { received_date, comment } = req.body;
  const { role, branch_id: userBranchId, name: userName, id: userId } = req.user;

  const issue = db.prepare(`
    SELECT i.*, b.name as branch_name
    FROM issues i
    JOIN branches b ON i.branch_id = b.id
    WHERE i.id = ?
  `).get(issueId);

  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  // Server security enforcement
  if (role === 'branch' && issue.branch_id !== userBranchId) {
    return res.status(403).json({ error: 'Access denied: You can only confirm receipt for your own branch' });
  }

  const recDate = received_date || new Date().toISOString().slice(0, 19).replace('T', ' ');

  db.prepare(`
    UPDATE issues
    SET status = 'Received', received_at = ?
    WHERE id = ?
  `).run(recDate, issueId);

  // Audit history
  db.prepare(`
    INSERT INTO issue_updates (issue_id, status, comment, updated_by, updated_by_name)
    VALUES (?, 'Received', ?, ?, ?)
  `).run(issueId, comment || 'Confirmed received in good order by branch.', userId, userName);

  // Notify Admin
  db.prepare(`
    INSERT INTO notifications (target_role, title, message, issue_id)
    VALUES ('admin', 'Receipt Confirmed', '${issue.branch_name} confirmed receipt of "${issue.campaign}"', ?)
  `).run(issueId);

  res.json({ message: 'Receipt confirmed successfully!', issue_id: issueId, status: 'Received' });
});

// POST /api/issues/:id/problem (Branch reports problem)
router.post('/:id/problem', authenticateToken, (req, res) => {
  const issueId = parseInt(req.params.id, 10);
  const { problem_type, comment, photo } = req.body;
  const { role, branch_id: userBranchId, name: userName, id: userId } = req.user;

  if (!comment) {
    return res.status(400).json({ error: 'Please describe the problem' });
  }

  const issue = db.prepare(`
    SELECT i.*, b.name as branch_name
    FROM issues i
    JOIN branches b ON i.branch_id = b.id
    WHERE i.id = ?
  `).get(issueId);

  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  // Server security enforcement
  if (role === 'branch' && issue.branch_id !== userBranchId) {
    return res.status(403).json({ error: 'Access denied: You can only report problems for your own branch' });
  }

  const probDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

  db.prepare(`
    UPDATE issues
    SET status = 'Problem', problem_at = ?
    WHERE id = ?
  `).run(probDate, issueId);

  const fullComment = problem_type ? `[${problem_type}] ${comment}` : comment;

  // Audit history
  db.prepare(`
    INSERT INTO issue_updates (issue_id, status, comment, photo, updated_by, updated_by_name)
    VALUES (?, 'Problem', ?, ?, ?, ?)
  `).run(issueId, fullComment, photo || null, userId, userName);

  // Notify Admin
  db.prepare(`
    INSERT INTO notifications (target_role, title, message, issue_id)
    VALUES ('admin', 'Problem Reported', '${issue.branch_name} reported problem for "${issue.campaign}": ${fullComment}', ?)
  `).run(issueId);

  res.json({ message: 'Problem reported to Marketing', issue_id: issueId, status: 'Problem' });
});

module.exports = router;
