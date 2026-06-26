const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

(async () => {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'boresha_mama',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  // Update all existing mothers to have password = firstName@123
  const result = await pool.query(`
    SELECT u.id, u.phone, u.first_name, u.last_name
    FROM users u
    WHERE u.role = 'mother'
    ORDER BY u.created_at ASC
  `);

  console.log(`Found ${result.rows.length} mothers in the system`);

  for (const row of result.rows) {
    const password = `${row.first_name}@123`;
    const hash = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, row.id]);
    console.log(`Updated: ${row.phone} - ${row.first_name} ${row.last_name} -> ${password}`);
  }

  await pool.end();
  console.log('All mother passwords updated to firstName@123 format!');
})();
