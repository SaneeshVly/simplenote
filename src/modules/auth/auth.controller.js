const service = require('./auth.service')

exports.login = async (req, res, next) => {
  try {
    const result = await service.login(req.body)
    res.json(result)
  } catch (err) {
    next(err)
  }
}