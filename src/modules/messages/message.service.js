const repository = require('./message.repository')

exports.sendMessage = async (data) => {
  if (!data.text || !String(data.text).trim()) {
    const error = new Error('Message text is required')
    error.status = 400
    throw error
  }

  if (!data.recipientId) {
    const error = new Error('recipientId is required')
    error.status = 400
    throw error
  }

  return repository.create(data)
}

exports.getConversation = async ({ userId, recipientId }) => {
  if (!recipientId) {
    const error = new Error('recipientId is required')
    error.status = 400
    throw error
  }

  return repository.findConversation({
    userId,
    recipientId: Number(recipientId)
  })
}