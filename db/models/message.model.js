const { DataTypes } = require('sequelize')
const sequelize = require('../../src/config/database')

const Message = sequelize.define('Message', {
  text: DataTypes.TEXT,
  userId: DataTypes.INTEGER,
  recipientId: DataTypes.INTEGER
})

module.exports = Message