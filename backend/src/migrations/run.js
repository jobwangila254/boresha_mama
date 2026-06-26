const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const logger = require('../config/logger');

async function runMigrations() {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  logger.info(`Found ${files.length} migration files`);

  // Run migrations individually with error handling
  for (const file of files) {
    const client = await pool.connect();
    try {
      logger.info(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      await client.query(sql);
      logger.info(`Migration complete: ${file}`);
    } catch (err) {
      // Log error but continue - migration might be partially applied or already applied
      logger.warn(`Migration ${file} had issues (may already be applied):`, err.message);
    } finally {
      client.release();
    }
  }

  await pool.end();
  logger.info('Migration process completed');
}

runMigrations()
  .then(() => process.exit(0))
  .catch(err => {
    logger.error('Migration process failed:', err);
    process.exit(1);
  });
