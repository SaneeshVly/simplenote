require('dotenv').config()

const sslEnabled = process.env.DB_SSL === 'true'
const sharedConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  dialect: 'postgres',
  logging: false
}

const sslConfig = sslEnabled
  ? {
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    }
  : {}

module.exports = {
  development: {
    ...sharedConfig,
    ...sslConfig
  },
  test: {
    ...sharedConfig,
    database: process.env.DB_TEST_NAME || `${process.env.DB_NAME}_test`,
    ...sslConfig
  },
  production: {
    ...sharedConfig,
    ...sslConfig
  }
}