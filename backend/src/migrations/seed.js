const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const logger = require('../config/logger');

async function seed() {
  const client = await pool.connect();
  try {
    logger.info('Seeding database...');

    // Clear existing demo data for re-seeding
    await client.query('DELETE FROM pregnancies');
    await client.query('DELETE FROM mothers');
    await client.query('DELETE FROM facility_staff');
    await client.query('DELETE FROM chv_profiles');
    await client.query("DELETE FROM users WHERE role IN ('facility_staff', 'mother', 'chv')");

    // Seed facilities
    const facilities = [
      { name: 'Kiminini Health Centre', type: 'health_center', ward: 'Kiminini', constituency: 'Kiminini', latitude: 1.0222, longitude: 35.0155, level: 'Level 3' },
      { name: 'Matunda Dispensary', type: 'dispensary', ward: 'Matunda', constituency: 'Kiminini', latitude: 1.0455, longitude: 35.0200, level: 'Level 2' },
      { name: 'Nabiswa Dispensary', type: 'dispensary', ward: 'Nabiswa', constituency: 'Kiminini', latitude: 1.0010, longitude: 34.9900, level: 'Level 2' },
      { name: 'Kitale County Referral Hospital', type: 'county_referral_hospital', ward: 'Kitale', constituency: 'Kiminini', latitude: 1.0167, longitude: 35.0033, level: 'Level 5' },
      { name: 'Mt. Elgon Hospital', type: 'county_hospital', ward: 'Kitale', constituency: 'Kiminini', latitude: 1.0333, longitude: 35.0100, level: 'Level 4' },
      { name: 'Matunda Sub-County Hospital', type: 'sub_county_hospital', ward: 'Matunda', constituency: 'Kiminini', latitude: 1.0455, longitude: 35.0200, level: 'Level 4' },
      { name: 'Sikhendu Dispensary', type: 'dispensary', ward: 'Sikhendu', constituency: 'Kiminini', latitude: 1.0100, longitude: 34.9800, level: 'Level 2' },
    ];

    for (const f of facilities) {
      await client.query(
        `INSERT INTO facilities (name, type, ward, constituency, latitude, longitude, level)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [f.name, f.type, f.ward, f.constituency, f.latitude, f.longitude, f.level]
      );
    }

    // Seed locations (constituencies, wards, and villages)
    const locations = [
      { constituency: 'Kiminini', ward: 'Kiminini', village: 'Kiminini Town' },
      { constituency: 'Kiminini', ward: 'Kiminini', village: 'Kabuyefwe' },
      { constituency: 'Kiminini', ward: 'Kiminini', village: 'Masaba' },
      { constituency: 'Kiminini', ward: 'Kiminini', village: 'Kananachi' },
      { constituency: 'Kiminini', ward: 'Kiminini', village: 'Muthangari' },
      { constituency: 'Kiminini', ward: 'Waitaluk', village: 'Waitaluk' },
      { constituency: 'Kiminini', ward: 'Waitaluk', village: 'Kibomet' },
      { constituency: 'Kiminini', ward: 'Waitaluk', village: 'Kongasis' },
      { constituency: 'Kiminini', ward: 'Waitaluk', village: 'Nabiswa' },
      { constituency: 'Kiminini', ward: 'Sirende', village: 'Sirende' },
      { constituency: 'Kiminini', ward: 'Sirende', village: 'Baraton' },
      { constituency: 'Kiminini', ward: 'Hospital', village: 'Hospital' },
      { constituency: 'Kiminini', ward: 'Sikhendu', village: 'Sikhendu' },
      { constituency: 'Kiminini', ward: 'Sikhendu', village: 'Konoin' },
      { constituency: 'Kiminini', ward: 'Sikhendu', village: 'Imani' },
      { constituency: 'Kiminini', ward: 'Sikhendu', village: 'Musumba' },
      { constituency: 'Kiminini', ward: 'Sikhendu', village: 'Miti 10' },
      { constituency: 'Kiminini', ward: 'Sikhendu', village: 'Siamba' },
      { constituency: 'Kiminini', ward: 'Sikhendu', village: 'Mwiruri' },
      { constituency: 'Kiminini', ward: 'Nabiswa', village: 'Nabiswa' },
      { constituency: 'Kiminini', ward: 'Nabiswa', village: 'Mufutu' },
      { constituency: 'Kiminini', ward: 'Nabiswa', village: 'Kiungani' },
      { constituency: 'Kiminini', ward: 'Nabiswa', village: 'Kirenga' },
      { constituency: 'Kiminini', ward: 'Nabiswa', village: 'Birunda' },
      { constituency: 'Kiminini', ward: 'Nabiswa', village: 'Nabunga' },
    ];

    for (const loc of locations) {
      await client.query(
        `INSERT INTO locations (constituency, ward, village, county)
         VALUES ($1, $2, $3, 'Trans-Nzoia')
         ON CONFLICT DO NOTHING`,
        [loc.constituency, loc.ward, loc.village]
      );
    }

    // Seed admin user
    const passwordHash = await bcrypt.hash('Admin@123', 12);
    await client.query(
      `INSERT INTO users (phone, first_name, last_name, email, password_hash, role, is_verified)
       VALUES ('+254700000000', 'County', 'Admin', 'admin@boreshamama.go.ke', $1, 'county_admin', true)
       ON CONFLICT (phone) DO NOTHING`,
      [passwordHash]
    );

    // Seed facility logins (facility reception desks)

    // Kiminini Health Centre login (password: Kiminini@123)
    const kimiHash = await bcrypt.hash('Kiminini@123', 12);
    const kimiFacility = await client.query(
      "SELECT id FROM facilities WHERE name = 'Kiminini Health Centre' LIMIT 1"
    );
    const kimiFacilityId = kimiFacility.rows[0]?.id;

    const kimiStaff = await client.query(
      `INSERT INTO users (phone, first_name, last_name, email, password_hash, role, is_verified)
       VALUES ('+254722000002', 'Kiminini Health', 'Centre', 'kiminini@boreshamama.go.ke', $1, 'facility_staff', true)
       ON CONFLICT (phone) DO NOTHING
       RETURNING id`,
      [kimiHash]
    );
    const kimiUserId = kimiStaff.rows[0]?.id;
    if (kimiUserId && kimiFacilityId) {
      await client.query(
        `INSERT INTO facility_staff (user_id, facility_id, job_title) VALUES ($1, $2, 'Facility Reception') ON CONFLICT DO NOTHING`,
        [kimiUserId, kimiFacilityId]
      );
    }

    // Matunda Dispensary login (password: Matunda@123)
    const matundaHash = await bcrypt.hash('Matunda@123', 12);
    const matundaFacility = await client.query(
      "SELECT id FROM facilities WHERE name = 'Matunda Dispensary' LIMIT 1"
    );
    const matundaFacilityId = matundaFacility.rows[0]?.id;

    const matundaStaff = await client.query(
      `INSERT INTO users (phone, first_name, last_name, email, password_hash, role, is_verified)
       VALUES ('+254722000003', 'Matunda', 'Dispensary', 'matunda@boreshamama.go.ke', $1, 'facility_staff', true)
       ON CONFLICT (phone) DO NOTHING
       RETURNING id`,
      [matundaHash]
    );
    const matundaUserId = matundaStaff.rows[0]?.id;
    if (matundaUserId && matundaFacilityId) {
      await client.query(
        `INSERT INTO facility_staff (user_id, facility_id, job_title) VALUES ($1, $2, 'Facility Reception') ON CONFLICT DO NOTHING`,
        [matundaUserId, matundaFacilityId]
      );
    }

    // Sikhendu Dispensary login (password: Sikhendu@123)
    const sikhenduHash = await bcrypt.hash('Sikhendu@123', 12);
    const sikhenduFacility = await client.query(
      "SELECT id FROM facilities WHERE name = 'Sikhendu Dispensary' LIMIT 1"
    );
    const sikhenduFacilityId = sikhenduFacility.rows[0]?.id;

    const sikhenduStaff = await client.query(
      `INSERT INTO users (phone, first_name, last_name, email, password_hash, role, is_verified)
       VALUES ('+254722000004', 'Sikhendu', 'Dispensary', 'sikhendu@boreshamama.go.ke', $1, 'facility_staff', true)
       ON CONFLICT (phone) DO NOTHING
       RETURNING id`,
      [sikhenduHash]
    );
    const sikhenduUserId = sikhenduStaff.rows[0]?.id;
    if (sikhenduUserId && sikhenduFacilityId) {
      await client.query(
        `INSERT INTO facility_staff (user_id, facility_id, job_title) VALUES ($1, $2, 'Facility Reception') ON CONFLICT DO NOTHING`,
        [sikhenduUserId, sikhenduFacilityId]
      );
    }

    logger.info('Seed completed successfully');
  } catch (err) {
    logger.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
