const { Server } = require('socket.io')
const jwt = require('./utils/jwt')
const logger = require('./utils/logger')
const messageService = require('./modules/messages/message.service')

const onlineUsers = new Map()

const addSocketForUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set())
  }
  onlineUsers.get(userId).add(socketId)
}

const removeSocketForUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) return
  const sockets = onlineUsers.get(userId)
  sockets.delete(socketId)
  if (!sockets.size) {
    onlineUsers.delete(userId)
  }
}

const emitToUser = (io, userId, eventName, payload) => {
  const sockets = onlineUsers.get(String(userId))
  if (!sockets) return
  sockets.forEach((socketId) => io.to(socketId).emit(eventName, payload))
}

const getOnlineUserIds = () => Array.from(onlineUsers.keys()).map((id) => Number(id))

const parseAllowedOrigins = () =>
  (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

const isProd = process.env.NODE_ENV === 'production'

function initializeSocket(server) {
  const allowedOrigins = parseAllowedOrigins()
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || (!isProd && !allowedOrigins.length)) {
          return callback(null, true)
        }
        return callback(new Error('Not allowed by CORS'))
      },
      credentials: true
    }
  })

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) {
        return next(new Error('Unauthorized'))
      }

      const payload = jwt.verify(token)
      socket.userId = String(payload.id)
      return next()
    } catch (error) {
      return next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    addSocketForUser(socket.userId, socket.id)
    logger.info('Socket connected', { userId: socket.userId, socketId: socket.id })
    socket.emit('presence_sync', { onlineUserIds: getOnlineUserIds() })
    io.emit('presence_update', { userId: Number(socket.userId), online: true })

    socket.on('private_message', async (payload, ack) => {
      try {
        const recipientId = Number(payload?.recipientId)
        const text = String(payload?.text || '').trim()

        if (!recipientId || !text) {
          throw new Error('recipientId and text are required')
        }

        const message = await messageService.sendMessage({
          text,
          recipientId,
          userId: Number(socket.userId)
        })

        emitToUser(io, socket.userId, 'private_message', message)
        emitToUser(io, recipientId, 'private_message', message)
        if (typeof ack === 'function') ack({ ok: true, message })
      } catch (error) {
        logger.warn('private_message failed', { userId: socket.userId, error })
        if (typeof ack === 'function') ack({ ok: false, error: error.message })
      }
    })

    socket.on('typing', (payload) => {
      const recipientId = Number(payload?.recipientId)
      const isTyping = Boolean(payload?.isTyping)
      if (!recipientId) return

      emitToUser(io, recipientId, 'typing', {
        userId: Number(socket.userId),
        recipientId,
        isTyping
      })
    })

    socket.on('disconnect', () => {
      removeSocketForUser(socket.userId, socket.id)
      const stillOnline = onlineUsers.has(socket.userId)
      if (!stillOnline) {
        io.emit('presence_update', { userId: Number(socket.userId), online: false })
      }
      logger.info('Socket disconnected', { userId: socket.userId, socketId: socket.id })
    })
  })

  return io
}

module.exports = { initializeSocket }
