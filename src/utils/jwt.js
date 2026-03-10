const jwt = require('jsonwebtoken')

const getSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }

  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production')
  }

  return secret
}

exports.sign = (payload) => {
  return jwt.sign(payload, getSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || '1d' })
}

exports.verify = (token) => {
  return jwt.verify(token, getSecret())
}