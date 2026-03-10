const express = require('express')
const controller = require('./message.controller')
const auth = require('../../middlewares/auth.middleware')

const router = express.Router()

router.use(auth)
router.get('/conversation/:userId', controller.getConversation)
router.post('/', controller.sendMessage)

module.exports = router