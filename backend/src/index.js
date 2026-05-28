const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

const config = require('./config');
const logger = require('./config/logger');
const { errorHandler } = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const smsService = require('./services/smsService');
const { pool } = require('./config/database');

['logs', config.upload.dir].forEach(dir => {
  const dirPath = path.resolve(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Auth endpoints get stricter rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again later.' },
});
app.use('/api/auth/login', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
}

app.use('/uploads', express.static(path.resolve(__dirname, '..', config.upload.dir)));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/pregnancies', require('./routes/pregnancies'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/home-visits', require('./routes/homeVisits'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/monitoring', require('./routes/monitoring'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/health-tips', require('./routes/healthTips'));
app.use('/api/locations', require('./routes/locations'));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Boresha-Mama API Docs',
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Boresha-Mama API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// SMS reminders (runs daily at 8:00 AM)
if (config.nodeEnv !== 'test') {
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running scheduled appointment reminders...');
    await smsService.sendAppointmentReminders();
  });
}

app.use(errorHandler);

function shutdownGracefully(signal, server) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  const forceExit = setTimeout(() => {
    logger.error('Forced exit after timeout');
    process.exit(1);
  }, 10000);

  server.close(() => {
    pool.end().then(() => {
      logger.info('Database pool closed');
      clearTimeout(forceExit);
      process.exit(0);
    }).catch(err => {
      logger.error('Error closing pool:', err);
      clearTimeout(forceExit);
      process.exit(1);
    });
  });
}

if (require.main === module) {
  const server = app.listen(config.port, () => {
    logger.info(`Boresha-Mama API server running on port ${config.port} in ${config.nodeEnv} mode`);
  });

  process.on('SIGTERM', () => shutdownGracefully('SIGTERM', server));
  process.on('SIGINT', () => shutdownGracefully('SIGINT', server));
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
