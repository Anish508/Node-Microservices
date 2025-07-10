const express = require('express')
const {createPost,getAllPosts,getSinglePost,deletePost} = require("../controller/postController.js")
const authenticatedRequest = require("../middleware/authMiddleware.js")

const router = express.Router()

router.use(authenticatedRequest)
router.post('/create-post',createPost )
router.get('/get-all-posts',getAllPosts )

module.exports = router