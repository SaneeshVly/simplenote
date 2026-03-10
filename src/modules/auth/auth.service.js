const User = require('../../../db/models/user.model')
const jwt = require('../../utils/jwt')

exports.login = async ({ email }) => {

  const user = await User.findOne({ where: { email } })

  if (!user) {
    throw new Error('User not found')
  }

  const token = jwt.sign({ id: user.id })

  return { token }
}