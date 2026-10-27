const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'posm.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high reliability
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      town TEXT NOT NULL,
      address TEXT NOT NULL,
      contact TEXT NOT NULL,
      phone TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hoarding_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'ft',
      orientation TEXT NOT NULL DEFAULT 'Horizontal',
      sides INTEGER NOT NULL DEFAULT 1,
      qty INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS item_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS hoarding_sizes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      width REAL NOT NULL,
      height REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'ft',
      orientation TEXT NOT NULL DEFAULT 'Horizontal',
      sides INTEGER NOT NULL DEFAULT 1,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user', 'branch')),
      branch_id INTEGER,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      item_type_id INTEGER NOT NULL,
      slot_id INTEGER,
      campaign TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1,
      issue_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Issued', 'Received', 'Problem', 'Cancelled')),
      note TEXT,
      attachment_url TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      received_at DATETIME,
      problem_at DATETIME,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
      FOREIGN KEY (item_type_id) REFERENCES item_types(id) ON DELETE RESTRICT,
      FOREIGN KEY (slot_id) REFERENCES hoarding_slots(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS issue_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      comment TEXT,
      photo TEXT,
      updated_by INTEGER,
      updated_by_name TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_role TEXT, -- 'admin', 'user', 'branch', or NULL
      user_id INTEGER,
      branch_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      issue_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
    );
  `);
}

function seedData() {
  const branchCount = db.prepare('SELECT COUNT(*) as count FROM branches').get().count;
  if (branchCount > 0) return; // already seeded

  console.log('Seeding initial data...');

  // Settings
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('overdue_day_of_month', '2');
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('company_name', 'SPAR SaveMor Sri Lanka');

  // Item Types
  const insertItemType = db.prepare('INSERT INTO item_types (name, description, active) VALUES (?, ?, 1)');
  insertItemType.run('Tabloid', 'Printed monthly promotional tabloid/newspaper');
  insertItemType.run('Poster', 'In-store & storefront promotional posters');
  insertItemType.run('Hoarding', 'Outdoor and rooftop billboard hoarding displays');
  insertItemType.run('Banner', 'Fabric or vinyl event & promotional banner');
  insertItemType.run('Wobbler', 'Shelf-edge promotional wobbler displays');

  // Hoarding Sizes Master
  const insertSize = db.prepare('INSERT INTO hoarding_sizes (width, height, unit, orientation, sides, active) VALUES (?, ?, ?, ?, ?, 1)');
  insertSize.run(12, 8, 'ft', 'Horizontal', 1);
  insertSize.run(8, 4, 'ft', 'Vertical', 1);
  insertSize.run(10, 5, 'ft', 'Horizontal', 2);
  insertSize.run(6, 4, 'ft', 'Vertical', 1);
  insertSize.run(20, 10, 'ft', 'Horizontal', 1);
  insertSize.run(18, 8, 'ft', 'Horizontal', 1);

  // 22 Branches from SAVEMOR sheet
  const branchesData = [
    { name: 'Chandra Super', town: 'Palmadulla', address: 'Main Street, Palmadulla', contact: 'Nimal Perera', phone: '077 123 4567' },
    { name: 'SaveMor City', town: 'Colombo', address: 'Union Place, Colombo 02', contact: 'Kasun Fernando', phone: '077 234 5678' },
    { name: 'Galle Branch', town: 'Galle', address: 'Wakwella Road, Galle', contact: 'Saman Kumara', phone: '077 345 6789' },
    { name: 'Kandy Branch', town: 'Kandy', address: 'Peradeniya Road, Kandy', contact: 'Ruwan Silva', phone: '077 456 7890' },
    { name: 'Matara Branch', town: 'Matara', address: 'Anagarika Dharmapala Mw, Matara', contact: 'Isuru Perera', phone: '077 567 8901' },
    { name: 'Kurunegala Branch', town: 'Kurunegala', address: 'Colombo Road, Kurunegala', contact: 'Dinesh Jayasuriya', phone: '077 678 9012' },
    { name: 'Negombo Branch', town: 'Negombo', address: 'Greens Road, Negombo', contact: 'Chamara De Silva', phone: '077 789 0123' },
    { name: 'Gampaha Super', town: 'Gampaha', address: 'Yakkala Road, Gampaha', contact: 'Pradeep Alwis', phone: '077 890 1234' },
    { name: 'Kalutara Branch', town: 'Kalutara', address: 'Galle Road, Kalutara North', contact: 'Lalith Mendis', phone: '077 901 2345' },
    { name: 'Ratnapura SaveMor', town: 'Ratnapura', address: 'Hospital Road, Ratnapura', contact: 'Ajith Bandara', phone: '071 123 4567' },
    { name: 'Anuradhapura Branch', town: 'Anuradhapura', address: 'Maithripala Senanayake Mw', contact: 'Sunil Herath', phone: '071 234 5678' },
    { name: 'Badulla IR', town: 'Badulla', address: 'Lower King Street, Badulla', contact: 'Damith Wickrama', phone: '071 345 6789' },
    { name: 'Kegalle Store', town: 'Kegalle', address: 'Kandy Road, Kegalle', contact: 'Janaka Senanayake', phone: '071 456 7890' },
    { name: 'Panadura Branch', town: 'Panadura', address: 'Arthur V Dias Mw, Panadura', contact: 'Rohan Fonseka', phone: '071 567 8901' },
    { name: 'Wattala Super', town: 'Wattala', address: 'Negombo Road, Wattala', contact: 'Ashan Rodrigo', phone: '071 678 9012' },
    { name: 'Moratuwa SaveMor', town: 'Moratuwa', address: 'Old Galle Road, Moratuwa', contact: 'Priyantha Cooray', phone: '071 789 0123' },
    { name: 'Battaramulla Store', town: 'Battaramulla', address: 'Main Street, Battaramulla', contact: 'Malik Gunaratne', phone: '071 890 1234' },
    { name: 'Maharagama IR', town: 'Maharagama', address: 'High Level Road, Maharagama', contact: 'Kavinda Abeysekara', phone: '071 901 2345' },
    { name: 'Kiribathgoda (Branch A)', town: 'Kiribathgoda', address: 'Kandy Road No 19/A, Kiribathgoda', contact: 'Nuwan Gamage', phone: '072 123 4567' },
    { name: 'Kiribathgoda (Branch B)', town: 'Kiribathgoda', address: 'Kandy Road No 19/B, Kiribathgoda', contact: 'Suranga Wijesinghe', phone: '072 234 5678' },
    { name: 'Nugegoda Super', town: 'Nugegoda', address: 'Stanley Thilakarathne Mw', contact: 'Tharindu Rathnayake', phone: '072 345 6789' },
    { name: 'Bandarawela IR', town: 'Bandarawela', address: 'Badulla Road, Bandarawela', contact: 'Chathura Ranasinghe', phone: '072 456 7890' }
  ];

  const insertBranch = db.prepare(`
    INSERT INTO branches (name, town, address, contact, phone, active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const insertSlot = db.prepare(`
    INSERT INTO hoarding_slots (branch_id, width, height, unit, orientation, sides, qty, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const branchIds = {};
  branchesData.forEach((b, index) => {
    const info = insertBranch.run(b.name, b.town, b.address, b.contact, b.phone);
    const branchId = info.lastInsertRowid;
    branchIds[b.name] = branchId;

    // Attach hoarding slots as documented in proposal
    if (b.name === 'Chandra Super') {
      // 12' x 8' horizontal hoarding plus 2 nos of 8' x 4' vertical
      insertSlot.run(branchId, 12, 8, 'ft', 'Horizontal', 1, 1, 'Front entrance main hoarding');
      insertSlot.run(branchId, 8, 4, 'ft', 'Vertical', 1, 2, 'Roadside vertical pillars (2 nos)');
    } else if (index % 3 === 0) {
      insertSlot.run(branchId, 20, 10, 'ft', 'Horizontal', 1, 1, 'Roof-top main billboard');
      insertSlot.run(branchId, 10, 5, 'ft', 'Horizontal', 2, 1, 'Double-sided parking entrance display');
    } else if (index % 2 === 0) {
      insertSlot.run(branchId, 18, 8, 'ft', 'Horizontal', 1, 1, 'Facade banner slot');
    } else {
      insertSlot.run(branchId, 8, 4, 'ft', 'Vertical', 1, 1, 'Side gate signpost');
    }
  });

  // Users
  const passwordHash = bcrypt.hashSync('spar123', 8);

  const insertUser = db.prepare(`
    INSERT INTO users (name, username, email, password_hash, role, branch_id, active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  // Admin
  const adminId = insertUser.run('Sanith Perera', 'admin', 'sanith@spar.lk', passwordHash, 'admin', null).lastInsertRowid;
  // Marketing User
  insertUser.run('Nimal Perera (Marketing)', 'user', 'nimal@spar.lk', passwordHash, 'user', null);

  // Branch Users for all 22 branches
  branchesData.forEach((b) => {
    const username = b.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const bId = branchIds[b.name];
    insertUser.run(`${b.name} Rep`, username, `${username}@savemor.lk`, passwordHash, 'branch', bId);
  });

  // Issues and History (Seeding realistic campaign items across October 2026)
  const insertIssue = db.prepare(`
    INSERT INTO issues (branch_id, item_type_id, slot_id, campaign, qty, issue_date, status, note, created_by, received_at, problem_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertUpdate = db.prepare(`
    INSERT INTO issue_updates (issue_id, status, comment, photo, updated_by, updated_by_name, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNotif = db.prepare(`
    INSERT INTO notifications (target_role, user_id, branch_id, title, message, issue_id, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Item Types: 1=Tabloid, 2=Poster, 3=Hoarding, 4=Banner, 5=Wobbler
  // 1. Chandra Super - Tabloid (Received)
  const iss1 = insertIssue.run(branchIds['Chandra Super'], 1, null, 'Monthly Tabloid 500 pcs', 500, '2026-10-01', 'Received', 'October monthly promotional tabloid pack', adminId, '2026-10-02 14:30:00', null).lastInsertRowid;
  insertUpdate.run(iss1, 'Issued', 'Dispatched via Courier #SP-9921', null, adminId, 'Sanith Perera', '2026-10-01 09:00:00');
  insertUpdate.run(iss1, 'Received', 'All 500 pcs received in good condition at cashier desk.', null, null, 'Chandra Super Rep', '2026-10-02 14:30:00');

  // 2. Chandra Super - Hoarding (Problem)
  const iss2 = insertIssue.run(branchIds['Chandra Super'], 3, 1, 'Autumn Promo Hoarding', 1, '2026-10-05', 'Problem', '12x8 ft hoarding print for Autumn campaign', adminId, null, '2026-10-07 11:15:00').lastInsertRowid;
  insertUpdate.run(iss2, 'Issued', 'Delivered by printing vendor direct to store', null, adminId, 'Sanith Perera', '2026-10-05 10:00:00');
  insertUpdate.run(iss2, 'Problem', 'Damaged vinyl in transit - cut mark on the bottom right corner.', null, null, 'Chandra Super Rep', '2026-10-07 11:15:00');

  // 3. Chandra Super - Poster (Pending)
  insertIssue.run(branchIds['Chandra Super'], 2, null, 'Festival Poster Campaign', 10, '2026-10-14', 'Pending', 'A3 Festival posters - scheduled for delivery', adminId, null, null);

  // 4. Chandra Super - Poster (Issued)
  const iss4 = insertIssue.run(branchIds['Chandra Super'], 2, null, 'October Campaign Posters', 4, '2026-10-26', 'Issued', 'Seasonal offer store display posters', adminId, null, null).lastInsertRowid;
  insertUpdate.run(iss4, 'Issued', 'Dispatched with logistics team morning dispatch', null, adminId, 'Sanith Perera', '2026-10-26 08:30:00');

  // 5. SaveMor City - Hoarding (Problem)
  const iss5 = insertIssue.run(branchIds['SaveMor City'], 3, null, 'Mega Sale Hoarding', 1, '2026-10-08', 'Problem', 'Main front road hoarding print', adminId, null, '2026-10-10 16:00:00').lastInsertRowid;
  insertUpdate.run(iss5, 'Issued', 'Dispatched with installation team', null, adminId, 'Sanith Perera', '2026-10-08 09:00:00');
  insertUpdate.run(iss5, 'Problem', 'Wrong size delivered - received 16x8 instead of 20x10 ft.', null, null, 'SaveMor City Rep', '2026-10-10 16:00:00');

  // 6. Overdue Item: Issued in previous month (e.g. 2026-09-24) to Galle Branch, still Issued (not confirmed by 2nd of Oct -> Red/Overdue!)
  const iss6 = insertIssue.run(branchIds['Galle Branch'], 2, null, 'Bakery Month Posters', 6, '2026-09-24', 'Issued', 'Bakery special promotional boards', adminId, null, null).lastInsertRowid;
  insertUpdate.run(iss6, 'Issued', 'Sent via postal dispatch parcel', null, adminId, 'Sanith Perera', '2026-09-24 11:00:00');

  // 7. Seed items for several other branches across October to populate the calendar nicely!
  const calendarSeeds = [
    { branch: 'Kandy Branch', type: 1, camp: 'Monthly Tabloid 500 pcs', qty: 500, date: '2026-10-01', status: 'Received' },
    { branch: 'Matara Branch', type: 2, camp: 'Fresh Harvest Posters', qty: 8, date: '2026-10-03', status: 'Received' },
    { branch: 'Kurunegala Branch', type: 4, camp: 'Weekend Special Banner', qty: 2, date: '2026-10-09', status: 'Issued' },
    { branch: 'Negombo Branch', type: 1, camp: 'Monthly Tabloid 500 pcs', qty: 500, date: '2026-10-11', status: 'Received' },
    { branch: 'Gampaha Super', type: 2, camp: 'Dairy Promo Posters', qty: 6, date: '2026-10-14', status: 'Issued' },
    { branch: 'Kalutara Branch', type: 3, camp: 'Storefront Hoarding', qty: 1, date: '2026-10-16', status: 'Received' },
    { branch: 'Ratnapura SaveMor', type: 5, camp: 'Household Wobblers', qty: 50, date: '2026-10-18', status: 'Pending' },
    { branch: 'Wattala Super', type: 1, camp: 'Mid-Month Savings Tabloid', qty: 400, date: '2026-10-21', status: 'Received' },
    { branch: 'Panadura Branch', type: 4, camp: 'Sparks Rewards Banner', qty: 2, date: '2026-10-23', status: 'Issued' },
    { branch: 'Nugegoda Super', type: 2, camp: 'Organic Produce Posters', qty: 12, date: '2026-10-26', status: 'Received' },
    { branch: 'Kiribathgoda (Branch A)', type: 1, camp: 'Halloween Festival Tabloid', qty: 450, date: '2026-10-28', status: 'Pending' },
    { branch: 'Kiribathgoda (Branch B)', type: 1, camp: 'Halloween Festival Tabloid', qty: 450, date: '2026-10-28', status: 'Pending' }
  ];

  calendarSeeds.forEach(item => {
    const bId = branchIds[item.branch] || 1;
    const recAt = item.status === 'Received' ? `${item.date} 15:00:00` : null;
    const newId = insertIssue.run(bId, item.type, null, item.camp, item.qty, item.date, item.status, `Official POSM release for ${item.camp}`, adminId, recAt, null).lastInsertRowid;
    insertUpdate.run(newId, item.status, `Status marked as ${item.status}`, null, adminId, 'Sanith Perera', `${item.date} 09:00:00`);
  });

  // Seed Notifications
  insertNotif.run('admin', null, null, 'New Item Issued', 'Tabloid - 22 branches issued for October Campaign', iss4, 0, '2026-10-26 09:30:00');
  insertNotif.run('admin', null, null, 'Problem reported', 'SaveMor City reported Problem: Hoarding - Wrong size delivered', iss5, 0, '2026-10-10 16:05:00');
  insertNotif.run('admin', null, null, 'Overdue Items Flagged', '6 items from September not confirmed by 2nd Oct', iss6, 0, '2026-10-02 08:00:00');
  insertNotif.run('branch', null, branchIds['Chandra Super'], 'New POSM Issued', 'October Campaign Posters (4 pcs) dispatched to your branch.', iss4, 0, '2026-10-26 09:35:00');

  console.log('Seeding completed successfully!');
}

initSchema();
seedData();

module.exports = db;
