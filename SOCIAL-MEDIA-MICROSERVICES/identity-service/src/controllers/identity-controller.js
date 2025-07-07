const logger = require("../utils/logger.js");
const {
  validateRegistration,
  validateLogin,
} = require("../utils/validation.js");
const User = require("../models/user-model.js");
const RefreshToken = require("../models/refreshToken.js");
const generateTokens = require("../utils/generateTokens.js");
const { ref } = require("joi");

//user reg
const registerUser = async (req, res) => {
  logger.info("Registration endpoint hit....");
  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { username, email, password } = req.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("User already exists please login");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }
    user = new User({ username, email, password });
    await user.save();
    logger.warn("User saved successfully", user._id);

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(200).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//user login
const loginUser = async (req, res) => {
  try {
    logger.info("Login endpoint hit...");
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("Inavalid user");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn("Inavalid password");
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }
    const { accessToken, refreshToken } = await generateTokens(user);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("Login error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//refresh token
const userRefreshToken = async (req, res) => {
  logger.info("Request token endpoint hit");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("refresh token missing");
      return res.status(400).json({
        success: false,
        message:"Missing refresh token",
      });
    }
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token ");
      return res.status(400).json({
        success: false,
        message: "Invalid Refresh Token",
      });
    }

    //we need to find the user
    const user = await User.findById(storedToken.user)
     if (!user) {
      logger.warn(" user not found");
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const {accessToken: newAccessToken , refreshToken : newRefreshToken} = await generateTokens(user)

    //delete old refresh token
     await RefreshToken.deleteOne({_id: storedToken._id})
     res.json({
      success: true,
      accessToken : newAccessToken,
      refreshToken : newRefreshToken
     })
  } catch (error) {
    logger.error("RefreshToken error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//logout
const logoutUser = async (req, res)=>{
  logger.info("Logout endpoint hit");
  try {
    const {refreshToken} = req.body;
     if (!refreshToken) {
      logger.warn("refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Missing refresh token",
      });
    }
    await RefreshToken.deleteOne({token: refreshToken})
    logger.info("Refresh Token Deleted for logout")
    res.json({
      success: true,
      message:"Logged out successfully"
     })
  } catch (error) {
     logger.error("Logout error", error);
    res.status(500).json({
      success: false,
      message: "Problem arised while logging out",
    });
  }
}
module.exports = { registerUser, loginUser ,userRefreshToken, logoutUser};
