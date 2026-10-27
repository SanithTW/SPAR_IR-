const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

// GET /api/branches
router.get('/', authenticateToken, (req, res) => {
  const { role, branch_id } = req.user;

  // If role is branch, only allow viewing own branch!
  if (role === 'branch') {
    const branch = db.prepare(`
      SELECT b.*,
        (SELECT COUNT(*) FROM hoarding_slots hs WHERE hs.branch_id = b.id) as slot_count,
        (SELECT COUNT(*) FROM issues i WHERE i.branch_id = b.id) as total_issues
      FROM branches b
      WHERE b.id = ?
    `).get(branch_id);

    return res.json(branch ? [branch] : []);
  }

  // Admin and User: see all branches
  const branches = db.prepare(`
    SELECT b.*,
      (SELECT COUNT(*) FROM hoarding_slots hs WHERE hs.branch_id = b.id) as slot_count,
      (SELECT COUNT(*) FROM issues i WHERE i.branch_id = b.id) as total_issues,
      (SELECT COUNT(*) FROM issues i WHERE i.branch_id = b.id AND i.status = 'Received') as received_issues,
      (SELECT COUNT(*) FROM issues i WHERE i.branch_id = b.id AND i.status = 'Problem') as problem_issues
    FROM branches b
    ORDER BY b.id ASC
  `).all();

  res.json(branches);
});

// GET /api/branches/:id
router.get('/:id', authenticateToken, (req, res) => {
  const branchId = parseInt(req.params.id, 10);
  const { role, branch_id } = req.user;

  // Server security enforcement: branch can never view another branch's data
  if (role === 'branch' && branchId !== branch_id) {
    return res.status(403).json({ error: 'Access denied: You can only view your own branch' });
  }

  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  const slots = db.prepare('SELECT * FROM hoarding_slots WHERE branch_id = ? ORDER BY id ASC').all(branchId);

  res.json({
    ...branch,
    slots
  });
});

// POST /api/branches (Admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { name, town, address, contact, phone } = req.body;

  if (!name || !town) {
    return res.status(400).json({ error: 'Name and town are required' });
  }

  const stmt = db.prepare(`
    INSERT INTO branches (name, town, address, contact, phone, active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const info = stmt.run(name.trim(), town.trim(), address || '', contact || '', phone || '');
  const newBranch = db.prepare('SELECT * FROM branches WHERE id = ?').get(info.lastInsertRowid);

  res.status(201).json(newBranch);
});

// PUT /api/branches/:id (Admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const branchId = parseInt(req.params.id, 10);
  const { name, town, address, contact, phone, active } = req.body;

  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  db.prepare(`
    UPDATE branches
    SET name = COALESCE(?, name),
        town = COALESCE(?, town),
        address = COALESCE(?, address),
        contact = COALESCE(?, contact),
        phone = COALESCE(?, phone),
        active = COALESCE(?, active)
    WHERE id = ?
  `).run(
    name !== undefined ? name.trim() : null,
    town !== undefined ? town.trim() : null,
    address !== undefined ? address : null,
    contact !== undefined ? contact : null,
    phone !== undefined ? phone : null,
    active !== undefined ? (active ? 1 : 0) : null,
    branchId
  );

  const updated = db.prepare('SELECT * FROM branches WHERE id = ?').get(branchId);
  res.json(updated);
});

// POST /api/branches/:id/slots (Admin only)
router.post('/:id/slots', authenticateToken, requireAdmin, (req, res) => {
  const branchId = parseInt(req.params.id, 10);
  const { width, height, unit, orientation, sides, qty, notes } = req.body;

  if (!width || !height) {
    return res.status(400).json({ error: 'Width and height are required' });
  }

  const stmt = db.prepare(`
    INSERT INTO hoarding_slots (branch_id, width, height, unit, orientation, sides, qty, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    branchId,
    parseFloat(width),
    parseFloat(height),
    unit || 'ft',
    orientation || 'Horizontal',
    parseInt(sides, 10) || 1,
    parseInt(qty, 10) || 1,
    notes || ''
  );

  const newSlot = db.prepare('SELECT * FROM hoarding_slots WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(newSlot);
});

// DELETE /api/branches/:id/slots/:slotId (Admin only)
router.delete('/:id/slots/:slotId', authenticateToken, requireAdmin, (req, res) => {
  const branchId = parseInt(req.params.id, 10);
  const slotId = parseInt(req.params.slotId, 10);

  db.prepare('DELETE FROM hoarding_slots WHERE id = ? AND branch_id = ?').run(slotId, branchId);
  res.json({ message: 'Slot deleted successfully' });
});

module.exports = router;
