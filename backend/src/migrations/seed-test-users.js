const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const logger = require('../config/logger');

async function seedTestUsers() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hash = await bcrypt.hash('Test@123', 12);

    // Find a facility to link CHVs to
    const facility = await client.query('SELECT id FROM facilities LIMIT 1');
    const facilityId = facility.rows[0]?.id;

    // Test CHV
    const chvResult = await client.query(
      `INSERT INTO users (phone, first_name, last_name, email, password_hash, role, is_verified)
       VALUES ('+254711000001', 'Test', 'CHV', 'test.chv@boreshamama.go.ke', $1, 'chv', true)
       ON CONFLICT (phone) DO NOTHING
       RETURNING id`,
      [hash]
    );
    const chvUserId = chvResult.rows[0]?.id;
    if (chvUserId && facilityId) {
      await client.query(
        `INSERT INTO chv_profiles (user_id, facility_id, area_of_coverage, village, years_of_experience, is_active, chv_registration_number, education_level)
         VALUES ($1, $2, 'Kiminini', 'Kiminini Town', 3, true, 'CHV-TEST-001', 'Diploma')
         ON CONFLICT DO NOTHING`,
        [chvUserId, facilityId]
      );
    }

    // Test Mother
    const motherResult = await client.query(
      `INSERT INTO users (phone, first_name, last_name, email, password_hash, role, is_verified)
       VALUES ('+254701000001', 'Test', 'Mother', 'test.mother@boreshamama.go.ke', $1, 'mother', true)
       ON CONFLICT (phone) DO NOTHING
       RETURNING id`,
      [hash]
    );
    const motherUserId = motherResult.rows[0]?.id;
    if (motherUserId) {
      await client.query(
        `INSERT INTO mothers (user_id, ward, village, date_of_birth, chv_id)
         VALUES ($1, 'Kiminini', 'Kiminini Town', '1995-06-15', $2)
         ON CONFLICT DO NOTHING`,
        [motherUserId, chvUserId]
      );
      const mother = await client.query(
        'SELECT id FROM mothers WHERE user_id = $1 LIMIT 1', [motherUserId]
      );
      const motherId = mother.rows[0]?.id;
      if (motherId && facilityId) {
        await client.query(
          `INSERT INTO pregnancies (mother_id, facility_id, lmp_date, edd_date, risk_level, status)
           VALUES ($1, $2, '2025-12-01', '2026-09-06', 'low', 'active')
           ON CONFLICT DO NOTHING`,
          [motherId, facilityId]
        );
      }
    }

    await client.query('COMMIT');
    logger.info('Test users seeded');
    logger.info('  CHV:    +254711000001 / Test@123');
    logger.info('  Mother: +254701000001 / Test@123');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestUsers()
  .then(() => process.exit(0))
  .catch((err) => { logger.error(err); process.exit(1); });
