const logger = require('../utils/logger')

module.exports = (req, res, next) => {
  const startedAt = process.hrtime.bigint()

  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - startedAt
    const durationMs = Number(durationNs) / 1e6

    logger.info('HTTP request', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userAgent: req.get('user-agent') || 'unknown'
    })
  })

  next()
}
