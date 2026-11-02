const express = require('express');
const router = express.Router();
const { supabase, run, fetchAll, insert, insertOne } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');
const { computeIssuesDisplay } = require('../utils');

const ISSUE_SELECT = `*,
  branches!inner(name, town, address, phone),
  item_types!inner(name),
  hoarding_slots(width, height, unit, orientation, notes),
  users(name)`;

// Flatten embedded relations into the flat column names the client expects
function flattenIssue(row, { detail = false } = {}) {
  const { branches: b, item_types: t, hoarding_slots: s, users: u, ...issue } = row;
  const flat = {
    ...issue,
    branch_name: b ? b.name : null,
    branch_town: b ? b.town : null,
    item_type_name: t ? t.name : null,
    slot_width: s ? s.width : null,
    slot_height: s ? s.height : null,
    slot_unit: s ? s.unit : null,
    slot_orientation: s ? s.orientation : null,
    creator_name: u ? u.name : null
  };
  if (detail) {
    flat.branch_address = b ? b.address : null;
    flat.branch_phone = b ? b.phone : null;
    flat.slot_notes = s ? s.notes : null;
  }
  return flat;
}

// Map each branch to the hoarding slot an issue should reference.
// - hoardingSizeId (from the Sizes master list): use each branch's existing slot
//   with those exact dimensions, creating one for branches that lack it.
// - slotId (a branch-specific slot): honoured only for the branch that owns it.
async function resolveSlots(branchIds, hoardingSizeId, slotId) {
  const result = {};
  const sizeId = parseInt(hoardingSizeId, 10);

  if (!isNaN(sizeId)) {
    const size = await run(supabase.from('hoarding_sizes').select('*').eq('id', sizeId).maybeSingle());
    if (!size) return result;

    const existing = await run(
      supabase.from('hoarding_slots').select('id, branch_id')
        .in('branch_id', branchIds)
        .eq('width', size.width).eq('height', size.height)
        .eq('unit', size.unit).eq('orientation', size.orientation).eq('sides', size.sides)
        .order('id')
    );
    for (const s of existing) if (!result[s.branch_id]) result[s.branch_id] = s.id;

    const missing = branchIds.filter((b) => !result[b]);
    if (missing.length) {
      const created = await insert('hoarding_slots', missing.map((b) => ({
        branch_id: b,
        width: size.width,
        height: size.height,
        unit: size.unit,
        orientation: size.orientation,
        sides: size.sides,
        qty: 1,
        notes: 'Added automatically when issuing a hoarding'
      })), 'id, branch_id');
      for (const s of created) result[s.branch_id] = s.id;
    }
    return result;
  }

  const sid = parseInt(slotId, 10);
  if (!isNaN(sid)) {
    const slot = await run(supabase.from('hoarding_slots').select('id, branch_id').eq('id', sid).maybeSingle());
    if (slot && branchIds.includes(slot.branch_id)) result[slot.branch_id] = slot.id;
  }
  return result;
}

function containsCI(value, term) {
  return (value || '').toLowerCase().includes(term);
}

function nowTimestamp() {
  return new Date().toISOString();
}

// GET /api/issues
router.get('/', authenticateToken, async (req, res) => {
  const { role, branch_id: userBranchId } = req.user;
  let { branch_id, item_type_id, status, campaign, month, search } = req.query;

  // Server security enforcement: Branch user can only ever see their own branch items!
  if (role === 'branch') {
    branch_id = userBranchId;
  }

  const rows = await fetchAll(() => {
    let q = supabase.from('issues').select(ISSUE_SELECT);
    if (branch_id) q = q.eq('branch_id', parseInt(branch_id, 10));
    if (item_type_id) q = q.eq('item_type_id', parseInt(item_type_id, 10));
    if (month && /^\d{4}-\d{2}$/.test(month)) q = q.like('issue_date', `${month}%`);
    return q.order('issue_date', { ascending: false }).order('id', { ascending: false });
  });

  let flat = rows.map((r) => flattenIssue(r));

  if (campaign) {
    const term = String(campaign).toLowerCase();
    flat = flat.filter((i) => containsCI(i.campaign, term));
  }

  if (search) {
    const term = String(search).toLowerCase();
    flat = flat.filter((i) =>
      containsCI(i.campaign, term) || containsCI(i.note, term) ||
      containsCI(i.branch_name, term) || containsCI(i.branch_town, term)
    );
  }

  let issues = await computeIssuesDisplay(flat);

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
router.get('/summary', authenticateToken, async (req, res) => {
  const { role, branch_id: userBranchId } = req.user;
  const targetBranchId = role === 'branch' ? userBranchId : (req.query.branch_id ? parseInt(req.query.branch_id, 10) : null);

  const rows = await fetchAll(() => {
    let q = supabase.from('issues').select('id, branch_id, status, issue_date');
    if (targetBranchId) q = q.eq('branch_id', targetBranchId);
    return q.order('id');
  });
  const issues = await computeIssuesDisplay(rows);

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
router.get('/:id', authenticateToken, async (req, res) => {
  const issueId = parseInt(req.params.id, 10);
  const { role, branch_id: userBranchId } = req.user;

  const row = isNaN(issueId)
    ? null
    : await run(supabase.from('issues').select(ISSUE_SELECT).eq('id', issueId).maybeSingle());

  if (!row) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  // Branch security enforcement
  if (role === 'branch' && row.branch_id !== userBranchId) {
    return res.status(403).json({ error: 'Access denied: You cannot view this issue' });
  }

  const updates = await run(
    supabase.from('issue_updates').select('*').eq('issue_id', issueId).order('id', { ascending: false })
  );

  const [display] = await computeIssuesDisplay([flattenIssue(row, { detail: true })]);

  res.json({
    ...display,
    history: updates
  });
});

// POST /api/issues (Admin only: single or bulk issue)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
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
    const all = await run(supabase.from('branches').select('id').eq('active', 1).order('id'));
    targetBranchIds = all.map(b => b.id);
  } else if (Array.isArray(branch_ids) && branch_ids.length > 0) {
    targetBranchIds = branch_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  } else if (req.body.branch_id) {
    targetBranchIds = [parseInt(req.body.branch_id, 10)].filter(id => !isNaN(id));
  }

  if (targetBranchIds.length === 0) {
    return res.status(400).json({ error: 'Please select at least one branch' });
  }

  const initialStatus = status === 'Pending' ? 'Pending' : 'Issued';
  const itemType = await run(supabase.from('item_types').select('name').eq('id', item_type_id).maybeSingle());
  const quantity = parseInt(qty, 10) || 1;
  const slotByBranch = await resolveSlots(targetBranchIds, req.body.hoarding_size_id, slot_id);

  // One multi-row insert so all issues are created atomically
  const created = await insert('issues', targetBranchIds.map((bId) => ({
    branch_id: bId,
    item_type_id,
    slot_id: slotByBranch[bId] || null,
    campaign: campaign.trim(),
    qty: quantity,
    issue_date,
    status: initialStatus,
    note: note || '',
    attachment_url: attachment_url || null,
    created_by: req.user.id
  })), 'id, branch_id');

  const createdIds = created.map((c) => c.id);

  // Audit history
  await insert('issue_updates', created.map((c) => ({
    issue_id: c.id,
    status: initialStatus,
    comment: initialStatus === 'Issued' ? 'Item issued by Marketing' : 'Planned in calendar',
    updated_by: req.user.id,
    updated_by_name: req.user.name
  })), 'id');

  // In-app notification to each branch, plus admins for bulk issues
  const notifications = created.map((c) => ({
    target_role: 'branch',
    branch_id: c.branch_id,
    title: 'New POSM Issued',
    message: `${itemType ? itemType.name : 'Item'} for "${campaign}" (${quantity} pcs) scheduled for ${issue_date}`,
    issue_id: c.id
  }));
  if (targetBranchIds.length > 1) {
    notifications.push({
      target_role: 'admin',
      branch_id: null,
      title: 'Bulk POSM Issued',
      message: `"${campaign}" issued to ${targetBranchIds.length} branches by ${req.user.name}`,
      issue_id: createdIds[0]
    });
  }
  await insert('notifications', notifications, 'id');

  res.status(201).json({
    message: `Successfully issued item to ${createdIds.length} branch(es)`,
    count: createdIds.length,
    created_ids: createdIds
  });
});

// PUT /api/issues/:id/status (Admin change status: e.g. Pending -> Issued, or Cancelled)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const issueId = parseInt(req.params.id, 10);
  const { status, note } = req.body;

  if (!['Pending', 'Issued', 'Cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Pending, Issued, or Cancelled' });
  }

  const issue = isNaN(issueId)
    ? null
    : await run(supabase.from('issues').select('*').eq('id', issueId).maybeSingle());
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  await run(supabase.from('issues').update({ status }).eq('id', issueId));

  // Log update
  await insertOne('issue_updates', {
    issue_id: issueId,
    status,
    comment: note || `Status changed to ${status} by Admin`,
    updated_by: req.user.id,
    updated_by_name: req.user.name
  }, 'id');

  // If moved to Issued, notify branch
  if (status === 'Issued') {
    await insertOne('notifications', {
      target_role: 'branch',
      branch_id: issue.branch_id,
      title: 'Item Dispatched',
      message: `Item for "${issue.campaign}" has now been Issued.`,
      issue_id: issueId
    }, 'id');
  }

  res.json({ message: `Status updated to ${status}` });
});

async function loadIssueWithBranch(issueId) {
  if (isNaN(issueId)) return null;
  const row = await run(
    supabase.from('issues').select('*, branches!inner(name)').eq('id', issueId).maybeSingle()
  );
  if (!row) return null;
  const { branches, ...issue } = row;
  return { ...issue, branch_name: branches ? branches.name : null };
}

// POST /api/issues/:id/receive (Branch confirms receipt)
router.post('/:id/receive', authenticateToken, async (req, res) => {
  const issueId = parseInt(req.params.id, 10);
  const { received_date, comment } = req.body;
  const { role, branch_id: userBranchId, name: userName, id: userId } = req.user;

  const issue = await loadIssueWithBranch(issueId);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  // Server security enforcement
  if (role === 'branch' && issue.branch_id !== userBranchId) {
    return res.status(403).json({ error: 'Access denied: You can only confirm receipt for your own branch' });
  }

  await run(supabase.from('issues').update({
    status: 'Received',
    received_at: received_date || nowTimestamp()
  }).eq('id', issueId));

  // Audit history
  await insertOne('issue_updates', {
    issue_id: issueId,
    status: 'Received',
    comment: comment || 'Confirmed received in good order by branch.',
    updated_by: userId,
    updated_by_name: userName
  }, 'id');

  // Notify Admin
  await insertOne('notifications', {
    target_role: 'admin',
    title: 'Receipt Confirmed',
    message: `${issue.branch_name} confirmed receipt of "${issue.campaign}"`,
    issue_id: issueId
  }, 'id');

  res.json({ message: 'Receipt confirmed successfully!', issue_id: issueId, status: 'Received' });
});

// POST /api/issues/:id/problem (Branch reports problem)
router.post('/:id/problem', authenticateToken, async (req, res) => {
  const issueId = parseInt(req.params.id, 10);
  const { problem_type, comment, photo } = req.body;
  const { role, branch_id: userBranchId, name: userName, id: userId } = req.user;

  if (!comment) {
    return res.status(400).json({ error: 'Please describe the problem' });
  }

  const issue = await loadIssueWithBranch(issueId);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  // Server security enforcement
  if (role === 'branch' && issue.branch_id !== userBranchId) {
    return res.status(403).json({ error: 'Access denied: You can only report problems for your own branch' });
  }

  await run(supabase.from('issues').update({
    status: 'Problem',
    problem_at: nowTimestamp()
  }).eq('id', issueId));

  const fullComment = problem_type ? `[${problem_type}] ${comment}` : comment;

  // Audit history
  await insertOne('issue_updates', {
    issue_id: issueId,
    status: 'Problem',
    comment: fullComment,
    photo: photo || null,
    updated_by: userId,
    updated_by_name: userName
  }, 'id');

  // Notify Admin
  await insertOne('notifications', {
    target_role: 'admin',
    title: 'Problem Reported',
    message: `${issue.branch_name} reported problem for "${issue.campaign}": ${fullComment}`,
    issue_id: issueId
  }, 'id');

  res.json({ message: 'Problem reported to Marketing', issue_id: issueId, status: 'Problem' });
});

module.exports = router;
