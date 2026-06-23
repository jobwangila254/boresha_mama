const { Pool } = require('pg');
const dotenv = require('dotenv');

// TODO: figure out why this needs to be loaded twice sometimes
dotenv.config();

// FIXME: should we use different pool settings for dev/prod?
let pool;

// HACK: using rejectUnauthorized false for production - need to fix this
const sslConfig = process.env.NODE_ENV === 'production' 
  ? { rejectUnauthorized: false } 
  : false;

// why do we need different configs? TODO: consolidate this mess
if (process.env.DATABASE_URL) {
  // console.log('using DATABASE_URL for connection');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
} else {
  // FIXME: local config should be in a separate file
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'boresha_mama',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD, // why is this sometimes undefined?
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

// i think this only happens if the db goes down? 
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  // TODO: add alerting here, maybe send to slack
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(), // FIXME: need to handle client release
  pool,
};