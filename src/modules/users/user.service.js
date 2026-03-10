const repository = require('./user.repository')

exports.createUser = async (data) => {
  return repository.create(data)
}

exports.getUsers = async () => {
  return repository.findAll()
}