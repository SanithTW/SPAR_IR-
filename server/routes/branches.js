const express = require('express');
const router = express.Router();
const { supabase, run, fetchAll, insertOne } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

function countBy(rows, key) {
  const counts = {};
  for (const r of rows) counts[r[key]] = (counts[r[key]] || 0) + 1;
  return counts;
}

// GET /api/branches
router.get('/', authenticateToken, async (req, res) => {
  const { role, branch_id } = req.user;

  // If role is branch, only allow viewing own branch!
  if (role === 'branch') {
    const branch = await run(supabase.from('branches').select('*').eq('id', branch_id).maybeSingle());
    if (!branch) return res.json([]);

    const [slots, issues] = await Promise.all([
      run(supabase.from('hoarding_slots').select('id', { count: 'exact', head: false }).eq('branch_id', branch_id)),
      fetchAll(() => supabase.from('issues').select('id').eq('branch_id', branch_id).order('id'))
    ]);

    return res.json([{ ...branch, slot_count: slots.length, total_issues: issues.length }]);
  }

  // Admin and User: see all branches
  const [branches, slots, issues] = await Promise.all([
    run(supabase.from('branches').select('*').order('id', { ascending: true })),
    fetchAll(() => supabase.from('hoarding_slots').select('branch_id').order('id')),
    fetchAll(() => supabase.from('issues').select('branch_id, status').order('id'))
  ]);

  const slotCounts = countBy(slots, 'branch_id');
  const issueCounts = countBy(issues, 'branch_id');
  const receivedCounts = countBy(issues.filter((i) => i.status === 'Received'), 'branch_id');
  const problemCounts = countBy(issues.filter((i) => i.status === 'Problem'), 'branch_id');

  res.json(branches.map((b) => ({
    ...b,
    slot_count: slotCounts[b.id] || 0,
    total_issues: issueCounts[b.id] || 0,
    received_issues: receivedCounts[b.id] || 0,
    problem_issues: problemCounts[b.id] || 0
  })));
});

// GET /api/branches/:id
router.get('/:id', authenticateToken, async (req, res) => {
  const branchId = parseInt(req.params.id, 10);
  const { role, branch_id } = req.user;

  // Server security enforcement: branch can never view another branch's data
  if (role === 'branch' && branchId !== branch_id) {
    return res.status(403).json({ error: 'Access denied: You can only view your own branch' });
  }
  if (isNaN(branchId)) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  const branch = await run(supabase.from('branches').select('*').eq('id', branchId).maybeSingle());
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  const slots = await run(
    supabase.from('hoarding_slots').select('*').eq('branch_id', branchId).order('id', { ascending: true })
  );

  res.json({
    ...branch,
    slots
  });
});

// POST /api/branches (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, town, address, contact, phone } = req.body;

  if (!name || !town) {
    return res.status(400).json({ error: 'Name and town are required' });
  }

  const newBranch = await insertOne('branches', {
    name: name.trim(),
    town: town.trim(),
    address: address || '',
    contact: contact || '',
    phone: phone || '',
    active: 1
  });

  res.status(201).json(newBranch);
});

// PUT /api/branches/:id (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const branchId = parseInt(req.params.id, 10);
  const { name, town, address, contact, phone, active } = req.body;

  const branch = isNaN(branchId)
    ? null
    : await run(supabase.from('branches').select('id').eq('id', branchId).maybeSingle());
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  const patch = {};
  if (name !== undefined && name !== null) patch.name = name.trim();
  if (town !== undefined && town !== null) patch.town = town.trim();
  if (address !== undefined && address !== null) patch.address = address;
  if (contact !== undefined && contact !== null) patch.contact = contact;
  if (phone !== undefined && phone !== null) patch.phone = phone;
  if (active !== undefined && active !== null) patch.active = active ? 1 : 0;

  const query = Object.keys(patch).length
    ? supabase.from('branches').update(patch).eq('id', branchId).select('*').single()
    : supabase.from('branches').select('*').eq('id', branchId).single();

  res.json(await run(query));
});

// POST /api/branches/:id/slots (Admin only)
router.post('/:id/slots', authenticateToken, requireAdmin, async (req, res) => {
  const branchId = parseInt(req.params.id, 10);
  const { width, height, unit, orientation, sides, qty, notes } = req.body;

  if (!width || !height) {
    return res.status(400).json({ error: 'Width and height are required' });
  }

  const newSlot = await insertOne('hoarding_slots', {
    branch_id: branchId,
    width: parseFloat(width),
    height: parseFloat(height),
    unit: unit || 'ft',
    orientation: orientation || 'Horizontal',
    sides: parseInt(sides, 10) || 1,
    qty: parseInt(qty, 10) || 1,
    notes: notes || ''
  });

  res.status(201).json(newSlot);
});

// DELETE /api/branches/:id/slots/:slotId (Admin only)
router.delete('/:id/slots/:slotId', authenticateToken, requireAdmin, async (req, res) => {
  const branchId = parseInt(req.params.id, 10);
  const slotId = parseInt(req.params.slotId, 10);

  await run(supabase.from('hoarding_slots').delete().eq('id', slotId).eq('branch_id', branchId));
  res.json({ message: 'Slot deleted successfully' });
});

module.exports = router;
