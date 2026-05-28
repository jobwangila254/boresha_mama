const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const logger = require('../config/logger');

async function seedAdmin() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash('Admin@123', 12);
    await client.query(
      `INSERT INTO users (phone, first_name, last_name, email, password_hash, role, is_verified)
       VALUES ('+254700000000', 'County', 'Admin', 'admin@boreshamama.go.ke', $1, 'county_admin', true)
       ON CONFLICT (phone) DO NOTHING`,
      [passwordHash]
    );

    await client.query('COMMIT');
    logger.info('Admin user seeded successfully');
    logger.info('  Phone: +254700000000');
    logger.info('  Password: Admin@123');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Failed to seed admin:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedAdmin()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
