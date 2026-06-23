const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const logger = require('../config/logger');

const facilities = [
  { name: 'Kiminini Health Centre', type: 'health_center', ward: 'Kiminini', constituency: 'Kiminini', latitude: 1.0222, longitude: 35.0155, level: 'Level 3', phone: '+254722000101' },
  { name: 'Matunda Dispensary', type: 'dispensary', ward: 'Matunda', constituency: 'Kiminini', latitude: 1.0455, longitude: 35.0200, level: 'Level 2', phone: '+254722000102' },
  { name: 'Nabiswa Dispensary', type: 'dispensary', ward: 'Nabiswa', constituency: 'Kiminini', latitude: 1.0010, longitude: 34.9900, level: 'Level 2', phone: '+254722000103' },
  { name: 'Kitale County Referral Hospital', type: 'county_referral_hospital', ward: 'Kitale', constituency: 'Kiminini', latitude: 1.0167, longitude: 35.0033, level: 'Level 5', phone: '+254722000104' },
  { name: 'Mt. Elgon Hospital', type: 'county_hospital', ward: 'Kitale', constituency: 'Kiminini', latitude: 1.0333, longitude: 35.0100, level: 'Level 4', phone: '+254722000105' },
  { name: 'Matunda Sub-County Hospital', type: 'sub_county_hospital', ward: 'Matunda', constituency: 'Kiminini', latitude: 1.0455, longitude: 35.0200, level: 'Level 4', phone: '+254722000106' },
  { name: 'Sikhendu Dispensary', type: 'dispensary', ward: 'Sikhendu', constituency: 'Kiminini', latitude: 1.0100, longitude: 34.9800, level: 'Level 2', phone: '+254722000107' },
];

const locations = [
  { constituency: 'Kiminini', ward: 'Kiminini', sub_location: 'Kiminini', village: 'Kiminini Town' },
  { constituency: 'Kiminini', ward: 'Kiminini', sub_location: 'Kiminini', village: 'Kabuyefwe' },
  { constituency: 'Kiminini', ward: 'Kiminini', sub_location: 'Kiminini', village: 'Masaba' },
  { constituency: 'Kiminini', ward: 'Kiminini', sub_location: 'Kiminini', village: 'Kananachi' },
  { constituency: 'Kiminini', ward: 'Kiminini', sub_location: 'Kiminini', village: 'Muthangari' },
  { constituency: 'Kiminini', ward: 'Waitaluk', sub_location: 'Waitaluk', village: 'Waitaluk' },
  { constituency: 'Kiminini', ward: 'Waitaluk', sub_location: 'Waitaluk', village: 'Kibomet' },
  { constituency: 'Kiminini', ward: 'Waitaluk', sub_location: 'Waitaluk', village: 'Kongasis' },
  { constituency: 'Kiminini', ward: 'Waitaluk', sub_location: 'Nabiswa', village: 'Nabiswa' },
  { constituency: 'Kiminini', ward: 'Sirende', sub_location: 'Sirende', village: 'Sirende' },
  { constituency: 'Kiminini', ward: 'Sirende', sub_location: 'Sirende', village: 'Baraton' },
  { constituency: 'Kiminini', ward: 'Hospital', sub_location: 'Hospital', village: 'Hospital' },
  { constituency: 'Kiminini', ward: 'Sikhendu', sub_location: 'Sikhendu', village: 'Sikhendu' },
  { constituency: 'Kiminini', ward: 'Sikhendu', sub_location: 'Sikhendu', village: 'Konoin' },
  { constituency: 'Kiminini', ward: 'Sikhendu', sub_location: 'Sikhendu', village: 'Imani' },
  { constituency: 'Kiminini', ward: 'Sikhendu', sub_location: 'Sikhendu', village: 'Musumba' },
  { constituency: 'Kiminini', ward: 'Sikhendu', sub_location: 'Sikhendu', village: 'Miti 10' },
  { constituency: 'Kiminini', ward: 'Sikhendu', sub_location: 'Sikhendu', village: 'Siamba' },
  { constituency: 'Kiminini', ward: 'Sikhendu', sub_location: 'Sikhendu', village: 'Mwiruri' },
  { constituency: 'Kiminini', ward: 'Nabiswa', sub_location: 'Nabiswa', village: 'Nabiswa' },
  { constituency: 'Kiminini', ward: 'Nabiswa', sub_location: 'Nabiswa', village: 'Mufutu' },
  { constituency: 'Kiminini', ward: 'Nabiswa', sub_location: 'Nabiswa', village: 'Kiungani' },
  { constituency: 'Kiminini', ward: 'Nabiswa', sub_location: 'Nabiswa', village: 'Kirenga' },
  { constituency: 'Kiminini', ward: 'Nabiswa', sub_location: 'Nabiswa', village: 'Birunda' },
  { constituency: 'Kiminini', ward: 'Nabiswa', sub_location: 'Nabiswa', village: 'Nabunga' },
];

const fsFacilities = [
  { name: 'Kiminini Health Centre', phone: '+254722500102', first: 'Reception', last: 'Kiminini' },
  { name: 'Matunda Dispensary', phone: '+254722700203', first: 'Reception', last: 'Matunda' },
  { name: 'Sikhendu Dispensary', phone: '+254722900304', first: 'Reception', last: 'Sikhendu' },
  { name: 'Kitale County Referral Hospital', phone: '+254722300405', first: 'Reception', last: 'Kitale' },
];

const chvData = [
  { phone: '+254711500101', firstName: 'John', lastName: 'Kiprop', ward: 'Kiminini', yrs: 3, edu: 'Diploma' },
  { phone: '+254711700202', firstName: 'Peter', lastName: 'Wafula', ward: 'Waitaluk', yrs: 5, edu: 'Certificate' },
  { phone: '+254711900303', firstName: 'Sarah', lastName: 'Wanjala', ward: 'Nabiswa', yrs: 2, edu: 'Diploma' },
  { phone: '+254711300404', firstName: 'David', lastName: 'Khasoa', ward: 'Sikhendu', yrs: 7, edu: 'Degree' },
  { phone: '+254711100505', firstName: 'Mary', lastName: 'Chepkoech', ward: 'Sirende', yrs: 4, edu: 'Diploma' },
];

const motherDobs = ['1995-01-15', '1993-08-22', '1997-03-10', '1990-11-05', '1998-06-18', '1992-09-30', '1996-04-25', '1994-12-12', '1991-07-08', '1999-02-20', '1993-10-15', '1997-05-28', '1996-08-04'];

const mothers = [
  { phone: '+254701345001', firstName: 'Mary', lastName: 'Wanjiku', ward: 'Kiminini', village: 'Kiminini Town', facilityName: 'Kiminini Health Centre', dueDate: '2026-08-15' },
  { phone: '+254701892003', firstName: 'Grace', lastName: 'Akinyi', ward: 'Kiminini', village: 'Kabuyefwe', facilityName: 'Kiminini Health Centre', dueDate: '2026-09-20' },
  { phone: '+254701567012', firstName: 'Faith', lastName: 'Chebet', ward: 'Kiminini', village: 'Masaba', facilityName: 'Kiminini Health Centre', dueDate: '2026-07-10' },
  { phone: '+254701234008', firstName: 'Jane', lastName: 'Nyambura', ward: 'Waitaluk', village: 'Waitaluk', facilityName: 'Kiminini Health Centre', dueDate: '2026-10-05' },
  { phone: '+254701678005', firstName: 'Esther', lastName: 'Wairimu', ward: 'Waitaluk', village: 'Kibomet', facilityName: 'Kiminini Health Centre', dueDate: '2026-08-22' },
  { phone: '+254701123009', firstName: 'Sarah', lastName: 'Chemutai', ward: 'Waitaluk', village: 'Kongasis', facilityName: 'Kiminini Health Centre', dueDate: '2026-11-15' },
  { phone: '+254701456007', firstName: 'Rose', lastName: 'Wanjala', ward: 'Nabiswa', village: 'Nabiswa', facilityName: 'Matunda Dispensary', dueDate: '2026-09-01' },
  { phone: '+254701789002', firstName: 'Agnes', lastName: 'Mukhongo', ward: 'Nabiswa', village: 'Mufutu', facilityName: 'Matunda Dispensary', dueDate: '2026-07-28' },
  { phone: '+254701321004', firstName: 'Doris', lastName: 'Nasimiyu', ward: 'Nabiswa', village: 'Kiungani', facilityName: 'Matunda Dispensary', dueDate: '2026-10-12' },
  { phone: '+254701654010', firstName: 'Margaret', lastName: 'Khasoa', ward: 'Sikhendu', village: 'Sikhendu', facilityName: 'Sikhendu Dispensary', dueDate: '2026-08-30' },
  { phone: '+254701876011', firstName: 'Hellen', lastName: 'Mmbone', ward: 'Sikhendu', village: 'Konoin', facilityName: 'Sikhendu Dispensary', dueDate: '2026-09-18' },
  { phone: '+254701543013', firstName: 'Ruth', lastName: 'Kipyegen', ward: 'Sirende', village: 'Sirende', facilityName: 'Kiminini Health Centre', dueDate: '2026-11-25' },
  { phone: '+254701210006', firstName: 'Nancy', lastName: 'Biwott', ward: 'Sirende', village: 'Baraton', facilityName: 'Kiminini Health Centre', dueDate: '2026-10-08', riskLevel: 'medium' },
];

router.get('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const f of facilities) {
      await client.query(
        `INSERT INTO facilities (name, type, ward, constituency, latitude, longitude, level, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (name) DO NOTHING`,
        [f.name, f.type, f.ward, f.constituency, f.latitude, f.longitude, f.level, f.phone]
      );
    }

    for (const loc of locations) {
      await client.query(
        `INSERT INTO locations (constituency, ward, sub_location, village, county)
         VALUES ($1, $2, $3, $4, 'Trans-Nzoia')
         ON CONFLICT (county, constituency, ward, village) DO UPDATE SET sub_location = EXCLUDED.sub_location`,
        [loc.constituency, loc.ward, loc.sub_location, loc.village]
      );
    }

    const passwordHash = await bcrypt.hash('Admin@123', 12);
    await client.query(
      `INSERT INTO users (phone, first_name, last_name, email, password_hash, role, is_verified)
       VALUES ('+254700000000', 'County', 'Admin', 'admin@boreshamama.go.ke', $1, 'county_admin', true)
       ON CONFLICT (phone) DO NOTHING`,
      [passwordHash]
    );

    const adminResult = await client.query("SELECT id FROM users WHERE phone = '+254700000000' LIMIT 1");
    const adminUserId = adminResult.rows[0]?.id;

    const kimiFacility = await client.query("SELECT id FROM facilities WHERE name = 'Kiminini Health Centre' LIMIT 1");
    const kimiFacilityId = kimiFacility.rows[0]?.id;

    for (const fs of fsFacilities) {
      const fac = await client.query('SELECT id FROM facilities WHERE name = $1 LIMIT 1', [fs.name]);
      const fid = fac.rows[0]?.id;
      if (!fid) continue;
      const shortName = fs.name.split(' ')[0];
      const fsHash = await bcrypt.hash(`${shortName}@123`, 12);
      const staffUser = await client.query(
        `INSERT INTO users (phone, first_name, last_name, email, password_hash, role, is_verified)
         VALUES ($1, $2, $3, $4, $5, 'facility_staff', true)
         ON CONFLICT (phone) DO NOTHING
         RETURNING id`,
        [fs.phone, fs.first, fs.last, `${fs.name.toLowerCase().replace(/\s+/g, '_')}@boreshamama.go.ke`, fsHash]
      );
      const uid = staffUser.rows[0]?.id;
      if (uid) {
        await client.query(
          `INSERT INTO facility_staff (user_id, facility_id, job_title) VALUES ($1, $2, 'Reception Desk') ON CONFLICT DO NOTHING`,
          [uid, fid]
        );
      }
    }

    const wardChvMap = {};
    for (let ci = 0; ci < chvData.length; ci++) {
      const c = chvData[ci];
      const regNumber = `CHV-${(ci + 1) * 7}`;
      const chvPass = 'CHV_' + c.phone.slice(-4);
      const chvHash = await bcrypt.hash(chvPass, 12);
      const chvUser = await client.query(
        `INSERT INTO users (phone, first_name, last_name, email, password_hash, role, is_verified)
         VALUES ($1, $2, $3, $4, $5, 'chv', true)
         ON CONFLICT (phone) DO NOTHING
         RETURNING id`,
        [c.phone, c.firstName, c.lastName, `${c.firstName.toLowerCase()}${ci}@boreshamama.go.ke`, chvHash]
      );
      const chvUserId = chvUser.rows[0]?.id;
      if (chvUserId) {
        const facility = await client.query('SELECT id FROM facilities WHERE ward = $1 LIMIT 1', [c.ward]);
        const facilityId = facility.rows[0]?.id || kimiFacilityId;
        await client.query(
          `INSERT INTO chv_profiles (user_id, facility_id, area_of_coverage, village, years_of_experience, is_active, chv_registration_number, education_level)
           VALUES ($1, $2, $3, $4, $5, true, $6, $7)
           ON CONFLICT DO NOTHING`,
          [chvUserId, facilityId, c.ward, c.ward, c.yrs, regNumber, c.edu]
        );
        wardChvMap[c.ward] = chvUserId;
      }
    }

    for (let mi = 0; mi < mothers.length; mi++) {
      const m = mothers[mi];
      const facility = await client.query('SELECT id FROM facilities WHERE name = $1 LIMIT 1', [m.facilityName]);
      const facilityId = facility.rows[0]?.id;
      if (!facilityId) continue;

      const rawPass = 'Mama' + m.phone.slice(-4);
      const mHash = await bcrypt.hash(rawPass, 12);
      const user = await client.query(
        `INSERT INTO users (phone, first_name, last_name, email, password_hash, role, is_verified)
         VALUES ($1, $2, $3, $4, $5, 'mother', true)
         ON CONFLICT (phone) DO NOTHING
         RETURNING id`,
        [m.phone, m.firstName, m.lastName, `${m.firstName.toLowerCase()}.${m.lastName.toLowerCase()}@boreshamama.go.ke`, mHash]
      );
      const userId = user.rows[0]?.id;
      if (!userId) continue;

      await client.query(
        `INSERT INTO mothers (user_id, ward, village, date_of_birth, chv_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [userId, m.ward, m.village, motherDobs[mi % motherDobs.length], wardChvMap[m.ward] || null]
      );

      const mother = await client.query('SELECT id FROM mothers WHERE user_id = $1 LIMIT 1', [userId]);
      const motherId = mother.rows[0]?.id;
      if (motherId) {
        const edd = new Date(m.dueDate);
        const lmp = new Date(edd);
        lmp.setDate(lmp.getDate() - 280);
        await client.query(
          `INSERT INTO pregnancies (mother_id, facility_id, registered_by, lmp_date, edd_date, risk_level, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'active')
           ON CONFLICT DO NOTHING`,
          [motherId, facilityId, adminUserId, lmp.toISOString().split('T')[0], m.dueDate, m.riskLevel || 'low']
        );
      }
    }

    const homeVisitMothers = await client.query(`
      SELECT m.id AS mother_id, p.id AS pregnancy_id, m.chv_id
      FROM mothers m
      JOIN pregnancies p ON p.mother_id = m.id
      WHERE m.chv_id IS NOT NULL
      LIMIT 6
    `);
    for (const hv of homeVisitMothers.rows) {
      await client.query(
        `INSERT INTO home_visits (pregnancy_id, mother_id, chv_id, visit_date, visit_type, weight_kg, blood_pressure_systolic, blood_pressure_diastolic, risk_level, notes)
         VALUES ($1, $2, $3, $4, 'antenatal', $5, $6, $7, $8, $9)
         ON CONFLICT DO NOTHING`,
        [
          hv.pregnancy_id,
          hv.mother_id,
          hv.chv_id,
          '2026-05-15',
          65.5 + Math.random() * 5,
          110 + Math.floor(Math.random() * 20),
          70 + Math.floor(Math.random() * 10),
          'low',
          'Routine antenatal visit. Mother in good health.',
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Seed failed:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
