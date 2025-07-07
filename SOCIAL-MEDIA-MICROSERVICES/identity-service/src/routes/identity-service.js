const express = require('express')
const { registerUser, loginUser,userRefreshToken,logoutUser } = require('../controllers/identity-controller.js')

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/refreshToken', userRefreshToken)
router.post('/logout', logoutUser)


module.exports = router