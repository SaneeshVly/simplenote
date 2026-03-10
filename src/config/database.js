const { Sequelize } = require('sequelize')

const requiredProdEnv = ['DB_NAME', 'DB_USER', 'DB_PASS', 'DB_HOST']
if (process.env.NODE_ENV === 'production') {
  const missingVars = requiredProdEnv.filter((key) => !process.env[key])
  if (missingVars.length) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }
}

const sslEnabled = process.env.DB_SSL === 'true'
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development',
    dialectOptions: sslEnabled
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : undefined,
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: Number(process.env.DB_POOL_MIN || 0),
      acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
      idle: Number(process.env.DB_POOL_IDLE || 10000)
    }
  }
)

module.exports = sequelize