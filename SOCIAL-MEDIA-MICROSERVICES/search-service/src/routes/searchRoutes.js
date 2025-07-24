const express = require('express')
const {SearchController} = require('../controllers/SearchPostController.js')
const authenticatedRequest = require('../middlewares/authMiddleware.js')

const router = express.router()

router.use(authenticatedRequest)

router.get('/posts', SearchController)

module.exports = router