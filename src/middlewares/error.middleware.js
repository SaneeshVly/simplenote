const logger = require('../utils/logger')

module.exports = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production'
  const statusCode = err.status || 500

  logger.error('Request error', {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    error: err
  })

  res.status(statusCode).json({
    message: statusCode >= 500 && isProd ? 'Internal server error' : err.message || 'Internal server error',
    stack: !isProd ? err.stack : undefined
  })
}