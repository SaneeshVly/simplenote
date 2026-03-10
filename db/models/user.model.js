const { DataTypes } = require('sequelize')
const sequelize = require('../../src/config/database')

const User = sequelize.define('User', {
  name: DataTypes.STRING,
  email: DataTypes.STRING
})

module.exports = User