const service = require('./message.service')

exports.sendMessage = async (req, res, next) => {
  try {
    const message = await service.sendMessage({
      text: req.body.text,
      recipientId: Number(req.body.recipientId),
      userId: req.user.id
    })
    res.json(message)
  } catch (err) {
    next(err)
  }
}

exports.getConversation = async (req, res, next) => {
  try {
    const conversation = await service.getConversation({
      userId: req.user.id,
      recipientId: req.params.userId
    })
    res.json(conversation)
  } catch (err) {
    next(err)
  }
}