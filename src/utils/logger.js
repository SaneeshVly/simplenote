const util = require('util')

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
}

const env = process.env.NODE_ENV || 'development'
const isProd = env === 'production'
const configuredLevel = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug')
const maxLevel = levels[configuredLevel] ?? levels.info

const shouldLog = (level) => levels[level] <= maxLevel

const formatError = (error) => {
  if (!error) return undefined

  return {
    name: error.name,
    message: error.message,
    stack: error.stack
  }
}

const emit = (level, message, meta = {}) => {
  if (!shouldLog(level)) return

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message
  }

  if (meta.error instanceof Error) {
    payload.error = formatError(meta.error)
    delete meta.error
  }

  Object.assign(payload, meta)

  if (isProd) {
    const line = JSON.stringify(payload)
    if (level === 'error') {
      console.error(line)
      return
    }

    console.log(line)
    return
  }

  const label = level.toUpperCase()
  const detail = Object.keys(payload).length > 3
    ? `\n${util.inspect(payload, { depth: null, compact: false })}`
    : ''
  const line = `[${payload.timestamp}] ${label} ${message}${detail}`

  if (level === 'error') {
    console.error(line)
    return
  }

  console.log(line)
}

module.exports = {
  error: (message, meta) => emit('error', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  info: (message, meta) => emit('info', message, meta),
  debug: (message, meta) => emit('debug', message, meta)
}
