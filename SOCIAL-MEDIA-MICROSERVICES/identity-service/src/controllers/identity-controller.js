
const logger = require('../utils/logger.js')
const validateRegistration = require('../utils/validation.js')
const User = require('../models/user-model.js')
const generateTokens = require('../utils/generateTokens.js')

//user reg
const registerUser = async(req ,res )=>{
  logger.info('Registration endpoint hit....')
  try {
    const  {error} = validateRegistration(req.body)
    if(error){
      logger.warn('validation error' , error.details[0].message)
      return res.status(400).json({
        success:false,
        message: error.details[0].message
      })
    }
    const {username, email, password} = req.body

    let user = await User.findOne({$or: [{email}, {username}]})
    if(user){
      logger.warn("User already exists please login")
      return res.status(400).json({
        success: false,
        message:"User already exists"
      })
    }
    user = new User({username, email, password})
    await user.save()
    logger.warn("User saved successfully", user._id)

    const {accessToken, refreshToken} = await generateTokens(user)


    res.status(200).json({
      success: true,
      message:"User registered successfully",
      accessToken,
      refreshToken
    })
  } catch (error) {
    logger.error('Registration error occured', error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}
//user login

//refresh token

//logout

module.exports = {registerUser}