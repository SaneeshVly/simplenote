const User = require('../../../db/models/user.model')

exports.create = (data) => {
  return User.create(data)
}

exports.findAll = () => {
  return User.findAll()
}