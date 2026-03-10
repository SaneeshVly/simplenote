require('dotenv').config()
const http = require('http')
const app = require('./app')
const logger = require('./utils/logger')
const { initializeSocket } = require('./socket')

const PORT = process.env.PORT || 3000

const server = http.createServer(app)
initializeSocket(server)

server.listen(PORT, () => {
  logger.info('Server started', {
    port: Number(PORT),
    env: process.env.NODE_ENV || 'development'
  })
})

const shutdown = (signal) => {
  logger.warn('Shutdown signal received', { signal })
  server.close(() => {
    logger.info('HTTP server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    error: reason instanceof Error ? reason : new Error(String(reason))
  })
})
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error })
  process.exit(1)
})