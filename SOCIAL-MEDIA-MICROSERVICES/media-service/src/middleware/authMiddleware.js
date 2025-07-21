const logger = require("../utils/logger.js")

const authenticatedRequest = (req, res, next)=>{
  const userId = req.headers['x-user-id']

  if(!userId){
    logger.warn("Access attempted without user id")
    return res.status(400).json({
      success: false,
      message:"Unauthorised accesss kindy login to access service"
    })
  }
  req.user = {userId}
  next()
}
module.exports = authenticatedRequest