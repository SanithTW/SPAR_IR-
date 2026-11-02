const express = require('express');
const router = express.Router();
const { supabase, run, fetchAll } = require('../db');
const { authenticateToken, requireAdminOrUser } = require('../auth');
const { computeIssuesDisplay } = require('../utils');

// Require Admin or Marketing User for all reports
router.use(authenticateToken);
router.use(requireAdminOrUser);

const REPORT_SELECT = '*, branches!inner(name, town), item_types!inner(name), users(name)';

function flatten(row) {
  const { branches: b, item_types: t, users: u, ...issue } = row;
  return {
    ...issue,
    branch_name: b ? b.name : null,
    branch_town: b ? b.town : null,
    item_type_name: t ? t.name : null,
    creator_name: u ? u.name : null
  };
}

// Load issues (joined + display fields) with optional month / branch / status filters
async function loadIssues({ month, branch_id, statuses, ascending = false } = {}) {
  const rows = await fetchAll(() => {
    let q = supabase.from('issues').select(REPORT_SELECT);
    if (statuses) q = q.in('status', statuses);
    if (month && /^\d{4}-\d{2}$/.test(month)) q = q.like('issue_date', `${month}%`);
    if (branch_id) q = q.eq('branch_id', parseInt(branch_id, 10));
    return q.order('issue_date', { ascending }).order('id', { ascending });
  });
  return computeIssuesDisplay(rows.map(flatten));
}

// GET /api/reports/outstanding
router.get('/outstanding', async (req, res) => {
  const { month, branch_id } = req.query;
  const issues = await loadIssues({ month, branch_id, statuses: ['Issued', 'Pending'], ascending: true });

  // Filter only overdue items (not confirmed by 2nd of following month)
  res.json(issues.filter(i => i.is_overdue === 1));
});

// GET /api/reports/branch-history
router.get('/branch-history', async (req, res) => {
  const [branches, issues] = await Promise.all([
    run(supabase.from('branches').select('id, name, town').eq('active', 1).order('name', { ascending: true })),
    loadIssues()
  ]);

  const byBranch = {};
  for (const i of issues) (byBranch[i.branch_id] = byBranch[i.branch_id] || []).push(i);

  const history = branches.map(b => {
    const list = byBranch[b.id] || [];
    const total = list.length;
    const received = list.filter(i => i.status === 'Received').length;

    return {
      branch_id: b.id,
      branch_name: b.name,
      branch_town: b.town,
      total_items: total,
      received_count: received,
      problem_count: list.filter(i => i.status === 'Problem').length,
      overdue_count: list.filter(i => i.is_overdue === 1 && i.status === 'Issued').length,
      pending_count: list.filter(i => i.status === 'Pending').length,
      issued_waiting: list.filter(i => i.status === 'Issued' && !i.is_overdue).length,
      completion_rate: total > 0 ? Math.round((received / total) * 100) : 0
    };
  });

  res.json(history);
});

// GET /api/reports/campaign-history
router.get('/campaign-history', async (req, res) => {
  const issues = await loadIssues(); // newest first

  const byCampaign = new Map();
  for (const i of issues) {
    if (!byCampaign.has(i.campaign)) byCampaign.set(i.campaign, []);
    byCampaign.get(i.campaign).push(i);
  }

  const result = [...byCampaign.keys()].sort().map(campaign => {
    const list = byCampaign.get(campaign);
    return {
      campaign,
      total_issues: list.length,
      total_branches: new Set(list.map(i => i.branch_id)).size,
      total_quantity: list.reduce((acc, curr) => acc + (curr.qty || 1), 0),
      received_count: list.filter(i => i.status === 'Received').length,
      problem_count: list.filter(i => i.status === 'Problem').length,
      overdue_count: list.filter(i => i.is_overdue === 1 && i.status === 'Issued').length,
      latest_issue_date: list[0]?.issue_date || null
    };
  });

  res.json(result);
});

// GET /api/reports/export (CSV export compatible with Microsoft Excel)
router.get('/export', async (req, res) => {
  const { type, month, branch_id } = req.query; // 'outstanding' | 'all' | 'branch' | 'campaign'

  let issues = await loadIssues({ month, branch_id });

  if (type === 'outstanding') {
    issues = issues.filter(i => i.is_overdue === 1);
  }

  const q = (v) => `"${String(v || '').replace(/"/g, '""')}"`;

  // Generate CSV rows
  const headers = ['Issue ID', 'Branch Name', 'Town', 'Item Type', 'Campaign Name', 'Quantity', 'Issue Date', 'Days Elapsed', 'Status', 'Overdue?', 'Received Date', 'Problem Date', 'Issued By', 'Notes'];
  const rows = issues.map(i => [
    i.id,
    q(i.branch_name),
    q(i.branch_town),
    q(i.item_type_name),
    q(i.campaign),
    i.qty || 1,
    i.issue_date,
    i.days_elapsed,
    i.display_status,
    i.is_overdue ? 'YES' : 'NO',
    i.received_at || '',
    i.problem_at || '',
    q(i.creator_name),
    q(i.note)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=SPAR_POSM_Report_${type || 'all'}_${Date.now()}.csv`);
  res.send(csvContent);
});

module.exports = router;
