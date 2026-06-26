const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required'); })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  },
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'boresha_mama',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  },
  sms: {
    provider: process.env.SMS_PROVIDER || 'africastalking',
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
    senderId: process.env.AT_SENDER_ID || 'BoreshaMama',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880,
  },
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost:8081,https://county-portal.vercel.app,https://facility-dashboard-rho.vercel.app,https://chv-app.vercel.app,https://mother-app-ashy.vercel.app').split(','),
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || (process.env.NODE_ENV === 'test' ? 1 : 12),
  },
};
