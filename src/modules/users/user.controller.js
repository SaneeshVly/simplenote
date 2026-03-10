const service = require('./user.service')

exports.createUser = async (req, res, next) => {
  try {
    const user = await service.createUser(req.body)
    res.json(user)
  } catch (err) {
    next(err)
  }
}

exports.getUsers = async (req, res, next) => {
  try {
    const users = await service.getUsers()
    res.json(users)
  } catch (err) {
    next(err)
  }
}