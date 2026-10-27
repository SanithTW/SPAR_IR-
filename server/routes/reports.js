const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdminOrUser } = require('../auth');
const { computeIssueDisplay } = require('../utils');

// Require Admin or Marketing User for all reports
router.use(authenticateToken);
router.use(requireAdminOrUser);

// GET /api/reports/outstanding
router.get('/outstanding', (req, res) => {
  const { month, branch_id } = req.query;

  let query = `
    SELECT i.*,
           b.name as branch_name, b.town as branch_town,
           t.name as item_type_name
    FROM issues i
    JOIN branches b ON i.branch_id = b.id
    JOIN item_types t ON i.item_type_id = t.id
    WHERE i.status IN ('Issued', 'Pending')
  `;
  const params = [];

  if (month) {
    query += ' AND i.issue_date LIKE ?';
    params.push(`${month}%`);
  }

  if (branch_id) {
    query += ' AND i.branch_id = ?';
    params.push(parseInt(branch_id, 10));
  }

  query += ' ORDER BY i.issue_date ASC';

  const raw = db.prepare(query).all(...params);
  const issues = raw.map(computeIssueDisplay);

  // Filter only overdue items (not confirmed by 2nd of following month)
  const outstanding = issues.filter(i => i.is_overdue === 1);

  res.json(outstanding);
});

// GET /api/reports/branch-history
router.get('/branch-history', (req, res) => {
  const branches = db.prepare('SELECT id, name, town FROM branches WHERE active = 1 ORDER BY name ASC').all();

  const history = branches.map(b => {
    const raw = db.prepare(`
      SELECT i.*, t.name as item_type_name
      FROM issues i
      JOIN item_types t ON i.item_type_id = t.id
      WHERE i.branch_id = ?
    `).all(b.id);

    const issues = raw.map(computeIssueDisplay);
    const total = issues.length;
    const received = issues.filter(i => i.status === 'Received').length;
    const problem = issues.filter(i => i.status === 'Problem').length;
    const overdue = issues.filter(i => i.is_overdue === 1 && i.status === 'Issued').length;
    const pending = issues.filter(i => i.status === 'Pending').length;
    const issuedWaiting = issues.filter(i => i.status === 'Issued' && !i.is_overdue).length;

    return {
      branch_id: b.id,
      branch_name: b.name,
      branch_town: b.town,
      total_items: total,
      received_count: received,
      problem_count: problem,
      overdue_count: overdue,
      pending_count: pending,
      issued_waiting: issuedWaiting,
      completion_rate: total > 0 ? Math.round((received / total) * 100) : 0
    };
  });

  res.json(history);
});

// GET /api/reports/campaign-history
router.get('/campaign-history', (req, res) => {
  const campaigns = db.prepare(`
    SELECT DISTINCT campaign FROM issues ORDER BY campaign ASC
  `).all();

  const result = campaigns.map(c => {
    const raw = db.prepare(`
      SELECT i.*, b.name as branch_name, t.name as item_type_name
      FROM issues i
      JOIN branches b ON i.branch_id = b.id
      JOIN item_types t ON i.item_type_id = t.id
      WHERE i.campaign = ?
    `).all(c.campaign);

    const issues = raw.map(computeIssueDisplay);
    const totalBranches = new Set(issues.map(i => i.branch_id)).size;
    const totalQty = issues.reduce((acc, curr) => acc + (curr.qty || 1), 0);
    const received = issues.filter(i => i.status === 'Received').length;
    const problem = issues.filter(i => i.status === 'Problem').length;
    const overdue = issues.filter(i => i.is_overdue === 1 && i.status === 'Issued').length;

    return {
      campaign: c.campaign,
      total_issues: issues.length,
      total_branches: totalBranches,
      total_quantity: totalQty,
      received_count: received,
      problem_count: problem,
      overdue_count: overdue,
      latest_issue_date: issues[0]?.issue_date || null
    };
  });

  res.json(result);
});

// GET /api/reports/export (CSV export compatible with Microsoft Excel)
router.get('/export', (req, res) => {
  const { type, month, branch_id } = req.query; // 'outstanding' | 'all' | 'branch' | 'campaign'

  let query = `
    SELECT i.id, b.name as branch_name, b.town as branch_town,
           t.name as item_type, i.campaign, i.qty, i.issue_date,
           i.status, i.received_at, i.problem_at, i.note,
           u.name as issued_by
    FROM issues i
    JOIN branches b ON i.branch_id = b.id
    JOIN item_types t ON i.item_type_id = t.id
    LEFT JOIN users u ON i.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (month) {
    query += ' AND i.issue_date LIKE ?';
    params.push(`${month}%`);
  }

  if (branch_id) {
    query += ' AND i.branch_id = ?';
    params.push(parseInt(branch_id, 10));
  }

  query += ' ORDER BY i.issue_date DESC';

  const raw = db.prepare(query).all(...params);
  let issues = raw.map(computeIssueDisplay);

  if (type === 'outstanding') {
    issues = issues.filter(i => i.is_overdue === 1);
  }

  // Generate CSV rows
  const headers = ['Issue ID', 'Branch Name', 'Town', 'Item Type', 'Campaign Name', 'Quantity', 'Issue Date', 'Days Elapsed', 'Status', 'Overdue?', 'Received Date', 'Problem Date', 'Issued By', 'Notes'];
  const rows = issues.map(i => [
    i.id,
    `"${(i.branch_name || '').replace(/"/g, '""')}"`,
    `"${(i.branch_town || '').replace(/"/g, '""')}"`,
    `"${(i.item_type || '').replace(/"/g, '""')}"`,
    `"${(i.campaign || '').replace(/"/g, '""')}"`,
    i.qty || 1,
    i.issue_date,
    i.days_elapsed,
    i.display_status,
    i.is_overdue ? 'YES' : 'NO',
    i.received_at || '',
    i.problem_at || '',
    `"${(i.issued_by || '').replace(/"/g, '""')}"`,
    `"${(i.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=SPAR_POSM_Report_${type || 'all'}_${Date.now()}.csv`);
  res.send(csvContent);
});

module.exports = router;
