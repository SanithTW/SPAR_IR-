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
      phone TEXT,
      address TEXT,
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

    CREATE TABLE IF NOT EXISTS private_labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      description TEXT,
      file_url TEXT NOT NULL,
      file_name TEXT,
      file_type TEXT,
      file_size INTEGER,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  try { db.exec('ALTER TABLE users ADD COLUMN phone TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN address TEXT'); } catch (e) {}
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

  // 28 Official IR Branches from Master Sheet
  const branchesData = [
    { no: 1, name: "NIRMAL SUPER", contact: "MR. NRMAL", email: "nirmalfamilysuper@gmail.com", address: "NO. 3 A, MAIN STREET, PALLEWELA", phone: "077 - 2445813", town: "Pallewela", username: "nirmalsuper" },
    { no: 2, name: "DK SUPER", contact: "MS. ANUSHI", email: "martdksuper@gmail.com", address: "A.A.N. SAMARASINGHE, 24/B/1, POLGASOWITA ROAD, MATTEGODA.", phone: "071 - 1683694", town: "Mattegoda", username: "dksuper" },
    { no: 3, name: "ANANDA SUPER", contact: "MS. NILMINI", email: "newanandatc@gmail.com", address: "NEW ANANDA TRADERS (PVT) LTD, NO 272, ANGURUWATOTA RD, WEWALA, HORANA", phone: "077 - 1594156", town: "Horana", username: "anandasuper" },
    { no: 4, name: "D AND J SUPER", contact: "MR. NILANKA", email: "orders@savemordj.com", address: "NO 01, CHAPPEL LANE, NUGEGODA.", phone: "077 - 7061691", town: "Nugegoda", username: "dandjsuper" },
    { no: 5, name: "PAHAN SUPER", contact: "MR. NALIN", email: "nalinrathnayaka524@gmail.com", address: "NO. 343 / A, KORALAIMA, GONAPOLA JUNCTION, GONAPOLA", phone: "077 - 5019420", town: "Gonapola", username: "pahansuper" },
    { no: 6, name: "D & S SUPER", contact: "MR. KRISHANTHA", email: "rangajeewanethu@gmail.com", address: "NO. 245 / A / 5, HENGODA, BANDARAGAMA", phone: "077 - 7350758", town: "Bandaragama", username: "dandssuper" },
    { no: 7, name: "WICKRAMA SUPER", contact: "MR. CHULA / ASITHA", email: "wickramaoffice@gmail.com", address: "NO. 386, KANDY ROAD, NITTABUWA", phone: "077 7271008", town: "Nittabuwa", username: "wickramasuper" },
    { no: 8, name: "RUPIKA SUPER", contact: "MR. DUMINDA", email: "rupikasuper.urapola@gmail.com", address: "295/B/5, HANWELLA ROAD, URAPOLA.", phone: "076 - 7276888", town: "Urapola", username: "rupikasuper" },
    { no: 9, name: "NIMAL SUPER / HYPERMART", contact: "MR. KASUN", email: "kasunspathirana@gmail.com", address: "NEW TOWN ROAD, EMBILIPITIYA.", phone: "077 - 7770061", town: "Embilipitiya", username: "nimalsuper" },
    { no: 10, name: "SHAKUNI SUPER", contact: "MR. SIRIPALA", email: "sakunimills@gmail.com", address: "KAHAWATHTHALA - ELA, POLGAHAWELA.", phone: "071 - 7631066", town: "Polgahawela", username: "shakunisuper" },
    { no: 11, name: "SSA SUPER", contact: "MR. ANIL", email: "anilpriyantha2004@gmail.com", address: "No. 10/01, HANDAPANGODA ROAD, PORUWADANDA JUNCTION, PORUWADANDA.", phone: "077 - 1865545", town: "Poruwadanda", username: "ssasuper" },
    { no: 12, name: "MAHARAJA - WELLAWATTA", contact: "MR. RISHI", email: "rishi@gtve.com", address: "NO. 46, HAMPTON LANE, COLOMBO 06.", phone: "076 - 6908987", town: "Wellawatta", username: "maharajawellawatta" },
    { no: 13, name: "KUMARA SUPER", contact: "MR. KUMARA", email: "kumarasuper403@gmail.com", address: "NO. 255, AGALAWATTA ROAD, MATHUGAMA.", phone: "078 3362485", town: "Mathugama", username: "kumarasuper" },
    { no: 14, name: "RAHEEM SUPER ( CONTRACT )", contact: "MR. SHAMI", email: "mohammedyesar70@gmail.com", address: "NO 201, GALBOKKA ROAD, WELIGAMA.", phone: "077 - 0776813", town: "Weligama", username: "raheemsuper" },
    { no: 15, name: "GAMAGE SUPER", contact: "MR. SUPUN", email: "madushanbgs@gmail.com", address: "AKURASSA ROAD, YAKKALAMULLA.", phone: "070 - 3744170", town: "Yakkalamulla", username: "gamagesuper" },
    { no: 16, name: "KUMARAGE SUPER ( CONTRACT )", contact: "MS. NADEESHA", email: "kumarage12@gmail.com", address: "BADDEGAMA ROAD, WANDURABA.", phone: "076 - 1487314", town: "Wanduraba", username: "kumaragesuper" },
    { no: 17, name: "MAHARAJA - KOTAHENA", contact: "MR. RISHI", email: "rishi@gtve.com", address: "NO.133, JAMPETTAH STREET, KOTAHENA, COLOMBO 13.", phone: "076 - 6908987", town: "Kotahena", username: "maharajakotahena" },
    { no: 18, name: "RANASINGHE SUPER", contact: "MR. IMALKA", email: "imachathu@gmail.com", address: "RANASINGHE SUPER, THANAMALWILA ROAD, WALAWA JUNCTION, UDAWALAWE.", phone: "077 1538747", town: "Udawalawe", username: "ranasinghesuper" },
    { no: 19, name: "CHANDRA SUPER - GODAKAWELA", contact: "MR. NALAKA", email: "nalaka1967@gmail.com", address: "NO.108, MAIN STREET, GODAKAWELA.", phone: "077 - 3536047", town: "Godakawela", username: "chandragodakawela" },
    { no: 20, name: "CHANDRA SUPER - GANEGAMA", contact: "MR. NALAKA", email: "nalaka1967@gmail.com", address: "NO. 438, GANEGAMA, PALMADULLA.", phone: "078 - 3536047", town: "Ganegama", username: "chandraganegama" },
    { no: 21, name: "GAMAGE SUPER - UDUGAMA", contact: "MR. IRUSHA", email: "irushagangabadage@gmail.com", address: "GAMAGE FOOD CITY, BAR JUNCTION, UDUGAMA, GALLE", phone: "077 - 3249166", town: "Udugama", username: "gamageudugama" },
    { no: 22, name: "NEBULA SUPER - ALUTHGAMA", contact: "MR. NISHAN", email: "nebulasupermarkets@gmail.com", address: "NEBULA SUPER MARKET, NO 88, WALIPANNA ROAD, ALUTHGAM.", phone: "077 - 7899710", town: "Aluthgama", username: "nebulasuper" },
    { no: 23, name: "PTI SUPER - KESBAWA", contact: "MR. CHANAKA", email: "omegatex90@gmail.com", address: "NO. 67/10, BANDARAGAMA ROAD, MAKANDANA, KESBAWA", phone: "077 - 3055327", town: "Kesbawa", username: "ptisuper" },
    { no: 24, name: "DAYARATHNA SUPER - POLGASOVITA", contact: "MR. PRADEEP", email: "newdayarathnastprima@gmail.com", address: "NO. 72, HALPITA, POLGASOVITA.", phone: "076 - 8518488", town: "Polgasovita", username: "dayarathnasuper" },
    { no: 25, name: "CHETHANA SUPER - ELPITYA", contact: "MR. VISHNA", email: "wish.senevirathne2@gmail.com", address: "CHETHANAKETAPOLA, GANEGODA, ELPITIYA.", phone: "077 - 8317278", town: "Elpitiya", username: "chethanasuper" },
    { no: 26, name: "GAMAGE SUPER - NAGODA", contact: "MS. SHANI", email: "madushanisasara@gmail.com", address: "NAGODA", phone: "074 - 2765025", town: "Nagoda", username: "gamagenagoda" },
    { no: 27, name: "CHANDRA SUPER - PELMADULLA", contact: "MR. NALAKA", email: "nalaka1967@gmail.com", address: "NO. 40, RAKWANA ROAD, PELMADULLA.", phone: "078 - 3536047", town: "Pelmadulla", username: "chandrapelmadulla" },
    { no: 28, name: "CHANDRA SUPER - PILIYANDALA", contact: "MR. NALAKA", email: "nalaka1967@gmail.com", address: "89 A, MADAPATH ROAD, KALAMUNNA, PILIYANDALA.", phone: "078 - 3536047", town: "Piliyandala", username: "chandrapiliyandala" }
  ];

  const insertBranch = db.prepare(`
    INSERT INTO branches (id, name, town, address, contact, phone, active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  const branchIds = {};
  branchesData.forEach((b) => {
    insertBranch.run(b.no, b.name, b.town, b.address, b.contact, b.phone);
    branchIds[b.name] = b.no;
  });

  // Users
  const passwordHash = bcrypt.hashSync('spar123', 8);

  const insertUser = db.prepare(`
    INSERT INTO users (name, username, email, phone, address, password_hash, role, branch_id, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  // Admin
  const adminId = insertUser.run('Sanith Perera', 'admin', 'sanith@spar.lk', null, null, passwordHash, 'admin', null).lastInsertRowid;
  // Marketing User
  insertUser.run('Nimal Perera (Marketing)', 'user', 'nimal@spar.lk', null, null, passwordHash, 'user', null);

  // Branch Users for all 28 IR branches
  branchesData.forEach((b) => {
    const phonePassword = b.phone.replace(/[^0-9]/g, '');
    const phonePasswordHash = bcrypt.hashSync(phonePassword, 8);
    insertUser.run(
      `${b.name} - ${b.contact}`,
      b.username,
      b.email,
      b.phone,
      b.address,
      phonePasswordHash,
      'branch',
      b.no
    );
  });

  console.log('Seeding completed successfully!');
}

initSchema();
seedData();

module.exports = db;
