const express = require('express')
const {createPost,getAllPosts,getSinglePost,deletePost} = require("../controller/postController.js")
const authenticatedRequest = require("../middleware/authMiddleware.js")
const { route } = require('../../../identity-service/src/routes/identity-service.js')
const router = express.Router()

router.post('/create-post', authenticatedRequest ,createPost )

module.exports = router