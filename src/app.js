const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const hpp = require('hpp')
const rateLimit = require('express-rate-limit')
const userRoutes = require('./modules/users/user.routes')
const authRoutes = require('./modules/auth/auth.routes')
const messageRoutes = require('./modules/messages/message.routes')
const requestLogger = require('./middlewares/request-logger.middleware')
const errorMiddleware = require('./middlewares/error.middleware')

const app = express()
const isProd = process.env.NODE_ENV === 'production'
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.disable('x-powered-by')
app.set('trust proxy', process.env.TRUST_PROXY === 'true')

app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      if (!isProd && !allowedOrigins.length) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true
  })
)
app.use(hpp())
app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' }
  })
)

app.use(express.json({ limit: process.env.JSON_LIMIT || '10kb' }))
app.use(express.urlencoded({ extended: false, limit: process.env.JSON_LIMIT || '10kb' }))
app.use(requestLogger)

const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || (isProd ? 10 : 50)),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, please try again later.' }
})

app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/api/users', userRoutes)
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/messages', messageRoutes)

app.use(errorMiddleware)

module.exports = app