const Message = require('../../../db/models/message.model')
const { Op } = require('sequelize')

exports.create = (data) => {
  return Message.create(data)
}

exports.findConversation = ({ userId, recipientId, limit = 100 }) => {
  return Message.findAll({
    where: {
      [Op.or]: [
        { userId, recipientId },
        { userId: recipientId, recipientId: userId }
      ]
    },
    order: [['createdAt', 'ASC']],
    limit
  })
}