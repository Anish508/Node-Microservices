const express = require('express')
const {searchPostController} = require('../controllers/SearchPostController.js')
const authenticatedRequest = require('../middlewares/authMiddleware.js')

const router = express.Router()

router.use(authenticatedRequest)

router.get('/posts', searchPostController)

module.exports = router