const jwt = require("jsonwebtoken");
const RefreshToken  = require('../models/refreshToken.js')
const crypto = require('crypto')

const generateTokens = async (user) => {

  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SCECRET, 
    {
      expiresIn: '10m'
    }
  );

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7) //refresh token expires in 7 days

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt
  })

  return {accessToken, refreshToken}
};

module.exports = generateTokens;