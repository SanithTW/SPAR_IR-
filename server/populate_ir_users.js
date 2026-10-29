const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

// Ensure columns exist in SQLite
try { db.exec('ALTER TABLE users ADD COLUMN phone TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE users ADD COLUMN address TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE branches ADD COLUMN opening_date TEXT'); } catch (e) {}

const irData = [
  {
    no: 1,
    name: "NIRMAL SUPER",
    contact: "MR. NRMAL",
    email: "nirmalfamilysuper@gmail.com",
    address: "NO. 3 A, MAIN STREET, PALLEWELA",
    opening_date: "31-Jul-24",
    phone: "077 - 2445813",
    town: "Pallewela",
    username: "nirmalsuper"
  },
  {
    no: 2,
    name: "DK SUPER",
    contact: "MS. ANUSHI",
    email: "martdksuper@gmail.com",
    address: "A.A.N. SAMARASINGHE, 24/B/1, POLGASOWITA ROAD, MATTEGODA.",
    opening_date: "16-Dec-24",
    phone: "071 - 1683694",
    town: "Mattegoda",
    username: "dksuper"
  },
  {
    no: 3,
    name: "ANANDA SUPER",
    contact: "MS. NILMINI",
    email: "newanandatc@gmail.com",
    address: "NEW ANANDA TRADERS (PVT) LTD, NO 272, ANGURUWATOTA RD, WEWALA, HORANA",
    opening_date: "9-Jan-25",
    phone: "077 - 1594156",
    town: "Horana",
    username: "anandasuper"
  },
  {
    no: 4,
    name: "D AND J SUPER",
    contact: "MR. NILANKA",
    email: "orders@savemordj.com",
    address: "NO 01, CHAPPEL LANE, NUGEGODA.",
    opening_date: "30-Jan-25",
    phone: "077 - 7061691",
    town: "Nugegoda",
    username: "dandjsuper"
  },
  {
    no: 5,
    name: "PAHAN SUPER",
    contact: "MR. NALIN",
    email: "nalinrathnayaka524@gmail.com",
    address: "NO. 343 / A, KORALAIMA, GONAPOLA JUNCTION, GONAPOLA",
    opening_date: "31-Jan-25",
    phone: "077 - 5019420",
    town: "Gonapola",
    username: "pahansuper"
  },
  {
    no: 6,
    name: "D & S SUPER",
    contact: "MR. KRISHANTHA",
    email: "rangajeewanethu@gmail.com",
    address: "NO. 245 / A / 5, HENGODA, BANDARAGAMA",
    opening_date: "12-Mar-25",
    phone: "077 - 7350758",
    town: "Bandaragama",
    username: "dandssuper"
  },
  {
    no: 7,
    name: "WICKRAMA SUPER",
    contact: "MR. CHULA / ASITHA",
    email: "wickramaoffice@gmail.com",
    address: "NO. 386, KANDY ROAD, NITTABUWA",
    opening_date: "21-Mar-25",
    phone: "077 7271008",
    town: "Nittabuwa",
    username: "wickramasuper"
  },
  {
    no: 8,
    name: "RUPIKA SUPER",
    contact: "MR. DUMINDA",
    email: "rupikasuper.urapola@gmail.com",
    address: "295/B/5, HANWELLA ROAD, URAPOLA.",
    opening_date: "31-Mar-25",
    phone: "076 - 7276888",
    town: "Urapola",
    username: "rupikasuper"
  },
  {
    no: 9,
    name: "NIMAL SUPER / HYPERMART",
    contact: "MR. KASUN",
    email: "kasunspathirana@gmail.com",
    address: "NEW TOWN ROAD, EMBILIPITIYA.",
    opening_date: "10-Apr-25",
    phone: "077 - 7770061",
    town: "Embilipitiya",
    username: "nimalsuper"
  },
  {
    no: 10,
    name: "SHAKUNI SUPER",
    contact: "MR. SIRIPALA",
    email: "sakunimills@gmail.com",
    address: "KAHAWATHTHALA - ELA, POLGAHAWELA.",
    opening_date: "28-Apr-25",
    phone: "071 - 7631066",
    town: "Polgahawela",
    username: "shakunisuper"
  },
  {
    no: 11,
    name: "SSA SUPER",
    contact: "MR. ANIL",
    email: "anilpriyantha2004@gmail.com",
    address: "No. 10/01, HANDAPANGODA ROAD, PORUWADANDA JUNCTION, PORUWADANDA.",
    opening_date: "9-Sep-25",
    phone: "077 - 1865545",
    town: "Poruwadanda",
    username: "ssasuper"
  },
  {
    no: 12,
    name: "MAHARAJA - WELLAWATTA",
    contact: "MR. RISHI",
    email: "rishi@gtve.com",
    address: "NO. 46, HAMPTON LANE, COLOMBO 06.",
    opening_date: "12-Sep-25",
    phone: "076 - 6908987",
    town: "Wellawatta",
    username: "maharajawellawatta"
  },
  {
    no: 13,
    name: "KUMARA SUPER",
    contact: "MR. KUMARA",
    email: "kumarasuper403@gmail.com",
    address: "NO. 255, AGALAWATTA ROAD, MATHUGAMA.",
    opening_date: "12-May-26",
    phone: "078 3362485",
    town: "Mathugama",
    username: "kumarasuper"
  },
  {
    no: 14,
    name: "RAHEEM SUPER ( CONTRACT )",
    contact: "MR. SHAMI",
    email: "mohammedyesar70@gmail.com",
    address: "NO 201, GALBOKKA ROAD, WELIGAMA.",
    opening_date: "19-May-26",
    phone: "077 - 0776813",
    town: "Weligama",
    username: "raheemsuper"
  },
  {
    no: 15,
    name: "GAMAGE SUPER",
    contact: "MR. SUPUN",
    email: "madushanbgs@gmail.com",
    address: "AKURASSA ROAD, YAKKALAMULLA.",
    opening_date: "21-May-26",
    phone: "070 - 3744170",
    town: "Yakkalamulla",
    username: "gamagesuper"
  },
  {
    no: 16,
    name: "KUMARAGE SUPER ( CONTRACT )",
    contact: "MS. NADEESHA",
    email: "kumarage12@gmail.com",
    address: "BADDEGAMA ROAD, WANDURABA.",
    opening_date: "27-May-26",
    phone: "076 - 1487314",
    town: "Wanduraba",
    username: "kumaragesuper"
  },
  {
    no: 17,
    name: "MAHARAJA - KOTAHENA",
    contact: "MR. RISHI",
    email: "rishi@gtve.com",
    address: "NO.133, JAMPETTAH STREET, KOTAHENA, COLOMBO 13.",
    opening_date: "1-Jun-26",
    phone: "076 - 6908987",
    town: "Kotahena",
    username: "maharajakotahena"
  },
  {
    no: 18,
    name: "RANASINGHE SUPER",
    contact: "MR. IMALKA",
    email: "imachathu@gmail.com",
    address: "RANASINGHE SUPER, THANAMALWILA ROAD, WALAWA JUNCTION, UDAWALAWE.",
    opening_date: "23-Jun-26",
    phone: "077 1538747",
    town: "Udawalawe",
    username: "ranasinghesuper"
  },
  {
    no: 19,
    name: "CHANDRA SUPER - GODAKAWELA",
    contact: "MR. NALAKA",
    email: "nalaka1967@gmail.com",
    address: "NO.108, MAIN STREET, GODAKAWELA.",
    opening_date: "23-Jun-26",
    phone: "077 - 3536047",
    town: "Godakawela",
    username: "chandragodakawela"
  },
  {
    no: 20,
    name: "CHANDRA SUPER - GANEGAMA",
    contact: "MR. NALAKA",
    email: "nalaka1967@gmail.com",
    address: "NO. 438, GANEGAMA, PALMADULLA.",
    opening_date: "23-Jun-26",
    phone: "078 - 3536047",
    town: "Ganegama",
    username: "chandraganegama"
  },
  {
    no: 21,
    name: "GAMAGE SUPER - UDUGAMA",
    contact: "MR. IRUSHA",
    email: "irushagangabadage@gmail.com",
    address: "GAMAGE FOOD CITY, BAR JUNCTION, UDUGAMA, GALLE",
    opening_date: "15-Jul-26",
    phone: "077 - 3249166",
    town: "Udugama",
    username: "gamageudugama"
  },
  {
    no: 22,
    name: "NEBULA SUPER - ALUTHGAMA",
    contact: "MR. NISHAN",
    email: "nebulasupermarkets@gmail.com",
    address: "NEBULA SUPER MARKET, NO 88, WALIPANNA ROAD, ALUTHGAM.",
    opening_date: "30-Jul-26",
    phone: "077 - 7899710",
    town: "Aluthgama",
    username: "nebulasuper"
  },
  {
    no: 23,
    name: "PTI SUPER - KESBAWA",
    contact: "MR. CHANAKA",
    email: "omegatex90@gmail.com",
    address: "NO. 67/10, BANDARAGAMA ROAD, MAKANDANA, KESBAWA",
    opening_date: "14-Aug-26",
    phone: "077 - 3055327",
    town: "Kesbawa",
    username: "ptisuper"
  },
  {
    no: 24,
    name: "DAYARATHNA SUPER - POLGASOVITA",
    contact: "MR. PRADEEP",
    email: "newdayarathnastprima@gmail.com",
    address: "NO. 72, HALPITA, POLGASOVITA.",
    opening_date: "3-Sep-26",
    phone: "076 - 8518488",
    town: "Polgasovita",
    username: "dayarathnasuper"
  },
  {
    no: 25,
    name: "CHETHANA SUPER - ELPITYA",
    contact: "MR. VISHNA",
    email: "wish.senevirathne2@gmail.com",
    address: "CHETHANAKETAPOLA, GANEGODA, ELPITIYA.",
    opening_date: "10-Sep-26",
    phone: "077 - 8317278",
    town: "Elpitiya",
    username: "chethanasuper"
  },
  {
    no: 26,
    name: "GAMAGE SUPER - NAGODA",
    contact: "MS. SHANI",
    email: "madushanisasara@gmail.com",
    address: "NAGODA",
    opening_date: "21-Sep-26",
    phone: "074 - 2765025",
    town: "Nagoda",
    username: "gamagenagoda"
  },
  {
    no: 27,
    name: "CHANDRA SUPER - PELMADULLA",
    contact: "MR. NALAKA",
    email: "nalaka1967@gmail.com",
    address: "NO. 40, RAKWANA ROAD, PELMADULLA.",
    opening_date: "1-Oct-26",
    phone: "078 - 3536047",
    town: "Pelmadulla",
    username: "chandrapelmadulla"
  },
  {
    no: 28,
    name: "CHANDRA SUPER - PILIYANDALA",
    contact: "MR. NALAKA",
    email: "nalaka1967@gmail.com",
    address: "89 A, MADAPATH ROAD, KALAMUNNA, PILIYANDALA.",
    opening_date: "7-Oct-26",
    phone: "078 - 3536047",
    town: "Piliyandala",
    username: "chandrapiliyandala"
  }
];

async function populate() {
  console.log('🔄 Populating 28 IR branches and user accounts...');

  const passwordHash = bcrypt.hashSync('spar123', 8);

  // Step 1: Ensure branches 1 to 28 exist and match the IR data
  for (const ir of irData) {
    const existingBranch = db.prepare('SELECT id FROM branches WHERE id = ?').get(ir.no);
    if (existingBranch) {
      db.prepare(`
        UPDATE branches
        SET name = ?, town = ?, address = ?, contact = ?, phone = ?, opening_date = ?, active = 1
        WHERE id = ?
      `).run(ir.name, ir.town, ir.address, ir.contact, ir.phone, ir.opening_date, ir.no);
    } else {
      db.prepare(`
        INSERT INTO branches (id, name, town, address, contact, phone, opening_date, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).run(ir.no, ir.name, ir.town, ir.address, ir.contact, ir.phone, ir.opening_date);
    }
  }

  // Step 2: Remove old mock branch users (excluding admin and marketing user)
  db.prepare(`
    DELETE FROM users
    WHERE role = 'branch' AND branch_id NOT IN (${irData.map(i => i.no).join(',')})
  `).run();

  // Step 3: Insert or update user accounts for each of the 28 IR branches
  for (const ir of irData) {
    const displayName = `${ir.name} - ${ir.contact}`;
    // Password set directly to phone number without any spaces (e.g. 0772445813)
    const phonePassword = ir.phone.replace(/[^0-9]/g, '');
    const phonePasswordHash = bcrypt.hashSync(phonePassword, 8);

    const existingUser = db.prepare('SELECT id, password_hash FROM users WHERE username = ? OR branch_id = ?').get(ir.username, ir.no);

    if (existingUser) {
      db.prepare(`
        UPDATE users
        SET name = ?,
            username = ?,
            email = ?,
            phone = ?,
            address = ?,
            password_hash = ?,
            role = 'branch',
            branch_id = ?,
            active = 1
        WHERE id = ?
      `).run(displayName, ir.username, ir.email, ir.phone, ir.address, phonePasswordHash, ir.no, existingUser.id);
      console.log(`User [${ir.username}] password set to phone [${phonePassword}]`);
    } else {
      db.prepare(`
        INSERT INTO users (name, username, email, phone, address, password_hash, role, branch_id, active)
        VALUES (?, ?, ?, ?, ?, ?, 'branch', ?, 1)
      `).run(displayName, ir.username, ir.email, ir.phone, ir.address, phonePasswordHash, ir.no);
      console.log(`Created user [${ir.username}] password set to phone [${phonePassword}]`);
    }
  }

  console.log('✅ Local database population complete!');

  // Optional: Sync to Supabase
  try {
    const { supabase } = require('./supabase');
    if (supabase && (process.env.USE_SUPABASE === 'true' || process.env.SUPABASE_URL)) {
      console.log('⏳ Syncing updated branches and users to Supabase...');
      const branches = db.prepare('SELECT * FROM branches').all();
      const users = db.prepare('SELECT * FROM users').all();
      await supabase.from('branches').upsert(branches, { onConflict: 'id' });
      await supabase.from('users').upsert(users, { onConflict: 'id' });
      console.log('✅ Supabase sync complete!');
    }
  } catch (sbErr) {
    console.warn('Supabase sync note:', sbErr.message);
  }
}

populate().catch(console.error);
