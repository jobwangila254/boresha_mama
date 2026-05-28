const logger = require('../config/logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // PostgreSQL unique violation
  if (err.code === '23505') {
    statusCode = 409;
    message = 'A record with this value already exists';
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced record not found';
  }

  // PostgreSQL not null violation
  if (err.code === '23502') {
    statusCode = 400;
    message = `Required field missing: ${err.column}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  logger.error(`${statusCode} - ${message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    message = 'Internal Server Error';
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler, AppError };
